import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { getAllClients } from '../database/clientsDb';
import { getAllServices } from '../database/servicesDb';
import { createAppointment, getAvailableSlots, hasConflict } from '../database/appointmentsDb';
import PremiumButton from '../components/PremiumButton';
import TimeSlot from '../components/TimeSlot';
import { showToast } from '../hooks/useToast';
import { formatCurrencyInput, parseCurrency } from '../utils/currency';

const STEPS = ['Cliente', 'Serviço', 'Horario'];

function formatTimeInput(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isValidTime(t) {
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export default function NovoAgendamentoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const bottomPad = 70 + insets.bottom + 32;
  const [clientes, setClientes] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [step, setStep] = useState(0);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [customTime, setCustomTime] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [precoCustom, setPrecoCustom] = useState('');
  const [searchCliente, setSearchCliente] = useState('');
  const [searchServico, setSearchServico] = useState('');

  const totalDuration = servicosSelecionados.reduce((sum, s) => sum + s.duration_min, 0);
  const totalPrice = servicosSelecionados.reduce((sum, s) => sum + s.price, 0);
  const combinedName = servicosSelecionados.map((s) => s.name).join(' + ');

  function resetForm() {
    setStep(0);
    setClienteSelecionado(null);
    setServicosSelecionados([]);
    setHorarioSelecionado(null);
    setCustomTime('');
    setPrecoCustom('');
    setSearchCliente('');
    setSearchServico('');
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }

  useFocusEffect(
    useCallback(() => {
      resetForm();
      async function load() {
        const [c, s] = await Promise.all([getAllClients(), getAllServices()]);
        setClientes(c);
        setServicos(s);
      }
      load();
    }, [])
  );

  useEffect(() => {
    if (step === 2 && totalDuration > 0) {
      getAvailableSlots(selectedDate, totalDuration).then(setSlots);
    }
  }, [step, selectedDate, totalDuration]);

  function toggleServico(item) {
    setServicosSelecionados((prev) => {
      const exists = prev.find((s) => s.id === item.id);
      if (exists) return prev.filter((s) => s.id !== item.id);
      return [...prev, item];
    });
  }

  function avancarParaHorario() {
    if (servicosSelecionados.length === 0) return;
    setPrecoCustom(formatCurrencyInput(String(Math.round(totalPrice * 100))));
    setStep(2);
  }

  async function escolherCustomTime() {
    if (!isValidTime(customTime)) {
      showToast({ type: 'error', text1: 'Horário inválido', text2: 'Use o formato HH:MM.' });
      return;
    }
    const conflict = await hasConflict(selectedDate, customTime, totalDuration);
    if (conflict) {
      showToast({ type: 'error', text1: 'Horário indisponível', text2: 'Já existe agendamento conflitante.' });
      return;
    }
    setHorarioSelecionado(customTime);
  }

  const handleConfirmar = async () => {
    const price = precoCustom ? parseCurrency(precoCustom) : totalPrice;
    try {
      await createAppointment({
        client_id: clienteSelecionado.id,
        client_name: clienteSelecionado.name,
        service_id: servicosSelecionados[0].id,
        service_name: combinedName,
        date: selectedDate,
        time: horarioSelecionado,
        duration_min: totalDuration,
        price,
      });
      showToast({
        type: 'success',
        text1: 'Agendamento criado!',
        text2: `${clienteSelecionado.name} — ${horarioSelecionado}`,
      });
      resetForm();
      navigation.goBack();
    } catch (e) {
      console.log('[NovoAgendamento] erro:', e);
      showToast({ type: 'error', text1: 'Erro ao agendar', text2: 'Tente novamente.' });
    }
  };

  const filteredClientes = searchCliente
    ? clientes.filter((c) => c.name.toLowerCase().includes(searchCliente.toLowerCase()))
    : clientes;

  const filteredServicos = searchServico
    ? servicos.filter((s) => s.name.toLowerCase().includes(searchServico.toLowerCase()))
    : servicos;

  const formatDateLabel = (d) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const nextDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    nextDays.push(d.toISOString().split('T')[0]);
  }

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {STEPS.map((label, i) => (
        <View key={label} style={styles.stepItem}>
          <View style={[styles.stepCircle, i <= step && styles.stepCircleActive, i < step && styles.stepCircleDone]}>
            {i < step ? (
              <MaterialCommunityIcons name="check" size={16} color={colors.background} />
            ) : (
              <Text style={[styles.stepNumber, i <= step && styles.stepNumberActive]}>{i + 1}</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, i <= step && styles.stepLabelActive]}>{label}</Text>
          {i < STEPS.length - 1 && (
            <View style={[styles.stepLine, i < step && styles.stepLineActive]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderClientes = () => (
    <View style={{ flex: 1 }}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar cliente..."
        placeholderTextColor={colors.textMuted}
        value={searchCliente}
        onChangeText={setSearchCliente}
      />
      <FlatList
        data={filteredClientes}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.selectCard, clienteSelecionado?.id === item.id && styles.selectCardActive]}
            onPress={() => { setClienteSelecionado(item); setStep(1); }}
            activeOpacity={0.7}
          >
            <View style={styles.selectAvatar}>
              <Text style={styles.selectAvatarText}>{item.avatar}</Text>
            </View>
            <View style={styles.selectInfo}>
              <Text style={styles.selectName}>{item.name}</Text>
              {item.phone ? <Text style={styles.selectSub}>{item.phone}</Text> : null}
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum cliente cadastrado</Text>
          </View>
        }
      />
    </View>
  );

  const renderServicos = () => {
    const hasSelection = servicosSelecionados.length > 0;
    return (
      <View style={{ flex: 1 }}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar serviço..."
          placeholderTextColor={colors.textMuted}
          value={searchServico}
          onChangeText={setSearchServico}
        />
        <Text style={styles.hintMulti}>Toque para selecionar um ou mais serviços</Text>
        <FlatList
          data={filteredServicos}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: hasSelection ? bottomPad + 80 : bottomPad }}
          renderItem={({ item }) => {
            const selected = !!servicosSelecionados.find((s) => s.id === item.id);
            return (
              <TouchableOpacity
                style={[styles.selectCard, selected && styles.selectCardActive]}
                onPress={() => toggleServico(item)}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name={item.icon} size={24} color={colors.gold} />
                </View>
                <View style={styles.selectInfo}>
                  <Text style={styles.selectName}>{item.name}</Text>
                  <Text style={styles.selectSub}>{item.duration_min}min</Text>
                </View>
                <Text style={styles.selectPreco}>R$ {item.price.toFixed(2)}</Text>
                <View style={[styles.checkBox, selected && styles.checkBoxActive]}>
                  {selected && <MaterialCommunityIcons name="check" size={14} color={colors.background} />}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Nenhum serviço encontrado</Text>
            </View>
          }
        />
        {hasSelection && (
          <View style={[styles.floatingBar, { bottom: insets.bottom + 70 + 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.floatingLabel}>
                {servicosSelecionados.length} serviço{servicosSelecionados.length > 1 ? 's' : ''} · {totalDuration}min
              </Text>
              <Text style={styles.floatingTotal}>R$ {totalPrice.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.floatingBtn} onPress={avancarParaHorario}>
              <Text style={styles.floatingBtnText}>Continuar</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color={colors.background} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderHorarios = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomPad }}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <MaterialCommunityIcons name="account" size={18} color={colors.gold} />
          <Text style={styles.summaryText}>{clienteSelecionado?.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <MaterialCommunityIcons name="content-cut" size={18} color={colors.gold} />
          <Text style={styles.summaryText}>{combinedName} — {totalDuration}min</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>Data</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
        {nextDays.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.dateChip, selectedDate === d && styles.dateChipActive]}
            onPress={() => { setSelectedDate(d); setHorarioSelecionado(null); }}
          >
            <Text style={[styles.dateChipText, selectedDate === d && styles.dateChipTextActive]}>
              {formatDateLabel(d)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.subtitle}>Valor</Text>
      <View style={styles.priceRow}>
        <Text style={styles.pricePrefix}>R$</Text>
        <TextInput
          style={styles.priceInput}
          keyboardType="number-pad"
          value={precoCustom}
          onChangeText={(v) => setPrecoCustom(formatCurrencyInput(v))}
        />
      </View>

      <Text style={styles.subtitle}>Horário</Text>
      <View style={styles.slotsGrid}>
        {slots.map((s) => (
          <TimeSlot
            key={s.time}
            horario={s.time}
            selecionado={horarioSelecionado === s.time}
            ocupado={!s.available}
            onPress={() => { setHorarioSelecionado(s.time); setCustomTime(''); }}
          />
        ))}
      </View>

      <Text style={styles.customLabel}>Ou digite um horário específico</Text>
      <View style={styles.customTimeRow}>
        <TextInput
          style={styles.customTimeInput}
          placeholder="Ex: 15:15"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={customTime}
          onChangeText={(v) => setCustomTime(formatTimeInput(v))}
          maxLength={5}
        />
        <TouchableOpacity style={styles.customTimeBtn} onPress={escolherCustomTime}>
          <Text style={styles.customTimeBtnText}>Usar</Text>
        </TouchableOpacity>
      </View>

      {horarioSelecionado && (
        <View style={styles.confirmSection}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Resumo</Text>
            <Text style={styles.confirmLine}>{clienteSelecionado?.name}</Text>
            <Text style={styles.confirmLine}>{combinedName} ({totalDuration}min)</Text>
            <Text style={styles.confirmLine}>
              {formatDateLabel(selectedDate)} às {horarioSelecionado}
            </Text>
            <Text style={styles.confirmValor}>R$ {precoCustom}</Text>
          </View>

          <PremiumButton
            title="Confirmar Agendamento"
            onPress={handleConfirmar}
            style={{ marginTop: 16 }}
          />
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { if (step > 0) setStep(step - 1); else navigation.goBack(); }}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Novo Agendamento</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderStepIndicator()}

      <View style={styles.content}>
        {step === 0 && renderClientes()}
        {step === 1 && renderServicos()}
        {step === 2 && renderHorarios()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
  },
  title: { color: colors.white, fontSize: 20, fontWeight: '700' },
  stepRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, marginBottom: 20 },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.border,
  },
  stepCircleActive: { borderColor: colors.gold },
  stepCircleDone: { backgroundColor: colors.gold, borderColor: colors.gold },
  stepNumber: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  stepNumberActive: { color: colors.gold },
  stepLabel: { color: colors.textMuted, fontSize: 12, marginLeft: 6, fontWeight: '600' },
  stepLabelActive: { color: colors.gold },
  stepLine: { width: 30, height: 2, backgroundColor: colors.border, marginHorizontal: 8 },
  stepLineActive: { backgroundColor: colors.gold },
  content: { flex: 1, paddingHorizontal: 20 },
  searchInput: {
    backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.white, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: colors.border,
  },
  hintMulti: { color: colors.textMuted, fontSize: 12, fontStyle: 'italic', marginBottom: 10 },
  selectCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent',
  },
  selectCardActive: { borderColor: colors.gold },
  selectAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  selectAvatarText: { color: colors.background, fontSize: 14, fontWeight: '700' },
  iconBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  selectInfo: { flex: 1, marginLeft: 12 },
  selectName: { color: colors.white, fontSize: 15, fontWeight: '600' },
  selectSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  selectPreco: { color: colors.gold, fontSize: 16, fontWeight: '700', marginRight: 10 },
  checkBox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  checkBoxActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  floatingBar: {
    position: 'absolute', left: 0, right: 0, marginHorizontal: 0,
    backgroundColor: colors.surface, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: colors.gold,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4,
    shadowRadius: 8, elevation: 10,
  },
  floatingLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  floatingTotal: { color: colors.gold, fontSize: 18, fontWeight: '800', marginTop: 2 },
  floatingBtn: {
    backgroundColor: colors.gold, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  floatingBtnText: { color: colors.background, fontWeight: '700', fontSize: 14 },
  subtitle: { color: colors.white, fontSize: 16, fontWeight: '600', marginBottom: 14 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 20,
    gap: 10, borderWidth: 1, borderColor: colors.border,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryText: { color: colors.white, fontSize: 14, fontWeight: '500', flex: 1 },
  dateChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.surface, marginRight: 8, borderWidth: 1, borderColor: colors.border,
  },
  dateChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  dateChipText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  dateChipTextActive: { color: colors.background },
  priceRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 20,
    backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  pricePrefix: { color: colors.gold, fontSize: 16, fontWeight: '700', paddingLeft: 14 },
  priceInput: { flex: 1, color: colors.white, fontSize: 16, paddingHorizontal: 10, paddingVertical: 12 },
  customLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  customTimeRow: {
    flexDirection: 'row', gap: 8, marginBottom: 8,
  },
  customTimeInput: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, color: colors.white, fontSize: 15,
    borderWidth: 1, borderColor: colors.border,
  },
  customTimeBtn: {
    backgroundColor: colors.gold, paddingHorizontal: 20, justifyContent: 'center',
    borderRadius: 10,
  },
  customTimeBtnText: { color: colors.background, fontWeight: '700', fontSize: 14 },
  confirmSection: { marginTop: 24 },
  confirmCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: colors.gold,
  },
  confirmTitle: { color: colors.gold, fontSize: 18, fontWeight: '700', marginBottom: 10 },
  confirmLine: { color: colors.white, fontSize: 14, marginBottom: 4 },
  confirmValor: { color: colors.gold, fontSize: 22, fontWeight: '800', marginTop: 10 },
  emptyState: { alignItems: 'center', paddingVertical: 40, backgroundColor: colors.surface, borderRadius: 16 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
