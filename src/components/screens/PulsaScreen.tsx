import React, { useState } from 'react';
import { Money } from '../../lib/money';
import { Plus, Smartphone } from 'lucide-react';

interface PulsaScreenProps {
  onBack: () => void;
}

export const PulsaScreen: React.FC<PulsaScreenProps> = () => {
  const [saldoAwal] = useState(500); // 500k
  const [isiList, setIsiList] = useState<{ id: string; nominal: number }[]>([]);
  const [pemakaianList, setPemakaianList] = useState<{ id: string; nominal: number; modal: number }[]>([]);
  const [inputIsi, setInputIsi] = useState('');
  const [inputJual, setInputJual] = useState('');
  const [inputModal, setInputModal] = useState('');

  const totalIsi = isiList.reduce((acc, i) => acc + i.nominal, 0);
  const totalPemakaian = pemakaianList.reduce((acc, p) => acc + p.modal, 0);
  const totalOmset = pemakaianList.reduce((acc, p) => acc + p.nominal, 0);
  const totalLaba = totalOmset - totalPemakaian;
  const saldoAkhir = saldoAwal + totalIsi - totalPemakaian;

  const handleAddIsi = () => {
    const val = parseInt(inputIsi || '0', 10);
    if (val <= 0) return;
    setIsiList(prev => [...prev, { id: `isi-${Date.now()}`, nominal: val }]);
    setInputIsi('');
  };

  const handleAddPemakaian = () => {
    const jual = parseInt(inputJual || '0', 10);
    const modal = parseInt(inputModal || '0', 10);
    if (jual <= 0 || modal <= 0) return;
    setPemakaianList(prev => [...prev, { id: `pakai-${Date.now()}`, nominal: jual, modal }]);
    setInputJual('');
    setInputModal('');
  };

  return (
    <div className="pb-24 max-w-md mx-auto p-3.5 space-y-3.5">
      {/* Metric Saldo Pulsa */}
      <div className="bg-[#09275F] text-white p-4 rounded-xl border border-[#1749B5]/40 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Sisa Saldo Pulsa</span>
          <Smartphone className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="text-3xl font-black font-tabular mt-1 text-emerald-400">
          {Money.ribuan(saldoAkhir)}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-blue-100 font-tabular">
          <span>Isi: {Money.ribuan(totalIsi)}</span>
          <span>Terpakai: {Money.ribuan(totalPemakaian)}</span>
          <span className="text-amber-300 font-bold">Laba: {Money.ribuan(totalLaba)}</span>
        </div>
      </div>

      {/* Card Input Tambah Isi Saldo */}
      <div className="bg-white rounded-xl border border-[#E0E7F2] p-3.5 shadow-xs space-y-2">
        <h4 className="font-extrabold text-sm text-[#09275F]">Isi Saldo Pulsa (Server)</h4>
        <p className="text-xs text-[#6F7C92]">Tambahkan saldo modal kapan saja (dalam ribuan, contoh: 500 = Rp500.000)</p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Nominal ribuan (contoh: 500)"
            value={inputIsi}
            onChange={e => setInputIsi(e.target.value)}
            className="flex-1 p-2.5 border border-[#E0E7F2] rounded-lg text-sm font-bold font-tabular outline-none focus:border-[#1749B5]"
          />
          <button
            onClick={handleAddIsi}
            className="px-4 bg-[#1749B5] text-white font-bold text-xs rounded-lg shadow-xs btn-press"
          >
            + Tambah
          </button>
        </div>
      </div>

      {/* Card Input Transaksi Pulsa ke Pelanggan */}
      <div className="bg-white rounded-xl border border-[#E0E7F2] p-3.5 shadow-xs space-y-2">
        <h4 className="font-extrabold text-sm text-[#09275F]">Catat Penjualan Pulsa / Paket</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-[#6F7C92]">Harga Jual (k):</label>
            <input
              type="number"
              placeholder="Contoh: 12"
              value={inputJual}
              onChange={e => setInputJual(e.target.value)}
              className="w-full mt-1 p-2 border border-[#E0E7F2] rounded-lg text-sm font-bold font-tabular"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#6F7C92]">Harga Modal (k):</label>
            <input
              type="number"
              placeholder="Contoh: 10"
              value={inputModal}
              onChange={e => setInputModal(e.target.value)}
              className="w-full mt-1 p-2 border border-[#E0E7F2] rounded-lg text-sm font-bold font-tabular"
            />
          </div>
        </div>
        <button
          onClick={handleAddPemakaian}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs btn-press flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Transaksi Pulsa</span>
        </button>
      </div>

      {/* Log Pemakaian */}
      {pemakaianList.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E0E7F2] p-3 divide-y divide-[#E0E7F2]">
          <div className="text-xs font-bold text-[#6F7C92] pb-1.5 uppercase">Riwayat Penjualan Hari Ini</div>
          {pemakaianList.map((p, idx) => (
            <div key={p.id} className="py-2 flex justify-between text-xs font-tabular items-center">
              <span>#{idx + 1} Pulsa Reguler</span>
              <div className="text-right">
                <span className="font-bold text-[#09275F]">{Money.ribuan(p.nominal)}</span>
                <span className="text-[10px] text-emerald-600 ml-2 font-bold">+{Money.ribuan(p.nominal - p.modal)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
