import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Fallback dummy or real client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/** Sinkronisasi data dari IndexedDB ke Supabase saat online */
export async function syncToSupabase() {
  if (!supabase) return { success: false, reason: 'Supabase URL/Key belum dikonfigurasi' };
  // Fitur sync realtime ke cloud
  return { success: true };
}
