import { supabase } from './db';

export async function getSetting(key) {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  return data?.value ?? null;
}

export async function setSetting(key, value) {
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
}

export async function getLunchTime() {
  const v = await getSetting('lunch_time');
  return v ?? '13:00';
}

export async function setLunchTime(time) {
  await setSetting('lunch_time', time);
}
