import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../theme/colors';
import { exportBackup, importBackup } from '../services/backup';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { showToast } from '../hooks/useToast';

export default function ConfiguracoesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(null);
  const [confirmImport, setConfirmImport] = useState({ visible: false, uri: null, fileName: '' });

  async function handleExport() {
    if (busy) return;
    setBusy('export');
    try {
      const res = await exportBackup();
      showToast({
        type: 'success',
        text1: 'Backup gerado',
        text2: `${res.totals.clients} clientes · ${res.totals.appointments} agendamentos`,
      });
    } catch (e) {
      console.log('[config] export erro:', e);
      showToast({ type: 'error', text1: 'Erro ao gerar backup', text2: 'Tente novamente.' });
    } finally {
      setBusy(null);
    }
  }

  async function handlePickImport() {
    if (busy) return;
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/json', '*/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const file = res.assets?.[0];
      if (!file) return;
      setConfirmImport({ visible: true, uri: file.uri, fileName: file.name });
    } catch (e) {
      console.log('[config] picker erro:', e);
      showToast({ type: 'error', text1: 'Erro ao abrir arquivo' });
    }
  }

  async function confirmRestore() {
    const { uri } = confirmImport;
    setConfirmImport({ visible: false, uri: null, fileName: '' });
    setBusy('import');
    try {
      const res = await importBackup(uri);
      showToast({
        type: 'success',
        text1: 'Backup restaurado',
        text2: `${res.clients} clientes · ${res.appointments} agendamentos`,
      });
    } catch (e) {
      console.log('[config] import erro:', e);
      showToast({ type: 'error', text1: 'Falha ao restaurar', text2: e.message ?? 'Arquivo inválido.' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Configurações</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.sectionTitle}>Backup</Text>
        <Text style={styles.sectionDesc}>
          Exporte periodicamente para não perder clientes e atendimentos caso troque de celular ou o app seja desinstalado.
        </Text>

        <TouchableOpacity
          style={[styles.actionCard, busy && { opacity: 0.6 }]}
          onPress={handleExport}
          disabled={!!busy}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${colors.gold}22` }]}>
            {busy === 'export' ? (
              <ActivityIndicator color={colors.gold} />
            ) : (
              <MaterialCommunityIcons name="cloud-upload-outline" size={28} color={colors.gold} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Exportar backup</Text>
            <Text style={styles.actionDesc}>
              Gera um arquivo .json com todos os dados e abre o menu de compartilhamento.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, busy && { opacity: 0.6 }]}
          onPress={handlePickImport}
          disabled={!!busy}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${colors.info}22` }]}>
            {busy === 'import' ? (
              <ActivityIndicator color={colors.info} />
            ) : (
              <MaterialCommunityIcons name="cloud-download-outline" size={28} color={colors.info} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Restaurar backup</Text>
            <Text style={styles.actionDesc}>
              Escolha um arquivo .json exportado anteriormente. Substitui todos os dados atuais.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.warning}>
          <MaterialCommunityIcons name="alert-outline" size={18} color={colors.danger} />
          <Text style={styles.warningText}>
            Restaurar apaga tudo que está no app agora e coloca no lugar o que estiver no arquivo.
          </Text>
        </View>
      </ScrollView>

      <DeleteConfirmModal
        visible={confirmImport.visible}
        title="Restaurar backup"
        description={`Isso vai substituir todos os dados atuais pelo conteúdo de "${confirmImport.fileName}". Continuar?`}
        onConfirm={confirmRestore}
        onCancel={() => setConfirmImport({ visible: false, uri: null, fileName: '' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingBottom: 16,
  },
  navBtn: { padding: 4 },
  title: { color: colors.white, fontSize: 20, fontWeight: '700' },
  sectionTitle: { color: colors.gold, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  sectionDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 20 },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  actionTitle: { color: colors.white, fontSize: 15, fontWeight: '700', marginBottom: 2 },
  actionDesc: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  warning: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: `${colors.danger}15`, borderRadius: 12,
    padding: 14, marginTop: 20, borderLeftWidth: 3, borderLeftColor: colors.danger,
  },
  warningText: { color: colors.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
});
