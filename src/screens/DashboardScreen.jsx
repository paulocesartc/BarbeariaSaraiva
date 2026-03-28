import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import useStore from '../store/useStore';
import AgendamentoCard from '../components/AgendamentoCard';
import PremiumButton from '../components/PremiumButton';

export default function DashboardScreen({ navigation }) {
  const agendamentos = useStore((s) => s.agendamentos);
  const hoje = new Date().toISOString().split('T')[0];
  const agendamentosHoje = agendamentos.filter((a) => a.data === hoje);
  const proximosAtendimentos = agendamentosHoje.filter(
    (a) => a.status !== 'finalizado'
  );
  const faturamento = agendamentosHoje
    .filter((a) => a.status === 'finalizado')
    .reduce((sum, a) => sum + a.valor, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.greeting}>Barbearia Saraiva</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons
            name="account-group"
            size={28}
            color={colors.gold}
          />
          <Text style={styles.statValue}>{agendamentosHoje.length}</Text>
          <Text style={styles.statLabel}>Clientes hoje</Text>
        </View>

        <View style={[styles.statCard, styles.statCardGold]}>
          <MaterialCommunityIcons
            name="cash"
            size={28}
            color={colors.background}
          />
          <Text style={[styles.statValue, { color: colors.background }]}>
            R$ {faturamento}
          </Text>
          <Text style={[styles.statLabel, { color: colors.goldDark }]}>
            Faturamento
          </Text>
        </View>
      </View>

      {/* Novo Agendamento */}
      <PremiumButton
        title="+ Novo Agendamento"
        onPress={() => navigation.navigate('NovoAgendamento')}
        style={styles.novoBtn}
      />

      {/* Proximos Atendimentos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Proximos Atendimentos</Text>
        {proximosAtendimentos.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="calendar-check"
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>
              Nenhum atendimento pendente hoje
            </Text>
          </View>
        ) : (
          proximosAtendimentos.map((a) => (
            <AgendamentoCard key={a.id} agendamento={a} />
          ))
        )}
      </View>

      {/* Agenda do dia completa */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Agenda do Dia</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Agenda')}>
            <Text style={styles.verTudo}>Ver completa</Text>
          </TouchableOpacity>
        </View>
        {agendamentosHoje.map((a) => (
          <AgendamentoCard key={a.id} agendamento={a} />
        ))}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    gap: 14,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  greeting: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  date: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statCardGold: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  statValue: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 6,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  novoBtn: {
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  verTudo: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 10,
    fontSize: 14,
  },
});
