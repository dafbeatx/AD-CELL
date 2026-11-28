import Dexie, { type Table } from 'dexie';
import { Product, ProductSale, TxRow, Expense, Kasbon, DailyClosing } from '../types';

export class AldeaDatabase extends Dexie {
  products!: Table<Product, string>;
  productSales!: Table<ProductSale, string>;
  transactions!: Table<TxRow, string>;
  expenses!: Table<Expense, string>;
  kasbon!: Table<Kasbon, string>;
  closings!: Table<DailyClosing, string>;
  meta!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('AldeaPOSDB');
    this.version(1).stores({
      products: 'id, kategori, model',
      productSales: 'id, productId, waktu, kategori',
      transactions: 'id, channel, baris',
      expenses: 'id, createdAt, jenis',
      kasbon: 'id, lunas, tanggalDibuat',
      closings: 'id, tanggal',
      meta: 'key'
    });
  }
}

export const db = new AldeaDatabase();

/** Inisialisasi data awal (seeding) jika database masih kosong */
export async function initializeDatabase() {
  const initialized = await db.meta.get('initialized');
  if (initialized) return;

  // Default seed products
  const defaultProducts: Product[] = [
    { id: 'acc-1', kategori: 'Acc', model: 'Kabel Data Type-C', awal: 10, tambah: 0, sisa: 10, terjual: 0, akhir: 10, modal: 12, jual: 25, omset: 0, laba: 0 },
    { id: 'acc-2', kategori: 'Acc', model: 'Charger 20W Fast', awal: 8, tambah: 0, sisa: 8, terjual: 0, akhir: 8, modal: 35, jual: 65, omset: 0, laba: 0 },
    { id: 'atk-1', kategori: 'Atk', model: 'Pulpen Standard Hitam', awal: 24, tambah: 0, sisa: 24, terjual: 0, akhir: 24, modal: 2, jual: 3, omset: 0, laba: 0 },
    { id: 'atk-2', kategori: 'Atk', model: 'Buku Tulis Sidu 38', awal: 20, tambah: 0, sisa: 20, terjual: 0, akhir: 20, modal: 4, jual: 6, omset: 0, laba: 0 },
    { id: 'voc-1', kategori: 'Voucher', model: 'Telkomsel 5GB / 30Hr', awal: 15, tambah: 0, sisa: 15, terjual: 0, akhir: 15, modal: 24, jual: 28, omset: 0, laba: 0 },
    { id: 'voc-2', kategori: 'Voucher', model: 'Indosat 3GB / 30Hr', awal: 12, tambah: 0, sisa: 12, terjual: 0, akhir: 12, modal: 16, jual: 20, omset: 0, laba: 0 },
  ];

  await db.products.bulkAdd(defaultProducts);

  // Inisialisasi 20 baris kosong untuk channel transaksi bawaan (Bank & Dana)
  const channels = ['Bank', 'Dana'];
  const initialRows: TxRow[] = [];
  for (const ch of channels) {
    for (let i = 1; i <= 20; i++) {
      initialRows.push({
        id: `${ch.toLowerCase()}-${i}`,
        channel: ch,
        baris: i,
        saldoAwal: 0,
        transaksi: '',
        nominal: 0,
        laba: 0,
        saldoAkhir: 0
      });
    }
  }
  await db.transactions.bulkAdd(initialRows);

  // Tandai sudah di-seed
  await db.meta.put({ key: 'initialized', value: true });
  await db.meta.put({ key: 'aldea_saldo_bank', value: 0 });
  await db.meta.put({ key: 'aldea_saldo_dana', value: 0 });
  await db.meta.put({ key: 'pulsa_saldo_awal', value: 0 });
  await db.meta.put({ key: 'qris_saldo_awal', value: 0 });
}
