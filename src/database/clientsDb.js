import { supabase, generateUUID } from './db';
import { getTenantId } from './tenantContext';

export async function getAllClients({ includeInactive = false } = {}) {
  let query = supabase.from('clients').select('*')
    .eq('tenant_id', getTenantId())
    .order('name', { ascending: true });
  if (!includeInactive) query = query.eq('active', 1);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getClientById(id) {
  const { data, error } = await supabase.from('clients').select('*')
    .eq('id', id).eq('tenant_id', getTenantId()).single();
  if (error) throw error;
  return data;
}

export async function getClientByPhone(phone) {
  const normalized = phone.replace(/\D/g, '');
  const { data } = await supabase.from('clients').select('*')
    .eq('tenant_id', getTenantId()).eq('phone', normalized).maybeSingle();
  return data;
}

export async function createClient({ name, phone, description }) {
  const id = generateUUID();
  const avatar = name.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const { error } = await supabase
    .from('clients')
    .insert({ id, tenant_id: getTenantId(), name: name.trim(), phone: phone ?? '', description: description ?? '', avatar });
  if (error) throw error;
  return id;
}

export async function updateClient(id, { name, phone, description }) {
  const avatar = name.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const { error } = await supabase
    .from('clients')
    .update({ name: name.trim(), phone: phone ?? '', description: description ?? '', avatar })
    .eq('id', id).eq('tenant_id', getTenantId());
  if (error) throw error;
}

export async function setClientActive(id, active) {
  const { error } = await supabase.from('clients').update({ active: active ? 1 : 0 })
    .eq('id', id).eq('tenant_id', getTenantId());
  if (error) throw error;
}

export async function importClients(contacts) {
  const { data: existing } = await supabase.from('clients').select('phone')
    .eq('tenant_id', getTenantId());
  const existingPhones = new Set((existing ?? []).map((r) => r.phone.replace(/\D/g, '')));

  const toInsert = [];
  for (const c of contacts) {
    const rawPhone = (c.phone ?? '').replace(/\D/g, '');
    if (existingPhones.has(rawPhone)) continue;
    const id = generateUUID();
    const avatar = (c.name ?? '?').trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
    toInsert.push({ id, tenant_id: getTenantId(), name: c.name.trim(), phone: c.phone ?? '', description: '', avatar });
    existingPhones.add(rawPhone);
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('clients').insert(toInsert);
    if (error) throw error;
  }

  return toInsert.length;
}

export async function addAppointmentToClient(clientId, value) {
  const { data: client, error: fetchError } = await supabase
    .from('clients').select('total_appointments, total_spent')
    .eq('id', clientId).eq('tenant_id', getTenantId()).single();
  if (fetchError) throw fetchError;
  const { error } = await supabase.from('clients').update({
    total_appointments: (client.total_appointments ?? 0) + 1,
    total_spent: (client.total_spent ?? 0) + (Number(value) || 0),
  }).eq('id', clientId).eq('tenant_id', getTenantId());
  if (error) throw error;
}
