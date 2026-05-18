import { supabase } from './db';
import { getTenantId } from './tenantContext';

export async function getSetting(key) {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('tenant_id', getTenantId())
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

export async function setSetting(key, value) {
  const { error } = await supabase
    .from('settings')
    .upsert({ tenant_id: getTenantId(), key, value }, { onConflict: 'tenant_id,key' });
  if (error) throw error;
}

export async function getLunchTime() {
  const v = await getSetting('lunch_time');
  return v ?? '13:00';
}

export async function setLunchTime(time) {
  await setSetting('lunch_time', time);
}

export async function getPrimaryColor() {
  return getSetting('primary_color');
}

export async function setPrimaryColor(color) {
  await setSetting('primary_color', color);
}

export async function getLogoUrl() {
  return getSetting('logo_url');
}

export async function setLogoUrl(url) {
  await setSetting('logo_url', url);
}

export async function getDisabledSlots() {
  const v = await getSetting('disabled_slots');
  try { return v ? JSON.parse(v) : []; } catch { return []; }
}

export async function setDisabledSlots(slots) {
  await setSetting('disabled_slots', JSON.stringify(slots));
}
