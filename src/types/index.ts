export type ProductCategory = 'Acc' | 'Atk' | 'Voucher';

export interface Product {
  id: string;
  kategori: ProductCategory;
  model: string;
  awal: number;
  tambah: number;
  sisa: number;
  terjual: number;
  akhir: number;
  modal: number; // in ribuan
  jual: number;  // in ribuan
  omset: number; // in ribuan
  laba: number;  // in ribuan
}

export interface ProductSale {
  id: string;
  productId: string;
  kategori: ProductCategory;
  model: string;
  modal: number;
  jual: number;
  waktu: number;
}

export type TariffProfile = 'Bank' | 'Dana';
export type TxChannel = string;
export type TxType = 'bagi' | 'isi' | 'transfer' | 'tarik' | 'setor';

export interface TxChannelConfig {
  id: string;
  name: string;
  subtitle: string;
  kind: 'ledger' | 'pulsa' | 'qris';
  tariffProfile: TariffProfile;
  isDefault: boolean;
}

export interface TariffConfig {
  bank: Tariff[];
  dana: Tariff[];
}

export interface TxRow {
  id: string;
  channel: TxChannel;
  baris: number;
  saldoAwal: number;
  transaksi: TxType | '';
  nominal: number; // in ribuan
  laba: number;    // in ribuan
  saldoAkhir: number;
}

export interface TxSummary {
  saldo: number;
  omset: number;
  selisih: number;
  aldea: number; // Saldo aktual dari fisik
}

export interface Expense {
  id: string;
  nomor: number;
  nama: string;
  jumlah: number; // in ribuan
  keterangan: string;
  jenis: 'ADMIN' | 'OPERASIONAL';
  createdAt: number;
}

export interface Kasbon {
  id: string;
  nama: string;
  nominal: number; // in full rupiah
  keterangan: string;
  lunas: boolean;
  tanggalDibuat: number;
  tanggalLunas?: number;
}

export interface PulsaData {
  saldoAwal: number;
  isiSaldoList: { id: string; nominal: number; waktu: number }[];
  pemakaianList: { id: string; nominal: number; modal: number; waktu: number }[];
}

export interface QrisData {
  saldoAwal: number;
  tarikTunai: number;
  adminTarik: number;
  bayarQris: number;
  pindahSaldo: number;
  catatanList: { id: string; keterangan: string; nominal: number; waktu: number }[];
}

export interface DailyClosing {
  id: string;
  tanggal: string; // YYYY-MM-DD
  omset: number;
  labaKotor: number;
  labaBersih: number;
  cashDrawer: number;
  timestamp: number;
  detail: Record<string, any>;
}

export interface Tariff {
  minimal: number;
  maksimal: number;
  admin: number;
}
