import React, { useState } from 'react';
import { Money } from '../../lib/money';
import { QrCode, ArrowDownRight } from 'lucide-react';

interface QrisScreenProps {
  onBack: () => void;
}

export const QrisScreen: React.FC<QrisScreenProps> = () => {
  const [tarikTunai, setTarikTunai] = useState<number>(0);
  const [adminTarik, setAdminTarik] = useState<number>(0);
  const [bayarQris, setBayarQris] = useState<number>(0);
  const [records, setRecords] = useState<{ id: string; tipe: string; nominal: number }[]>([]);

  const [inputNominal, setInputNominal] = useState('');
  const [inputAdmin, setInputAdmin] = useState('');

  const omsetQris = adminTarik - tarikTunai - bayarQris;

  const handleAddTarik = () => {
    const nom = parseInt(inputNominal || '0', 10);
    const adm = parseInt(inputAdmin || '0', 10);
    if (nom <= 0) return;

    setTarikTunai(prev => prev + nom);
    setAdminTarik(prev => prev + adm);
    setRecords(prev => [...prev, { id: `qris-${Date.now()}`, tipe: 'Tarik Tunai', nominal: nom }]);
    setInputNominal('');
    setInputAdmin('');
  };

  const handleAddBayar = () => {
    const nom = parseInt(inputNominal || '0', 10);
    if (nom <= 0) return;

    setBayarQris(prev => prev + nom);
    setRecords(prev => [...prev, { id: `qris-${Date.now()}`, tipe: 'Bayar Produk/Jasa', nominal: nom }]);
    setInputNominal('');
  };

  return (
    <div className="pb-24 max-w-md mx-auto p-3.5 space-y-3.5">
      {/* Metric Card QRIS */}
      <div className="bg-[#09275F] text-white p-4 rounded-xl border border-[#1749B5]/40 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Omset QRIS</span>
          <QrCode className="w-5 h-5 text-amber-400" />
        </div>
        <div className="text-3xl font-black font-tabular mt-1 text-white">
          {Money.ribuan(omsetQris)}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-blue-100 font-tabular">
          <span>Tarik: {Money.ribuan(tarikTunai)}</span>
          <span>Admin: {Money.ribuan(adminTarik)}</span>
          <span>Bayar: {Money.ribuan(bayarQris)}</span>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-xl border border-[#E0E7F2] p-3.5 shadow-xs space-y-3">
        <h4 className="font-extrabold text-sm text-[#09275F]">Input Transaksi QRIS</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-[#6F7C92]">Nominal QRIS (k):</label>
            <input
              type="number"
              placeholder="Contoh: 50"
              value={inputNominal}
              onChange={e => setInputNominal(e.target.value)}
              className="w-full mt-1 p-2 border border-[#E0E7F2] rounded-lg text-sm font-bold font-tabular"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#6F7C92]">Biaya Admin (k):</label>
            <input
              type="number"
              placeholder="Contoh: 3"
              value={inputAdmin}
              onChange={e => setInputAdmin(e.target.value)}
              className="w-full mt-1 p-2 border border-[#E0E7F2] rounded-lg text-sm font-bold font-tabular"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleAddTarik}
            className="py-2.5 bg-[#1749B5] text-white font-bold text-xs rounded-lg btn-press flex items-center justify-center gap-1 shadow-xs"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Tarik Tunai QRIS</span>
          </button>
          <button
            onClick={handleAddBayar}
            className="py-2.5 bg-slate-800 text-white font-bold text-xs rounded-lg btn-press flex items-center justify-center gap-1 shadow-xs"
          >
            <span>Bayar QRIS Toko</span>
          </button>
        </div>
      </div>

      {/* Records list */}
      {records.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E0E7F2] p-3 divide-y divide-[#E0E7F2]">
          <div className="text-xs font-bold text-[#6F7C92] pb-1.5 uppercase">Riwayat QRIS Hari Ini</div>
          {records.map((r, idx) => (
            <div key={r.id} className="py-2 flex justify-between text-xs font-tabular items-center">
              <span>#{idx + 1} {r.tipe}</span>
              <span className="font-extrabold text-[#09275F]">{Money.ribuan(r.nominal)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
