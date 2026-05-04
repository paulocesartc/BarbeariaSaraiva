import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { colors } from '../theme/colors';
import { exportBackup, importBackup } from '../services/backup';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { showToast } from '../hooks/useToast';
import { getLunchTime, setLunchTime } from '../database/settingsDb';

function formatTimeInput(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function isValidTime(t) {
  if (!/^\d{2}:\d{2}$/.test(t)) return false;
  const [h, m] = t.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

export default function ConfiguracoesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(null);
  const [confirmImport, setConfirmImport] = useState({ visible: false, uri: null, fileName: '' });
  const [lunchInput, setLunchInput] = useState('');
  const [savingLunch, setSavingLunch] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getLunchTime().then(setLunchInput).catch(() => {});
    }, [])
  );

  async function handleSaveLunch() {
    if (!isValidTime(lunchInput)) {
      showToast({ type: 'error', text1: 'Horário inválido', text2: 'Use o formato HH:MM.' });
      return;
    }
    setSavingLunch(true);
    try {
      await setLunchTime(lunchInput);
      showToast({ type: 'success', text1: 'Horário de almoço atualizado', text2: `A partir de agora ${lunchInput} fica bloqueado.` });
    } catch (e) {
      showToast({ type: 'error', text1: 'Erro ao salvar' });
    } finally {
      setSavingLunch(false);
    }
  }

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

        <Text style={styles.sectionTitle}>Agenda</Text>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('DiasBloqueados')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${colors.danger}22` }]}>
            <MaterialCommunityIcons name="calendar-remove" size={28} color={colors.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Dias Bloqueados</Text>
            <Text style={styles.actionDesc}>
              Bloqueie dias específicos para que não aceitem novos agendamentos.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.lunchCard}>
          <View style={styles.lunchHeader}>
            <MaterialCommunityIcons name="food-fork-drink" size={22} color={colors.info} />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Horário de almoço</Text>
              <Text style={styles.actionDesc}>Esse horário fica bloqueado todos os dias automaticamente.</Text>
            </View>
          </View>
          <View style={styles.lunchRow}>
            <TextInput
              style={styles.lunchInput}
              value={lunchInput}
              onChangeText={(v) => setLunchInput(formatTimeInput(v))}
              keyboardType="number-pad"
              maxLength={5}
              placeholder="13:00"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={[styles.lunchBtn, savingLunch && { opacity: 0.6 }]}
              onPress={handleSaveLunch}
              disabled={savingLunch}
              activeOpacity={0.8}
            >
              {savingLunch ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.lunchBtnText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
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
  lunchCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  lunchHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  lunchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  lunchInput: {
    flex: 1, backgroundColor: colors.background, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, color: colors.white,
    fontSize: 20, fontWeight: '700', borderWidth: 1, borderColor: colors.border,
    textAlign: 'center', letterSpacing: 2,
  },
  lunchBtn: {
    backgroundColor: colors.gold, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 10, minWidth: 80, alignItems: 'center',
  },
  lunchBtnText: { color: colors.background, fontWeight: '700', fontSize: 14 },
});
