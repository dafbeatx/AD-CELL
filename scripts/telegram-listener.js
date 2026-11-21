import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Baca .env.local jika ada
const envPath = path.resolve(__dirname, '../.env.local');
let botToken = '9289205740:AAGS5qFzQxS2SD8Kfo7MY7u8kmGVFy52kWk';
let allowedChatId = '9086805999';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('VITE_TELEGRAM_BOT_TOKEN=')) {
      const val = trimmed.split('=')[1]?.trim();
      if (val) botToken = val;
    }
    if (trimmed.startsWith('VITE_TELEGRAM_CHAT_ID=')) {
      const val = trimmed.split('=')[1]?.trim();
      if (val) allowedChatId = val;
    }
  }
}

console.log(`[Telegram Listener] Starting with Bot Token: ${botToken.slice(0, 10)}... Target Chat: ${allowedChatId}`);

let lastUpdateId = 0;

async function sendReply(chatId, text) {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML'
      })
    });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.error('[Telegram Listener] Gagal kirim balasan:', err);
    return false;
  }
}

async function handleMessage(msg) {
  const chatId = msg.chat?.id;
  const text = (msg.text || '').trim();
  const senderName = msg.from?.first_name || 'Kasir';
  const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  console.log(`[Telegram Listener] Pesan masuk dari ${senderName} (${chatId}): "${text}"`);

  if (text.startsWith('/start')) {
    const reply = `
👋 Halo <b>${senderName}</b>!
🤖 <b>Bot Aldea POS Aktif & Siap Digunakan!</b>
━━━━━━━━━━━━━━━━━
✅ <b>Status:</b> Online & Terhubung
🕒 <b>Waktu:</b> ${time} WIB
📅 <b>Tanggal:</b> ${dateStr}

Sistem kasir Anda siap digunakan. Setiap transaksi masuk, penjualan produk, kasbon, dan closing harian akan otomatis dilaporkan ke sini.

📌 <b>Perintah yang tersedia:</b>
• /start - Cek status bot kasir
• /status - Cek status koneksi kasir
• /help - Panduan penggunaan bot
━━━━━━━━━━━━━━━━━
🏪 <i>AD-CELL POS System</i>`.trim();

    await sendReply(chatId, reply);
  } else if (text.startsWith('/status')) {
    const reply = `
📊 <b>STATUS SISTEM ALDEA POS</b>
━━━━━━━━━━━━━━━━━
• <b>Bot Telegram:</b> 🟢 Aktif & Terhubung
• <b>Chat ID Anda:</b> <code>${chatId}</code>
• <b>Tanggal:</b> ${dateStr}
• <b>Waktu Server:</b> ${time} WIB
• <b>Koneksi:</b> Siap menerima transaksi
━━━━━━━━━━━━━━━━━
🏪 <i>AD-CELL POS System</i>`.trim();

    await sendReply(chatId, reply);
  } else if (text.startsWith('/help')) {
    const reply = `
ℹ️ <b>PANDUAN BOT ALDEA POS</b>
━━━━━━━━━━━━━━━━━
Bot ini terhubung dengan aplikasi kasir AD-CELL:
1. <b>Notifikasi Transaksi:</b> Otomatis dikirim saat kasir menyimpan transaksi Bank, Dana, OVO, BCA, atau QRIS.
2. <b>Penjualan Produk:</b> Notifikasi langsung saat produk Acc, ATK, atau Voucher terjual.
3. <b>Buku Kasbon:</b> Laporan saat ada hutang baru atau pelunasan kasbon.
4. <b>Closing Harian:</b> Rekap omset dan laba bersih otomatis dikirim saat tutup kasir.
━━━━━━━━━━━━━━━━━
🏪 <i>AD-CELL POS System</i>`.trim();

    await sendReply(chatId, reply);
  }
}

async function pollUpdates() {
  while (true) {
    try {
      const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${lastUpdateId ? lastUpdateId + 1 : 0}&timeout=15`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          if (update.message) {
            await handleMessage(update.message);
          }
        }
      }
    } catch (err) {
      console.error('[Telegram Listener] Poll error:', err);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

pollUpdates();
