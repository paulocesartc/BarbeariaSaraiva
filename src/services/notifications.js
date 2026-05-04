import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { getAppointmentsByDate, getDayRevenue, getDayCount } from '../database/appointmentsDb';
import { setSetting } from '../database/settingsDb';

const MORNING_TASK = 'MORNING_NOTIFICATION';
const EVENING_TASK = 'EVENING_NOTIFICATION';

// Configura como as notificações aparecem quando o app está aberto
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Pede permissão de notificação */
export async function requestNotificationPermission() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Agenda a notificação matinal diária às 07:00 */
export async function scheduleMorningNotification() {
  // Cancela anteriores para não duplicar
  await cancelScheduledNotifications(MORNING_TASK);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '☀️ Bom dia! Barbearia Saraiva',
      body: 'Confira sua agenda do dia de hoje!',
      data: { type: 'morning' },
    },
    trigger: {
      type: 'daily',
      hour: 7,
      minute: 0,
    },
    identifier: MORNING_TASK,
  });

  console.log('[notifications] Notificação matinal agendada para 07:00');
}

/** Agenda a notificação de fim de dia às 21:00 */
export async function scheduleEveningNotification() {
  await cancelScheduledNotifications(EVENING_TASK);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 Dia encerrado!',
      body: 'Toque para ver o resumo do seu dia.',
      data: { type: 'evening' },
    },
    trigger: {
      type: 'daily',
      hour: 21,
      minute: 0,
    },
    identifier: EVENING_TASK,
  });

  console.log('[notifications] Notificação noturna agendada para 21:00');
}

/** Envia notificação imediata com resumo do dia (para usar no fim do expediente) */
export async function sendDaySummaryNotification() {
  const hoje = new Date().toISOString().split('T')[0];
  const [count, revenue] = await Promise.all([
    getDayCount(hoje),
    getDayRevenue(hoje),
  ]);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Resumo do dia',
      body: `Hoje você atendeu ${count} cliente${count !== 1 ? 's' : ''} e faturou R$ ${revenue.toFixed(2)}`,
      data: { type: 'summary' },
    },
    trigger: null, // imediata
  });
}

/** Envia notificação com a agenda da manhã */
export async function sendMorningAgendaNotification() {
  const hoje = new Date().toISOString().split('T')[0];
  const appts = await getAppointmentsByDate(hoje);
  const active = appts.filter((a) => a.status !== 'cancelado');

  const body = active.length === 0
    ? 'Você não tem agendamentos para hoje. Dia livre! 🎉'
    : `Você tem ${active.length} agendamento${active.length !== 1 ? 's' : ''} hoje. O primeiro é às ${active[0].time}.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: '☀️ Sua agenda de hoje',
      body,
      data: { type: 'morning_detail' },
    },
    trigger: null,
  });
}

async function cancelScheduledNotifications(identifier) {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch {
    // Pode não existir, sem problema
  }
}

async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Barbearia Saraiva',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#D4AF37',
  });
}

const EAS_PROJECT_ID = '4b851623-c57f-4d11-b7dc-5d7ebca2b50e';

/** Obtém o Expo Push Token e salva no Supabase para uso pelo site de agendamento */
async function savePushToken() {
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID });
    if (token) {
      await setSetting('expo_push_token', token);
      console.log('[notifications] Push token salvo:', token);
    } else {
      console.warn('[notifications] Token vazio retornado');
    }
  } catch (e) {
    console.error('[notifications] Erro ao obter push token:', e.message);
  }
}

/** Configura todas as notificações recorrentes */
export async function setupNotifications() {
  const granted = await requestNotificationPermission();
  if (!granted) {
    console.log('[notifications] Permissão negada');
    return false;
  }

  await setupAndroidChannel();
  await savePushToken();
  await scheduleMorningNotification();
  await scheduleEveningNotification();

  console.log('[notifications] Setup completo');
  return true;
}
