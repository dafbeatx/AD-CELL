import React, { useState } from 'react';
import { BANK_TARIFFS, DANA_OVO_TARIFFS } from '../../lib/tariffs';
import { Money } from '../../lib/money';
import { isSupabaseConfigured } from '../../lib/supabase';
import { ShieldCheck, Cloud, Database } from 'lucide-react';

interface AdminScreenProps {
  onBack: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = () => {
  const [activeTab, setActiveTab] = useState<'tarif' | 'cloud'>('tarif');

  return (
    <div className="pb-24 max-w-md mx-auto p-3.5 space-y-4">
      {/* Header */}
      <div className="bg-[#09275F] text-white p-4 rounded-xl flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base">Panel Pengaturan Admin</h3>
          <p className="text-xs text-blue-200">Konfigurasi Tarif & Database Cloud</p>
        </div>
        <ShieldCheck className="w-7 h-7 text-amber-400" />
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-[#E0E7F2]">
        <button
          onClick={() => setActiveTab('tarif')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg btn-press ${
            activeTab === 'tarif' ? 'bg-[#1749B5] text-white' : 'text-[#6F7C92] hover:bg-slate-50'
          }`}
        >
          Daftar Tarif Biaya Admin
        </button>
        <button
          onClick={() => setActiveTab('cloud')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg btn-press ${
            activeTab === 'cloud' ? 'bg-[#1749B5] text-white' : 'text-[#6F7C92] hover:bg-slate-50'
          }`}
        >
          Koneksi Supabase
        </button>
      </div>

      {activeTab === 'tarif' ? (
        <div className="space-y-3">
          {/* Tabel Tarif Bank */}
          <div className="bg-white rounded-xl border border-[#E0E7F2] p-3 shadow-xs">
            <h4 className="font-bold text-xs text-[#09275F] uppercase mb-2">Tarif Bank & BCA</h4>
            <div className="divide-y divide-[#E0E7F2] text-xs font-tabular">
              <div className="grid grid-cols-2 pb-1 font-bold text-[#6F7C92]">
                <span>Rentang Nominal</span>
                <span className="text-right">Biaya Admin</span>
              </div>
              {BANK_TARIFFS.map((t, idx) => (
                <div key={idx} className="grid grid-cols-2 py-1.5">
                  <span>{Money.ribuan(t.minimal)} - {Money.ribuan(t.maksimal)}</span>
                  <span className="text-right font-black text-[#1749B5]">{Money.ribuan(t.admin)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabel Tarif Dana / Ovo */}
          <div className="bg-white rounded-xl border border-[#E0E7F2] p-3 shadow-xs">
            <h4 className="font-bold text-xs text-[#09275F] uppercase mb-2">Tarif Dana & OVO</h4>
            <div className="divide-y divide-[#E0E7F2] text-xs font-tabular">
              <div className="grid grid-cols-2 pb-1 font-bold text-[#6F7C92]">
                <span>Rentang Nominal</span>
                <span className="text-right">Biaya Admin</span>
              </div>
              {DANA_OVO_TARIFFS.map((t, idx) => (
                <div key={idx} className="grid grid-cols-2 py-1.5">
                  <span>{Money.ribuan(t.minimal)} - {Money.ribuan(t.maksimal)}</span>
                  <span className="text-right font-black text-[#1749B5]">{Money.ribuan(t.admin)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Tab Cloud */
        <div className="bg-white rounded-xl border border-[#E0E7F2] p-4 shadow-xs space-y-3 text-xs">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-[#1749B5]" />
            <h4 className="font-extrabold text-sm text-[#09275F]">Status Sinkronisasi Cloud</h4>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-[#E0E7F2] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#6F7C92]">Supabase Connected:</span>
              <span className={`font-bold ${isSupabaseConfigured ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isSupabaseConfigured ? 'Tersambung (Online)' : 'Belum Dikonfigurasi (Mode Offline)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6F7C92]">Penyimpanan Lokal:</span>
              <span className="font-bold text-emerald-600">IndexedDB (Aktif 100%)</span>
            </div>
          </div>

          <div className="text-[#6F7C92] leading-relaxed">
            Untuk mengaktifkan sinkronisasi cloud multi-perangkat:
            masukkan <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">VITE_SUPABASE_URL</code> dan <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">VITE_SUPABASE_ANON_KEY</code> di pengaturan environment Vercel atau file <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">.env.local</code>.
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[#09275F] space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#1749B5]" />
              <span>Skema Database SQL</span>
            </div>
            <p className="text-[11px] text-blue-800/80">
              File <code className="font-semibold">supabase/schema.sql</code> sudah dibuat. Anda tinggal menyalin isinya dan menjalankan di SQL Editor pada dashboard Supabase Anda.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
