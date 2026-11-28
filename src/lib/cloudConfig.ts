import { supabase, isSupabaseConfigured } from './supabase';
import { SUPABASE_TARIFFS_KEY, applyCloudTariffs } from './tariffs';
import { SUPABASE_CHANNELS_KEY, applyCloudChannels } from './channels';

const STORAGE_KEY_TOKEN = 'aldea_telegram_token';
const STORAGE_KEY_CHAT_ID = 'aldea_telegram_chat_id';

/**
 * Mengambil semua konfigurasi aplikasi dari Supabase dalam 1 kueri batch
 * untuk menghemat egress & request count.
 */
export async function syncAppConfigFromCloud(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', [
        'telegram_bot_token',
        'telegram_chat_id',
        SUPABASE_TARIFFS_KEY,
        SUPABASE_CHANNELS_KEY
      ]);

    if (error || !data || data.length === 0) return;

    let updated = false;
    for (const item of data) {
      if (!item.value) continue;

      if (item.key === 'telegram_bot_token' && !localStorage.getItem(STORAGE_KEY_TOKEN)) {
        localStorage.setItem(STORAGE_KEY_TOKEN, item.value);
      } else if (item.key === 'telegram_chat_id' && !localStorage.getItem(STORAGE_KEY_CHAT_ID)) {
        localStorage.setItem(STORAGE_KEY_CHAT_ID, item.value);
      } else if (item.key === SUPABASE_TARIFFS_KEY) {
        applyCloudTariffs(item.value);
        updated = true;
      } else if (item.key === SUPABASE_CHANNELS_KEY) {
        applyCloudChannels(item.value);
        updated = true;
      }
    }

    if (updated && typeof window !== 'undefined') {
      window.dispatchEvent(new Event('aldea-config-updated'));
    }
  } catch (err) {
    console.warn('Gagal memuat konfigurasi cloud:', err);
  }
}
