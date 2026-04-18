import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export const PAYMENT_METHODS = {
  dinheiro: { label: 'Dinheiro', icon: 'cash',                color: colors.success },
  pix:      { label: 'Pix',      icon: 'qrcode',              color: colors.gold },
  cartao:   { label: 'Cartão',   icon: 'credit-card-outline', color: colors.info },
};

export default function PaymentMethodModal({ visible, appointment, onConfirm, onCancel }) {
  const insets = useSafeAreaInsets();
  const pb = Math.max(insets.bottom + 8, 24);

  const [picked, setPicked] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setPicked(null);
      setSaving(false);
    }
  }, [visible]);

  async function handlePick(key) {
    if (saving) return;
    setPicked(key);
    setSaving(true);
    try {
      await onConfirm(key);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (saving) return;
    onCancel?.();
  }

  const options = Object.entries(PAYMENT_METHODS);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={handleCancel}
          disabled={saving}
        />
        <View style={[styles.sheet, { paddingBottom: pb }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Forma de pagamento</Text>
          {appointment && (
            <Text style={styles.subtitle}>
              {appointment.client_name} · R$ {Number(appointment.price ?? 0).toFixed(2)}
            </Text>
          )}

          <View style={styles.options}>
            {options.map(([key, cfg]) => {
              const isPicked = picked === key;
              const dim = saving && !isPicked;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.option,
                    isPicked && { borderColor: cfg.color, borderWidth: 1.5 },
                    dim && { opacity: 0.4 },
                  ]}
                  onPress={() => handlePick(key)}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconWrap, { backgroundColor: `${cfg.color}22` }]}>
                    {isPicked && saving ? (
                      <ActivityIndicator color={cfg.color} />
                    ) : (
                      <MaterialCommunityIcons name={cfg.icon} size={28} color={cfg.color} />
                    )}
                  </View>
                  <Text style={styles.optionLabel}>{cfg.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={handleCancel} disabled={saving} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, saving && { opacity: 0.4 }]}>
              {saving ? 'Processando...' : 'Cancelar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textMuted, alignSelf: 'center', marginBottom: 16 },
  title: { color: colors.white, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  options: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginBottom: 16 },
  option: {
    flex: 1, backgroundColor: colors.background, borderRadius: 14,
    paddingVertical: 18, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  optionLabel: { color: colors.white, fontSize: 14, fontWeight: '700' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
});
