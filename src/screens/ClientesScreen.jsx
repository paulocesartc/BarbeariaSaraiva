import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, Modal,
  ScrollView, KeyboardAvoidingView, TouchableOpacity, Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Contacts from 'expo-contacts';
import { colors } from '../theme/colors';
import { getAllClients, createClient, updateClient, setClientActive, importClients } from '../database/clientsDb';
import { formatPhone } from '../utils/phone';
import { showToast } from '../hooks/useToast';

export default function ClientesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const fabBottom = 70 + insets.bottom + 16;

  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Modal novo/editar
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null); // null = novo
  const [form, setForm] = useState({ name: '', phone: '', description: '' });

  // Modal importar contatos
  const [importModal, setImportModal] = useState(false);
  const [contactList, setContactList] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [searchContato, setSearchContato] = useState('');

  const carregar = useCallback(async () => {
    const data = await getAllClients({ includeInactive: showInactive });
    setClientes(data);
  }, [showInactive]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const clientesFiltrados = clientes.filter((c) =>
    c.name.toLowerCase().includes(busca.toLowerCase()) ||
    (c.phone ?? '').includes(busca)
  );

  // ── Abrir formulário ───────────────────────────────────────────
  function abrirNovo() {
    setEditando(null);
    setForm({ name: '', phone: '', description: '' });
    setModalVisible(true);
  }

  function abrirEdicao(cliente) {
    setEditando(cliente);
    setForm({ name: cliente.name, phone: cliente.phone ?? '', description: cliente.description ?? '' });
    setModalVisible(true);
  }

  // ── Salvar (criar ou editar) ───────────────────────────────────
  async function handleSalvar() {
    const name = form.name.trim();
    if (!name) return showToast({ type: 'error', text1: 'Campo obrigatório', text2: 'Informe o nome do cliente.' });

    try {
      if (editando) {
        await updateClient(editando.id, { name, phone: form.phone, description: form.description });
        showToast({ type: 'success', text1: 'Cliente atualizado', text2: `"${name}" foi salvo.` });
      } else {
        await createClient({ name, phone: form.phone, description: form.description });
        showToast({ type: 'success', text1: 'Cliente cadastrado', text2: `"${name}" foi adicionado.` });
      }
      setModalVisible(false);
      carregar();
    } catch (e) {
      showToast({ type: 'error', text1: 'Erro ao salvar', text2: 'Tente novamente.' });
    }
  }

  // ── Ativar / Inativar ──────────────────────────────────────────
  async function handleToggleActive(cliente) {
    await setClientActive(cliente.id, !cliente.active);
    showToast({
      type: 'info',
      text1: cliente.active ? 'Cliente inativado' : 'Cliente reativado',
      text2: cliente.name,
    });
    carregar();
  }

  // ── Importar contatos ──────────────────────────────────────────
  async function abrirImport() {
    setLoadingContacts(true);
    setImportModal(true);
    setSelected(new Set());
    setSearchContato('');

    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      setImportModal(false);
      setLoadingContacts(false);
      return showToast({ type: 'error', text1: 'Permissão negada', text2: 'Acesso aos contatos não autorizado.' });
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      sort: Contacts.SortTypes.FirstName,
    });

    // Filtra só quem tem nome e pelo menos um telefone
    const validos = data
      .filter((c) => c.name && c.phoneNumbers?.length > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        phone: formatPhone(c.phoneNumbers[0].number ?? ''),
      }));

    setContactList(validos);
    setLoadingContacts(false);
  }

  function toggleContato(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    const filtrados = contactList.filter((c) =>
      c.name.toLowerCase().includes(searchContato.toLowerCase())
    );
    if (selected.size === filtrados.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtrados.map((c) => c.id)));
    }
  }

  async function handleImportar() {
    const paraImportar = contactList
      .filter((c) => selected.has(c.id))
      .map((c) => ({ name: c.name, phone: c.phone }));

    if (!paraImportar.length) return showToast({ type: 'info', text1: 'Nenhum selecionado', text2: 'Selecione ao menos um contato.' });

    try {
      const count = await importClients(paraImportar);
      setImportModal(false);
      carregar();
      showToast({
        type: 'success',
        text1: `${count} cliente${count !== 1 ? 's' : ''} importado${count !== 1 ? 's' : ''}`,
        text2: count < paraImportar.length ? `${paraImportar.length - count} já existiam e foram ignorados.` : undefined,
      });
    } catch (e) {
      showToast({ type: 'error', text1: 'Erro ao importar', text2: 'Tente novamente.' });
    }
  }

  const contatosFiltrados = contactList.filter((c) =>
    c.name.toLowerCase().includes(searchContato.toLowerCase())
  );

  const sheetPb = Math.max(insets.bottom + 8, 24);

  // ── Render card cliente ────────────────────────────────────────
  const renderCliente = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, !item.active && styles.cardInactive]}
      onPress={() => navigation.navigate('ClientePerfil', { clienteId: item.id })}
      activeOpacity={0.8}
    >
      <View style={[styles.avatar, !item.active && styles.avatarInactive]}>
        <Text style={styles.avatarText}>{item.avatar}</Text>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={[styles.cardName, !item.active && styles.textInactive]}>{item.name}</Text>
          {!item.active && (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inativo</Text>
            </View>
          )}
        </View>
        {item.phone ? (
          <Text style={styles.cardPhone}>{item.phone}</Text>
        ) : null}
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
      </View>

      <TouchableOpacity onPress={() => abrirEdicao(item)} style={styles.btnEditar}>
        <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.gold} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Clientes</Text>
          <Text style={styles.subtitle}>{clientes.length} cadastrado{clientes.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.btnImport} onPress={abrirImport}>
          <MaterialCommunityIcons name="contacts" size={18} color={colors.background} />
          <Text style={styles.btnImportText}>Importar</Text>
        </TouchableOpacity>
      </View>

      {/* Busca + toggle inativos */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome ou telefone..."
            placeholderTextColor={colors.textMuted}
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.toggleRow} onPress={() => setShowInactive((v) => !v)}>
        <MaterialCommunityIcons
          name={showInactive ? 'eye' : 'eye-off-outline'}
          size={16}
          color={colors.textSecondary}
        />
        <Text style={styles.toggleText}>
          {showInactive ? 'Ocultando inativos' : 'Mostrar inativos'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={clientesFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={renderCliente}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: fabBottom + 60 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { bottom: fabBottom }]} onPress={abrirNovo} activeOpacity={0.8}>
        <MaterialCommunityIcons name="plus" size={28} color={colors.background} />
      </TouchableOpacity>

      {/* ── Modal: Novo / Editar Cliente ── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setModalVisible(false)} />
          <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={0}>
            <View style={[styles.sheet, { paddingBottom: sheetPb }]}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>{editando ? 'Editar Cliente' : 'Novo Cliente'}</Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.label}>Nome *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nome completo"
                  placeholderTextColor={colors.textMuted}
                  value={form.name}
                  onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
                />

                <Text style={styles.label}>Telefone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={form.phone}
                  onChangeText={(v) => setForm((f) => ({ ...f, phone: formatPhone(v) }))}
                />

                <Text style={styles.label}>Descrição / Observações</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  placeholder="Preferências, alergias, anotações..."
                  placeholderTextColor={colors.textMuted}
                  value={form.description}
                  onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
                  multiline
                  numberOfLines={3}
                />

                {/* Switch ativar/inativar — só na edição */}
                {editando && (
                  <View style={styles.switchRow}>
                    <View>
                      <Text style={styles.switchLabel}>Cliente ativo</Text>
                      <Text style={styles.switchSub}>
                        {editando.active ? 'Desative para ocultar nas listas' : 'Reative para exibir normalmente'}
                      </Text>
                    </View>
                    <Switch
                      value={!!editando.active}
                      onValueChange={async (val) => {
                        await setClientActive(editando.id, val);
                        setEditando((e) => ({ ...e, active: val ? 1 : 0 }));
                        carregar();
                      }}
                      trackColor={{ false: colors.border, true: `${colors.gold}66` }}
                      thumbColor={editando.active ? colors.gold : colors.textMuted}
                    />
                  </View>
                )}

                <View style={styles.modalBtns}>
                  <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.btnCancelar}>
                    <Text style={styles.btnCancelarText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSalvar} style={styles.btnSalvar}>
                    <Text style={styles.btnSalvarText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Modal: Importar Contatos ── */}
      <Modal visible={importModal} transparent animationType="slide" onRequestClose={() => setImportModal(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={() => setImportModal(false)} />
          <View style={[styles.sheet, styles.sheetTall, { paddingBottom: sheetPb }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.importHeader}>
              <Text style={styles.sheetTitle}>Importar Contatos</Text>
              {!loadingContacts && (
                <TouchableOpacity onPress={toggleTodos} style={styles.btnTodos}>
                  <Text style={styles.btnTodosText}>
                    {selected.size === contatosFiltrados.length && contatosFiltrados.length > 0
                      ? 'Desmarcar todos'
                      : 'Selecionar todos'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {loadingContacts ? (
              <View style={styles.loadingBox}>
                <MaterialCommunityIcons name="loading" size={32} color={colors.gold} />
                <Text style={styles.loadingText}>Carregando contatos...</Text>
              </View>
            ) : (
              <>
                <View style={styles.searchContainer}>
                  <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar contato..."
                    placeholderTextColor={colors.textMuted}
                    value={searchContato}
                    onChangeText={setSearchContato}
                  />
                </View>

                <Text style={styles.importCount}>
                  {selected.size} selecionado{selected.size !== 1 ? 's' : ''} de {contatosFiltrados.length}
                </Text>

                <FlatList
                  data={contatosFiltrados}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  style={{ flex: 1 }}
                  renderItem={({ item }) => {
                    const isSelected = selected.has(item.id);
                    return (
                      <TouchableOpacity
                        style={[styles.contactItem, isSelected && styles.contactItemSelected]}
                        onPress={() => toggleContato(item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.contactAvatar, isSelected && styles.contactAvatarSelected]}>
                          {isSelected
                            ? <MaterialCommunityIcons name="check" size={16} color={colors.background} />
                            : <Text style={styles.contactAvatarText}>{item.name[0].toUpperCase()}</Text>
                          }
                        </View>
                        <View style={styles.contactInfo}>
                          <Text style={styles.contactName}>{item.name}</Text>
                          <Text style={styles.contactPhone}>{item.phone}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>Nenhum contato encontrado</Text>
                    </View>
                  }
                />

                <View style={[styles.modalBtns, { marginTop: 12 }]}>
                  <TouchableOpacity onPress={() => setImportModal(false)} style={styles.btnCancelar}>
                    <Text style={styles.btnCancelarText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleImportar}
                    style={[styles.btnSalvar, selected.size === 0 && { opacity: 0.5 }]}
                    disabled={selected.size === 0}
                  >
                    <Text style={styles.btnSalvarText}>
                      Importar {selected.size > 0 ? `(${selected.size})` : ''}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, marginBottom: 16,
  },
  title: { color: colors.white, fontSize: 28, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  btnImport: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.gold, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  btnImportText: { color: colors.background, fontWeight: '700', fontSize: 14 },

  searchRow: { marginBottom: 8 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, gap: 10,
  },
  searchInput: { flex: 1, color: colors.white, fontSize: 15 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 14, alignSelf: 'flex-start',
  },
  toggleText: { color: colors.textSecondary, fontSize: 13 },

  card: {
    backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, marginBottom: 10, flexDirection: 'row',
    alignItems: 'center', borderWidth: 1, borderColor: 'transparent',
  },
  cardInactive: { opacity: 0.55 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center',
  },
  avatarInactive: { backgroundColor: colors.textMuted },
  avatarText: { color: colors.background, fontSize: 16, fontWeight: '800' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { color: colors.white, fontSize: 15, fontWeight: '600' },
  textInactive: { color: colors.textMuted },
  inactiveBadge: {
    backgroundColor: colors.border, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  inactiveBadgeText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' },
  cardPhone: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  cardDesc: { color: colors.textMuted, fontSize: 12, marginTop: 3, fontStyle: 'italic' },
  btnEditar: { padding: 6 },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: colors.textMuted, marginTop: 10, fontSize: 14 },

  fab: {
    position: 'absolute', right: 20, width: 60, height: 60,
    borderRadius: 30, backgroundColor: colors.gold,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24,
  },
  sheetTall: { maxHeight: '90%' },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.textMuted, alignSelf: 'center', marginBottom: 20,
  },
  sheetTitle: { color: colors.gold, fontSize: 20, fontWeight: '800', marginBottom: 20 },

  label: {
    color: colors.textSecondary, fontSize: 12, fontWeight: '600',
    marginBottom: 6, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.background, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    color: colors.white, fontSize: 15, marginBottom: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  inputMulti: { height: 90, textAlignVertical: 'top' },

  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.background, borderRadius: 12,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  switchLabel: { color: colors.white, fontWeight: '600', fontSize: 15 },
  switchSub: { color: colors.textMuted, fontSize: 12, marginTop: 2, maxWidth: 220 },

  modalBtns: { flexDirection: 'row', gap: 10 },
  btnCancelar: {
    flex: 1, padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  btnCancelarText: { color: colors.textSecondary, fontWeight: '600' },
  btnSalvar: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: colors.gold, alignItems: 'center' },
  btnSalvarText: { color: colors.background, fontWeight: '700', fontSize: 15 },

  // Importação
  importHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  btnTodos: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.gold },
  btnTodosText: { color: colors.gold, fontSize: 13, fontWeight: '600' },
  importCount: { color: colors.textSecondary, fontSize: 13, marginBottom: 10 },

  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },

  contactItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  contactItemSelected: { backgroundColor: `${colors.gold}0D`, borderRadius: 10, paddingHorizontal: 8 },
  contactAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  contactAvatarSelected: { backgroundColor: colors.gold, borderColor: colors.gold },
  contactAvatarText: { color: colors.gold, fontWeight: '700', fontSize: 15 },
  contactInfo: { flex: 1 },
  contactName: { color: colors.white, fontSize: 14, fontWeight: '600' },
  contactPhone: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
});
