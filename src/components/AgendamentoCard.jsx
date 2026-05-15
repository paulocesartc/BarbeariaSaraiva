import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { PAYMENT_METHODS } from './PaymentMethodModal';

export default function AgendamentoCard({ agendamento, onFinalizar, onCancelar }) {
  const { primaryColor } = useTheme();
  const styles = useMemo(() => makeStyles(primaryColor), [primaryColor]);

  const statusConfig = {
    agendado: { label: 'Agendado', color: colors.statusLivre, icon: 'clock-outline' },
    livre: { label: 'Agendado', color: colors.statusLivre, icon: 'clock-outline' },
    ocupado: { label: 'Em atendimento', color: colors.statusOcupado, icon: 'content-cut' },
    finalizado: { label: 'Finalizado', color: colors.statusFinalizado, icon: 'check-circle' },
    cancelado: { label: 'Cancelado', color: colors.danger, icon: 'close-circle' },
  };

  const status = statusConfig[agendamento.status] || statusConfig.livre;
  const swipeableRef = useRef(null);
  const canSwipe = agendamento.status !== 'finalizado' && agendamento.status !== 'cancelado';

  const renderLeftActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.leftAction}>
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <MaterialCommunityIcons name="check-circle" size={28} color={colors.white} />
          <Text style={styles.actionText}>Finalizar</Text>
        </Animated.View>
      </View>
    );
  };

  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.rightAction}>
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <MaterialCommunityIcons name="close-circle" size={28} color={colors.white} />
          <Text style={styles.actionText}>Cancelar</Text>
        </Animated.View>
      </View>
    );
  };

  function handleSwipeOpen(direction) {
    swipeableRef.current?.close();
    if (direction === 'left') {
      onFinalizar?.(agendamento);
    } else if (direction === 'right') {
      onCancelar?.(agendamento);
    }
  }

  const cardInner = (
    <View style={[styles.card, { borderLeftColor: status.color }]}>
      <View style={styles.timeContainer}>
        <Text style={styles.horario}>{agendamento.time}</Text>
        <Text style={styles.duracao}>{agendamento.duration_min}min</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoContainer}>
        <Text style={styles.clienteNome}>{agendamento.client_name}</Text>
        <Text style={styles.servicoNome}>{agendamento.service_name}</Text>
        <View style={styles.statusRow}>
          <MaterialCommunityIcons name={status.icon} size={14} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.rightCol}>
        <Text style={styles.valor}>R$ {agendamento.price.toFixed(2)}</Text>
        {agendamento.payment_method && PAYMENT_METHODS[agendamento.payment_method] && (
          <View style={styles.payRow}>
            <MaterialCommunityIcons
              name={PAYMENT_METHODS[agendamento.payment_method].icon}
              size={12}
              color={PAYMENT_METHODS[agendamento.payment_method].color}
            />
            <Text style={[styles.payText, { color: PAYMENT_METHODS[agendamento.payment_method].color }]}>
              {PAYMENT_METHODS[agendamento.payment_method].label}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (!canSwipe) {
    return cardInner;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      leftThreshold={80}
      rightThreshold={80}
      overshootLeft={false}
      overshootRight={false}
      onSwipeableOpen={handleSwipeOpen}
      containerStyle={styles.swipeContainer}
    >
      {cardInner}
    </Swipeable>
  );
}

function makeStyles(primary) {
  return StyleSheet.create({
    swipeContainer: {
      borderRadius: 12,
      marginBottom: 10,
      overflow: 'hidden',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderLeftWidth: 4,
    },
    timeContainer: { alignItems: 'center', width: 55 },
    horario: { color: colors.white, fontSize: 16, fontWeight: '700' },
    duracao: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
    divider: { width: 1, height: 40, backgroundColor: colors.border, marginHorizontal: 14 },
    infoContainer: { flex: 1 },
    clienteNome: { color: colors.white, fontSize: 15, fontWeight: '600' },
    servicoNome: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
    statusText: { fontSize: 12, fontWeight: '500' },
    rightCol: { alignItems: 'flex-end' },
    valor: { color: primary, fontSize: 16, fontWeight: '700' },
    payRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
    payText: { fontSize: 10, fontWeight: '600' },
    leftAction: {
      flex: 1,
      backgroundColor: colors.success,
      justifyContent: 'center',
      paddingLeft: 24,
      alignItems: 'flex-start',
    },
    rightAction: {
      flex: 1,
      backgroundColor: colors.danger,
      justifyContent: 'center',
      paddingRight: 24,
      alignItems: 'flex-end',
    },
    actionText: { color: colors.white, fontWeight: '700', fontSize: 12, marginTop: 4 },
  });
}
