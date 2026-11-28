import { Tariff, TariffConfig, TariffProfile } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { db } from './db';

const STORAGE_KEY_TARIFFS = 'aldea_admin_tariffs_v1';
export const SUPABASE_TARIFFS_KEY = 'admin_tariffs_config';

export const DEFAULT_BANK_TARIFFS: Tariff[] = [
  { minimal: 1, maksimal: 203, admin: 3 },
  { minimal: 204, maksimal: 505, admin: 4 },
  { minimal: 506, maksimal: 1005, admin: 5 },
  { minimal: 1006, maksimal: 2008, admin: 8 },
  { minimal: 2009, maksimal: 3010, admin: 10 },
  { minimal: 3011, maksimal: 4015, admin: 15 },
  { minimal: 4016, maksimal: 5020, admin: 20 }
];

export const DEFAULT_DANA_TARIFFS: Tariff[] = [
  { minimal: 1, maksimal: 102, admin: 2 },
  { minimal: 103, maksimal: 303, admin: 3 },
  { minimal: 304, maksimal: 604, admin: 4 },
  { minimal: 605, maksimal: 1005, admin: 5 },
  { minimal: 1006, maksimal: 2008, admin: 8 },
  { minimal: 2009, maksimal: 3010, admin: 10 },
  { minimal: 3011, maksimal: 4015, admin: 15 }
];

function cloneTariffs(list: Tariff[]): Tariff[] {
  return list.map(t => ({ minimal: t.minimal, maksimal: t.maksimal, admin: t.admin }));
}

export function getDefaultTariffs(): TariffConfig {
  return {
    bank: cloneTariffs(DEFAULT_BANK_TARIFFS),
    dana: cloneTariffs(DEFAULT_DANA_TARIFFS)
  };
}

/** Validasi dan normalisasi daftar tarif agar rapi dan terurut */
export function normalizeTariffs(list: Tariff[]): Tariff[] {
  return list
    .filter(t => Number.isFinite(t.minimal) && Number.isFinite(t.maksimal) && Number.isFinite(t.admin))
    .map(t => ({
      minimal: Math.max(0, Math.round(t.minimal)),
      maksimal: Math.max(0, Math.round(t.maksimal)),
      admin: Math.max(0, Math.round(t.admin))
    }))
    .filter(t => t.maksimal >= t.minimal && t.maksimal > 0)
    .sort((a, b) => a.minimal - b.minimal);
}

/** Ambil tarif admin aktif dari cache lokal (fallback ke bawaan) */
export function getTariffs(): TariffConfig {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TARIFFS);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<TariffConfig>;
        if (Array.isArray(parsed.bank) && Array.isArray(parsed.dana)) {
          return {
            bank: parsed.bank.length > 0 ? parsed.bank : cloneTariffs(DEFAULT_BANK_TARIFFS),
            dana: parsed.dana.length > 0 ? parsed.dana : cloneTariffs(DEFAULT_DANA_TARIFFS)
          };
        }
      }
    } catch {
      // ignore parse error
    }
  }
  return getDefaultTariffs();
}

/** Simpan tarif admin ke lokal + sinkronkan ke Supabase */
export async function saveTariffs(config: TariffConfig): Promise<{ cloudSaved: boolean; error?: string }> {
  const clean: TariffConfig = {
    bank: normalizeTariffs(config.bank),
    dana: normalizeTariffs(config.dana)
  };

  if (clean.bank.length === 0 || clean.dana.length === 0) {
    return { cloudSaved: false, error: 'Minimal harus ada 1 baris tarif valid untuk Bank dan Dana.' };
  }

  const serialized = JSON.stringify(clean);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_TARIFFS, serialized);
    window.dispatchEvent(new Event('aldea-config-updated'));
  }

  db.meta.put({ key: SUPABASE_TARIFFS_KEY, value: clean }).catch(() => {});

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('app_settings').upsert({
        key: SUPABASE_TARIFFS_KEY,
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

/** Terapkan tarif dari cloud tanpa memicu upsert balik */
export function applyCloudTariffs(rawJson: string): void {
  try {
    const parsed = JSON.parse(rawJson) as Partial<TariffConfig>;
    if (Array.isArray(parsed.bank) && Array.isArray(parsed.dana)) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_TARIFFS, JSON.stringify({
          bank: parsed.bank,
          dana: parsed.dana
        }));
      }
    }
  } catch {
    // ignore invalid json
  }
}

export async function resetTariffsToDefault(): Promise<{ cloudSaved: boolean; error?: string }> {
  return saveTariffs(getDefaultTariffs());
}

/** Hitung biaya admin berdasarkan profil tarif ('Bank' atau 'Dana') */
export function calculateAdminFee(profile: TariffProfile, nominalRibuan: number): number {
  if (nominalRibuan <= 0) return 0;
  const tariffs = getTariffs();
  const list = profile === 'Bank' ? tariffs.bank : tariffs.dana;
  const match = list.find(t => nominalRibuan >= t.minimal && nominalRibuan <= t.maksimal);
  return match ? match.admin : 0;
}
