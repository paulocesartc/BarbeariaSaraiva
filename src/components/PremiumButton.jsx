import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function PremiumButton({ title, onPress, style, variant = 'filled' }) {
  const isFilled = variant === 'filled';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isFilled ? styles.filled : styles.outline,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, !isFilled && styles.textOutline]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filled: {
    backgroundColor: colors.gold,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  text: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textOutline: {
    color: colors.gold,
  },
});
