import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const CONFIGS = {
  success: { icon: 'check-circle-outline', color: colors.success },
  error:   { icon: 'alert-circle-outline',  color: colors.danger },
  info:    { icon: 'information-outline',   color: colors.gold },
};

const Toast = forwardRef((_, ref) => {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const timer = useRef(null);
  const [toast, setToast] = useState({ type: 'success', text1: '', text2: '' });

  useImperativeHandle(ref, () => ({
    show({ type = 'success', text1 = '', text2 = '', duration = 3000 }) {
      if (timer.current) clearTimeout(timer.current);

      setToast({ type, text1, text2 });

      Animated.parallel([
        Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start();

      timer.current = setTimeout(() => hide(), duration);
    },
  }));

  function hide() {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 250, useNativeDriver: true }),
    ]).start();
  }

  const cfg = CONFIGS[toast.type] ?? CONFIGS.info;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { top: insets.top + 12, opacity, transform: [{ translateY }], borderLeftColor: cfg.color },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${cfg.color}22` }]}>
        <MaterialCommunityIcons name={cfg.icon} size={20} color={cfg.color} />
      </View>
      <View style={styles.texts}>
        {toast.text1 ? <Text style={styles.title}>{toast.text1}</Text> : null}
        {toast.text2 ? <Text style={styles.message}>{toast.text2}</Text> : null}
      </View>
    </Animated.View>
  );
});

export default Toast;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    zIndex: 9999,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1 },
  title: { color: colors.white, fontSize: 14, fontWeight: '700' },
  message: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
});
