import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const statusConfig = {
  livre: { label: 'Agendado', color: colors.statusLivre, icon: 'clock-outline' },
  ocupado: { label: 'Em atendimento', color: colors.statusOcupado, icon: 'content-cut' },
  finalizado: { label: 'Finalizado', color: colors.statusFinalizado, icon: 'check-circle' },
};

export default function AgendamentoCard({ agendamento, onPress }) {
  const status = statusConfig[agendamento.status] || statusConfig.livre;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: status.color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.timeContainer}>
        <Text style={styles.horario}>{agendamento.horario}</Text>
        <Text style={styles.duracao}>{agendamento.duracao}min</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoContainer}>
        <Text style={styles.clienteNome}>{agendamento.clienteNome}</Text>
        <Text style={styles.servicoNome}>{agendamento.servicoNome}</Text>
        <View style={styles.statusRow}>
          <MaterialCommunityIcons
            name={status.icon}
            size={14}
            color={status.color}
          />
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.valorContainer}>
        <Text style={styles.valor}>R$ {agendamento.valor}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  timeContainer: {
    alignItems: 'center',
    width: 55,
  },
  horario: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  duracao: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: 14,
  },
  infoContainer: {
    flex: 1,
  },
  clienteNome: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  servicoNome: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  valorContainer: {
    alignItems: 'flex-end',
  },
  valor: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },
});
