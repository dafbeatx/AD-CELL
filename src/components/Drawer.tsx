import React from 'react';
import { X, Shield, Download, Upload, RefreshCw, Smartphone } from 'lucide-react';
import { db } from '../lib/db';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      const products = await db.products.toArray();
      const txs = await db.transactions.toArray();
      const expenses = await db.expenses.toArray();
      const kasbon = await db.kasbon.toArray();
      const closings = await db.closings.toArray();

      const backup = {
        exportedAt: new Date().toISOString(),
        version: "1.0-web",
        products,
        transactions: txs,
        expenses,
        kasbon,
        closings
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_aldea_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal mengekspor data: ' + err);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.products && Array.isArray(data.products)) {
            await db.products.clear();
            await db.products.bulkAdd(data.products);
          }
          if (data.transactions && Array.isArray(data.transactions)) {
            await db.transactions.clear();
            await db.transactions.bulkAdd(data.transactions);
          }
          if (data.expenses && Array.isArray(data.expenses)) {
            await db.expenses.clear();
            await db.expenses.bulkAdd(data.expenses);
          }
          if (data.kasbon && Array.isArray(data.kasbon)) {
            await db.kasbon.clear();
            await db.kasbon.bulkAdd(data.kasbon);
          }
          alert('Impor data berhasil dipulihkan!');
          window.location.reload();
        } catch (err) {
          alert('Format file cadangan tidak valid: ' + err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 transition-opacity" 
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-2xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 bg-[#09275F] text-white">
          <div>
            <h2 className="font-bold text-lg">Menu Aldea POS</h2>
            <p className="text-xs text-blue-200">Mobile-First Kasir & Keuangan</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 btn-press text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <div className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
          <button
            onClick={() => { onClose(); onNavigate('admin'); }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-left font-semibold text-[#182338] hover:bg-[#F6F8FC] border border-[#E0E7F2] btn-press"
          >
            <Shield className="w-5 h-5 text-[#1749B5]" />
            <div>
              <div className="text-sm">Panel Admin</div>
              <div className="text-xs text-[#6F7C92] font-normal">Pengaturan tarif & saldo</div>
            </div>
          </button>

          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-left font-semibold text-[#182338] hover:bg-[#F6F8FC] border border-[#E0E7F2] btn-press"
          >
            <Download className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="text-sm">Ekspor Cadangan Data</div>
              <div className="text-xs text-[#6F7C92] font-normal">Simpan file JSON lokal</div>
            </div>
          </button>

          <button
            onClick={handleImport}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-left font-semibold text-[#182338] hover:bg-[#F6F8FC] border border-[#E0E7F2] btn-press"
          >
            <Upload className="w-5 h-5 text-amber-600" />
            <div>
              <div className="text-sm">Impor Cadangan Data</div>
              <div className="text-xs text-[#6F7C92] font-normal">Pulihkan data dari file JSON</div>
            </div>
          </button>

          <button
            onClick={() => {
              if (confirm('Yakin ingin reset semua data aktif ke kondisi awal?')) {
                db.delete().then(() => window.location.reload());
              }
            }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-left font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 btn-press"
          >
            <RefreshCw className="w-5 h-5 text-rose-600" />
            <div>
              <div className="text-sm">Reset Data Pabrik</div>
              <div className="text-xs text-rose-500 font-normal">Kembalikan ke data bawaan</div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E0E7F2] bg-[#F6F8FC] text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[#6F7C92]">
            <Smartphone className="w-4 h-4" />
            <span>Aldea Mobile POS v1.0</span>
          </div>
          <p className="text-[11px] text-[#6F7C92] mt-0.5">Vercel • Supabase • GitHub</p>
        </div>
      </div>
    </div>
  );
};
