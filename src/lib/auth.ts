import { db } from './db';

const DEFAULT_PASSWORD = 'Aldea#2026';
const SESSION_KEY = 'aldea_auth_session';

/** Helper hashing SHA-256 menggunakan native Web Crypto API */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Inisialisasi password default jika belum ada di database */
export async function initializeAuth(): Promise<void> {
  const existingHash = await db.meta.get('admin_password_hash');
  if (!existingHash) {
    const defaultHash = await sha256(DEFAULT_PASSWORD);
    await db.meta.put({ key: 'admin_password_hash', value: defaultHash });
  }
}

/** Verifikasi password input terhadap hash tersimpan */
export async function verifyPassword(password: string): Promise<boolean> {
  await initializeAuth();
  const stored = await db.meta.get('admin_password_hash');
  if (!stored || !stored.value) return false;

  const inputHash = await sha256(password);
  return inputHash === stored.value;
}

/** Ubah password admin */
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
  await db.meta.put({ key: 'admin_password_hash', value: newHash });

  return { success: true, message: 'Password berhasil diubah!' };
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

export const DEFAULT_PASS_HINT = DEFAULT_PASSWORD;
