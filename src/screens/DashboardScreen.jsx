import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import {
  getAppointmentsByDate,
  getDayRevenue,
  getDayCount,
  updateAppointmentStatus,
  finalizeAppointment,
  autoTransitionOngoing,
} from '../database/appointmentsDb';
import { getLogoUrl } from '../database/settingsDb';
import AgendamentoCard from '../components/AgendamentoCard';
import PremiumButton from '../components/PremiumButton';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import PaymentMethodModal, { PAYMENT_METHODS } from '../components/PaymentMethodModal';
import { showToast } from '../hooks/useToast';

function localDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function DashboardScreen({ navigation }) {
  const hoje = localDateStr();
  const { primaryColor } = useTheme();
  const styles = useMemo(() => makeStyles(primaryColor), [primaryColor]);

  const [agendamentosHoje, setAgendamentosHoje] = useState([]);
  const [faturamento, setFaturamento] = useState(0);
  const [totalDia, setTotalDia] = useState(0);
  const [logoUri, setLogoUri] = useState(null);
  const [cancelModal, setCancelModal] = useState({ visible: false, item: null });
  const [paymentModal, setPaymentModal] = useState({ visible: false, item: null });

  const loadData = useCallback(async () => {
    await autoTransitionOngoing(hoje);
    const [appts, rev, count] = await Promise.all([
      getAppointmentsByDate(hoje),
      getDayRevenue(hoje),
      getDayCount(hoje),
    ]);
    setAgendamentosHoje(appts);
    setFaturamento(rev);
    setTotalDia(count);
  }, [hoje]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      getLogoUrl().then((u) => { if (u) setLogoUri(u); }).catch(() => {});
    }, [loadData])
  );

  const proximosAtendimentos = agendamentosHoje
    .filter((a) => a.status !== 'finalizado' && a.status !== 'cancelado')
    .slice(0, 4);

  function handleFinalizar(item) {
    setPaymentModal({ visible: true, item });
  }

  async function confirmarPagamento(method) {
    const item = paymentModal.item;
    if (!item) return;
    try {
      await finalizeAppointment({
        id: item.id,
        clientId: item.client_id,
        price: item.price,
        paymentMethod: method,
      });
      setPaymentModal({ visible: false, item: null });
      const cfg = PAYMENT_METHODS[method];
      showToast({
        type: 'success',
        text1: 'Atendimento finalizado',
        text2: `${item.client_name} · ${cfg.label} · R$ ${item.price.toFixed(2)}`,
      });
      await loadData();
    } catch (e) {
      console.log('[Dashboard] erro ao finalizar:', e?.message ?? e);
      setPaymentModal({ visible: false, item: null });
      showToast({
        type: 'error',
        text1: 'Erro ao finalizar',
        text2: e?.message ?? 'Tente novamente.',
      });
    }
  }

  function pedirCancelamento(item) {
    setCancelModal({ visible: true, item });
  }

  async function confirmarCancelamento() {
    const item = cancelModal.item;
    setCancelModal({ visible: false, item: null });
    await updateAppointmentStatus(item.id, 'cancelado');
    showToast({
      type: 'error',
      text1: 'Agendamento cancelado',
      text2: item.client_name,
    });
    loadData();
  }

  return (
    <View style={styles.root}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Image
              source={logoUri ? { uri: logoUri } : require('../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Barbearia Saraiva</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long', day: 'numeric', month: 'long',
              })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Configuracoes')}
            style={styles.settingsBtn}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="cog-outline" size={24} color={primaryColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="account-group" size={28} color={primaryColor} />
            <Text style={styles.statValue}>{totalDia}</Text>
            <Text style={styles.statLabel}>Clientes hoje</Text>
          </View>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <MaterialCommunityIcons name="cash" size={28} color={colors.background} />
            <Text style={[styles.statValue, { color: colors.background }]}>
              R$ {faturamento.toFixed(2)}
            </Text>
            <Text style={[styles.statLabel, { color: `${primaryColor}CC` }]}>Faturamento</Text>
          </View>
        </View>

        <PremiumButton
          title="+ Novo Agendamento"
          onPress={() => navigation.navigate('NovoAgendamento')}
          style={styles.novoBtn}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximos Atendimentos</Text>
          <Text style={styles.hint}>← Cancelar · Finalizar →</Text>
          {proximosAtendimentos.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-check" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Nenhum atendimento pendente hoje</Text>
            </View>
          ) : (
            proximosAtendimentos.map((a) => (
              <AgendamentoCard
                key={a.id}
                agendamento={a}
                onFinalizar={handleFinalizar}
                onCancelar={pedirCancelamento}
              />
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Agenda do Dia</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Agenda')}>
              <Text style={styles.verTudo}>Ver completa</Text>
            </TouchableOpacity>
          </View>
          {agendamentosHoje.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhum agendamento hoje</Text>
            </View>
          ) : (
            agendamentosHoje.map((a) => (
              <AgendamentoCard
                key={a.id}
                agendamento={a}
                onFinalizar={handleFinalizar}
                onCancelar={pedirCancelamento}
              />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <DeleteConfirmModal
        visible={cancelModal.visible}
        title="Cancelar agendamento"
        description={
          cancelModal.item
            ? `Deseja realmente cancelar o atendimento de "${cancelModal.item.client_name}" às ${cancelModal.item.time}?`
            : ''
        }
        onConfirm={confirmarCancelamento}
        onCancel={() => setCancelModal({ visible: false, item: null })}
      />

      <PaymentMethodModal
        visible={paymentModal.visible}
        appointment={paymentModal.item}
        onConfirm={confirmarPagamento}
        onCancel={() => setPaymentModal({ visible: false, item: null })}
      />
    </View>
  );
}

function makeStyles(primary) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
    header: {
      flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingBottom: 20, gap: 14,
    },
    logoWrap: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
    logo: { width: 56, height: 56 },
    settingsBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: colors.border,
    },
    greeting: { color: primary, fontSize: 22, fontWeight: '700', letterSpacing: 0.5 },
    date: { color: colors.textSecondary, fontSize: 13, marginTop: 2, textTransform: 'capitalize' },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    statCard: {
      flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 18,
      alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    },
    statCardPrimary: { backgroundColor: primary, borderColor: primary },
    statValue: { color: colors.white, fontSize: 28, fontWeight: '800', marginTop: 6 },
    statLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '500' },
    novoBtn: { marginBottom: 24 },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { color: colors.white, fontSize: 18, fontWeight: '700', marginBottom: 6 },
    hint: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic', marginBottom: 10 },
    verTudo: { color: primary, fontSize: 14, fontWeight: '600', marginBottom: 14 },
    emptyState: {
      alignItems: 'center', paddingVertical: 30, backgroundColor: colors.surface, borderRadius: 16,
    },
    emptyText: { color: colors.textMuted, marginTop: 10, fontSize: 14 },
  });
}
