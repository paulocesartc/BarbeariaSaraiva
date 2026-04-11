import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

/**
 * Modal de confirmação de exclusão reutilizável.
 *
 * Props:
 *  - visible: boolean
 *  - title: string          ex: "Excluir serviço"
 *  - description: string    ex: 'Deseja excluir "Corte de Cabelo"?'
 *  - onConfirm: () => void
 *  - onCancel: () => void
 */
export default function DeleteConfirmModal({ visible, title, description, onConfirm, onCancel }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.box, { marginBottom: insets.bottom + 16 }]}>
          {/* Ícone */}
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="trash-can-outline" size={32} color={colors.danger} />
          </View>

          {/* Textos */}
          <Text style={styles.title}>{title || 'Confirmar exclusão'}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}

          {/* Botões */}
          <View style={styles.btns}>
            <TouchableOpacity style={styles.btnCancelar} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.btnCancelarText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnExcluir} onPress={onConfirm} activeOpacity={0.8}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.white} />
              <Text style={styles.btnExcluirText}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  box: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(231,76,60,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  btns: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  btnCancelar: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelarText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  btnExcluir: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  btnExcluirText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
