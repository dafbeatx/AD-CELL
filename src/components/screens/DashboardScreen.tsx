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
  CreditCard,
  SlidersHorizontal
} from 'lucide-react';
import { db } from '../../lib/db';
import { Money } from '../../lib/money';
import { getChannels } from '../../lib/channels';
import { TxChannelConfig } from '../../types';
import { ChannelManagerModal } from '../ChannelManagerModal';

interface DashboardScreenProps {
  onNavigate: (screen: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    omset: 0,
    laba: 0,
    piutangKasbon: 0
  });
  const [channels, setChannels] = useState<TxChannelConfig[]>(() => getChannels());
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  useEffect(() => {
    async function loadQuickStats() {
      const unpaid = await db.kasbon.filter(k => !k.lunas).toArray();
      const totalKasbon = unpaid.reduce((sum, item) => sum + item.nominal, 0);

      const products = await db.products.toArray();
      const productOmset = products.reduce((sum, p) => sum + p.omset, 0);
      const productLaba = products.reduce((sum, p) => sum + p.laba, 0);

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

    const handleConfigUpdate = () => setChannels(getChannels());
    window.addEventListener('aldea-config-updated', handleConfigUpdate);
    return () => window.removeEventListener('aldea-config-updated', handleConfigUpdate);
  }, []);

  const handleOpenChannel = (ch: TxChannelConfig) => {
    if (ch.kind === 'pulsa') {
      onNavigate('pulsa');
    } else if (ch.kind === 'qris') {
      onNavigate('qris');
    } else {
      onNavigate(`tx:${ch.id}`);
    }
  };

  const renderChannelBadge = (ch: TxChannelConfig) => {
    if (ch.kind === 'pulsa') {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <Smartphone className="w-4 h-4" />
        </div>
      );
    }
    if (ch.kind === 'qris') {
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
          <QrCode className="w-4 h-4" />
        </div>
      );
    }
    const shortCode = ch.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase() || 'TX';
    const bgClass = ch.tariffProfile === 'Dana' ? 'bg-sky-600' : 'bg-[#09275F]';
    return (
      <div className={`w-8 h-8 rounded-lg ${bgClass} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
        {shortCode}
      </div>
    );
  };

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

      {/* SECTION: TRANSAKSI KEUANGAN (DINAMIS) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <div className="text-[11px] font-bold text-[#1749B5] tracking-wider uppercase">
            Modul Transaksi
          </div>
          <button
            type="button"
            onClick={() => setIsManagerOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EBF1FD] text-[#1749B5] hover:bg-blue-100 text-[11px] font-extrabold btn-press"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Tambah / Rename</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => handleOpenChannel(ch)}
              className="bg-white p-3 rounded-xl border border-[#E0E7F2] flex items-center justify-between hover:border-[#1749B5] btn-press shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {renderChannelBadge(ch)}
                <div className="text-left min-w-0">
                  <div className="text-sm font-bold text-[#182338] truncate">{ch.name}</div>
                  <div className="text-[11px] text-[#6F7C92] truncate">
                    {ch.kind === 'ledger' ? `Admin ${ch.tariffProfile}` : ch.subtitle}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6F7C92] shrink-0" />
            </button>
          ))}
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

      {/* Modal Tambah / Rename / Hapus Channel */}
      <ChannelManagerModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
        onChanged={() => setChannels(getChannels())}
      />
    </div>
  );
};
