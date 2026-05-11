import { supabase, generateUUID } from './db';
import { getLunchTime } from './settingsDb';

export async function getAppointmentsByDate(date) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('date', date)
    .order('time', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getAppointmentsByClient(clientId) {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAllAppointmentDates() {
  const { data, error } = await supabase
    .from('appointments')
    .select('date')
    .order('date', { ascending: true });
  if (error) throw error;
  const unique = [...new Set(data.map((r) => r.date))];
  return unique.map((date) => ({ date }));
}

export async function createAppointment({ client_id, client_name, service_id, service_name, date, time, duration_min, price }) {
  const id = generateUUID();
  const { error } = await supabase.from('appointments').insert({
    id,
    client_id: String(client_id ?? ''),
    client_name: String(client_name ?? ''),
    service_id: String(service_id ?? ''),
    service_name: String(service_name ?? ''),
    date: String(date ?? ''),
    time: String(time ?? ''),
    duration_min: Number(duration_min) || 30,
    price: Number(price) || 0,
    status: 'agendado',
  });
  if (error) throw error;
  return id;
}

export async function updateAppointmentStatus(id, status) {
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function finalizeAppointment({ id, clientId, price, paymentMethod }) {
  const { error } = await supabase.from('appointments')
    .update({ status: 'finalizado', payment_method: paymentMethod })
    .eq('id', id);
  if (error) throw error;

  if (clientId) {
    const { data: client, error: fetchError } = await supabase
      .from('clients').select('total_appointments, total_spent').eq('id', clientId).single();
    if (fetchError) throw fetchError;
    const { error: updateError } = await supabase.from('clients').update({
      total_appointments: (client.total_appointments ?? 0) + 1,
      total_spent: (client.total_spent ?? 0) + (Number(price) || 0),
    }).eq('id', clientId);
    if (updateError) throw updateError;
  }
}

export async function cancelAppointment(id) {
  return updateAppointmentStatus(id, 'cancelado');
}

export async function hasConflict(date, time, duration_min, excludeId = null) {
  let query = supabase
    .from('appointments')
    .select('time, duration_min')
    .eq('date', date)
    .not('status', 'in', '("cancelado")');
  if (excludeId) query = query.neq('id', excludeId);
  const { data, error } = await query;
  if (error) throw error;

  const toMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const newStart = toMinutes(time);
  const newEnd = newStart + duration_min;

  for (const appt of data) {
    const existStart = toMinutes(appt.time);
    const existEnd = existStart + appt.duration_min;
    if (newStart < existEnd && newEnd > existStart) return true;
  }
  return false;
}

export async function getAvailableSlots(date, duration_min) {
  const [{ data, error }, lunchTimeStr] = await Promise.all([
    supabase
      .from('appointments')
      .select('time, duration_min')
      .eq('date', date)
      .not('status', 'in', '("cancelado")'),
    getLunchTime(),
  ]);
  if (error) throw error;

  const toMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fromMinutes = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  const START = 8 * 60;
  const END = 21 * 60;
  const STEP = 60;
  const LUNCH = toMinutes(lunchTimeStr);

  const slots = [];
  for (let t = START; t + duration_min <= END; t += STEP) {
    // Bloqueia o slot do almoço (o slot que começa exatamente no horário configurado)
    if (t === LUNCH) {
      slots.push({ time: fromMinutes(t), available: false, lunch: true });
      continue;
    }
    let conflict = false;
    for (const appt of data) {
      const existStart = toMinutes(appt.time);
      const existEnd = existStart + appt.duration_min;
      if (t < existEnd && t + duration_min > existStart) { conflict = true; break; }
    }
    slots.push({ time: fromMinutes(t), available: !conflict });
  }
  return slots;
}

export async function autoTransitionOngoing(date) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const { data, error } = await supabase
    .from('appointments')
    .select('id, time')
    .eq('date', date)
    .in('status', ['agendado', 'livre']);
  if (error) throw error;

  for (const appt of data) {
    const [h, m] = appt.time.split(':').map(Number);
    if (h * 60 + m <= currentMinutes) {
      await supabase.from('appointments').update({ status: 'ocupado' }).eq('id', appt.id);
    }
  }
}

export async function getDayRevenue(date) {
  const { data, error } = await supabase
    .from('appointments')
    .select('price')
    .eq('date', date)
    .eq('status', 'finalizado');
  if (error) throw error;
  return data.reduce((sum, r) => sum + (r.price ?? 0), 0);
}

export async function getDayCount(date) {
  const { data, error } = await supabase
    .from('appointments')
    .select('id')
    .eq('date', date)
    .not('status', 'in', '("cancelado")');
  if (error) throw error;
  return data.length;
}

export async function getBlockedDays() {
  const { data, error } = await supabase
    .from('blocked_days')
    .select('date')
    .order('date', { ascending: true });
  if (error) throw error;
  return data.map((r) => r.date);
}

export async function isDayBlocked(date) {
  const { data, error } = await supabase
    .from('blocked_days')
    .select('id')
    .eq('date', date)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function blockDay(date) {
  const { error } = await supabase
    .from('blocked_days')
    .upsert({ date }, { onConflict: 'date' });
  if (error) throw error;
}

export async function unblockDay(date) {
  const { error } = await supabase
    .from('blocked_days')
    .delete()
    .eq('date', date);
  if (error) throw error;
}
