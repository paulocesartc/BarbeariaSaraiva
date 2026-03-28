import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import useStore from '../store/useStore';
import ClienteCard from '../components/ClienteCard';
import PremiumButton from '../components/PremiumButton';

export default function ClientesScreen({ navigation }) {
  const clientes = useStore((s) => s.clientes);
  const addCliente = useStore((s) => s.addCliente);
  const [busca, setBusca] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novaObs, setNovaObs] = useState('');

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const handleAddCliente = () => {
    if (!novoNome.trim()) return;
    const iniciais = novoNome
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    addCliente({
      nome: novoNome,
      telefone: novoTelefone,
      observacoes: novaObs,
      avatar: iniciais,
    });

    setNovoNome('');
    setNovoTelefone('');
    setNovaObs('');
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clientes</Text>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={colors.textMuted}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente..."
          placeholderTextColor={colors.textMuted}
          value={busca}
          onChangeText={setBusca}
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')}>
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Client List */}
      <FlatList
        data={clientesFiltrados}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ClienteCard
            cliente={item}
            onPress={() => navigation.navigate('ClientePerfil', { cliente: item })}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="account-search"
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color={colors.background} />
      </TouchableOpacity>

      {/* Modal Novo Cliente */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Novo Cliente</Text>

            <Text style={styles.inputLabel}>Nome</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              placeholderTextColor={colors.textMuted}
              value={novoNome}
              onChangeText={setNovoNome}
            />

            <Text style={styles.inputLabel}>Telefone</Text>
            <TextInput
              style={styles.input}
              placeholder="(11) 99999-9999"
              placeholderTextColor={colors.textMuted}
              value={novoTelefone}
              onChangeText={setNovoTelefone}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Observacoes</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Preferencias, anotacoes..."
              placeholderTextColor={colors.textMuted}
              value={novaObs}
              onChangeText={setNovaObs}
              multiline
              numberOfLines={3}
            />

            <PremiumButton title="Cadastrar" onPress={handleAddCliente} style={{ marginTop: 10 }} />

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  title: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    paddingTop: 60,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.textMuted,
    marginTop: 10,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.white,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 10,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
