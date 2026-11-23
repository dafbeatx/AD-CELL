import React, { useEffect, useState } from 'react';
import { 
  Smartphone, 
  QrCode, 
  Receipt, 
  BookOpen, 
  Calculator,
  Package,
  Layers,
  ChevronRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { db } from '../../lib/db';
import { Money } from '../../lib/money';

interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    omset: 0,
    laba: 0,
    piutangKasbon: 0
  });

  useEffect(() => {
    async function loadQuickStats() {
      // Hitung total piutang kasbon belum lunas
      const unpaid = await db.kasbon.filter(k => !k.lunas).toArray();
      const totalKasbon = unpaid.reduce((sum, item) => sum + item.nominal, 0);

      // Hitung produk terjual
      const products = await db.products.toArray();
      const productOmset = products.reduce((sum, p) => sum + p.omset, 0);
      const productLaba = products.reduce((sum, p) => sum + p.laba, 0);

      // Hitung transaksi (hanya transfer dan tarik yang menghasilkan laba fee)
      const txs = await db.transactions.toArray();
      const txLaba = txs.reduce((sum, t) => {
        const isLabaEligible = t.transaksi === 'transfer' || t.transaksi === 'tarik';
        return sum + (isLabaEligible ? (t.laba || 0) : 0);
      }, 0);

      setStats({
        omset: productOmset,
        laba: productLaba + txLaba,
        piutangKasbon: totalKasbon
      });
    }
    loadQuickStats();
  }, []);

  return (
    <div className="pb-24 pt-3 px-3.5 max-w-md mx-auto space-y-4">
      {/* Brand Header Banner */}
      <div className="bg-[#09275F] text-white p-4 rounded-xl shadow-sm border border-[#1749B5]/40 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-blue-200 uppercase tracking-wider">Aplikasi Kasir & Pembukuan</span>
          <h2 className="text-2xl font-black tracking-tight">ALDEA K</h2>
          <p className="text-xs text-blue-100/80 mt-0.5">Versi Modern • Local-First Cloud POS</p>
        </div>
        <img
          src="/logo.webp"
          alt="Aldea Logo"
          className="w-14 h-14 object-contain rounded-xl drop-shadow-md bg-white/10 p-0.5 border border-white/20"
        />
      </div>

      {/* Ringkasan Kilat Hari Ini */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-[#E0E7F2] shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6F7C92]">
            <TrendingUp className="w-3.5 h-3.5 text-[#1749B5]" />
            <span>Estimasi Laba</span>
          </div>
          <div className="text-lg font-black text-[#09275F] mt-1 font-tabular">
            {Money.ribuan(stats.laba)}
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-[#E0E7F2] shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6F7C92]">
            <BookOpen className="w-3.5 h-3.5 text-rose-500" />
            <span>Piutang Kasbon</span>
          </div>
          <div className="text-lg font-black text-rose-600 mt-1 font-tabular">
            {Money.rupiah(stats.piutangKasbon)}
          </div>
        </div>
      </div>

      {/* SECTION: PRODUK */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-[#1749B5] tracking-wider uppercase px-1">
          Kategori Produk & Stok
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onNavigate('product-acc')}
            className="bg-white p-3 rounded-xl border border-[#E0E7F2] flex flex-col items-center justify-center gap-1.5 hover:border-[#1749B5] btn-press shadow-xs"
          >
            <div className="w-9 h-9 rounded-lg bg-[#EBF1FD] text-[#1749B5] flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#182338]">Acc</span>
          </button>

          <button
            onClick={() => onNavigate('product-atk')}
            className="bg-white p-3 rounded-xl border border-[#E0E7F2] flex flex-col items-center justify-center gap-1.5 hover:border-[#1749B5] btn-press shadow-xs"
          >
            <div className="w-9 h-9 rounded-lg bg-[#EBF1FD] text-[#1749B5] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#182338]">ATK</span>
          </button>

          <button
            onClick={() => onNavigate('product-voucher')}
            className="bg-white p-3 rounded-xl border border-[#E0E7F2] flex flex-col items-center justify-center gap-1.5 hover:border-[#1749B5] btn-press shadow-xs"
          >
            <div className="w-9 h-9 rounded-lg bg-[#EBF1FD] text-[#1749B5] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-[#182338] text-center leading-tight">Voucher & SP</span>
          </button>
        </div>
      </div>

      {/* SECTION: TRANSAKSI KEUANGAN */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-[#1749B5] tracking-wider uppercase px-1">
          Transaksi Perbankan & Dompet Digital
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate('tx-bank')}
            className="bg-white p-3 rounded-xl border border-[#E0E7F2] flex items-center justify-between hover:border-[#1749B5] btn-press shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#09275F] text-white flex items-center justify-center font-bold text-xs">
                BNK
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-[#182338]">Bank</div>
                <div className="text-[11px] text-[#6F7C92]">Tarik/Transfer</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6F7C92]" />
          </button>

          <button
            onClick={() => onNavigate('tx-dana')}
            className="bg-white p-3 rounded-xl border border-[#E0E7F2] flex items-center justify-between hover:border-[#1749B5] btn-press shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs">
                DAN
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-[#182338]">Dana</div>
                <div className="text-[11px] text-[#6F7C92]">Top up / Tarik</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6F7C92]" />
          </button>

          <button
            onClick={() => onNavigate('tx-ovo')}
            className="bg-white p-3 rounded-xl border border-[#E0E7F2] flex items-center justify-between hover:border-[#1749B5] btn-press shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center font-bold text-xs">
                OVO
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-[#182338]">Ovo</div>
                <div className="text-[11px] text-[#6F7C92]">Dompet Digital</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6F7C92]" />
          </button>

          <button
            onClick={() => onNavigate('tx-bca')}
            className="bg-white p-3 rounded-xl border border-[#E0E7F2] flex items-center justify-between hover:border-[#1749B5] btn-press shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-800 text-white flex items-center justify-center font-bold text-xs">
                BCA
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-[#182338]">BCA</div>
                <div className="text-[11px] text-[#6F7C92]">Setor / Bagi</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6F7C92]" />
          </button>

          <button
            onClick={() => onNavigate('pulsa')}
            className="bg-white p-3 rounded-xl border border-[#E0E7F2] flex items-center justify-between hover:border-[#1749B5] btn-press shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-[#182338]">Pulsa</div>
                <div className="text-[11px] text-[#6F7C92]">Isi & Pemakaian</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6F7C92]" />
          </button>

          <button
            onClick={() => onNavigate('qris')}
            className="bg-white p-3 rounded-xl border border-[#E0E7F2] flex items-center justify-between hover:border-[#1749B5] btn-press shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-[#182338]">QRIS</div>
                <div className="text-[11px] text-[#6F7C92]">Bayar & Tarik</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#6F7C92]" />
          </button>
        </div>
      </div>

      {/* SECTION: PENGELUARAN & CATATAN */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-[#1749B5] tracking-wider uppercase px-1">
          Pengeluaran & Catatan
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onNavigate('expense')}
            className="bg-white p-3 rounded-xl border border-[#E0E7F2] flex items-center gap-3 hover:border-rose-300 btn-press shadow-xs"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-[#182338]">Pengeluaran</div>
              <div className="text-[11px] text-[#6F7C92]">Admin & Toko</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('kasbon')}
            className="bg-white p-3 rounded-xl border border-[#E0E7F2] flex items-center gap-3 hover:border-amber-300 btn-press shadow-xs"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold text-[#182338]">Buku Kasbon</div>
              <div className="text-[11px] text-[#6F7C92]">Piutang Pelanggan</div>
            </div>
          </button>
        </div>
      </div>

      {/* TOMBOL TOTALAN / CLOSING UTAMA */}
      <button
        onClick={() => onNavigate('total')}
        className="w-full h-14 bg-[#09275F] hover:bg-[#1749B5] text-white font-extrabold text-base rounded-xl flex items-center justify-center gap-2.5 shadow-md btn-press border border-white/20"
      >
        <Calculator className="w-5 h-5 text-amber-400" />
        <span>TOTALKAN HARI INI / CLOSING</span>
      </button>
    </div>
  );
};
