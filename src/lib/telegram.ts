import { Money } from './money';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY_TOKEN = 'aldea_telegram_token';
const STORAGE_KEY_CHAT_ID = 'aldea_telegram_chat_id';

/**
 * Mengambil konfigurasi Telegram saat ini.
 * Memprioritaskan nilai dari localStorage (yang diset via menu Admin),
 * kemudian fallback ke file environment .env.local.
 */
export function getTelegramConfig() {
  const localToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_TOKEN) : null;
  const localChatId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_CHAT_ID) : null;

  const botToken = (localToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = (localChatId || import.meta.env.VITE_TELEGRAM_CHAT_ID || '').trim();

  return {
    botToken,
    chatId,
    isConfigured: Boolean(botToken && chatId)
  };
}

export function isTelegramConfigured(): boolean {
  return getTelegramConfig().isConfigured;
}

/**
 * Menyimpan konfigurasi Telegram ke localStorage dan ke cloud database Supabase
 */
export async function saveTelegramConfig(token: string, chatId: string): Promise<void> {
  const cleanToken = token.trim();
  const cleanChatId = chatId.trim();

  if (typeof window !== 'undefined') {
    if (cleanToken) {
      localStorage.setItem(STORAGE_KEY_TOKEN, cleanToken);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
    if (cleanChatId) {
      localStorage.setItem(STORAGE_KEY_CHAT_ID, cleanChatId);
    } else {
      localStorage.removeItem(STORAGE_KEY_CHAT_ID);
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('app_settings').upsert([
        { key: 'telegram_bot_token', value: cleanToken, updated_at: new Date().toISOString() },
        { key: 'telegram_chat_id', value: cleanChatId, updated_at: new Date().toISOString() }
      ]);
    } catch (e) {
      console.warn('Gagal sync telegram config ke Supabase:', e);
    }
  }
}

/** Inisialisasi sync setting dari Supabase saat aplikasi terbuka */
export async function syncTelegramConfigFromCloud(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['telegram_bot_token', 'telegram_chat_id']);

    if (data && data.length > 0) {
      for (const item of data) {
        if (item.key === 'telegram_bot_token' && item.value && !localStorage.getItem(STORAGE_KEY_TOKEN)) {
          localStorage.setItem(STORAGE_KEY_TOKEN, item.value);
        }
        if (item.key === 'telegram_chat_id' && item.value && !localStorage.getItem(STORAGE_KEY_CHAT_ID)) {
          localStorage.setItem(STORAGE_KEY_CHAT_ID, item.value);
        }
      }
    }
  } catch (err) {
    console.warn('Gagal memuat setting telegram dari cloud:', err);
  }
}

/**
 * Kirim pesan teks terformat ke Telegram Bot via Telegram Bot API.
 * Asynchronous dan non-blocking agar tidak mengganggu transaksi kasir jika koneksi lambat.
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  const { botToken, chatId, isConfigured } = getTelegramConfig();
  if (!isConfigured) return false;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
    return res.ok;
  } catch (err) {
    console.warn('Gagal mengirim notifikasi ke Telegram:', err);
    return false;
  }
}

/**
 * Tes koneksi Telegram dengan laporan hasil pengiriman lengkap
 */
export async function testTelegramConnection(customToken?: string, customChatId?: string): Promise<{ success: boolean; message: string }> {
  const cfg = getTelegramConfig();
  const token = (customToken ?? cfg.botToken).trim();
  const cid = (customChatId ?? cfg.chatId).trim();

  if (!token || !cid) {
    return { success: false, message: 'Bot Token dan Chat ID wajib diisi terlebih dahulu.' };
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cid,
        text: `🚀 <b>Tes Notifikasi Aldea POS</b>\n━━━━━━━━━━━━━━━━━\n✅ <b>Status:</b> Bot Telegram Berhasil Terhubung!\n🕒 <b>Waktu:</b> ${time} WIB\n\nSetiap transaksi, kasbon, dan tutup buku harian akan otomatis dikirimkan ke sini.`,
        parse_mode: 'HTML'
      })
    });

    const data = await res.json();
    if (res.ok && data.ok) {
      return { success: true, message: 'Pesan tes berhasil dikirim! Silakan periksa chat Telegram Anda.' };
    } else {
      const errDesc = data.description || 'Gagal mengirim pesan';
      let tip = '';
      if (errDesc.includes('chat not found') || errDesc.includes('Forbidden')) {
        tip = ' (Pastikan Anda sudah membuka bot di Telegram dan menekan tombol START)';
      } else if (errDesc.includes('Unauthorized')) {
        tip = ' (Token Bot tidak valid, periksa kembali token dari @BotFather)';
      }
      return { success: false, message: `Telegram Error: ${errDesc}${tip}` };
    }
  } catch (err: any) {
    return { success: false, message: `Koneksi gagal: ${err?.message || 'Periksa jaringan internet Anda.'}` };
  }
}

/** Notifikasi transaksi keuangan masuk (Bank, Dana, OVO, BCA) */
export function notifyTransaction(data: {
  channel: string;
  type: string;
  nominal: number; // ribuan
  laba: number;    // ribuan
  saldo: number;   // ribuan
  baris: number;
}) {
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const message = `
💳 <b>TRANSAKSI BARU: ${data.channel.toUpperCase()}</b>
━━━━━━━━━━━━━━━━━
• <b>Jenis:</b> ${data.type.toUpperCase()} (Baris #${data.baris})
• <b>Nominal:</b> <code>${Money.ribuan(data.nominal)}</code>
• <b>Laba Fee:</b> <code>+${Money.ribuan(data.laba)}</code>
• <b>Sisa Saldo:</b> <code>${Money.ribuan(data.saldo)}</code>
• <b>Waktu:</b> ${time} WIB
━━━━━━━━━━━━━━━━━
🏪 <i>Aldea POS Kasir</i>`.trim();

  sendTelegramMessage(message);
}

/** Notifikasi penjualan produk fisik (Acc, ATK, Voucher) */
export function notifyProductSale(data: {
  model: string;
  category: string;
  price: number;   // ribuan
  profit: number;  // ribuan
  remaining: number;
}) {
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const message = `
📦 <b>PRODUK TERJUAL (1 UNIT)</b>
━━━━━━━━━━━━━━━━━
• <b>Produk:</b> <b>${data.model}</b> (${data.category})
• <b>Harga Jual:</b> <code>${Money.ribuan(data.price)}</code>
• <b>Laba Bersih:</b> <code>+${Money.ribuan(data.profit)}</code>
• <b>Sisa Stok:</b> ${data.remaining} unit
• <b>Waktu:</b> ${time} WIB
━━━━━━━━━━━━━━━━━
🏪 <i>Aldea POS Kasir</i>`.trim();

  sendTelegramMessage(message);
}

/** Notifikasi pengeluaran toko */
export function notifyExpense(data: {
  name: string;
  amount: number; // ribuan
  type: string;
}) {
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const message = `
💸 <b>PENGELUARAN TERCATAT</b>
━━━━━━━━━━━━━━━━━
• <b>Keperluan:</b> ${data.name}
• <b>Kategori:</b> ${data.type}
• <b>Jumlah:</b> <code>-${Money.ribuan(data.amount)}</code>
• <b>Waktu:</b> ${time} WIB
━━━━━━━━━━━━━━━━━
🏪 <i>Aldea POS Kasir</i>`.trim();

  sendTelegramMessage(message);
}

/** Notifikasi kasbon / piutang pelanggan */
export function notifyKasbon(data: {
  name: string;
  amountRupiah: number;
  isPaid: boolean;
  note?: string;
}) {
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const status = data.isPaid ? '✅ LUNAS' : '⚠️ KASBON BARU';
  const message = `
📖 <b>BUKU KASBON: ${status}</b>
━━━━━━━━━━━━━━━━━
• <b>Pelanggan:</b> <b>${data.name}</b>
• <b>Nominal:</b> <code>${Money.rupiah(data.amountRupiah)}</code>
${data.note ? `• <b>Catatan:</b> <i>${data.note}</i>\n` : ''}• <b>Waktu:</b> ${time} WIB
━━━━━━━━━━━━━━━━━
🏪 <i>Aldea POS Kasir</i>`.trim();

  sendTelegramMessage(message);
}

/** Notifikasi closing / tutup buku harian */
export function notifyClosing(data: {
  date: string;
  omset: number;
  grossProfit: number;
  netProfit: number;
}) {
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const message = `
🏁 <b>CLOSING KASIR HARI INI</b>
━━━━━━━━━━━━━━━━━
• <b>Tanggal:</b> ${data.date} (${time} WIB)
• <b>Total Omset:</b> <code>${Money.ribuan(data.omset)}</code>
• <b>Laba Kotor:</b> <code>${Money.ribuan(data.grossProfit)}</code>
• <b>Laba Bersih:</b> <b><code>${Money.ribuan(data.netProfit)}</code></b>
━━━━━━━━━━━━━━━━━
✅ <i>Tutup buku harian berhasil disimpan.</i>`.trim();

  sendTelegramMessage(message);
}

/** Notifikasi error / peringatan sistem */
export function notifySystemError(errorText: string, context?: string) {
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const message = `
🚨 <b>PERINGATAN ERROR ALDEA POS</b>
━━━━━━━━━━━━━━━━━
• <b>Waktu:</b> ${time} WIB
${context ? `• <b>Konteks:</b> ${context}\n` : ''}• <b>Pesan:</b>
<pre>${errorText.slice(0, 500)}</pre>
━━━━━━━━━━━━━━━━━
⚠️ <i>Harap periksa sistem kasir.</i>`.trim();

  sendTelegramMessage(message);
}

let isPollingActive = false;
let browserLastUpdateId = 0;

/**
 * Polling Telegram getUpdates dari browser secara realtime
 * Menangani perintah /start, /status, /help otomatis
 */
export function startTelegramPolling() {
  if (isPollingActive || typeof window === 'undefined') return;
  isPollingActive = true;

  const poll = async () => {
    const { botToken, isConfigured } = getTelegramConfig();
    if (!isConfigured) {
      setTimeout(poll, 8000);
      return;
    }

    try {
      const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${browserLastUpdateId ? browserLastUpdateId + 1 : 0}&timeout=10`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          browserLastUpdateId = update.update_id;
          if (update.message && update.message.text) {
            await handleIncomingCommand(update.message);
          }
        }
      }
    } catch {
      // Abaikan error jaringan saat polling
    }

    setTimeout(poll, 3000);
  };

  setTimeout(poll, 1500);
}

async function handleIncomingCommand(msg: any) {
  const chatId = msg.chat?.id;
  const text = (msg.text || '').trim();
  const senderName = msg.from?.first_name || 'Kasir';
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  let reply = '';
  if (text.startsWith('/start')) {
    reply = `
👋 Halo <b>${senderName}</b>!
🤖 <b>Bot Aldea POS Aktif & Siap Digunakan!</b>
━━━━━━━━━━━━━━━━━
✅ <b>Status:</b> Online & Terhubung
🕒 <b>Waktu:</b> ${time} WIB
📅 <b>Tanggal:</b> ${dateStr}

Sistem kasir siap digunakan. Notifikasi transaksi, penjualan, dan closing harian akan otomatis dikirim ke sini.

📌 <b>Perintah yang tersedia:</b>
• /start - Cek status bot kasir
• /status - Cek status kasir
• /help - Panduan penggunaan bot
━━━━━━━━━━━━━━━━━
🏪 <i>AD-CELL POS System</i>`.trim();
  } else if (text.startsWith('/status')) {
    reply = `
📊 <b>STATUS SISTEM ALDEA POS</b>
━━━━━━━━━━━━━━━━━
• <b>Bot Telegram:</b> 🟢 Aktif & Terhubung
• <b>Chat ID Anda:</b> <code>${chatId}</code>
• <b>Tanggal:</b> ${dateStr}
• <b>Waktu:</b> ${time} WIB
• <b>Mode Kasir:</b> Siap Transaksi
━━━━━━━━━━━━━━━━━
🏪 <i>AD-CELL POS System</i>`.trim();
  } else if (text.startsWith('/help')) {
    reply = `
ℹ️ <b>PANDUAN BOT ALDEA POS</b>
━━━━━━━━━━━━━━━━━
Bot ini terhubung dengan aplikasi kasir AD-CELL:
1. <b>Notifikasi Transaksi:</b> Otomatis dikirim saat kasir menyimpan transaksi Bank, Dana, OVO, BCA, atau QRIS.
2. <b>Penjualan Produk:</b> Notifikasi langsung saat produk Acc, ATK, atau Voucher terjual.
3. <b>Buku Kasbon:</b> Laporan saat ada hutang baru atau pelunasan kasbon.
4. <b>Closing Harian:</b> Rekap omset dan laba bersih otomatis dikirim saat tutup kasir.
━━━━━━━━━━━━━━━━━
🏪 <i>AD-CELL POS System</i>`.trim();
  }

  if (reply && chatId) {
    const { botToken } = getTelegramConfig();
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply,
          parse_mode: 'HTML'
        })
      });
    } catch {
      // ignore
    }
  }
}
