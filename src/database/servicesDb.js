import { supabase, generateUUID } from './db';
import { getTenantId } from './tenantContext';

export async function getAllServices() {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('tenant_id', getTenantId())
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createService({ name, price, duration_min, icon = 'content-cut' }) {
  const id = generateUUID();
  const { error } = await supabase
    .from('services')
    .insert({ id, tenant_id: getTenantId(), name, price, duration_min, icon, is_combo: 0 });
  if (error) throw error;
  return id;
}

export async function updateService(id, fields) {
  const { name, price, duration_min, icon } = fields;
  const { error } = await supabase
    .from('services')
    .update({ name, price, duration_min, icon })
    .eq('id', id).eq('tenant_id', getTenantId());
  if (error) throw error;
}

export async function deleteService(id) {
  const { error } = await supabase.from('services').delete()
    .eq('id', id).eq('tenant_id', getTenantId());
  if (error) throw error;
}

export async function createCombo({ services, finalPrice, customName }) {
  const id = generateUUID();
  const name = customName || services.map((s) => s.name).join(' + ');
  const duration_min = services.reduce((sum, s) => sum + s.duration_min, 0);
  const combo_ids = JSON.stringify(services.map((s) => s.id));
  const { error } = await supabase
    .from('services')
    .insert({ id, tenant_id: getTenantId(), name, price: finalPrice, duration_min, icon: 'star', is_combo: 1, combo_ids });
  if (error) throw error;
  return id;
}
