import React, { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { Kasbon } from '../../types';
import { Money } from '../../lib/money';
import { Plus, CheckCircle, Clock, Trash2 } from 'lucide-react';

interface KasbonScreenProps {
  onBack: () => void;
}

export const KasbonScreen: React.FC<KasbonScreenProps> = () => {
  const [tab, setTab] = useState<'belum' | 'lunas'>('belum');
  const [entries, setEntries] = useState<Kasbon[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [amountRibuan, setAmountRibuan] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    loadKasbon();
  }, [tab]);

  async function loadKasbon() {
    const isPaid = tab === 'lunas';
    const list = await db.kasbon.where('lunas').equals(isPaid ? 1 : 0).reverse().sortBy('tanggalDibuat');
    setEntries(list);
  }

  // Hitung total piutang aktif
  const [totalUnpaid, setTotalUnpaid] = useState(0);
  const [countUnpaid, setCountUnpaid] = useState(0);

  useEffect(() => {
    async function calcTotal() {
      const unpaid = await db.kasbon.filter(k => !k.lunas).toArray();
      const sum = unpaid.reduce((acc, curr) => acc + curr.nominal, 0);
      setTotalUnpaid(sum);
      setCountUnpaid(unpaid.length);
    }
    calcTotal();
  }, [entries]);

  const handleMarkPaid = async (k: Kasbon) => {
    if (confirm(`Tandai kasbon ${k.nama} sebesar ${Money.rupiah(k.nominal)} LUNAS?`)) {
      await db.kasbon.update(k.id, {
        lunas: true,
        tanggalLunas: Date.now()
      });
      await loadKasbon();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus catatan kasbon ini?')) {
      await db.kasbon.delete(id);
      await loadKasbon();
    }
  };

  const handleAddKasbon = async () => {
    if (!name.trim()) return;
    const ribuan = parseInt(amountRibuan || '0', 10);
    if (ribuan <= 0) return;

    await db.kasbon.add({
      id: `kasbon-${Date.now()}`,
      nama: name.trim(),
      nominal: ribuan * 1000,
      keterangan: note.trim(),
      lunas: false,
      tanggalDibuat: Date.now()
    });

    setName('');
    setAmountRibuan('');
    setNote('');
    setIsAddOpen(false);
    await loadKasbon();
  };

  return (
    <div className="pb-24 max-w-md mx-auto">
      {/* Header Banner Total Piutang Aktif */}
      <div className="bg-[#09275F] text-white p-4">
        <div className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Total Piutang Belum Lunas</div>
        <div className="text-3xl font-black font-tabular mt-0.5 text-amber-300">
          {Money.rupiah(totalUnpaid)}
        </div>
        <div className="text-xs text-blue-100/80 mt-1 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{countUnpaid} catatan pelanggan belum lunas</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E0E7F2] p-2 flex gap-2">
        <button
          onClick={() => setTab('belum')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg btn-press ${
            tab === 'belum'
              ? 'bg-[#1749B5] text-white shadow-xs'
              : 'bg-slate-100 text-[#6F7C92] hover:bg-slate-200'
          }`}
        >
          Belum Lunas ({countUnpaid})
        </button>
        <button
          onClick={() => setTab('lunas')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg btn-press ${
            tab === 'lunas'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-[#6F7C92] hover:bg-slate-200'
          }`}
        >
          Riwayat Sudah Lunas
        </button>
      </div>

      {/* List */}
      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between pb-1">
          <h4 className="text-xs font-bold text-[#6F7C92] uppercase">
            {entries.length} Catatan
          </h4>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#1749B5] text-white text-xs font-bold rounded-lg shadow-xs btn-press"
          >
            <Plus className="w-4 h-4" />
            <span>+ Kasbon Baru</span>
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-[#E0E7F2] text-center text-[#6F7C92] text-xs font-medium">
            Tidak ada catatan kasbon {tab === 'belum' ? 'yang aktif' : 'lunas'}.
          </div>
        ) : (
          entries.map((k) => (
            <div
              key={k.id}
              className="bg-white p-3 rounded-xl border border-[#E0E7F2] shadow-xs flex items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-[#09275F]">{k.nama}</span>
                  <span className="text-[10px] text-[#6F7C92] font-tabular">
                    {new Date(k.tanggalDibuat).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <div className="text-base font-black text-rose-600 font-tabular mt-0.5">
                  {Money.rupiah(k.nominal)}
                </div>
                {k.keterangan && (
                  <div className="text-xs text-[#6F7C92] mt-0.5 italic">"{k.keterangan}"</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!k.lunas ? (
                  <button
                    onClick={() => handleMarkPaid(k)}
                    className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs btn-press"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Lunas</span>
                  </button>
                ) : (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                    Lunas
                  </span>
                )}
                <button
                  onClick={() => handleDelete(k.id)}
                  className="p-1.5 text-slate-300 hover:text-rose-500 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-4 space-y-3 shadow-2xl">
            <h3 className="font-extrabold text-base text-[#182338]">Tambah Catatan Kasbon</h3>
            <div>
              <label className="text-xs font-bold text-[#6F7C92]">Nama Peminjam / Pelanggan:</label>
              <input
                type="text"
                placeholder="Contoh: Pak Budi"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full mt-1 p-2.5 border border-[#E0E7F2] rounded-lg text-sm font-semibold outline-none focus:border-[#1749B5]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6F7C92]">Nominal dalam Ribuan (x 1.000):</label>
              <input
                type="number"
                placeholder="Contoh: 50 untuk Rp50.000"
                value={amountRibuan}
                onChange={e => setAmountRibuan(e.target.value)}
                className="w-full mt-1 p-2.5 border border-[#E0E7F2] rounded-lg text-base font-extrabold font-tabular outline-none focus:border-[#1749B5]"
              />
              {amountRibuan && (
                <div className="text-xs font-bold text-[#1749B5] mt-1">
                  = {Money.ribuan(parseInt(amountRibuan, 10) || 0)}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-[#6F7C92]">Catatan Tambahan (Opsional):</label>
              <input
                type="text"
                placeholder="Contoh: Ambil rokok & kopi"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full mt-1 p-2 border border-[#E0E7F2] rounded-lg text-xs"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsAddOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-[#6F7C92] bg-slate-100 rounded-lg btn-press"
              >
                Batal
              </button>
              <button
                onClick={handleAddKasbon}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#1749B5] rounded-lg btn-press"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
