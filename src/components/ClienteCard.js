import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function ClienteCard({ cliente, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{cliente.avatar}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.nome}>{cliente.nome}</Text>
        <View style={styles.telefoneRow}>
          <MaterialCommunityIcons
            name="phone"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={styles.telefone}>{cliente.telefone}</Text>
        </View>
        {cliente.observacoes ? (
          <Text style={styles.obs} numberOfLines={1}>
            {cliente.observacoes}
          </Text>
        ) : null}
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={colors.textMuted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  nome: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  telefoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  telefone: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  obs: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
    fontStyle: 'italic',
  },
});
