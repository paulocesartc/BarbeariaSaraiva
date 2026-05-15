import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Image } from 'react-native';
import ColorPicker from 'react-native-wheel-color-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { exportBackup, importBackup } from '../services/backup';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { showToast } from '../hooks/useToast';
import { getLunchTime, setLunchTime, getLogoUrl, setLogoUrl } from '../database/settingsDb';
import { supabase } from '../database/db';


const PRESETS = [
  { label: 'Dourado',  color: '#D4AF37' },
  { label: 'Azul',     color: '#3498DB' },
  { label: 'Verde',    color: '#27AE60' },
  { label: 'Roxo',     color: '#9B59B6' },
];

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
  const { primaryColor, setPrimaryColor } = useTheme();
  const styles = useMemo(() => makeStyles(primaryColor), [primaryColor]);

  const [busy, setBusy] = useState(null);
  const [confirmImport, setConfirmImport] = useState({ visible: false, uri: null, fileName: '' });
  const [lunchInput, setLunchInput] = useState('');
  const [savingLunch, setSavingLunch] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [previewColor, setPreviewColor] = useState(primaryColor);
  const [logoUri, setLogoUri] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const pickerColorRef = useRef(primaryColor);
  const pickerRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      getLunchTime().then(setLunchInput).catch(() => {});
      getLogoUrl().then((u) => { if (u) setLogoUri(u); }).catch(() => {});
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
      showToast({ type: 'error', text1: 'Falha ao restaurar', text2: e.message ?? 'Arquivo inválido.' });
    } finally {
      setBusy(null);
    }
  }

  async function handleConfirmColor() {
    await setPrimaryColor(pickerColorRef.current);
    setPickerVisible(false);
    showToast({ type: 'success', text1: 'Cor aplicada!' });
  }

  async function handlePickLogo() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      showToast({ type: 'error', text1: 'Permissão negada', text2: 'Permita acesso à galeria nas configurações.' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploadingLogo(true);
    try {
      const mimeExt = asset.mimeType?.split('/')[1];
      const uriExt = asset.uri.split('.').pop()?.toLowerCase().split('?')[0];
      const ext = mimeExt ?? uriExt ?? 'jpg';
      const fileName = `logo.${ext}`;
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, name: fileName, type: `image/${ext}` });
      await supabase.storage.createBucket('logos', { public: true }).catch(() => {});
      await supabase.storage.from('logos').remove([fileName]).catch(() => {});
      const { error: upErr } = await supabase.storage.from('logos').upload(fileName, formData, {
        contentType: `image/${ext}`,
      });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(fileName);
      const urlFinal = `${publicUrl}?t=${Date.now()}`;
      await setLogoUrl(urlFinal);
      setLogoUri(urlFinal);
      showToast({ type: 'success', text1: 'Logo atualizada!' });
    } catch (e) {
      showToast({ type: 'error', text1: 'Erro ao enviar logo', text2: e?.message ?? 'Tente novamente.' });
    } finally {
      setUploadingLogo(false);
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

        {/* ── Personalização ── */}
        <Text style={styles.sectionTitle}>Personalização</Text>
        <TouchableOpacity style={styles.colorCard} onPress={() => { setPreviewColor(primaryColor); pickerColorRef.current = primaryColor; setPickerVisible(true); }} activeOpacity={0.8}>
          <View style={[styles.colorPreview, { backgroundColor: pickerVisible ? previewColor : primaryColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Cor principal</Text>
            <Text style={styles.actionDesc}>Toque para abrir o seletor de cores.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.colorCard} onPress={handlePickLogo} activeOpacity={0.8} disabled={uploadingLogo}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoPreview} />
          ) : (
            <View style={[styles.logoPreview, styles.logoPlaceholder]}>
              <MaterialCommunityIcons name="image-outline" size={24} color={colors.textMuted} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Logo da barbearia</Text>
            <Text style={styles.actionDesc}>Toque para escolher uma imagem da galeria.</Text>
          </View>
          {uploadingLogo ? (
            <ActivityIndicator size="small" color={primaryColor} />
          ) : (
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          )}
        </TouchableOpacity>

        <Modal visible={pickerVisible} transparent animationType="slide" onRequestClose={() => setPickerVisible(false)}>
          <View style={styles.pickerOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setPickerVisible(false)} />
            <View style={[styles.pickerSheet, { paddingBottom: Math.max(insets.bottom + 16, 36) }]}>
              <View style={styles.pickerHandle} />

              <View style={styles.pickerTopRow}>
                <View style={[styles.pickerBigPreview, { backgroundColor: previewColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerTitle}>Cor principal</Text>
                  <Text style={styles.pickerHex}>{previewColor.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.presetsRow}>
                {PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p.color}
                    style={[styles.presetSwatch, { backgroundColor: p.color }, previewColor.toUpperCase() === p.color.toUpperCase() && styles.presetSwatchActive]}
                    onPress={() => { pickerColorRef.current = p.color; setPreviewColor(p.color); }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.presetLabel}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.pickerSub}>Ou arraste para escolher</Text>
              <View style={styles.pickerWrapper}>
                <ColorPicker
                  ref={pickerRef}
                  color={primaryColor}
                  onColorChange={(c) => { pickerColorRef.current = c; setPreviewColor(c); }}
                  thumbSize={28}
                  sliderSize={28}
                  noSnap
                  row={false}
                  swatches={false}
                  discrete={false}
                />
              </View>

              <View style={styles.pickerBtns}>
                <TouchableOpacity style={styles.pickerBtnCancel} onPress={() => setPickerVisible(false)}>
                  <Text style={styles.pickerBtnCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pickerBtnConfirm, { backgroundColor: previewColor }]} onPress={handleConfirmColor}>
                  <Text style={styles.pickerBtnConfirmText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ── Agenda ── */}
        <Text style={styles.sectionTitle}>Agenda</Text>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Horarios')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconWrap, { backgroundColor: `${primaryColor}22` }]}>
            <MaterialCommunityIcons name="clock-edit-outline" size={28} color={primaryColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Horários de Atendimento</Text>
            <Text style={styles.actionDesc}>Ative ou desative horários específicos do dia.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
        </TouchableOpacity>

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

        {/* ── Backup ── */}
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
          <View style={[styles.iconWrap, { backgroundColor: `${primaryColor}22` }]}>
            {busy === 'export' ? (
              <ActivityIndicator color={primaryColor} />
            ) : (
              <MaterialCommunityIcons name="cloud-upload-outline" size={28} color={primaryColor} />
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

function makeStyles(primary) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20 },
    navBar: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingBottom: 16,
    },
    navBtn: { padding: 4 },
    title: { color: colors.white, fontSize: 20, fontWeight: '700' },
    sectionTitle: { color: primary, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
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
      backgroundColor: primary, paddingHorizontal: 20, paddingVertical: 12,
      borderRadius: 10, minWidth: 80, alignItems: 'center',
    },
    lunchBtnText: { color: colors.background, fontWeight: '700', fontSize: 14 },
    // Personalização
    colorCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: colors.surface, borderRadius: 14, padding: 16,
      borderWidth: 1, borderColor: colors.border, marginBottom: 12,
    },
    colorPreview: { width: 48, height: 48, borderRadius: 12 },
    logoPreview: { width: 48, height: 48, borderRadius: 12 },
    logoPlaceholder: {
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
      alignItems: 'center', justifyContent: 'center',
    },
    pickerOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end',
    },
    pickerSheet: {
      backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24,
    },
    pickerHandle: {
      width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textMuted,
      alignSelf: 'center', marginBottom: 20,
    },
    pickerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
    pickerBigPreview: { width: 56, height: 56, borderRadius: 16 },
    pickerTitle: { color: colors.white, fontSize: 18, fontWeight: '700' },
    pickerHex: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginTop: 4, letterSpacing: 1 },
    pickerSub: { color: colors.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    pickerWrapper: { height: 280, marginBottom: 24 },
    pickerBtns: { flexDirection: 'row', gap: 12 },
    pickerBtnCancel: {
      flex: 1, padding: 14, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    },
    pickerBtnCancelText: { color: colors.textSecondary, fontWeight: '600' },
    pickerBtnConfirm: {
      flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    },
    pickerBtnConfirmText: { color: colors.background, fontWeight: '700', fontSize: 15 },
    presetsRow: {
      flexDirection: 'row', gap: 10, marginBottom: 20, justifyContent: 'center',
    },
    presetSwatch: {
      flex: 1, paddingVertical: 10, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    presetSwatchActive: {
      borderWidth: 3, borderColor: colors.white,
    },
    presetLabel: { color: '#fff', fontSize: 11, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  });
}
