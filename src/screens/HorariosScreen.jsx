import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { getDisabledSlots, setDisabledSlots } from '../database/settingsDb';
import { showToast } from '../hooks/useToast';

const START = 8 * 60;
const END = 21 * 60;
const STEP = 60;

function generateAllSlots() {
  const slots = [];
  for (let t = START; t < END; t += STEP) {
    const h = String(Math.floor(t / 60)).padStart(2, '0');
    const m = String(t % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
}

const ALL_SLOTS = generateAllSlots();

export default function HorariosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { primaryColor } = useTheme();
  const styles = useMemo(() => makeStyles(primaryColor), [primaryColor]);

  const [disabled, setDisabled] = useState([]);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getDisabledSlots().then(setDisabled).catch(() => {});
    }, [])
  );

  function toggle(slot) {
    setDisabled((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setDisabledSlots(disabled);
      showToast({ type: 'success', text1: 'Horários salvos!', text2: 'As alterações já valem no site e no app.' });
      navigation.goBack();
    } catch {
      showToast({ type: 'error', text1: 'Erro ao salvar', text2: 'Tente novamente.' });
    } finally {
      setSaving(false);
    }
  }

  const activeCount = ALL_SLOTS.length - disabled.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Horários de Atendimento</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.desc}>
          Toque para ativar ou desativar cada horário. Horários desativados não aparecem no app nem no site de agendamento.
        </Text>

        <View style={styles.summary}>
          <MaterialCommunityIcons name="clock-check-outline" size={20} color={primaryColor} />
          <Text style={styles.summaryText}>
            <Text style={{ color: primaryColor, fontWeight: '700' }}>{activeCount}</Text>
            {` de ${ALL_SLOTS.length} horários ativos`}
          </Text>
        </View>

        <View style={styles.grid}>
          {ALL_SLOTS.map((slot) => {
            const isActive = !disabled.includes(slot);
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
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="content-save-outline" size={20} color={colors.background} />
          <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar alterações'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(primary) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    navBar: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingBottom: 16,
    },
    navBtn: { padding: 4 },
    title: { color: colors.white, fontSize: 18, fontWeight: '700' },
    desc: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 16 },
    summary: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.surface, borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: colors.border, marginBottom: 20,
    },
    summaryText: { color: colors.textSecondary, fontSize: 14 },
    grid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    },
    slotBtn: {
      width: '30%', flexGrow: 1,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 12, paddingVertical: 14,
      borderRadius: 12, borderWidth: 1.5,
    },
    slotActive: {
      backgroundColor: colors.surface,
      borderColor: primary,
    },
    slotInactive: {
      backgroundColor: colors.background,
      borderColor: colors.border,
      opacity: 0.5,
    },
    slotTime: { color: colors.white, fontSize: 15, fontWeight: '700' },
    slotTimeInactive: { color: colors.textMuted },
    footer: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 12,
      borderTopWidth: 1, borderTopColor: colors.border,
    },
    saveBtn: {
      backgroundColor: primary, borderRadius: 14, paddingVertical: 16,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    saveBtnText: { color: colors.background, fontWeight: '700', fontSize: 16 },
  });
}
