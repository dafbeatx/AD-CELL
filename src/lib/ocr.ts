import { createWorker } from 'tesseract.js';

export interface OcrParseResult {
  rawText: string;
  confidence: number;
  amount: number;         // dalam Rupiah penuh, misal 50000
  amountRibuan: number;   // dalam format sistem Aldea (ribuan), misal 50
  channel: 'BCA' | 'Bank' | 'Dana' | 'Ovo' | 'QRIS' | 'Pengeluaran' | 'Lainnya';
  txType: 'Tarik Tunai' | 'Transfer' | 'Setor Tunai' | 'QRIS' | 'Pengeluaran';
  adminFee?: number;      // dalam Rupiah
  recipient?: string;
  sender?: string;
  refNumber?: string;
  dateStr?: string;
}

/**
 * Ekstraksi angka nominal rupiah dari teks OCR
 */
function extractNominal(text: string): number {
  // Pola nominal Rupiah umum:
  // "Rp 150.000", "Rp. 50.000,00", "Total Transaksi Rp 25.000", "Jumlah Rp 500.000"
  const lines = text.split('\n');
  const candidates: number[] = [];

  // 1. Cari baris yang mengandung kata kunci nominal utama
  const priorityKeywords = [
    /total\s*transaksi/i,
    /total\s*bayar/i,
    /total\s*transfer/i,
    /jumlah\s*transfer/i,
    /nominal\s*transfer/i,
    /jumlah\s*bayar/i,
    /jumlah/i,
    /nominal/i,
    /total/i
  ];

  for (const line of lines) {
    for (const kw of priorityKeywords) {
      if (kw.test(line)) {
        // Cari angka berformat rupiah di baris ini
        const matches = line.match(/(?:rp\.?|idr)?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/i);
        if (matches && matches[1]) {
          const cleanNum = cleanNumber(matches[1]);
          if (cleanNum >= 1000 && cleanNum <= 100000000) {
            return cleanNum;
          }
        }
      }
    }
  }

  // 2. Jika tidak ada baris spesifik, cari semua nominal dengan prefix Rp
  const rpMatches = text.matchAll(/(?:rp\.?|idr)\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/gi);
  for (const m of rpMatches) {
    const val = cleanNumber(m[1]);
    if (val >= 1000 && val <= 100000000) {
      candidates.push(val);
    }
  }

  if (candidates.length > 0) {
    // Biasanya nominal transfer adalah angka terbesar yang bukan saldo
    return Math.max(...candidates);
  }

  // 3. Fallback: Cari deretan angka berformat ribuan (e.g. 50.000 atau 100.000)
  const genericMatches = text.matchAll(/\b([0-9]{1,3}(?:\.[0-9]{3})+)\b/g);
  for (const m of genericMatches) {
    const val = cleanNumber(m[1]);
    if (val >= 5000 && val <= 50000000) {
      candidates.push(val);
    }
  }

  if (candidates.length > 0) {
    return Math.max(...candidates);
  }

  return 0;
}

/**
 * Pembersihan string angka berpemisah titik/koma menjadi number
 */
function cleanNumber(str: string): number {
  if (!str) return 0;
  // Jika ada koma sebagai desimal (contoh: 50.000,00)
  let s = str.trim();
  if (s.includes(',') && s.split(',')[1].length <= 2) {
    s = s.split(',')[0];
  }
  // Buang semua selain digit
  const digits = s.replace(/[^0-9]/g, '');
  return parseInt(digits, 10) || 0;
}

/**
 * Deteksi saluran pembayaran / bank / e-wallet
 */
function detectChannel(text: string): 'BCA' | 'Bank' | 'Dana' | 'Ovo' | 'QRIS' | 'Pengeluaran' | 'Lainnya' {
  const t = text.toLowerCase();
  if (t.includes('bca') || t.includes('klikbca') || t.includes('mybca') || t.includes('m-transfer')) {
    return 'BCA';
  }
  if (t.includes('dana') || t.includes('kirim uang') && t.includes('dana id')) {
    return 'Dana';
  }
  if (t.includes('ovo') || t.includes('ovo cash')) {
    return 'Ovo';
  }
  if (t.includes('qris') || t.includes('nmid') || t.includes('quick response')) {
    return 'QRIS';
  }
  if (
    t.includes('brimo') || t.includes('bri') ||
    t.includes('mandiri') || t.includes('livin') ||
    t.includes('bni') || t.includes('bsi') ||
    t.includes('bank') || t.includes('atm')
  ) {
    return 'Bank';
  }
  if (
    t.includes('indomaret') || t.includes('alfamart') ||
    t.includes('belanja') || t.includes('toko') ||
    t.includes('nota') || t.includes('struk belanja')
  ) {
    return 'Pengeluaran';
  }
  return 'Lainnya';
}

/**
 * Deteksi nomor referensi struk
 */
function extractRefNumber(text: string): string | undefined {
  const match = text.match(/(?:no\.?\s*ref(?:erensi)?|ref\s*no|id\s*transaksi|no\s*transaksi|transaksi\s*id)\s*[:.]?\s*([a-zA-Z0-9_-]{6,30})/i);
  return match ? match[1].trim() : undefined;
}

/**
 * Deteksi nama penerima / rekening tujuan
 */
function extractRecipient(text: string): string | undefined {
  const match = text.match(/(?:ke\s*rekening|tujuan|penerima|nama\s*penerima|atas\s*nama|a\/n)\s*[:.]?\s*([a-zA-Z0-9\s.,]{3,35})/i);
  if (match) {
    const raw = match[1].split('\n')[0].trim();
    return raw.replace(/[^a-zA-Z0-9\s.,]/g, '').trim();
  }
  return undefined;
}

/**
 * Deteksi biaya admin pada struk
 */
function extractAdminFee(text: string): number | undefined {
  const match = text.match(/(?:biaya\s*admin|admin\s*fee|biaya\s*transaksi|biaya\s*layanan)\s*[:.]?\s*(?:rp\.?)?\s*([0-9.,]+)/i);
  if (match) {
    const val = cleanNumber(match[1]);
    if (val > 0 && val < 50000) return val;
  }
  return undefined;
}

/**
 * Fungsi utama untuk membaca gambar struk dan menghasilkan data transaksi terstruktur
 */
export async function recognizeReceipt(
  imageSource: File | Blob | string,
  onProgress?: (progress: number, status: string) => void
): Promise<OcrParseResult> {
  let worker: any = null;
  try {
    if (onProgress) onProgress(10, 'Menyiapkan mesin OCR...');

    worker = await createWorker('ind+eng');

    if (onProgress) onProgress(35, 'Memindai teks pada struk...');

    const ret = await worker.recognize(imageSource);
    const rawText = ret.data.text || '';
    const confidence = Math.round(ret.data.confidence || 0);

    if (onProgress) onProgress(80, 'Menganalisis nominal & data transaksi...');

    const amount = extractNominal(rawText);
    const amountRibuan = Math.round(amount / 1000);
    const channel = detectChannel(rawText);
    const refNumber = extractRefNumber(rawText);
    const recipient = extractRecipient(rawText);
    const adminFee = extractAdminFee(rawText);

    let txType: 'Tarik Tunai' | 'Transfer' | 'Setor Tunai' | 'QRIS' | 'Pengeluaran' = 'Transfer';
    if (channel === 'QRIS') {
      txType = 'QRIS';
    } else if (channel === 'Pengeluaran') {
      txType = 'Pengeluaran';
    } else if (/tarik\s*tunai/i.test(rawText)) {
      txType = 'Tarik Tunai';
    } else if (/setor\s*tunai/i.test(rawText)) {
      txType = 'Setor Tunai';
    }

    if (onProgress) onProgress(100, 'Pemindaian selesai!');

    return {
      rawText,
      confidence,
      amount,
      amountRibuan,
      channel,
      txType,
      adminFee,
      recipient,
      refNumber
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}
