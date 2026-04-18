import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { getAppointmentsByDate, getAllAppointmentDates, updateAppointmentStatus, finalizeAppointment, autoTransitionOngoing } from '../database/appointmentsDb';
import AgendamentoCard from '../components/AgendamentoCard';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import PaymentMethodModal, { PAYMENT_METHODS } from '../components/PaymentMethodModal';
import { showToast } from '../hooks/useToast';

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
  const [agendamentosDia, setAgendamentosDia] = useState([]);
  const [datesWithAppts, setDatesWithAppts] = useState([]);
  const [cancelModal, setCancelModal] = useState({ visible: false, item: null });
  const [paymentModal, setPaymentModal] = useState({ visible: false, item: null });

  const loadData = useCallback(async () => {
    await autoTransitionOngoing(hoje);
    const [appts, dates] = await Promise.all([
      getAppointmentsByDate(selectedDate),
      getAllAppointmentDates(),
    ]);
    setAgendamentosDia(appts);
    setDatesWithAppts(dates.map((d) => d.date));
  }, [selectedDate, hoje]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

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
      console.log('[Agenda] erro ao finalizar:', e?.message ?? e);
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
    showToast({ type: 'error', text1: 'Agendamento cancelado', text2: item.client_name });
    loadData();
  }

  const markedDates = {};
  datesWithAppts.forEach((d) => {
    if (d !== selectedDate) {
      markedDates[d] = { marked: true, dotColor: colors.gold };
    }
  });
  markedDates[selectedDate] = {
    selected: true,
    selectedColor: colors.gold,
    marked: datesWithAppts.includes(selectedDate),
    dotColor: colors.background,
  };

  const statusLegend = [
    { label: 'Agendado', color: colors.statusLivre },
    { label: 'Em atendimento', color: colors.statusOcupado },
    { label: 'Finalizado', color: colors.statusFinalizado },
    { label: 'Cancelado', color: colors.danger },
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

      <View style={styles.legendRow}>
        {statusLegend.map((s) => (
          <View key={s.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendText}>{s.label}</Text>
          </View>
        ))}
      </View>

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
          <>
            <Text style={styles.hint}>← Cancelar · Finalizar →</Text>
            {agendamentosDia.map((a) => (
              <AgendamentoCard
                key={a.id}
                agendamento={a}
                onFinalizar={handleFinalizar}
                onCancelar={pedirCancelamento}
              />
            ))}
          </>
        )}
      </View>

      <View style={{ height: 100 }} />

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
  hint: { color: colors.textMuted, fontSize: 11, fontStyle: 'italic', marginBottom: 10 },
});
