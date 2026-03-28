import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import useStore from '../store/useStore';

export default function ServicosScreen() {
  const servicos = useStore((s) => s.servicos);

  const renderServico = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name={item.icone}
          size={26}
          color={colors.gold}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.nome}>{item.nome}</Text>
        <View style={styles.detailsRow}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={styles.duracao}>{item.duracao} min</Text>
        </View>
      </View>

      <View style={styles.precoContainer}>
        <Text style={styles.preco}>R$ {item.preco}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Servicos</Text>
      <Text style={styles.subtitle}>
        {servicos.length} servicos disponiveis
      </Text>

      <FlatList
        data={servicos}
        keyExtractor={(item) => item.id}
        renderItem={renderServico}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
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
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  duracao: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  precoContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  preco: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },
});
