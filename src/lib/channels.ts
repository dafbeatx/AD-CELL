import { TariffProfile, TxChannelConfig, TxRow } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { db } from './db';

const STORAGE_KEY_CHANNELS = 'aldea_tx_channels_v1';
export const SUPABASE_CHANNELS_KEY = 'tx_channels_config';

export const DEFAULT_CHANNELS: TxChannelConfig[] = [
  {
    id: 'Bank',
    name: 'Bank',
    subtitle: 'Tarik/Transfer',
    kind: 'ledger',
    tariffProfile: 'Bank',
    isDefault: true
  },
  {
    id: 'Dana',
    name: 'Dana',
    subtitle: 'Top up / Tarik',
    kind: 'ledger',
    tariffProfile: 'Dana',
    isDefault: true
  },
  {
    id: 'pulsa',
    name: 'Pulsa',
    subtitle: 'Isi & Pemakaian',
    kind: 'pulsa',
    tariffProfile: 'Dana',
    isDefault: true
  },
  {
    id: 'qris',
    name: 'QRIS',
    subtitle: 'Bayar & Tarik',
    kind: 'qris',
    tariffProfile: 'Bank',
    isDefault: true
  }
];

/** Pastikan semua channel bawaan tetap ada (bisa di-rename, tidak bisa dihapus) */
function mergeWithDefaults(list: TxChannelConfig[]): TxChannelConfig[] {
  const byId = new Map<string, TxChannelConfig>();
  for (const ch of list) {
    if (ch && ch.id && ch.name) {
      byId.set(ch.id, ch);
    }
  }

  const merged: TxChannelConfig[] = [];
  for (const def of DEFAULT_CHANNELS) {
    const existing = byId.get(def.id);
    if (existing) {
      merged.push({
        ...def,
        name: existing.name.trim() || def.name,
        subtitle: existing.subtitle ?? def.subtitle,
        tariffProfile: existing.tariffProfile === 'Dana' || existing.tariffProfile === 'Bank'
          ? existing.tariffProfile
          : def.tariffProfile,
        isDefault: true
      });
      byId.delete(def.id);
    } else {
      merged.push({ ...def });
    }
  }

  // Tambahkan channel kustom lainnya sesuai urutan
  for (const custom of byId.values()) {
    merged.push({
      id: custom.id,
      name: custom.name.trim(),
      subtitle: custom.subtitle || (custom.tariffProfile === 'Bank' ? 'Admin Bank' : 'Admin Dana'),
      kind: 'ledger',
      tariffProfile: custom.tariffProfile === 'Dana' ? 'Dana' : 'Bank',
      isDefault: false
    });
  }

  return merged;
}

export function getChannels(): TxChannelConfig[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CHANNELS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return mergeWithDefaults(parsed);
        }
      }
    } catch {
      // ignore parse error
    }
  }
  return DEFAULT_CHANNELS.map(c => ({ ...c }));
}

export function getChannelById(id: string): TxChannelConfig | undefined {
  return getChannels().find(c => c.id === id);
}

/** Pastikan channel ledger memiliki 20 baris kosong di IndexedDB */
export async function ensureChannelRows(channelId: string): Promise<void> {
  const existingCount = await db.transactions.where('channel').equals(channelId).count();
  if (existingCount > 0) return;

  const prefix = channelId.toLowerCase();
  const rows: TxRow[] = [];
  for (let i = 1; i <= 20; i++) {
    rows.push({
      id: `${prefix}-${i}`,
      channel: channelId,
      baris: i,
      saldoAwal: 0,
      transaksi: '',
      nominal: 0,
      laba: 0,
      saldoAkhir: 0
    });
  }
  await db.transactions.bulkPut(rows);
}

/** Simpan daftar channel ke lokal & sinkronkan ke Supabase */
export async function saveChannels(
  channels: TxChannelConfig[]
): Promise<{ cloudSaved: boolean; error?: string }> {
  const clean = mergeWithDefaults(channels);
  const serialized = JSON.stringify(clean);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CHANNELS, serialized);
    window.dispatchEvent(new Event('aldea-config-updated'));
  }

  db.meta.put({ key: SUPABASE_CHANNELS_KEY, value: clean }).catch(() => {});

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('app_settings').upsert({
        key: SUPABASE_CHANNELS_KEY,
        value: serialized,
        updated_at: new Date().toISOString()
      });
      if (error) {
        return { cloudSaved: false, error: error.message };
      }
      return { cloudSaved: true };
    } catch (err: any) {
      return { cloudSaved: false, error: err?.message || 'Gagal sinkron ke Supabase' };
    }
  }

  return { cloudSaved: false };
}

/** Terapkan daftar channel dari cloud ke cache lokal */
export function applyCloudChannels(rawJson: string): void {
  try {
    const parsed = JSON.parse(rawJson);
    if (Array.isArray(parsed)) {
      const merged = mergeWithDefaults(parsed);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(merged));
      }
    }
  } catch {
    // ignore invalid json
  }
}

export async function addCustomChannel(
  name: string,
  tariffProfile: TariffProfile
): Promise<{ channel: TxChannelConfig; cloudSaved: boolean; error?: string }> {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error('Nama channel wajib diisi.');
  }

  const current = getChannels();
  const id = `ch-${Date.now()}`;
  const newChannel: TxChannelConfig = {
    id,
    name: cleanName,
    subtitle: `Tarif ${tariffProfile}`,
    kind: 'ledger',
    tariffProfile,
    isDefault: false
  };

  await ensureChannelRows(id);
  const syncRes = await saveChannels([...current, newChannel]);
  return { channel: newChannel, ...syncRes };
}

export async function updateChannel(
  id: string,
  updates: { name?: string; tariffProfile?: TariffProfile; subtitle?: string }
): Promise<{ cloudSaved: boolean; error?: string }> {
  const current = getChannels();
  const updated = current.map(ch => {
    if (ch.id !== id) return ch;
    const nextProfile = ch.kind === 'ledger' && updates.tariffProfile ? updates.tariffProfile : ch.tariffProfile;
    const nextName = updates.name !== undefined ? updates.name.trim() || ch.name : ch.name;
    const nextSubtitle = updates.subtitle !== undefined
      ? updates.subtitle
      : (ch.isDefault ? ch.subtitle : `Tarif ${nextProfile}`);

    return {
      ...ch,
      name: nextName,
      tariffProfile: nextProfile,
      subtitle: nextSubtitle
    };
  });

  return saveChannels(updated);
}

export async function deleteCustomChannel(
  id: string
): Promise<{ deleted: boolean; cloudSaved: boolean; error?: string }> {
  const current = getChannels();
  const target = current.find(c => c.id === id);
  if (!target) {
    return { deleted: false, cloudSaved: false, error: 'Channel tidak ditemukan.' };
  }
  if (target.isDefault) {
    return { deleted: false, cloudSaved: false, error: 'Channel bawaan tidak boleh dihapus.' };
  }

  const next = current.filter(c => c.id !== id);
  await db.transactions.where('channel').equals(id).delete();
  await db.meta.delete(`aldea_saldo_${id.toLowerCase()}`).catch(() => {});

  const syncRes = await saveChannels(next);
  return { deleted: true, ...syncRes };
}
