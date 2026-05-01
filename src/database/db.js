import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dzezieygyqaapkfwhlaa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LCgD3WBRHyOutMzd5M5ISQ_xh5yg_QX';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
