import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, KeyRound, AlertCircle, ShieldAlert, Cloud } from 'lucide-react';
import { verifyPassword, setAuthSession, isDefaultPassword, DEFAULT_PASSWORD, getStoredPasswordHash } from '../../lib/auth';
import { isSupabaseConfigured } from '../../lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDefault, setIsDefault] = useState<boolean>(true);
  const [authSource, setAuthSource] = useState<'cloud' | 'local'>('local');

  useEffect(() => {
    async function checkStatus() {
      const def = await isDefaultPassword();
      const stored = await getStoredPasswordHash();
      setIsDefault(def);
      setAuthSource(stored.source);
    }
    checkStatus();
  }, []);

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
        if (!isDefault && password === DEFAULT_PASSWORD) {
          setErrorMsg('Password default sudah tidak berlaku karena telah diubah secara global oleh Admin!');
        } else {
          setErrorMsg('Password salah! Periksa kembali huruf besar/kecil.');
        }
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
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="text-xs text-[#6F7C92] font-semibold">Kasir & Pembukuan</span>
              {isSupabaseConfigured && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Cloud className="w-3 h-3" />
                  <span>{authSource === 'cloud' ? 'Supabase Global' : 'Local'}</span>
                </span>
              )}
            </div>
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
                className="w-full h-12 pl-3.5 pr-11 bg-[#F6F8FC] border-2 border-[#E0E7F2] focus:ring-1 focus:ring-[#1749B5] rounded-xl text-sm font-semibold outline-none transition-colors"
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

        {/* Status Password Indicator */}
        {isDefault ? (
          <div className="p-3 bg-[#EBF1FD] rounded-xl border border-[#1749B5]/20 text-[11px] text-[#09275F] space-y-1">
            <div className="font-bold">🔑 Password Default Awal:</div>
            <div className="flex items-center justify-between font-mono bg-white px-2 py-1.5 rounded border border-[#E0E7F2] text-xs font-black text-[#1749B5]">
              <span>{DEFAULT_PASSWORD}</span>
              <button
                type="button"
                onClick={() => setPassword(DEFAULT_PASSWORD)}
                className="text-[10px] text-blue-600 font-sans font-bold hover:underline"
              >
                Gunakan
              </button>
            </div>
            <p className="text-[10px] text-[#6F7C92] pt-0.5">
              Admin dapat mengganti password ini secara global melalui menu Panel Admin.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Password kasir telah diubah oleh Admin secara Global. Password default sudah tidak berlaku.</span>
          </div>
        )}
      </div>
    </div>
  );
};
