import { getDb, generateUUID } from './db';
import { addAppointmentToClient } from './clientsDb';

export async function getAppointmentsByDate(date) {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT * FROM appointments WHERE date = ? ORDER BY time ASC',
    [date]
  );
}

export async function getAppointmentsByClient(clientId) {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT * FROM appointments
     WHERE client_id = ?
     ORDER BY date DESC, time DESC`,
    [clientId]
  );
}

export async function getAllAppointmentDates() {
  const db = await getDb();
  return db.getAllAsync(
    'SELECT DISTINCT date FROM appointments ORDER BY date ASC'
  );
}

export async function createAppointment({ client_id, client_name, service_id, service_name, date, time, duration_min, price }) {
  const db = await getDb();
  const id = generateUUID();

  const params = [
    String(id),
    String(client_id ?? ''),
    String(client_name ?? ''),
    String(service_id ?? ''),
    String(service_name ?? ''),
    String(date ?? ''),
    String(time ?? ''),
    Number(duration_min) || 30,
    Number(price) || 0,
  ];

  console.log('[appointmentsDb] create params →', JSON.stringify(params));

  try {
    await db.runAsync(
      `INSERT INTO appointments (id, client_id, client_name, service_id, service_name, date, time, duration_min, price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );
    console.log('[appointmentsDb] create → ok');
    return id;
  } catch (e) {
    console.error('[appointmentsDb] create → ERRO:', e);
    throw e;
  }
}

export async function updateAppointmentStatus(id, status) {
  const db = await getDb();
  console.log('[appointmentsDb] updateStatus →', id, status);
  await db.runAsync('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
}

/**
 * Finaliza um agendamento e atualiza os contadores do cliente.
 * Recebe clientId e price explicitamente — evita SELECT extra e simplifica o fluxo.
 */
export async function finalizeAppointment({ id, clientId, price, paymentMethod }) {
  const db = await getDb();
  console.log('[appointmentsDb] finalize →', { id, clientId, price, paymentMethod });

  await db.runAsync(
    `UPDATE appointments SET status = 'finalizado', payment_method = ? WHERE id = ?`,
    [paymentMethod, id]
  );

  if (clientId) {
    await db.runAsync(
      `UPDATE clients
       SET total_appointments = total_appointments + 1,
           total_spent = total_spent + ?
       WHERE id = ?`,
      [Number(price) || 0, clientId]
    );
  }

  console.log('[appointmentsDb] finalize → ok');
}

export async function cancelAppointment(id) {
  return updateAppointmentStatus(id, 'cancelado');
}

/**
 * Verifica conflitos de horario considerando duração do serviço.
 * Retorna true se o slot está ocupado.
 */
export async function hasConflict(date, time, duration_min, excludeId = null) {
  const db = await getDb();
  const appointments = await db.getAllAsync(
    `SELECT time, duration_min FROM appointments
     WHERE date = ? AND status NOT IN ('cancelado')${excludeId ? ' AND id != ?' : ''}`,
    excludeId ? [date, excludeId] : [date]
  );

  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const newStart = toMinutes(time);
  const newEnd = newStart + duration_min;

  for (const appt of appointments) {
    const existStart = toMinutes(appt.time);
    const existEnd = existStart + appt.duration_min;
    if (newStart < existEnd && newEnd > existStart) return true;
  }
  return false;
}

/**
 * Gera slots disponíveis para um dia, considerando a duração do serviço.
 * Horário de funcionamento: 08:00 - 20:00, intervalos de 30min.
 */
export async function getAvailableSlots(date, duration_min) {
  const db = await getDb();
  const appointments = await db.getAllAsync(
    `SELECT time, duration_min FROM appointments
     WHERE date = ? AND status NOT IN ('cancelado')`,
    [date]
  );

  const toMinutes = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const fromMinutes = (m) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const START = 8 * 60;  // 08:00
  const END = 20 * 60;   // 20:00
  const STEP = 30;

  const slots = [];
  for (let t = START; t + duration_min <= END; t += STEP) {
    const slotStart = t;
    const slotEnd = t + duration_min;

    let conflict = false;
    for (const appt of appointments) {
      const existStart = toMinutes(appt.time);
      const existEnd = existStart + appt.duration_min;
      if (slotStart < existEnd && slotEnd > existStart) {
        conflict = true;
        break;
      }
    }
    slots.push({ time: fromMinutes(t), available: !conflict });
  }

  return slots;
}

/** Passa automaticamente pra 'ocupado' qualquer livre cujo horário já começou */
export async function autoTransitionOngoing(date) {
  const db = await getDb();
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const appts = await db.getAllAsync(
    `SELECT id, time FROM appointments WHERE date = ? AND status = 'livre'`,
    [date]
  );

  for (const appt of appts) {
    const [h, m] = appt.time.split(':').map(Number);
    const apptMinutes = h * 60 + m;
    if (apptMinutes <= currentMinutes) {
      await db.runAsync(
        `UPDATE appointments SET status = 'ocupado' WHERE id = ?`,
        [appt.id]
      );
      console.log('[appointmentsDb] auto-transição livre → ocupado:', appt.id);
    }
  }
}

/** Faturamento do dia (soma dos finalizados) */
export async function getDayRevenue(date) {
  const db = await getDb();
  const row = await db.getFirstAsync(
    `SELECT COALESCE(SUM(price), 0) as total FROM appointments
     WHERE date = ? AND status = 'finalizado'`,
    [date]
  );
  return row.total;
}

/** Contagem de atendimentos do dia */
export async function getDayCount(date) {
  const db = await getDb();
  const row = await db.getFirstAsync(
    `SELECT COUNT(*) as total FROM appointments
     WHERE date = ? AND status NOT IN ('cancelado')`,
    [date]
  );
  return row.total;
}
