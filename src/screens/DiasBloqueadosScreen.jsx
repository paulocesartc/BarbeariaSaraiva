import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { getBlockedDays, blockDay, unblockDay } from '../database/appointmentsDb';
import { showToast } from '../hooks/useToast';

const DAYS_AHEAD = 60;

function buildDaysList() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function formatDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatMonth(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export default function DiasBloqueadosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [blockedSet, setBlockedSet] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  const days = buildDaysList();

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        try {
          const blocked = await getBlockedDays();
          setBlockedSet(new Set(blocked));
        } catch (e) {
          showToast({ type: 'error', text1: 'Erro ao carregar dias bloqueados' });
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [])
  );

  async function toggleDay(date) {
    if (toggling) return;
    setToggling(date);
    try {
      if (blockedSet.has(date)) {
        await unblockDay(date);
        setBlockedSet((prev) => { const s = new Set(prev); s.delete(date); return s; });
        showToast({ type: 'success', text1: 'Dia reativado' });
      } else {
        await blockDay(date);
        setBlockedSet((prev) => new Set([...prev, date]));
        showToast({ type: 'info', text1: 'Dia bloqueado' });
      }
    } catch (e) {
      showToast({ type: 'error', text1: 'Erro ao atualizar dia' });
    } finally {
      setToggling(null);
    }
  }

  // Group days by month
  const groups = [];
  let currentMonth = null;
  let currentGroup = null;
  for (const d of days) {
    const month = formatMonth(d);
    if (month !== currentMonth) {
      currentMonth = month;
      currentGroup = { month, days: [] };
      groups.push(currentGroup);
    }
    currentGroup.days.push(d);
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Dias Bloqueados</Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.hint}>
        Dias bloqueados não aceitam novos agendamentos.
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          {groups.map((group) => (
            <View key={group.month}>
              <Text style={styles.monthLabel}>{group.month}</Text>
              {group.days.map((date) => {
                const blocked = blockedSet.has(date);
                const isToggling = toggling === date;
                return (
                  <TouchableOpacity
                    key={date}
                    style={[styles.dayRow, blocked && styles.dayRowBlocked]}
                    onPress={() => toggleDay(date)}
                    activeOpacity={0.7}
                    disabled={!!toggling}
                  >
                    <View style={styles.dayLeft}>
                      <MaterialCommunityIcons
                        name={blocked ? 'calendar-remove' : 'calendar-check'}
                        size={20}
                        color={blocked ? colors.danger : colors.gold}
                      />
                      <Text style={[styles.dayText, blocked && styles.dayTextBlocked]}>
                        {formatDay(date)}
                      </Text>
                    </View>
                    {isToggling ? (
                      <ActivityIndicator size="small" color={colors.gold} />
                    ) : (
                      <View style={[styles.toggle, blocked && styles.toggleOn]}>
                        <View style={[styles.toggleThumb, blocked && styles.toggleThumbOn]} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8,
  },
  navBtn: { padding: 4 },
  title: { color: colors.white, fontSize: 20, fontWeight: '700' },
  hint: {
    color: colors.textSecondary, fontSize: 13, paddingHorizontal: 20,
    marginBottom: 16, lineHeight: 18,
  },
  monthLabel: {
    color: colors.gold, fontSize: 13, fontWeight: '700', textTransform: 'capitalize',
    letterSpacing: 0.5, marginTop: 20, marginBottom: 8,
  },
  dayRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  dayRowBlocked: { borderColor: `${colors.danger}55`, backgroundColor: `${colors.danger}10` },
  dayLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  dayText: { color: colors.white, fontSize: 14, fontWeight: '500', textTransform: 'capitalize' },
  dayTextBlocked: { color: colors.textMuted, textDecorationLine: 'line-through' },
  toggle: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: colors.border,
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: colors.danger },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: colors.textMuted,
    alignSelf: 'flex-start',
  },
  toggleThumbOn: { backgroundColor: colors.white, alignSelf: 'flex-end' },
});
