import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import useStore from '../store/useStore';
import PremiumButton from '../components/PremiumButton';
import TimeSlot from '../components/TimeSlot';
import { horariosDisponiveis } from '../data/mockData';

const STEPS = ['Cliente', 'Servico', 'Horario'];

export default function NovoAgendamentoScreen({ navigation }) {
  const clientes = useStore((s) => s.clientes);
  const servicos = useStore((s) => s.servicos);
  const agendamentos = useStore((s) => s.agendamentos);
  const addAgendamento = useStore((s) => s.addAgendamento);

  const [step, setStep] = useState(0);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [servicoSelecionado, setServicoSelecionado] = useState(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);

  const hoje = new Date().toISOString().split('T')[0];
  const horariosOcupados = agendamentos
    .filter((a) => a.data === hoje)
    .map((a) => a.horario);

  const handleConfirmar = () => {
    addAgendamento({
      clienteId: clienteSelecionado.id,
      clienteNome: clienteSelecionado.nome,
      servicoId: servicoSelecionado.id,
      servicoNome: servicoSelecionado.nome,
      data: hoje,
      horario: horarioSelecionado,
      duracao: servicoSelecionado.duracao,
      valor: servicoSelecionado.preco,
    });

    Alert.alert(
      'Agendamento Confirmado!',
      `${clienteSelecionado.nome}\n${servicoSelecionado.nome}\nHoje as ${horarioSelecionado}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepRow}>
      {STEPS.map((label, i) => (
        <View key={label} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              i <= step && styles.stepCircleActive,
              i < step && styles.stepCircleDone,
            ]}
          >
            {i < step ? (
              <MaterialCommunityIcons
                name="check"
                size={16}
                color={colors.background}
              />
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  i <= step && styles.stepNumberActive,
                ]}
              >
                {i + 1}
              </Text>
            )}
          </View>
          <Text
            style={[styles.stepLabel, i <= step && styles.stepLabelActive]}
          >
            {label}
          </Text>
          {i < STEPS.length - 1 && (
            <View
              style={[styles.stepLine, i < step && styles.stepLineActive]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderClientes = () => (
    <FlatList
      data={clientes}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.selectCard,
            clienteSelecionado?.id === item.id && styles.selectCardActive,
          ]}
          onPress={() => {
            setClienteSelecionado(item);
            setStep(1);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.selectAvatar}>
            <Text style={styles.selectAvatarText}>{item.avatar}</Text>
          </View>
          <View style={styles.selectInfo}>
            <Text style={styles.selectName}>{item.nome}</Text>
            <Text style={styles.selectSub}>{item.telefone}</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      )}
    />
  );

  const renderServicos = () => (
    <FlatList
      data={servicos}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.selectCard,
            servicoSelecionado?.id === item.id && styles.selectCardActive,
          ]}
          onPress={() => {
            setServicoSelecionado(item);
            setStep(2);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.iconBox}>
            <MaterialCommunityIcons
              name={item.icone}
              size={24}
              color={colors.gold}
            />
          </View>
          <View style={styles.selectInfo}>
            <Text style={styles.selectName}>{item.nome}</Text>
            <Text style={styles.selectSub}>
              {item.duracao}min
            </Text>
          </View>
          <Text style={styles.selectPreco}>R$ {item.preco}</Text>
        </TouchableOpacity>
      )}
    />
  );

  const renderHorarios = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Summary so far */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <MaterialCommunityIcons name="account" size={18} color={colors.gold} />
          <Text style={styles.summaryText}>{clienteSelecionado?.nome}</Text>
        </View>
        <View style={styles.summaryRow}>
          <MaterialCommunityIcons name="content-cut" size={18} color={colors.gold} />
          <Text style={styles.summaryText}>
            {servicoSelecionado?.nome} — R$ {servicoSelecionado?.preco}
          </Text>
        </View>
      </View>

      <Text style={styles.subtitle}>Escolha o horario</Text>

      <View style={styles.slotsGrid}>
        {horariosDisponiveis.map((h) => (
          <TimeSlot
            key={h}
            horario={h}
            selecionado={horarioSelecionado === h}
            ocupado={horariosOcupados.includes(h)}
            onPress={() => setHorarioSelecionado(h)}
          />
        ))}
      </View>

      {horarioSelecionado && (
        <View style={styles.confirmSection}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Resumo</Text>
            <Text style={styles.confirmLine}>
              {clienteSelecionado?.nome}
            </Text>
            <Text style={styles.confirmLine}>
              {servicoSelecionado?.nome} ({servicoSelecionado?.duracao}min)
            </Text>
            <Text style={styles.confirmLine}>
              Hoje as {horarioSelecionado}
            </Text>
            <Text style={styles.confirmValor}>
              R$ {servicoSelecionado?.preco}
            </Text>
          </View>

          <PremiumButton
            title="Confirmar Agendamento"
            onPress={handleConfirmar}
            style={{ marginTop: 16 }}
          />
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (step > 0) setStep(step - 1);
            else navigation.goBack();
          }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Novo Agendamento</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderStepIndicator()}

      <View style={styles.content}>
        {step === 0 && renderClientes()}
        {step === 1 && renderServicos()}
        {step === 2 && renderHorarios()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  stepCircleActive: {
    borderColor: colors.gold,
  },
  stepCircleDone: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  stepNumber: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: colors.gold,
  },
  stepLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: colors.gold,
  },
  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: colors.gold,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  selectCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectCardActive: {
    borderColor: colors.gold,
  },
  selectAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAvatarText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectName: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  selectSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  selectPreco: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  confirmSection: {
    marginTop: 24,
  },
  confirmCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  confirmTitle: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  confirmLine: {
    color: colors.white,
    fontSize: 14,
    marginBottom: 4,
  },
  confirmValor: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 10,
  },
});
