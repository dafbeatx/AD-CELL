export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'Aldea POS Telegram Webhook Endpoint Active' });
  }

  const botToken = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN is not configured' });
  }

  try {
    const update = req.body;
    const msg = update?.message;

    if (msg && msg.text) {
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
✅ <b>Status:</b> Online & Terhubung (Vercel Cloud)
🕒 <b>Waktu:</b> ${time} WIB
📅 <b>Tanggal:</b> ${dateStr}

Sistem kasir Anda siap digunakan. Setiap transaksi masuk, penjualan produk, kasbon, dan closing harian akan otomatis dilaporkan ke sini.

📌 <b>Perintah yang tersedia:</b>
• /start - Cek status bot kasir
• /status - Cek status koneksi kasir
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
• <b>Waktu Server:</b> ${time} WIB
• <b>Koneksi:</b> Siap menerima transaksi
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
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: reply,
            parse_mode: 'HTML'
          })
        });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
}
