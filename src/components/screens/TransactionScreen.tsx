import React, { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { TxRow, TxChannel, TxType } from '../../types';
import { Money } from '../../lib/money';
import { calculateAdminFee } from '../../lib/tariffs';
import { LedgerMath } from '../../lib/ledgerMath';
import { KeypadModal } from '../KeypadModal';
import { notifyTransaction } from '../../lib/telegram';
import { ScanText } from 'lucide-react';

interface TransactionScreenProps {
  channel: TxChannel;
  onBack?: () => void;
  onOpenOcr?: () => void;
  initialNominalRibuan?: number;
}

export const TransactionScreen: React.FC<TransactionScreenProps> = ({ 
  channel, 
  onOpenOcr,
  initialNominalRibuan 
}) => {
  const [rows, setRows] = useState<TxRow[]>([]);
  const [aldeaActual, setAldeaActual] = useState<number>(0);
  const [selectedRow, setSelectedRow] = useState<TxRow | null>(null);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [keypadTarget, setKeypadTarget] = useState<'aldea' | 'nominal'>('nominal');

  useEffect(() => {
    loadRows();
  }, [channel]);

  // Jika ada nominal dari hasil scan OCR, otomatis buka baris pertama yang kosong
  useEffect(() => {
    if (initialNominalRibuan && rows.length > 0) {
      const firstEmpty = rows.find(r => !r.nominal || r.nominal === 0);
      if (firstEmpty) {
        handleUpdateRow(firstEmpty, firstEmpty.transaksi || 'transfer', initialNominalRibuan);
      }
    }
  }, [initialNominalRibuan, rows]);

  async function loadRows() {
    const list = await db.transactions.where('channel').equals(channel).sortBy('baris');
    setRows(list);

    const aldeaMeta = await db.meta.get(`aldea_saldo_${channel.toLowerCase()}`);
    setAldeaActual(aldeaMeta?.value || 0);
  }

  // Hitung metric berjalan
  let runningSaldo = 0;
  let totalTransfer = 0;
  let totalTarik = 0;
  let totalLaba = 0;
  let totalSetorBca = 0;

  const rowsWithComputedSaldo = rows.map((r) => {
    const nom = r.nominal || 0;
    const laba = r.laba || 0;

    if (r.transaksi === 'isi') runningSaldo += nom;
    if (r.transaksi === 'tarik') {
      runningSaldo += nom;
      totalTarik += nom;
    }
    if (r.transaksi === 'transfer') {
      runningSaldo -= nom;
      totalTransfer += nom;
    }
    if (r.transaksi === 'bagi') runningSaldo -= nom;
    if (r.transaksi === 'setor') {
      runningSaldo += nom;
      totalSetorBca += nom;
    }
    totalLaba += laba;

    return { ...r, calculatedSaldo: runningSaldo };
  });

  const finalSaldo = runningSaldo;
  const calculatedOmset = LedgerMath.omset(totalTransfer, totalLaba, totalTarik, totalSetorBca);
  const selisih = aldeaActual > 0 ? aldeaActual - finalSaldo : 0;

  const handleUpdateRow = async (row: TxRow, type: TxType | '', nominalRibuan: number) => {
    const laba = type ? calculateAdminFee(channel, nominalRibuan) : 0;
    await db.transactions.update(row.id, {
      transaksi: type,
      nominal: nominalRibuan,
      laba: laba
    });
    await loadRows();

    if (type && nominalRibuan > 0) {
      notifyTransaction({
        channel,
        type,
        nominal: nominalRibuan,
        laba,
        saldo: finalSaldo,
        baris: row.baris
      });
    }
  };

  const handleSaveAldea = async (valRibuan: number) => {
    setAldeaActual(valRibuan);
    await db.meta.put({ key: `aldea_saldo_${channel.toLowerCase()}`, value: valRibuan });
  };

  const txOptions: { val: TxType; label: string }[] = [
    { val: 'bagi', label: 'Bagi Saldo' },
    { val: 'isi', label: 'Isi Saldo' },
    { val: 'transfer', label: 'Transfer' },
    { val: 'tarik', label: 'Tarik Tunai' },
    ...(channel === 'BCA' ? [{ val: 'setor' as TxType, label: 'Setor' }] : [])
  ];

  return (
    <div className="pb-24 max-w-md mx-auto">
      {/* 3 Metric Cards: Saldo, Omset, Selisih */}
      <div className="bg-[#1749B5] text-white px-3 py-2.5 grid grid-cols-3 gap-2 shadow-sm">
        <div className="bg-[#F8FAFF] text-[#1749B5] p-2 rounded-lg text-center border border-white/20">
          <div className="text-[10px] uppercase font-bold text-[#6F7C92]">Saldo</div>
          <div className="text-sm font-extrabold font-tabular truncate">{Money.ribuan(finalSaldo)}</div>
        </div>

        <div className="bg-[#F8FAFF] text-[#1749B5] p-2 rounded-lg text-center border border-white/20">
          <div className="text-[10px] uppercase font-bold text-[#6F7C92]">Omset</div>
          <div className="text-sm font-extrabold font-tabular truncate">{Money.ribuan(calculatedOmset)}</div>
        </div>

        <div className={`p-2 rounded-lg text-center border border-white/20 ${
          selisih < 0 ? 'bg-rose-100 text-rose-700' : 'bg-[#F8FAFF] text-[#1749B5]'
        }`}>
          <div className="text-[10px] uppercase font-bold text-[#6F7C92]">Selisih</div>
          <div className="text-sm font-extrabold font-tabular truncate">{Money.ribuan(selisih)}</div>
        </div>
      </div>

      {/* Saldo Aktual Fisik (Aldea) Bar */}
      <div className="bg-[#09275F] text-white px-3 py-2 flex items-center justify-between text-xs font-semibold">
        <span>Aldea Fisik: {Money.ribuan(aldeaActual)}</span>
        <button
          onClick={() => {
            setKeypadTarget('aldea');
            setIsKeypadOpen(true);
          }}
          className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded text-white btn-press border border-white/20"
        >
          Ubah Fisik
        </button>
      </div>

      {/* Tombol Pintasan Scan OCR */}
      {onOpenOcr && (
        <div className="px-3 pt-2.5">
          <button
            type="button"
            onClick={onOpenOcr}
            className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs btn-press"
          >
            <ScanText className="w-4 h-4" />
            <span>Scan Bukti Transfer (OCR)</span>
          </button>
        </div>
      )}

      {/* Table Header */}
      <div className="grid grid-cols-12 bg-white px-2 py-2.5 border-b border-[#E0E7F2] text-[11px] font-bold text-[#1749B5] text-center sticky top-14 z-10 shadow-2xs">
        <div className="col-span-1">No</div>
        <div className="col-span-4 text-right pr-2">Nominal</div>
        <div className="col-span-4">Transaksi</div>
        <div className="col-span-3 text-right pr-1">Laba</div>
      </div>

      {/* Rows List */}
      <div className="divide-y divide-[#E0E7F2] bg-white">
        {rowsWithComputedSaldo.map((row) => (
          <div
            key={row.id}
            onClick={() => setSelectedRow(row)}
            className={`grid grid-cols-12 px-2 py-2.5 text-xs font-tabular items-center cursor-pointer transition-colors ${
              row.nominal > 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/50 hover:bg-slate-100/50 text-[#6F7C92]'
            }`}
          >
            <div className="col-span-1 font-bold text-center text-[#6F7C92]">{row.baris}</div>
            <div className="col-span-4 text-right font-extrabold pr-2 text-[#09275F]">
              {row.nominal > 0 ? Money.ribuan(row.nominal) : '-'}
            </div>
            <div className="col-span-4 text-center">
              {row.transaksi ? (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
                  row.transaksi === 'tarik' ? 'bg-emerald-100 text-emerald-800' :
                  row.transaksi === 'transfer' ? 'bg-blue-100 text-blue-800' :
                  row.transaksi === 'bagi' ? 'bg-amber-100 text-amber-800' :
                  'bg-slate-200 text-slate-800'
                }`}>
                  {row.transaksi}
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Pilih</span>
              )}
            </div>
            <div className="col-span-3 text-right font-bold pr-1 text-emerald-700">
              {row.laba > 0 ? Money.ribuan(row.laba) : '-'}
            </div>
          </div>
        ))}
      </div>

      {/* Row Edit Modal / Bottom Sheet */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
          <div className="w-full max-w-md bg-white rounded-t-2xl p-4 flex flex-col gap-3 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0E7F2]">
              <h3 className="font-bold text-[#182338]">Baris #{selectedRow.baris} - {channel}</h3>
              <button onClick={() => setSelectedRow(null)} className="text-[#6F7C92] font-bold text-lg px-2">✕</button>
            </div>

            {/* Input Nominal Button */}
            <div 
              onClick={() => {
                setKeypadTarget('nominal');
                setIsKeypadOpen(true);
              }}
              className="p-3 bg-[#F6F8FC] border-2 border-[#1749B5] rounded-xl cursor-pointer text-center"
            >
              <div className="text-xs text-[#6F7C92] font-semibold">Nominal Transaksi:</div>
              <div className="text-2xl font-black text-[#09275F] font-tabular">
                {selectedRow.nominal > 0 ? Money.ribuan(selectedRow.nominal) : 'Ketuk untuk isi'}
              </div>
            </div>

            {/* Transaction Type Buttons */}
            <div>
              <div className="text-xs font-bold text-[#6F7C92] mb-1.5">Jenis Transaksi:</div>
              <div className="grid grid-cols-2 gap-2">
                {txOptions.map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => {
                      handleUpdateRow(selectedRow, opt.val, selectedRow.nominal);
                      setSelectedRow(prev => prev ? { ...prev, transaksi: opt.val } : null);
                    }}
                    className={`py-2.5 px-3 rounded-lg text-xs font-bold border btn-press ${
                      selectedRow.transaksi === opt.val
                        ? 'bg-[#1749B5] text-white border-[#1749B5]'
                        : 'bg-white text-[#182338] border-[#E0E7F2] hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset / Hapus Baris */}
            <div className="flex gap-2 pt-2 border-t border-[#E0E7F2]">
              <button
                onClick={() => {
                  handleUpdateRow(selectedRow, '', 0);
                  setSelectedRow(null);
                }}
                className="w-1/3 py-2.5 text-xs font-bold text-rose-600 bg-rose-50 rounded-lg border border-rose-200 btn-press"
              >
                Hapus
              </button>
              <button
                onClick={() => setSelectedRow(null)}
                className="w-2/3 py-2.5 text-xs font-bold text-white bg-[#09275F] rounded-lg btn-press shadow-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keypad Modal */}
      <KeypadModal
        isOpen={isKeypadOpen}
        title={keypadTarget === 'aldea' ? `Ubah Saldo Fisik ${channel}` : `Nominal Baris #${selectedRow?.baris}`}
        initialValue={keypadTarget === 'aldea' ? aldeaActual : (selectedRow?.nominal || 0)}
        onClose={() => setIsKeypadOpen(false)}
        onConfirm={(val) => {
          if (keypadTarget === 'aldea') {
            handleSaveAldea(val);
          } else if (selectedRow) {
            handleUpdateRow(selectedRow, selectedRow.transaksi, val);
            setSelectedRow(prev => prev ? { ...prev, nominal: val } : null);
          }
        }}
      />
    </div>
  );
};
