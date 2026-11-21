import React, { useState } from 'react';
import { BANK_TARIFFS, DANA_OVO_TARIFFS } from '../../lib/tariffs';
import { Money } from '../../lib/money';
import { isSupabaseConfigured } from '../../lib/supabase';
import { changePassword } from '../../lib/auth';
import { ShieldCheck, Cloud, Database, Lock, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';

interface AdminScreenProps {
  onBack: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = () => {
  const [activeTab, setActiveTab] = useState<'tarif' | 'cloud' | 'security'>('tarif');

  // State Ubah Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passStatus, setPassStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassStatus(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPassStatus({ type: 'error', msg: 'Semua kolom password wajib diisi!' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassStatus({ type: 'error', msg: 'Konfirmasi password baru tidak cocok!' });
      return;
    }

    setPassLoading(true);
    try {
      const res = await changePassword(oldPassword, newPassword);
      if (res.success) {
        setPassStatus({ type: 'success', msg: res.message });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassStatus({ type: 'error', msg: res.message });
      }
    } catch (err) {
      setPassStatus({ type: 'error', msg: 'Gagal mengubah password: ' + err });
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto p-3.5 space-y-4">
      {/* Header */}
      <div className="bg-[#09275F] text-white p-4 rounded-xl flex items-center justify-between shadow-xs">
        <div>
          <h3 className="font-extrabold text-base">Panel Pengaturan Admin</h3>
          <p className="text-xs text-blue-200">Tarif, Cloud & Keamanan Akun</p>
        </div>
        <ShieldCheck className="w-7 h-7 text-amber-400" />
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1.5 bg-white p-1 rounded-xl border border-[#E0E7F2]">
        <button
          onClick={() => setActiveTab('tarif')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg btn-press ${
            activeTab === 'tarif' ? 'bg-[#1749B5] text-white' : 'text-[#6F7C92] hover:bg-slate-50'
          }`}
        >
          Tarif Fee
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg btn-press ${
            activeTab === 'security' ? 'bg-[#1749B5] text-white' : 'text-[#6F7C92] hover:bg-slate-50'
          }`}
        >
          Password
        </button>
        <button
          onClick={() => setActiveTab('cloud')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg btn-press ${
            activeTab === 'cloud' ? 'bg-[#1749B5] text-white' : 'text-[#6F7C92] hover:bg-slate-50'
          }`}
        >
          Supabase
        </button>
      </div>

      {/* TAB 1: TARIF */}
      {activeTab === 'tarif' && (
        <div className="space-y-3">
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
      )}

      {/* TAB 2: KEAMANAN / UBAH PASSWORD */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-[#E0E7F2] p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E0E7F2]">
            <Lock className="w-5 h-5 text-[#1749B5]" />
            <div>
              <h4 className="font-extrabold text-sm text-[#09275F]">Ubah Password Kasir</h4>
              <p className="text-xs text-[#6F7C92]">Ganti password default untuk melindungi pembukuan</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#182338] mb-1">
                Password Lama / Saat Ini:
              </label>
              <input
                type="password"
                placeholder="Masukkan password saat ini..."
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                className="w-full h-11 px-3 bg-[#F6F8FC] border border-[#E0E7F2] focus:border-[#1749B5] rounded-xl text-xs font-semibold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#182338] mb-1">
                Password Baru:
              </label>
              <input
                type="password"
                placeholder="Minimal 6 karakter..."
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full h-11 px-3 bg-[#F6F8FC] border border-[#E0E7F2] focus:border-[#1749B5] rounded-xl text-xs font-semibold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#182338] mb-1">
                Konfirmasi Password Baru:
              </label>
              <input
                type="password"
                placeholder="Ketik ulang password baru..."
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full h-11 px-3 bg-[#F6F8FC] border border-[#E0E7F2] focus:border-[#1749B5] rounded-xl text-xs font-semibold outline-none"
              />
            </div>

            {passStatus && (
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                passStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {passStatus.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{passStatus.msg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={passLoading}
              className="w-full h-11 bg-[#1749B5] hover:bg-[#09275F] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs btn-press"
            >
              <KeyRound className="w-4 h-4" />
              <span>{passLoading ? 'Menyimpan...' : 'Simpan Password Baru'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: CLOUD SUPABASE */}
      {activeTab === 'cloud' && (
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
