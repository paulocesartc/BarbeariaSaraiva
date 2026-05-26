import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { getDisabledSlots, getDaySlots, setDaySlots, clearDaySlots } from '../database/settingsDb';
import { showToast } from '../hooks/useToast';

const START = 8 * 60;
const END = 21 * 60;
const STEP = 60;

function generateAllSlots() {
  const slots = [];
  for (let t = START; t < END; t += STEP) {
    slots.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  }
  return slots;
}

const ALL_SLOTS = generateAllSlots();

function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildNext21Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 21; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() === 0) continue;
    days.push({
      iso: localISO(d),
      label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }),
    });
  }
  return days;
}

const DAYS = buildNext21Days();

export default function HorariosDiaScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { primaryColor } = useTheme();
  const styles = useMemo(() => makeStyles(primaryColor), [primaryColor]);

  const [selectedDate, setSelectedDate] = useState(DAYS[0]?.iso ?? null);
  const [globalDisabled, setGlobalDisabled] = useState([]);
  const [dayDisabled, setDayDisabled] = useState(null); // null = sem override
  const [customizedDates, setCustomizedDates] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getDisabledSlots().then(setGlobalDisabled).catch(() => {});
    }, [])
  );

  // Carrega slots do dia ao mudar a data (via onSelectDate, não duplicar com useFocusEffect)

  // Carrega quais datas já têm personalização
  useFocusEffect(
    useCallback(() => {
      Promise.all(DAYS.map(({ iso }) => getDaySlots(iso).then(v => ({ iso, has: v !== null }))))
        .then(results => {
          setCustomizedDates(new Set(results.filter(r => r.has).map(r => r.iso)));
        })
        .catch(() => {});
    }, [])
  );

  const effectiveDisabled = dayDisabled ?? globalDisabled;
  const isCustomized = dayDisabled !== null;

  function toggle(slot) {
    const base = dayDisabled ?? globalDisabled;
    const next = base.includes(slot) ? base.filter(s => s !== slot) : [...base, slot];
    setDayDisabled(next);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setDaySlots(selectedDate, dayDisabled ?? globalDisabled);
      setCustomizedDates(prev => new Set([...prev, selectedDate]));
      showToast({ type: 'success', text1: 'Horários do dia salvos!', text2: 'Válidos apenas para esta data.' });
    } catch {
      showToast({ type: 'error', text1: 'Erro ao salvar', text2: 'Tente novamente.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    try {
      await clearDaySlots(selectedDate);
      setDayDisabled(null);
      setCustomizedDates(prev => { const s = new Set(prev); s.delete(selectedDate); return s; });
      showToast({ type: 'success', text1: 'Personalização removida', text2: 'Usando horários padrão.' });
    } catch {
      showToast({ type: 'error', text1: 'Erro ao remover', text2: 'Tente novamente.' });
    } finally {
      setSaving(false);
    }
  }

  function onSelectDate(iso) {
    setSelectedDate(iso);
    getDaySlots(iso).then(setDayDisabled).catch(() => setDayDisabled(null));
  }

  const activeCount = ALL_SLOTS.length - effectiveDisabled.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Horários por Dia</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.desc}>
          Selecione um dia e personalize os horários disponíveis apenas para aquela data. Dias sem personalização usam os horários padrão.
        </Text>

        {/* Chips de datas */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        >
          {DAYS.map(item => {
            const isSelected = item.iso === selectedDate;
            const hasCustom = customizedDates.has(item.iso);
            return (
              <TouchableOpacity
                key={item.iso}
                style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                onPress={() => onSelectDate(item.iso)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateChipText, isSelected && styles.dateChipTextSelected]}>
                  {item.label}
                </Text>
                {hasCustom && (
                  <View style={[styles.customDot, isSelected && { backgroundColor: colors.background }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Status do dia */}
        <View style={styles.statusRow}>
          <View style={styles.summary}>
            <MaterialCommunityIcons name="clock-check-outline" size={18} color={primaryColor} />
            <Text style={styles.summaryText}>
              <Text style={{ color: primaryColor, fontWeight: '700' }}>{activeCount}</Text>
              {` de ${ALL_SLOTS.length} horários ativos`}
            </Text>
          </View>
          {isCustomized && (
            <View style={styles.customBadge}>
              <MaterialCommunityIcons name="pencil-circle" size={14} color={primaryColor} />
              <Text style={[styles.customBadgeText, { color: primaryColor }]}>Personalizado</Text>
            </View>
          )}
        </View>

        {!isCustomized && (
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.textMuted} />
            <Text style={styles.infoText}>Usando horários padrão. Toque em um horário para personalizar este dia.</Text>
          </View>
        )}

        {/* Grid de slots */}
        <View style={styles.grid}>
          {ALL_SLOTS.map((slot) => {
            const isActive = !effectiveDisabled.includes(slot);
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.slotBtn, isActive ? styles.slotActive : styles.slotInactive]}
                onPress={() => toggle(slot)}
                activeOpacity={0.7}
              >
                <Text style={[styles.slotTime, !isActive && styles.slotTimeInactive]}>{slot}</Text>
                <MaterialCommunityIcons
                  name={isActive ? 'check-circle' : 'close-circle'}
                  size={16}
                  color={isActive ? primaryColor : colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {isCustomized && (
          <TouchableOpacity
            style={[styles.resetBtn, saving && { opacity: 0.6 }]}
            onPress={handleReset}
            disabled={saving}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="restore" size={18} color={colors.textSecondary} />
            <Text style={styles.resetBtnText}>Usar padrão</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.background} />
          <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar este dia'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(primary) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 },
    navBtn: { padding: 4 },
    title: { color: colors.white, fontSize: 18, fontWeight: '700' },
    desc: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 16 },
    dateChip: {
      paddingHorizontal: 14, paddingVertical: 10,
      borderRadius: 10, borderWidth: 1, borderColor: colors.border,
      backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 6,
    },
    dateChipSelected: { backgroundColor: primary, borderColor: primary },
    dateChipText: { color: colors.white, fontSize: 13, fontWeight: '600' },
    dateChipTextSelected: { color: colors.background },
    customDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: primary },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    summary: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.surface, borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: colors.border,
    },
    summaryText: { color: colors.textSecondary, fontSize: 13 },
    customBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8,
      borderWidth: 1, borderColor: primary,
    },
    customBadgeText: { fontSize: 12, fontWeight: '600' },
    infoBox: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      backgroundColor: colors.surface, borderRadius: 10, padding: 12,
      borderWidth: 1, borderColor: colors.border, marginBottom: 16,
    },
    infoText: { flex: 1, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    slotBtn: {
      width: '30%', flexGrow: 1,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
    },
    slotActive: { backgroundColor: colors.surface, borderColor: primary },
    slotInactive: { backgroundColor: colors.background, borderColor: colors.border, opacity: 0.5 },
    slotTime: { color: colors.white, fontSize: 15, fontWeight: '700' },
    slotTimeInactive: { color: colors.textMuted },
    footer: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 12,
      borderTopWidth: 1, borderTopColor: colors.border, gap: 8,
    },
    saveBtn: {
      backgroundColor: primary, borderRadius: 14, paddingVertical: 15,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    saveBtnText: { color: colors.background, fontWeight: '700', fontSize: 16 },
    resetBtn: {
      backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 13,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    resetBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  });
}
