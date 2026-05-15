import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

export default function TimeSlot({ horario, selecionado, ocupado, lunch, onPress }) {
  const { primaryColor } = useTheme();
  const styles = useMemo(() => makeStyles(primaryColor), [primaryColor]);

  return (
    <TouchableOpacity
      style={[
        styles.slot,
        selecionado && styles.selecionado,
        ocupado && !lunch && styles.ocupado,
        lunch && styles.almoco,
      ]}
      onPress={onPress}
      disabled={ocupado}
      activeOpacity={0.7}
    >
      {lunch && (
        <MaterialCommunityIcons name="food-fork-drink" size={12} color={colors.textMuted} style={{ marginBottom: 2 }} />
      )}
      <Text
        style={[
          styles.text,
          selecionado && styles.textSelecionado,
          ocupado && !lunch && styles.textOcupado,
          lunch && styles.textAlmoco,
        ]}
      >
        {horario}
      </Text>
    </TouchableOpacity>
  );
}

function makeStyles(primary) {
  return StyleSheet.create({
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
      backgroundColor: primary,
      borderColor: primary,
    },
    ocupado: {
      backgroundColor: colors.surfaceLight,
      borderColor: colors.border,
      opacity: 0.4,
    },
    almoco: {
      backgroundColor: `${colors.info}12`,
      borderColor: `${colors.info}40`,
      opacity: 0.6,
      alignItems: 'center',
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
    textAlmoco: {
      color: colors.textMuted,
      fontSize: 13,
    },
  });
}
