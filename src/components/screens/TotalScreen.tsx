import React, { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { Money } from '../../lib/money';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { notifyClosing } from '../../lib/telegram';

interface TotalScreenProps {
  onBack: () => void;
}

export const TotalScreen: React.FC<TotalScreenProps> = () => {
  const [omset, setOmset] = useState(0);
  const [labaKotor, setLabaKotor] = useState(0);
  const [labaBersih, setLabaBersih] = useState(0);
  const [totalPengeluaranAdmin, setTotalPengeluaranAdmin] = useState(0);
  const [closingDone, setClosingDone] = useState(false);

  useEffect(() => {
    calculateTotalan();
  }, []);

  async function calculateTotalan() {
    // 1. Laba & Omset Produk
    const products = await db.products.toArray();
    const productOmset = products.reduce((acc, p) => acc + (p.omset || 0), 0);
    const productLaba = products.reduce((acc, p) => acc + (p.laba || 0), 0);

    // 2. Transaksi Keuangan
    const txs = await db.transactions.toArray();
    let transfer = 0;
    let tarik = 0;
    let labaTx = 0;
    let setorBca = 0;

    for (const t of txs) {
      if (t.transaksi === 'transfer') transfer += t.nominal || 0;
      if (t.transaksi === 'tarik') tarik += t.nominal || 0;
      if (t.transaksi === 'setor') setorBca += t.nominal || 0;
      // Isi saldo, bagi saldo, dan setor tidak menghasilkan laba fee
      if (t.transaksi === 'transfer' || t.transaksi === 'tarik') {
        labaTx += t.laba || 0;
      }
    }
    const txOmset = transfer + labaTx - tarik - setorBca;

    // 3. Pengeluaran
    const expenses = await db.expenses.toArray();
    const adminExp = expenses
      .filter(e => e.jenis === 'ADMIN')
      .reduce((acc, e) => acc + e.jumlah, 0);

    const calculatedGross = productLaba + labaTx;
    const calculatedNet = calculatedGross - adminExp;
    const calculatedOmset = productOmset + txOmset - adminExp;

    setOmset(calculatedOmset);
    setLabaKotor(calculatedGross);
    setLabaBersih(calculatedNet);
    setTotalPengeluaranAdmin(adminExp);
  }

  const handleClosing = async () => {
    if (!confirm('Yakin ingin melakukan Closing / Tutup Buku hari ini?\nData aktif akan disimpan ke Riwayat Closing dan transaksi akan di-reset untuk hari baru.')) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const snapshot = {
      products: await db.products.toArray(),
      transactions: await db.transactions.toArray(),
      expenses: await db.expenses.toArray()
    };

    await db.closings.put({
      id: `closing-${today}`,
      tanggal: today,
      omset,
      labaKotor,
      labaBersih,
      cashDrawer: 0,
      timestamp: Date.now(),
      detail: snapshot
    });

    // Reset baris transaksi untuk esok hari
    const txs = await db.transactions.toArray();
    for (const t of txs) {
      await db.transactions.update(t.id, {
        nominal: 0,
        transaksi: '',
        laba: 0
      });
    }

    // Reset penjualan produk
    const products = await db.products.toArray();
    for (const p of products) {
      await db.products.update(p.id, {
        terjual: 0,
        omset: 0,
        laba: 0,
        awal: p.sisa,
        tambah: 0
      });
    }

    // Reset pengeluaran aktif
    await db.expenses.clear();

    notifyClosing({
      date: today,
      omset,
      grossProfit: labaKotor,
      netProfit: labaBersih
    });

    setClosingDone(true);
    await calculateTotalan();
    alert('Closing hari ini berhasil disimpan ke riwayat!');
  };

  return (
    <div className="pb-24 max-w-md mx-auto p-3.5 space-y-4">
      {/* 3 Metric Cards Besar */}
      <div className="space-y-2.5">
        <div className="bg-[#09275F] text-white p-4 rounded-xl border border-[#1749B5]/40 shadow-xs">
          <div className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Omset Keseluruhan</div>
          <div className="text-3xl font-black font-tabular mt-1 text-white">
            {Money.ribuan(omset)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white p-3.5 rounded-xl border border-[#E0E7F2] shadow-xs">
            <div className="text-[11px] font-bold text-[#6F7C92] uppercase">Laba Kotor</div>
            <div className="text-xl font-black font-tabular mt-1 text-[#09275F]">
              {Money.ribuan(labaKotor)}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-emerald-300 shadow-xs bg-emerald-50/30">
            <div className="text-[11px] font-bold text-emerald-800 uppercase">Laba Bersih</div>
            <div className="text-xl font-black font-tabular mt-1 text-emerald-700">
              {Money.ribuan(labaBersih)}
            </div>
          </div>
        </div>
      </div>

      {/* Rincian Potongan */}
      <div className="bg-white rounded-xl border border-[#E0E7F2] p-4 shadow-xs space-y-2 text-xs">
        <h4 className="font-extrabold text-[#182338] text-sm pb-1 border-b border-[#E0E7F2]">
          Kalkulasi Pengurang
        </h4>
        <div className="flex justify-between text-[#6F7C92]">
          <span>Pengeluaran Admin:</span>
          <span className="font-bold text-rose-600 font-tabular">-{Money.ribuan(totalPengeluaranAdmin)}</span>
        </div>
        <div className="flex justify-between text-[#6F7C92] pt-1 border-t border-slate-100 font-semibold">
          <span>Rumus:</span>
          <span>Laba Bersih = Laba Kotor - Pengeluaran</span>
        </div>
      </div>

      {/* Tombol Closing */}
      <div className="pt-2">
        <button
          onClick={handleClosing}
          disabled={closingDone}
          className={`w-full h-14 rounded-xl font-extrabold text-base flex items-center justify-center gap-2 shadow-md btn-press ${
            closingDone
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-[#1749B5] hover:bg-[#09275F] text-white border border-white/20'
          }`}
        >
          {closingDone ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Hari Ini Sudah Closing</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5 text-amber-300" />
              <span>CLOSING & TUTUP BUKU HARI INI</span>
            </>
          )}
        </button>
      </div>

      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Closing akan menyimpan rekap harian ke dalam database lalu me-reset baris transaksi untuk persiapan hari operasional berikutnya.
        </span>
      </div>
    </div>
  );
};
