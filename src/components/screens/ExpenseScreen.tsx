import React, { useEffect, useState } from 'react';
import { db } from '../../lib/db';
import { Expense } from '../../types';
import { Money } from '../../lib/money';
import { Plus, Trash2, Receipt } from 'lucide-react';
import { notifyExpense } from '../../lib/telegram';

interface ExpenseScreenProps {
  onBack: () => void;
}

export const ExpenseScreen: React.FC<ExpenseScreenProps> = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [amountRibuan, setAmountRibuan] = useState('');
  const [note, setNote] = useState('');
  const [jenis, setJenis] = useState<'ADMIN' | 'OPERASIONAL'>('ADMIN');

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    const list = await db.expenses.orderBy('createdAt').reverse().toArray();
    setExpenses(list);
  }

  const totalExpense = expenses.reduce((sum, item) => sum + item.jumlah, 0);

  const handleAddExpense = async () => {
    if (!name.trim()) return;
    const amount = parseInt(amountRibuan || '0', 10);
    if (amount <= 0) return;

    await db.expenses.add({
      id: `exp-${Date.now()}`,
      nomor: expenses.length + 1,
      nama: name.trim(),
      jumlah: amount,
      keterangan: note.trim(),
      jenis,
      createdAt: Date.now()
    });

    setName('');
    setAmountRibuan('');
    setNote('');
    setIsAddOpen(false);

    notifyExpense({
      name: name.trim(),
      amount,
      type: jenis
    });

    await loadExpenses();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus catatan pengeluaran ini?')) {
      await db.expenses.delete(id);
      await loadExpenses();
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto">
      {/* Top Banner Total Pengeluaran */}
      <div className="bg-[#1749B5] text-white p-4 flex items-center justify-between shadow-sm">
        <div>
          <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Total Pengeluaran</span>
          <div className="text-2xl font-black font-tabular mt-0.5">
            {Money.ribuan(totalExpense)}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Receipt className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#6F7C92] uppercase">
            Daftar Pengeluaran ({expenses.length})
          </h4>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-[#1749B5] text-white text-xs font-bold rounded-lg shadow-xs btn-press"
          >
            <Plus className="w-4 h-4" />
            <span>+ Pengeluaran</span>
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-[#E0E7F2] text-center text-[#6F7C92] text-xs font-medium">
            Belum ada catatan pengeluaran hari ini.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E0E7F2] divide-y divide-[#E0E7F2] shadow-xs">
            {expenses.map((e, idx) => (
              <div key={e.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#6F7C92]">#{idx + 1}</span>
                    <span className="font-extrabold text-sm text-[#09275F]">{e.nama}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                      e.jenis === 'ADMIN' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {e.jenis}
                    </span>
                  </div>
                  {e.keterangan && (
                    <div className="text-xs text-[#6F7C92] mt-0.5">{e.keterangan}</div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-rose-600 font-tabular text-sm">
                    {Money.ribuan(e.jumlah)}
                  </span>
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="text-slate-300 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-4 space-y-3 shadow-2xl">
            <h3 className="font-extrabold text-base text-[#182338]">Tambah Pengeluaran</h3>
            <div>
              <label className="text-xs font-bold text-[#6F7C92]">Keperluan / Nama Pengeluaran:</label>
              <input
                type="text"
                placeholder="Contoh: Beli Kertas Struk / Token Listrik"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full mt-1 p-2.5 border border-[#E0E7F2] rounded-lg text-sm font-semibold outline-none focus:ring-1 focus:ring-[#1749B5]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6F7C92]">Jumlah dalam Ribuan (x 1.000):</label>
              <input
                type="number"
                placeholder="Contoh: 25 untuk Rp25.000"
                value={amountRibuan}
                onChange={e => setAmountRibuan(e.target.value)}
                className="w-full mt-1 p-2.5 border border-[#E0E7F2] rounded-lg text-base font-extrabold font-tabular outline-none focus:ring-1 focus:ring-[#1749B5]"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#6F7C92]">Kategori:</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setJenis('ADMIN')}
                  className={`py-2 text-xs font-bold rounded-lg border btn-press ${
                    jenis === 'ADMIN' ? 'bg-[#1749B5] text-white border-[#1749B5]' : 'bg-slate-50 text-[#182338] border-[#E0E7F2]'
                  }`}
                >
                  Admin Toko
                </button>
                <button
                  type="button"
                  onClick={() => setJenis('OPERASIONAL')}
                  className={`py-2 text-xs font-bold rounded-lg border btn-press ${
                    jenis === 'OPERASIONAL' ? 'bg-[#1749B5] text-white border-[#1749B5]' : 'bg-slate-50 text-[#182338] border-[#E0E7F2]'
                  }`}
                >
                  Operasional
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-[#6F7C92]">Keterangan (Opsional):</label>
              <input
                type="text"
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
                onClick={handleAddExpense}
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
