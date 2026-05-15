import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { showToast } from '../hooks/useToast';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
  createCombo,
} from '../database/servicesDb';
import { formatCurrencyInput, parseCurrency } from '../utils/currency';

const ICONS = [
  'content-cut', 'face-man', 'eye-outline', 'palette',
  'water', 'flash', 'spa', 'star', 'scissors-cutting',
  'hair-dryer', 'bottle-tonic', 'razor',
];

function useSheetPadding() {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'ios'
    ? Math.max(insets.bottom, 16)
    : Math.max(insets.bottom + 8, 24);
}

export default function ServicosScreen() {
  const insets = useSafeAreaInsets();
  const sheetPaddingBottom = useSheetPadding();
  const { primaryColor } = useTheme();
  const styles = useMemo(() => makeStyles(primaryColor), [primaryColor]);

  const [servicos, setServicos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [comboModal, setComboModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ visible: false, item: null });
  const [selecionados, setSelecionados] = useState([]);
  const [modoSelecao, setModoSelecao] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', duration_min: '', icon: 'content-cut' });
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', duration_min: '', icon: '' });
  const [comboNome, setComboNome] = useState('');
  const [comboPreco, setComboPreco] = useState('');

  const carregar = useCallback(async () => {
    const data = await getAllServices();
    setServicos(data);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleCriar() {
    const name = form.name.trim();
    const price = parseCurrency(form.price);
    const duration_min = parseInt(form.duration_min) || 30;
    if (!name) return showToast({ type: 'error', text1: 'Campo obrigatório', text2: 'Informe o nome do serviço.' });
    if (!price || price <= 0) return showToast({ type: 'error', text1: 'Preço inválido', text2: 'Informe um valor maior que zero.' });
    try {
      await createService({ name, price, duration_min, icon: form.icon });
      setForm({ name: '', price: '', duration_min: '', icon: 'content-cut' });
      setModalVisible(false);
      carregar();
      showToast({ type: 'success', text1: 'Serviço criado', text2: `"${name}" foi adicionado.` });
    } catch (e) {
      showToast({ type: 'error', text1: 'Erro ao salvar', text2: String(e.message || e) });
    }
  }

  function abrirEdicao(item) {
    setEditando(item);
    setEditForm({
      name: item.name,
      price: item.price.toFixed(2).replace('.', ','),
      duration_min: String(item.duration_min),
      icon: item.icon,
    });
    setEditModal(true);
  }

  async function handleEditar() {
    const name = editForm.name.trim();
    const price = parseCurrency(editForm.price);
    const duration_min = parseInt(editForm.duration_min) || 30;
    if (!name) return showToast({ type: 'error', text1: 'Campo obrigatório', text2: 'Informe o nome do serviço.' });
    if (!price || price <= 0) return showToast({ type: 'error', text1: 'Preço inválido', text2: 'Informe um valor maior que zero.' });
    try {
      await updateService(editando.id, { name, price, duration_min, icon: editForm.icon });
      setEditModal(false);
      setEditando(null);
      carregar();
      showToast({ type: 'success', text1: 'Serviço atualizado', text2: `"${name}" foi salvo.` });
    } catch (e) {
      showToast({ type: 'error', text1: 'Erro ao atualizar', text2: 'Tente novamente.' });
    }
  }

  function pedirExclusao(item) { setDeleteModal({ visible: true, item }); }

  async function confirmarExclusao() {
    await deleteService(deleteModal.item.id);
    setDeleteModal({ visible: false, item: null });
    carregar();
  }

  function toggleSelecao(item) {
    setSelecionados((prev) => {
      const exists = prev.find((s) => s.id === item.id);
      return exists ? prev.filter((s) => s.id !== item.id) : [...prev, item];
    });
  }

  function abrirCombo() {
    if (selecionados.length < 2) return showToast({ type: 'info', text1: 'Selecione mais serviços', text2: 'Escolha ao menos 2 para criar um combo.' });
    const soma = selecionados.reduce((acc, s) => acc + s.price, 0);
    setComboNome(selecionados.map((s) => s.name).join(' + '));
    setComboPreco(soma.toFixed(2).replace('.', ','));
    setComboModal(true);
  }

  async function handleCriarCombo() {
    const price = parseCurrency(comboPreco);
    if (!price || price <= 0) return showToast({ type: 'error', text1: 'Preço inválido', text2: 'Informe um valor maior que zero.' });
    try {
      const nome = comboNome.trim() || selecionados.map((s) => s.name).join(' + ');
      await createCombo({ services: selecionados, finalPrice: price, customName: comboNome.trim() || undefined });
      setComboModal(false);
      setSelecionados([]);
      setModoSelecao(false);
      setComboNome('');
      setComboPreco('');
      carregar();
      showToast({ type: 'success', text1: 'Combo criado', text2: `"${nome}" foi adicionado.` });
    } catch (e) {
      showToast({ type: 'error', text1: 'Erro ao criar combo', text2: 'Tente novamente.' });
    }
  }

  function cancelarSelecao() {
    setSelecionados([]);
    setModoSelecao(false);
  }

  const fabBottom = 70 + insets.bottom + 30;
  const somaSelecao = selecionados.reduce((acc, s) => acc + s.price, 0);

  const renderServico = ({ item }) => {
    const isSelected = !!selecionados.find((s) => s.id === item.id);
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onLongPress={() => { setModoSelecao(true); toggleSelecao(item); }}
        onPress={() => { if (modoSelecao) { toggleSelecao(item); } else { abrirEdicao(item); } }}
        activeOpacity={0.85}
      >
        {modoSelecao && (
          <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
            {isSelected && <MaterialCommunityIcons name="check" size={14} color={colors.background} />}
          </View>
        )}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={item.icon || 'content-cut'} size={24} color={primaryColor} />
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.nome}>{item.name}</Text>
            {item.is_combo === 1 && (
              <View style={styles.comboBadge}>
                <Text style={styles.comboText}>COMBO</Text>
              </View>
            )}
          </View>
          <View style={styles.detailsRow}>
            <MaterialCommunityIcons name="clock-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.duracao}>{item.duration_min} min</Text>
          </View>
        </View>
        <View style={styles.acoes}>
          <View style={styles.precoContainer}>
            <Text style={styles.preco}>R$ {item.price.toFixed(2)}</Text>
          </View>
          {!modoSelecao && (
            <TouchableOpacity onPress={() => pedirExclusao(item)} style={styles.btnAcao} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Serviços</Text>
          <Text style={styles.subtitle}>{servicos.length} disponíveis</Text>
        </View>
      </View>

      {modoSelecao && (
        <View style={styles.barraCombo}>
          <Text style={styles.barraTexto}>
            {selecionados.length} selecionado{selecionados.length !== 1 ? 's' : ''}
            {selecionados.length > 0 ? ` · R$ ${somaSelecao.toFixed(2)}` : ''}
          </Text>
          <View style={styles.barraAcoes}>
            <TouchableOpacity onPress={cancelarSelecao} style={styles.btnBarra}>
              <Text style={styles.btnBarraTexto}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={abrirCombo} style={[styles.btnBarra, styles.btnBarraCombo]} disabled={selecionados.length < 2}>
              <MaterialCommunityIcons name="link-variant" size={16} color={colors.background} />
              <Text style={[styles.btnBarraTexto, { color: colors.background }]}>Criar Combo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!modoSelecao && (
        <Text style={styles.dicaSelecao}>Segure um serviço para selecionar e criar combos</Text>
      )}

      <FlatList
        data={servicos}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderServico}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: fabBottom + 20 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="content-cut" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Nenhum serviço cadastrado</Text>
            <Text style={styles.emptySubtext}>Toque em "Novo" para adicionar</Text>
          </View>
        }
      />

      {!modoSelecao && (
        <TouchableOpacity style={[styles.fab, { bottom: fabBottom - 12 }]} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <MaterialCommunityIcons name="plus" size={20} color={colors.background} />
          <Text style={styles.fabText}>Novo Serviço</Text>
        </TouchableOpacity>
      )}

      {/* Modal: Novo Serviço */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={0}>
            <View style={[styles.modalBox, { paddingBottom: sheetPaddingBottom }]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Novo Serviço</Text>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>Nome</Text>
                <TextInput style={styles.input} placeholder="Ex: Corte Degradê" placeholderTextColor={colors.textSecondary} value={form.name} onChangeText={(v) => setForm((f) => ({ ...f, name: v }))} />
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Preço (R$)</Text>
                    <TextInput style={styles.input} placeholder="0,00" placeholderTextColor={colors.textSecondary} keyboardType="number-pad" value={form.price} onChangeText={(v) => setForm((f) => ({ ...f, price: formatCurrencyInput(v) }))} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Duração (min)</Text>
                    <TextInput style={styles.input} placeholder="30" placeholderTextColor={colors.textSecondary} keyboardType="number-pad" value={form.duration_min} onChangeText={(v) => setForm((f) => ({ ...f, duration_min: v.replace(/\D/g, '') }))} />
                  </View>
                </View>
                <Text style={styles.label}>Ícone</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  {ICONS.map((ic) => (
                    <TouchableOpacity key={ic} onPress={() => setForm((f) => ({ ...f, icon: ic }))} style={[styles.iconBtn, form.icon === ic && styles.iconBtnActive]}>
                      <MaterialCommunityIcons name={ic} size={22} color={form.icon === ic ? colors.background : primaryColor} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.modalBtns}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnCancelar}><Text style={styles.btnCancelarText}>Cancelar</Text></TouchableOpacity>
                  <TouchableOpacity onPress={handleCriar} style={styles.btnSalvar}><Text style={styles.btnSalvarText}>Salvar</Text></TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal: Editar Serviço */}
      <Modal visible={editModal} transparent animationType="slide" onRequestClose={() => setEditModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setEditModal(false)} />
          <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={0}>
            <View style={[styles.modalBox, { paddingBottom: sheetPaddingBottom }]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Editar Serviço</Text>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>Nome</Text>
                <TextInput style={styles.input} placeholderTextColor={colors.textSecondary} value={editForm.name} onChangeText={(v) => setEditForm((f) => ({ ...f, name: v }))} />
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Preço (R$)</Text>
                    <TextInput style={styles.input} keyboardType="number-pad" value={editForm.price} onChangeText={(v) => setEditForm((f) => ({ ...f, price: formatCurrencyInput(v) }))} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Duração (min)</Text>
                    <TextInput style={styles.input} keyboardType="number-pad" value={editForm.duration_min} onChangeText={(v) => setEditForm((f) => ({ ...f, duration_min: v.replace(/\D/g, '') }))} />
                  </View>
                </View>
                <Text style={styles.label}>Ícone</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  {ICONS.map((ic) => (
                    <TouchableOpacity key={ic} onPress={() => setEditForm((f) => ({ ...f, icon: ic }))} style={[styles.iconBtn, editForm.icon === ic && styles.iconBtnActive]}>
                      <MaterialCommunityIcons name={ic} size={22} color={editForm.icon === ic ? colors.background : primaryColor} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.modalBtns}>
                  <TouchableOpacity onPress={() => setEditModal(false)} style={styles.btnCancelar}><Text style={styles.btnCancelarText}>Cancelar</Text></TouchableOpacity>
                  <TouchableOpacity onPress={handleEditar} style={styles.btnSalvar}><Text style={styles.btnSalvarText}>Salvar</Text></TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal: Criar Combo */}
      <Modal visible={comboModal} transparent animationType="slide" onRequestClose={() => setComboModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setComboModal(false)} />
          <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={0}>
            <View style={[styles.modalBox, { paddingBottom: sheetPaddingBottom }]}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Criar Combo</Text>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.comboResumo}>
                  {selecionados.map((s) => (
                    <View key={s.id} style={styles.comboItem}>
                      <MaterialCommunityIcons name={s.icon || 'content-cut'} size={16} color={primaryColor} />
                      <Text style={styles.comboItemNome}>{s.name}</Text>
                      <Text style={styles.comboItemPreco}>R$ {s.price.toFixed(2)}</Text>
                    </View>
                  ))}
                  <View style={styles.divisor} />
                  <View style={styles.comboItem}>
                    <Text style={[styles.comboItemNome, { color: colors.textSecondary }]}>Soma original</Text>
                    <Text style={styles.comboItemPreco}>R$ {somaSelecao.toFixed(2)}</Text>
                  </View>
                </View>
                <Text style={styles.label}>Nome do combo</Text>
                <TextInput style={styles.input} placeholderTextColor={colors.textSecondary} value={comboNome} onChangeText={setComboNome} />
                <Text style={styles.label}>Preço final (ajuste para dar desconto)</Text>
                <TextInput style={[styles.input, styles.inputDestaque]} keyboardType="number-pad" value={comboPreco} onChangeText={(v) => setComboPreco(formatCurrencyInput(v))} />
                {(() => {
                  const final = parseCurrency(comboPreco);
                  const desconto = somaSelecao - final;
                  if (!isNaN(final) && desconto > 0) {
                    return <Text style={styles.descontoHint}>Desconto de R$ {desconto.toFixed(2)} ({((desconto / somaSelecao) * 100).toFixed(0)}%)</Text>;
                  }
                  return null;
                })()}
                <View style={[styles.modalBtns, { marginTop: 12 }]}>
                  <TouchableOpacity onPress={() => setComboModal(false)} style={styles.btnCancelar}><Text style={styles.btnCancelarText}>Cancelar</Text></TouchableOpacity>
                  <TouchableOpacity onPress={handleCriarCombo} style={styles.btnSalvar}><Text style={styles.btnSalvarText}>Criar Combo</Text></TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <DeleteConfirmModal
        visible={deleteModal.visible}
        title="Excluir serviço"
        description={deleteModal.item ? `Deseja excluir "${deleteModal.item.name}"? Esta ação não pode ser desfeita.` : ''}
        onConfirm={confirmarExclusao}
        onCancel={() => setDeleteModal({ visible: false, item: null })}
      />
    </View>
  );
}

function makeStyles(primary) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, marginBottom: 4 },
    title: { color: colors.white, fontSize: 28, fontWeight: '800' },
    subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
    fab: {
      position: 'absolute', right: 20,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: primary, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14,
      elevation: 8, shadowColor: primary,
      shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
    },
    fabText: { color: colors.background, fontWeight: '700', fontSize: 14 },
    dicaSelecao: { color: colors.textSecondary, fontSize: 12, marginBottom: 12, fontStyle: 'italic' },
    barraCombo: {
      backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginVertical: 10,
      borderWidth: 1, borderColor: primary,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
    },
    barraTexto: { color: colors.white, fontWeight: '600', fontSize: 14 },
    barraAcoes: { flexDirection: 'row', gap: 8 },
    btnBarra: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
    btnBarraCombo: { backgroundColor: primary, borderColor: primary, flexDirection: 'row', alignItems: 'center', gap: 4 },
    btnBarraTexto: { color: colors.white, fontSize: 13, fontWeight: '600' },
    card: {
      backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginBottom: 10,
      flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'transparent',
    },
    cardSelected: { borderColor: primary },
    checkbox: {
      width: 20, height: 20, borderRadius: 10, borderWidth: 2,
      borderColor: primary, marginRight: 10, alignItems: 'center', justifyContent: 'center',
    },
    checkboxActive: { backgroundColor: primary },
    iconContainer: {
      width: 46, height: 46, borderRadius: 12, backgroundColor: colors.background,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
    },
    info: { flex: 1, marginLeft: 12 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    nome: { color: colors.white, fontSize: 15, fontWeight: '600', flexShrink: 1 },
    comboBadge: { backgroundColor: primary, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
    comboText: { color: colors.background, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    detailsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    duracao: { color: colors.textSecondary, fontSize: 12 },
    acoes: { alignItems: 'flex-end', gap: 6 },
    precoContainer: { backgroundColor: colors.background, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: primary },
    preco: { color: primary, fontSize: 15, fontWeight: '700' },
    botoesAcao: { flexDirection: 'row', gap: 4 },
    btnAcao: { padding: 4 },
    emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
    emptyText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
    emptySubtext: { color: colors.textMuted, fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalBox: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.textMuted, alignSelf: 'center', marginBottom: 20 },
    modalTitle: { color: colors.white, fontSize: 20, fontWeight: '800', marginBottom: 20 },
    label: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: colors.background, borderRadius: 10, padding: 12, color: colors.white, fontSize: 15, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
    inputDestaque: { borderColor: primary, fontSize: 18, fontWeight: '700', color: primary },
    row: { flexDirection: 'row' },
    iconBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1, borderColor: colors.border },
    iconBtnActive: { backgroundColor: primary, borderColor: primary },
    modalBtns: { flexDirection: 'row', gap: 10 },
    btnCancelar: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    btnCancelarText: { color: colors.textSecondary, fontWeight: '600' },
    btnSalvar: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: primary, alignItems: 'center' },
    btnSalvarText: { color: colors.background, fontWeight: '700', fontSize: 15 },
    comboResumo: { backgroundColor: colors.background, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
    comboItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
    comboItemNome: { flex: 1, color: colors.white, fontSize: 14 },
    comboItemPreco: { color: primary, fontWeight: '700', fontSize: 14 },
    divisor: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
    descontoHint: { color: colors.success, fontSize: 13, fontWeight: '600', marginBottom: 12, marginTop: -8 },
  });
}
