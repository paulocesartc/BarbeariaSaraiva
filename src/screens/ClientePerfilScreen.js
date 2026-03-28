import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import useStore from '../store/useStore';

export default function ClientePerfilScreen({ route, navigation }) {
  const { cliente } = route.params;
  const historico = useStore((s) => s.historico).filter(
    (h) => h.clienteId === cliente.id
  );

  const totalGasto = historico.reduce((sum, h) => sum + h.valor, 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={colors.white}
        />
      </TouchableOpacity>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{cliente.avatar}</Text>
        </View>
        <Text style={styles.nome}>{cliente.nome}</Text>

        <View style={styles.contactRow}>
          <MaterialCommunityIcons
            name="phone"
            size={16}
            color={colors.gold}
          />
          <Text style={styles.telefone}>{cliente.telefone}</Text>
        </View>

        {cliente.observacoes ? (
          <View style={styles.obsBox}>
            <MaterialCommunityIcons
              name="note-text"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.obsText}>{cliente.observacoes}</Text>
          </View>
        ) : null}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{historico.length}</Text>
          <Text style={styles.statLabel}>Atendimentos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>R$ {totalGasto}</Text>
          <Text style={styles.statLabel}>Total gasto</Text>
        </View>
      </View>

      {/* History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historico de Atendimentos</Text>

        {historico.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="history"
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>Nenhum atendimento registrado</Text>
          </View>
        ) : (
          historico
            .sort((a, b) => b.data.localeCompare(a.data))
            .map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyLeft}>
                  <View style={styles.historyDot} />
                  <View style={styles.historyLine} />
                </View>

                <View style={styles.historyContent}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyServico}>
                      {item.servicoNome}
                    </Text>
                    <Text style={styles.historyValor}>R$ {item.valor}</Text>
                  </View>

                  <Text style={styles.historyData}>
                    {new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>

                  {item.observacao ? (
                    <View style={styles.historyObsBox}>
                      <Text style={styles.historyObs}>{item.observacao}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  backBtn: {
    paddingTop: 60,
    paddingBottom: 10,
    width: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: colors.background,
    fontSize: 28,
    fontWeight: '800',
  },
  nome: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  telefone: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  obsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    maxWidth: '90%',
  },
  obsText: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  historyCard: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  historyLeft: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gold,
    marginTop: 4,
  },
  historyLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 4,
  },
  historyContent: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyServico: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  historyValor: {
    color: colors.gold,
    fontSize: 15,
    fontWeight: '700',
  },
  historyData: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  historyObsBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historyObs: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 10,
    fontSize: 14,
  },
});
