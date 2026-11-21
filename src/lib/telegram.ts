import { Money } from './money';

const botToken = (import.meta.env.VITE_TELEGRAM_BOT_TOKEN || '').trim();
const chatId = (import.meta.env.VITE_TELEGRAM_CHAT_ID || '').trim();

export const isTelegramConfigured = Boolean(botToken && chatId);

/**
 * Kirim pesan teks terformat ke Telegram Bot via Telegram Bot API.
 * Asynchronous dan non-blocking agar tidak mengganggu transaksi kasir jika koneksi lambat.
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  if (!isTelegramConfigured) return false;

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
