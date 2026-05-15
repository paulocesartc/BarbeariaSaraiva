import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal,
  TouchableOpacity, Switch, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { getClientById, setClientActive, updateClient } from '../database/clientsDb';
import { getAppointmentsByClient } from '../database/appointmentsDb';
import { PAYMENT_METHODS } from '../components/PaymentMethodModal';
import { formatPhone } from '../utils/phone';
import { showToast } from '../hooks/useToast';

const STATUS_LABELS = {
  agendado: { label: 'Agendado', color: colors.statusLivre, icon: 'clock-outline' },
  livre: { label: 'Agendado', color: colors.statusLivre, icon: 'clock-outline' },
  ocupado: { label: 'Em atendimento', color: colors.statusOcupado, icon: 'content-cut' },
  finalizado: { label: 'Finalizado', color: colors.statusFinalizado, icon: 'check-circle' },
  cancelado: { label: 'Cancelado', color: colors.danger, icon: 'close-circle' },
};

function formatHistoryDate(d) {
  const date = new Date(d + 'T12:00:00');
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ClientePerfilScreen({ route, navigation }) {
  const { clienteId } = route.params;
  const insets = useSafeAreaInsets();
  const { primaryColor } = useTheme();
  const styles = useMemo(() => makeStyles(primaryColor), [primaryColor]);

  const [cliente, setCliente] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [editModal, setEditModal] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', description: '' });

  useFocusEffect(
    useCallback(() => {
      async function carregar() {
        const [data, appts] = await Promise.all([
          getClientById(clienteId),
          getAppointmentsByClient(clienteId),
        ]);
        setCliente(data);
        setHistorico(appts);
      }
      carregar();
    }, [clienteId])
  );

  function abrirEdicao() {
    setForm({ name: cliente.name, phone: cliente.phone ?? '', description: cliente.description ?? '' });
    setEditModal(true);
  }

  async function handleSalvar() {
    const name = form.name.trim();
    if (!name) return showToast({ type: 'error', text1: 'Campo obrigatório', text2: 'Informe o nome do cliente.' });
    try {
      await updateClient(clienteId, { name, phone: form.phone, description: form.description });
      const updated = await getClientById(clienteId);
      setCliente(updated);
      setEditModal(false);
      showToast({ type: 'success', text1: 'Cliente atualizado', text2: `"${name}" foi salvo.` });
    } catch {
      showToast({ type: 'error', text1: 'Erro ao salvar', text2: 'Tente novamente.' });
    }
  }

  async function handleToggleActive(val) {
    await setClientActive(clienteId, val);
    setCliente((c) => ({ ...c, active: val ? 1 : 0 }));
    showToast({
      type: 'info',
      text1: val ? 'Cliente reativado' : 'Cliente inativado',
      text2: cliente.name,
    });
  }

  if (!cliente) return null;

  const isActive = !!cliente.active;
  const sheetPb = Math.max(insets.bottom + 8, 24);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
      >
        <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={abrirEdicao} style={styles.btnEditarPerfil}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.background} />
            <Text style={styles.btnEditarPerfilText}>Editar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileHeader}>
          <View style={[styles.avatarLarge, !isActive && styles.avatarInactive]}>
            <Text style={styles.avatarText}>{cliente.avatar}</Text>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.nome}>{cliente.name}</Text>
            {!isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inativo</Text>
              </View>
            )}
          </View>

          {cliente.phone ? (
            <View style={styles.contactRow}>
              <MaterialCommunityIcons name="phone" size={15} color={primaryColor} />
              <Text style={styles.telefone}>{cliente.phone}</Text>
            </View>
          ) : null}

          {cliente.description ? (
            <View style={styles.obsBox}>
              <MaterialCommunityIcons name="note-text" size={15} color={colors.textSecondary} />
              <Text style={styles.obsText}>{cliente.description}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{cliente.total_appointments}</Text>
            <Text style={styles.statLabel}>Atendimentos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>R$ {cliente.total_spent.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total gasto</Text>
          </View>
        </View>

        <View style={styles.switchCard}>
          <View>
            <Text style={styles.switchLabel}>Cliente ativo</Text>
            <Text style={styles.switchSub}>
              {isActive ? 'Desative para ocultar nas listas' : 'Reative para exibir normalmente'}
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={handleToggleActive}
            trackColor={{ false: colors.border, true: `${primaryColor}66` }}
            thumbColor={isActive ? primaryColor : colors.textMuted}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Atendimentos</Text>
          {historico.length === 0 ? (
            <View style={styles.emptyHistory}>
              <MaterialCommunityIcons name="history" size={40} color={colors.textMuted} />
              <Text style={styles.emptyText}>Nenhum atendimento registrado</Text>
            </View>
          ) : (
            historico.map((a) => {
              const s = STATUS_LABELS[a.status] ?? STATUS_LABELS.livre;
              const pay = a.payment_method ? PAYMENT_METHODS[a.payment_method] : null;
              return (
                <View key={a.id} style={[styles.historyCard, { borderLeftColor: s.color }]}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{formatHistoryDate(a.date)} · {a.time}</Text>
                    <View style={styles.historyStatus}>
                      <MaterialCommunityIcons name={s.icon} size={13} color={s.color} />
                      <Text style={[styles.historyStatusText, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>
                  <View style={styles.historyBody}>
                    <Text style={styles.historyService}>{a.service_name}</Text>
                    <Text style={styles.historyPrice}>R$ {a.price.toFixed(2)}</Text>
                  </View>
                  {pay && (
                    <View style={styles.historyPayRow}>
                      <MaterialCommunityIcons name={pay.icon} size={12} color={pay.color} />
                      <Text style={[styles.historyPayText, { color: pay.color }]}>{pay.label}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setEditModal(false)} />
          <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={0}>
            <View style={[styles.sheet, { paddingBottom: sheetPb }]}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Editar Cliente</Text>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome completo"
                  placeholderTextColor={colors.textMuted}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />
                <Text style={styles.label}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={form.phone}
                  onChangeText={(v) => setForm((f) => ({ ...f, phone: formatPhone(v) }))}
                />
                <Text style={styles.label}>Descrição / Observações</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  placeholder="Preferências, alergias, anotações..."
                  placeholderTextColor={colors.textMuted}
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  multiline
                  numberOfLines={3}
                />
                <View style={styles.modalBtns}>
                  <TouchableOpacity onPress={() => setEditModal(false)} style={styles.btnCancelar}>
                    <Text style={styles.btnCancelarText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSalvar} style={styles.btnSalvar}>
                    <Text style={styles.btnSalvarText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(primary) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
    navBar: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingBottom: 10,
    },
    navBtn: { padding: 4 },
    btnEditarPerfil: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    },
    btnEditarPerfilText: { color: colors.background, fontWeight: '700', fontSize: 14 },
    profileHeader: {
      alignItems: 'center', paddingBottom: 24,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    avatarLarge: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: primary, alignItems: 'center', justifyContent: 'center',
      marginBottom: 14,
    },
    avatarInactive: { backgroundColor: colors.textMuted },
    avatarText: { color: colors.background, fontSize: 28, fontWeight: '800' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    nome: { color: colors.white, fontSize: 24, fontWeight: '700' },
    inactiveBadge: { backgroundColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    inactiveBadgeText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    telefone: { color: colors.textSecondary, fontSize: 15 },
    obsBox: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      marginTop: 14, backgroundColor: colors.surface,
      padding: 12, borderRadius: 10, maxWidth: '90%',
    },
    obsText: { color: colors.textSecondary, fontSize: 13, flex: 1, fontStyle: 'italic' },
    statsRow: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 16 },
    statCard: {
      flex: 1, backgroundColor: colors.surface, borderRadius: 14,
      padding: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
    },
    statValue: { color: primary, fontSize: 20, fontWeight: '800' },
    statLabel: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
    switchCard: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.surface, borderRadius: 14,
      padding: 16, marginBottom: 24,
      borderWidth: 1, borderColor: colors.border,
    },
    switchLabel: { color: colors.white, fontWeight: '600', fontSize: 15 },
    switchSub: { color: colors.textMuted, fontSize: 12, marginTop: 2, maxWidth: 220 },
    section: { marginBottom: 20 },
    sectionTitle: { color: colors.white, fontSize: 18, fontWeight: '700', marginBottom: 16 },
    emptyHistory: {
      alignItems: 'center', paddingVertical: 32,
      backgroundColor: colors.surface, borderRadius: 16, gap: 10,
    },
    emptyText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', maxWidth: 220 },
    historyCard: {
      backgroundColor: colors.surface, borderRadius: 12, padding: 14,
      borderLeftWidth: 3, marginBottom: 8,
    },
    historyHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 6,
    },
    historyDate: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    historyStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    historyStatusText: { fontSize: 11, fontWeight: '600' },
    historyBody: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center',
    },
    historyService: { color: colors.white, fontSize: 14, fontWeight: '600', flex: 1 },
    historyPrice: { color: primary, fontSize: 14, fontWeight: '700' },
    historyPayRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
    historyPayText: { fontSize: 11, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textMuted, alignSelf: 'center', marginBottom: 20 },
    sheetTitle: { color: primary, fontSize: 20, fontWeight: '800', marginBottom: 20 },
    label: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: colors.white, fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
    inputMulti: { height: 90, textAlignVertical: 'top' },
    modalBtns: { flexDirection: 'row', gap: 10 },
    btnCancelar: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    btnCancelarText: { color: colors.textSecondary, fontWeight: '600' },
    btnSalvar: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: primary, alignItems: 'center' },
    btnSalvarText: { color: colors.background, fontWeight: '700', fontSize: 15 },
  });
}
