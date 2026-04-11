import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { getClientById, setClientActive } from '../database/clientsDb';
import { showToast } from '../hooks/useToast';

export default function ClientePerfilScreen({ route, navigation }) {
  const { clienteId } = route.params;
  const insets = useSafeAreaInsets();
  const [cliente, setCliente] = useState(null);

  const carregar = useCallback(async () => {
    const data = await getClientById(clienteId);
    setCliente(data);
  }, [clienteId]);

  useEffect(() => { carregar(); }, [carregar]);

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

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
    >
      {/* Back */}
      <TouchableOpacity style={[styles.backBtn, { paddingTop: insets.top + 16 }]} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
      </TouchableOpacity>

      {/* Header */}
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
            <MaterialCommunityIcons name="phone" size={15} color={colors.gold} />
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

      {/* Stats */}
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

      {/* Switch ativo/inativo */}
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
          trackColor={{ false: colors.border, true: `${colors.gold}66` }}
          thumbColor={isActive ? colors.gold : colors.textMuted}
        />
      </View>

      {/* Histórico — virá dos agendamentos finalizados futuramente */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Histórico de Atendimentos</Text>

        <View style={styles.emptyHistory}>
          <MaterialCommunityIcons name="history" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>Histórico disponível após agendamentos finalizados</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },

  backBtn: { paddingBottom: 10, width: 40 },

  profileHeader: {
    alignItems: 'center', paddingBottom: 24,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarInactive: { backgroundColor: colors.textMuted },
  avatarText: { color: colors.background, fontSize: 28, fontWeight: '800' },

  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nome: { color: colors.white, fontSize: 24, fontWeight: '700' },
  inactiveBadge: {
    backgroundColor: colors.border, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
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
  statValue: { color: colors.gold, fontSize: 20, fontWeight: '800' },
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
});
