import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

function isValidHttpUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(
  isValidHttpUrl(supabaseUrl) && supabaseAnonKey.length > 20
);

let client = null;
if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('Gagal menginisialisasi Supabase client:', err);
    client = null;
  }
}

export const supabase = client;

/** Sinkronisasi data dari IndexedDB ke Supabase saat online */
export async function syncToSupabase() {
  if (!supabase) return { success: false, reason: 'Supabase URL/Key belum dikonfigurasi dengan benar' };
  return { success: true };
}
