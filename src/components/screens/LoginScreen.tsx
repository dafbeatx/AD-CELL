import React, { useState } from 'react';
import { Lock, Eye, EyeOff, KeyRound, AlertCircle } from 'lucide-react';
import { verifyPassword, setAuthSession, DEFAULT_PASS_HINT } from '../../lib/auth';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Masukkan password terlebih dahulu');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const isValid = await verifyPassword(password);
      if (isValid) {
        setAuthSession();
        onLoginSuccess();
      } else {
        setErrorMsg('Password salah! Periksa kembali huruf besar/kecil.');
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan saat verifikasi: ' + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#E0E7F2] p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#09275F] text-white rounded-2xl mx-auto flex items-center justify-center shadow-md">
            <Lock className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#09275F] tracking-tight">ALDEA K POS</h2>
            <p className="text-xs text-[#6F7C92] font-semibold mt-0.5">Aplikasi Kasir & Pembukuan Operasional</p>
          </div>
        </div>

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-[#182338] mb-1.5">
              Password Masuk Kasir:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full h-12 pl-3.5 pr-11 bg-[#F6F8FC] border-2 border-[#E0E7F2] focus:border-[#1749B5] rounded-xl text-sm font-semibold outline-none transition-colors"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6F7C92] hover:text-[#182338] p-1"
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#1749B5] hover:bg-[#09275F] text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md btn-press"
          >
            <KeyRound className="w-4 h-4" />
            <span>{loading ? 'Memverifikasi...' : 'Buka Aplikasi Kasir'}</span>
          </button>
        </form>

        {/* Info Default Password */}
        <div className="p-3 bg-[#EBF1FD] rounded-xl border border-[#1749B5]/20 text-[11px] text-[#09275F] space-y-1">
          <div className="font-bold">🔑 Password Default Awal:</div>
          <div className="flex items-center justify-between font-mono bg-white px-2 py-1.5 rounded border border-[#E0E7F2] text-xs font-black text-[#1749B5]">
            <span>{DEFAULT_PASS_HINT}</span>
            <button
              type="button"
              onClick={() => setPassword(DEFAULT_PASS_HINT)}
              className="text-[10px] text-blue-600 font-sans font-bold hover:underline"
            >
              Gunakan
            </button>
          </div>
          <p className="text-[10px] text-[#6F7C92] pt-0.5">
            Admin dapat mengganti password ini kapan saja melalui menu Panel Admin.
          </p>
        </div>
      </div>
    </div>
  );
};
