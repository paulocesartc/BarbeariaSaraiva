import React, { useMemo } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

export default function PremiumButton({ title, onPress, style, variant = 'filled' }) {
  const { primaryColor } = useTheme();
  const isFilled = variant === 'filled';
  const styles = useMemo(() => makeStyles(primaryColor), [primaryColor]);

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

function makeStyles(primary) {
  return StyleSheet.create({
    button: {
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filled: {
      backgroundColor: primary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: primary,
    },
    text: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    textOutline: {
      color: primary,
    },
  });
}
