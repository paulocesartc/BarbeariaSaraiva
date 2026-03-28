import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { colors } from '../theme/colors';
import useStore from '../store/useStore';
import AgendamentoCard from '../components/AgendamentoCard';

LocaleConfig.locales['pt-br'] = {
  monthNames: [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ],
  monthNamesShort: [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ],
  dayNames: [
    'Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado',
  ],
  dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
  today: 'Hoje',
};
LocaleConfig.defaultLocale = 'pt-br';

export default function AgendaScreen() {
  const hoje = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(hoje);
  const agendamentos = useStore((s) => s.agendamentos);

  const agendamentosDia = agendamentos.filter((a) => a.data === selectedDate);

  // Mark dates that have appointments
  const markedDates = {};
  agendamentos.forEach((a) => {
    if (a.data !== selectedDate) {
      markedDates[a.data] = {
        marked: true,
        dotColor: colors.gold,
      };
    }
  });
  markedDates[selectedDate] = {
    selected: true,
    selectedColor: colors.gold,
    marked: agendamentos.some((a) => a.data === selectedDate),
    dotColor: colors.background,
  };

  const statusLegend = [
    { label: 'Agendado', color: colors.statusLivre },
    { label: 'Em atendimento', color: colors.statusOcupado },
    { label: 'Finalizado', color: colors.statusFinalizado },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Agenda</Text>

      <Calendar
        current={hoje}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.surface,
          textSectionTitleColor: colors.gold,
          selectedDayBackgroundColor: colors.gold,
          selectedDayTextColor: colors.background,
          todayTextColor: colors.gold,
          dayTextColor: colors.white,
          textDisabledColor: colors.textMuted,
          arrowColor: colors.gold,
          monthTextColor: colors.white,
          textMonthFontWeight: '700',
          textDayFontWeight: '500',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
        style={styles.calendar}
      />

      {/* Legend */}
      <View style={styles.legendRow}>
        {statusLegend.map((s) => (
          <View key={s.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Appointments for selected date */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {selectedDate === hoje
            ? 'Hoje'
            : new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
              })}
        </Text>

        {agendamentosDia.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum agendamento neste dia</Text>
          </View>
        ) : (
          agendamentosDia
            .sort((a, b) => a.horario.localeCompare(b.horario))
            .map((a) => <AgendamentoCard key={a.id} agendamento={a} />)
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  title: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    paddingTop: 60,
    marginBottom: 20,
  },
  calendar: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
