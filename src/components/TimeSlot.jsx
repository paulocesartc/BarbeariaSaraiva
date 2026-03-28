import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function TimeSlot({ horario, selecionado, ocupado, onPress }) {
  return (
    <TouchableOpacity
      style={[
        styles.slot,
        selecionado && styles.selecionado,
        ocupado && styles.ocupado,
      ]}
      onPress={onPress}
      disabled={ocupado}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          selecionado && styles.textSelecionado,
          ocupado && styles.textOcupado,
        ]}
      >
        {horario}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  slot: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    margin: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  selecionado: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  ocupado: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    opacity: 0.4,
  },
  text: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  textSelecionado: {
    color: colors.background,
  },
  textOcupado: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
});
