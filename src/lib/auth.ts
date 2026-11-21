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

/** Ambil hash tersimpan dari Supabase (SQL Global) sebagai sumber kebenaran utama */
export async function getStoredPasswordHash(): Promise<{ hash: string; source: 'cloud' | 'local' }> {
  const defaultHash = await sha256(DEFAULT_PASSWORD);

  // 1. Prioritas Utama: Ambil dari Supabase (Cloud SQL Global)
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'admin_password_hash')
        .maybeSingle();

      if (!error && data && data.value) {
        // Simpan ke local cache agar saat offline tetap sinkron
        localStorage.setItem(LOCAL_STORAGE_HASH_KEY, data.value);
        db.meta.put({ key: 'admin_password_hash', value: data.value }).catch(() => {});
        return { hash: data.value, source: 'cloud' };
      }
      if (error) {
        console.warn('Supabase query error (mungkin tabel app_settings belum di-run di SQL Editor):', error);
      }
    } catch (err) {
      console.warn('Gagal koneksi ke Supabase:', err);
    }
  }

  // 2. Cadangan: Ambil dari localStorage
  const localHash = localStorage.getItem(LOCAL_STORAGE_HASH_KEY);
  if (localHash) {
    return { hash: localHash, source: 'local' };
  }

  // 3. Cadangan: Ambil dari IndexedDB
  try {
    const dbItem = await db.meta.get('admin_password_hash');
    if (dbItem && dbItem.value) {
      localStorage.setItem(LOCAL_STORAGE_HASH_KEY, dbItem.value);
      return { hash: dbItem.value, source: 'local' };
    }
  } catch (_) {}

  // 4. Jika benar-benar belum pernah dibuat di mana pun, gunakan default
  localStorage.setItem(LOCAL_STORAGE_HASH_KEY, defaultHash);
  try {
    await db.meta.put({ key: 'admin_password_hash', value: defaultHash });
  } catch (_) {}

  return { hash: defaultHash, source: 'local' };
}

/** Inisialisasi awal */
export async function initializeAuth(): Promise<void> {
  await getStoredPasswordHash();
}

/** Cek apakah password saat ini masih menggunakan default */
export async function isDefaultPassword(): Promise<boolean> {
  const { hash } = await getStoredPasswordHash();
  const defaultHash = await sha256(DEFAULT_PASSWORD);
  return hash === defaultHash;
}

/** Verifikasi password input terhadap hash tersimpan */
export async function verifyPassword(password: string): Promise<boolean> {
  const inputHash = await sha256(password);
  const { hash: storedHash } = await getStoredPasswordHash();
  const defaultHash = await sha256(DEFAULT_PASSWORD);

  // Jika password di Supabase/cloud sudah diganti, tolak password default lama!
  if (storedHash !== defaultHash && inputHash === defaultHash) {
    return false;
  }

  return inputHash === storedHash;
}

/** Ubah password admin secara global ke Supabase (SQL) */
export async function changePassword(
  oldPass: string,
  newPass: string
): Promise<{ success: boolean; message: string }> {
  const isValidOld = await verifyPassword(oldPass);
  if (!isValidOld) {
    return { success: false, message: 'Password saat ini salah!' };
  }

  if (newPass.length < 6) {
    return { success: false, message: 'Password baru minimal harus 6 karakter!' };
  }

  const newHash = await sha256(newPass);

  // 1. Simpan ke Supabase Cloud SQL jika tersambung (Wajib agar global untuk semua perangkat)
  let cloudSuccess = false;
  if (supabase) {
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'admin_password_hash',
          value: newHash,
          updated_at: new Date().toISOString()
        });

      if (error) {
        return {
          success: false,
          message: `Gagal simpan ke Supabase: ${error.message}. Buka SQL Editor di Supabase dan jalankan file supabase/schema.sql!`
        };
      }
      cloudSuccess = true;
    } catch (err: any) {
      return {
        success: false,
        message: `Gagal menghubungi server Supabase: ${err.message || err}`
      };
    }
  }

  // 2. Simpan juga salinan ke localStorage & IndexedDB perangkat ini
  localStorage.setItem(LOCAL_STORAGE_HASH_KEY, newHash);
  try {
    await db.meta.put({ key: 'admin_password_hash', value: newHash });
  } catch (_) {}

  return {
    success: true,
    message: cloudSuccess
      ? 'Password berhasil diubah secara GLOBAL di Supabase Cloud! Semua perangkat sekarang menggunakan password baru ini.'
      : 'Password berhasil diubah di penyimpanan lokal.'
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
