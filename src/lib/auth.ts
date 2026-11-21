import { db } from './db';
import { supabase } from './supabase';

export const DEFAULT_PASSWORD = 'Aldea#2026';
const SESSION_KEY = 'aldea_auth_session';
const LOCAL_STORAGE_HASH_KEY = 'aldea_admin_password_hash';

/** Helper hashing SHA-256 menggunakan native Web Crypto API */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Ambil hash tersimpan dari Supabase (SQL), localStorage, atau IndexedDB */
export async function getStoredPasswordHash(): Promise<string> {
  const defaultHash = await sha256(DEFAULT_PASSWORD);

  // 1. Coba ambil dari Supabase (Cloud SQL) jika online
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'admin_password_hash')
        .maybeSingle();

      if (!error && data && data.value) {
        // Simpan salinan ke localStorage & IndexedDB agar sinkron
        localStorage.setItem(LOCAL_STORAGE_HASH_KEY, data.value);
        db.meta.put({ key: 'admin_password_hash', value: data.value }).catch(() => {});
        return data.value;
      }
    } catch (_) {
      // Offline fallback
    }
  }

  // 2. Ambil dari localStorage (Sangat cepat & persisten)
  const localHash = localStorage.getItem(LOCAL_STORAGE_HASH_KEY);
  if (localHash) {
    return localHash;
  }

  // 3. Ambil dari IndexedDB
  try {
    const dbItem = await db.meta.get('admin_password_hash');
    if (dbItem && dbItem.value) {
      localStorage.setItem(LOCAL_STORAGE_HASH_KEY, dbItem.value);
      return dbItem.value;
    }
  } catch (_) {}

  // 4. Jika benar-benar belum pernah ada password, set default
  localStorage.setItem(LOCAL_STORAGE_HASH_KEY, defaultHash);
  try {
    await db.meta.put({ key: 'admin_password_hash', value: defaultHash });
  } catch (_) {}

  return defaultHash;
}

/** Inisialisasi awal */
export async function initializeAuth(): Promise<void> {
  await getStoredPasswordHash();
}

/** Cek apakah password saat ini masih menggunakan default */
export async function isDefaultPassword(): Promise<boolean> {
  const currentHash = await getStoredPasswordHash();
  const defaultHash = await sha256(DEFAULT_PASSWORD);
  return currentHash === defaultHash;
}

/** Verifikasi password input terhadap hash tersimpan */
export async function verifyPassword(password: string): Promise<boolean> {
  const inputHash = await sha256(password);
  const storedHash = await getStoredPasswordHash();
  const defaultHash = await sha256(DEFAULT_PASSWORD);

  // Proteksi mutlak: Jika password sudah pernah diganti (storedHash != defaultHash),
  // maka input default password DIJAMIN DITOLAK!
  if (storedHash !== defaultHash && inputHash === defaultHash) {
    return false;
  }

  return inputHash === storedHash;
}

/** Ubah password admin (simpan ke Supabase SQL + localStorage + IndexedDB) */
export async function changePassword(
  oldPass: string,
  newPass: string
): Promise<{ success: boolean; message: string }> {
  const isValidOld = await verifyPassword(oldPass);
  if (!isValidOld) {
    return { success: false, message: 'Password lama salah!' };
  }

  if (newPass.length < 6) {
    return { success: false, message: 'Password baru minimal harus 6 karakter!' };
  }

  const newHash = await sha256(newPass);

  // 1. Simpan ke localStorage (instan)
  localStorage.setItem(LOCAL_STORAGE_HASH_KEY, newHash);

  // 2. Simpan ke IndexedDB
  try {
    await db.meta.put({ key: 'admin_password_hash', value: newHash });
  } catch (_) {}

  // 3. Simpan ke Supabase SQL (agar sinkron ke semua perangkat HP/Laptop)
  let cloudSaved = false;
  if (supabase) {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'admin_password_hash',
          value: newHash,
          updated_at: new Date().toISOString()
        });
      if (!error) cloudSaved = true;
    } catch (_) {}
  }

  return { 
    success: true, 
    message: cloudSaved 
      ? 'Password berhasil diubah dan disinkronkan ke Cloud Supabase!' 
      : 'Password berhasil diubah di perangkat ini!' 
  };
}

/** Login session management */
export function setAuthSession(): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    authenticated: true,
    timestamp: Date.now()
  }));
}

export function clearAuthSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isUserAuthenticated(): boolean {
  try {
    const item = localStorage.getItem(SESSION_KEY);
    if (!item) return false;
    const session = JSON.parse(item);
    return Boolean(session && session.authenticated);
  } catch (_) {
    return false;
  }
}
