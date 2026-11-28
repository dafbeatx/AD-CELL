import React, { useState, useEffect } from 'react';
import {
  getTariffs,
  saveTariffs,
  resetTariffsToDefault
} from '../../lib/tariffs';
import { Money } from '../../lib/money';
import { Tariff, TariffConfig } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';
import { changePassword } from '../../lib/auth';
import {
  ShieldCheck,
  Cloud,
  Database,
  Lock,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Send,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react';
import { getTelegramConfig, saveTelegramConfig, testTelegramConnection } from '../../lib/telegram';
import { ConfirmModal } from '../ConfirmModal';
import { ChannelManagerModal } from '../ChannelManagerModal';

interface AdminScreenProps {
  onBack: () => void;
}

export const AdminScreen: React.FC<AdminScreenProps> = () => {
  const [activeTab, setActiveTab] = useState<'tarif' | 'security' | 'telegram' | 'cloud'>('tarif');

  // State Pengaturan Tarif Admin
  const [tariffDraft, setTariffDraft] = useState<TariffConfig>(() => getTariffs());
  const [tariffStatus, setTariffStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [tariffSaving, setTariffSaving] = useState(false);
  const [isChannelManagerOpen, setIsChannelManagerOpen] = useState(false);

  // Confirm Dialog Reusable
  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    variant: 'primary' | 'danger';
    action: () => Promise<void>;
  } | null>(null);

  // State Ubah Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passStatus, setPassStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [passLoading, setPassLoading] = useState(false);

  // State Telegram Bot
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramStatus, setTelegramStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);

  useEffect(() => {
    const cfg = getTelegramConfig();
    setTelegramToken(cfg.botToken);
    setTelegramChatId(cfg.chatId);

    const handleConfigUpdate = () => setTariffDraft(getTariffs());
    window.addEventListener('aldea-config-updated', handleConfigUpdate);
    return () => window.removeEventListener('aldea-config-updated', handleConfigUpdate);
  }, []);

  const updateTariffRow = (
    group: 'bank' | 'dana',
    idx: number,
    field: keyof Tariff,
    rawVal: string
  ) => {
    const num = parseInt(rawVal.replace(/[^0-9]/g, ''), 10) || 0;
    setTariffDraft(prev => {
      const nextList = [...prev[group]];
      nextList[idx] = { ...nextList[idx], [field]: num };
      return { ...prev, [group]: nextList };
    });
    setTariffStatus(null);
  };

  const addTariffRow = (group: 'bank' | 'dana') => {
    setTariffDraft(prev => {
      const list = prev[group];
      const lastMax = list.length > 0 ? list[list.length - 1].maksimal : 0;
      const nextRow: Tariff = {
        minimal: lastMax + 1,
        maksimal: lastMax + 1000,
        admin: list.length > 0 ? list[list.length - 1].admin + 5 : 5
      };
      return { ...prev, [group]: [...list, nextRow] };
    });
    setTariffStatus(null);
  };

  const removeTariffRow = (group: 'bank' | 'dana', idx: number) => {
    setTariffDraft(prev => {
      if (prev[group].length <= 1) return prev;
      return {
        ...prev,
        [group]: prev[group].filter((_, i) => i !== idx)
      };
    });
    setTariffStatus(null);
  };

  const requestSaveTariffs = () => {
    setTariffStatus(null);
    setConfirmState({
      title: 'Konfirmasi Simpan Tarif Admin',
      message: 'Simpan perubahan tarif admin Bank & Dana?\nPerubahan akan langsung aktif untuk transaksi baru dan disinkronkan ke Supabase.',
      variant: 'primary',
      action: async () => {
        setTariffSaving(true);
        try {
          const res = await saveTariffs(tariffDraft);
          if (res.error && !res.cloudSaved && isSupabaseConfigured) {
            setTariffDraft(getTariffs());
            setTariffStatus({
              type: 'error',
              msg: `Tersimpan lokal, namun gagal sinkron cloud: ${res.error}`
            });
          } else if (res.error) {
            setTariffStatus({ type: 'error', msg: res.error });
          } else {
            setTariffDraft(getTariffs());
            setTariffStatus({
              type: 'success',
              msg: res.cloudSaved
                ? 'Tarif admin berhasil disimpan & disinkronkan ke Supabase!'
                : 'Tarif admin berhasil disimpan secara lokal.'
            });
          }
        } finally {
          setTariffSaving(false);
          setConfirmState(null);
        }
      }
    });
  };

  const requestResetTariffs = () => {
    setTariffStatus(null);
    setConfirmState({
      title: 'Konfirmasi Reset Tarif Bawaan',
      message: 'Kembalikan semua tarif admin Bank & Dana ke daftar bawaan pabrik?',
      variant: 'danger',
      action: async () => {
        setTariffSaving(true);
        try {
          const res = await resetTariffsToDefault();
          setTariffDraft(getTariffs());
          setTariffStatus({
            type: 'success',
            msg: res.cloudSaved
              ? 'Tarif dikembalikan ke bawaan & tersinkron ke Supabase.'
              : 'Tarif dikembalikan ke bawaan secara lokal.'
          });
        } finally {
          setTariffSaving(false);
          setConfirmState(null);
        }
      }
    });
  };

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

  const handleSaveAndTestTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setTelegramStatus(null);

    const token = telegramToken.trim();
    const cid = telegramChatId.trim();

    if (!token || !cid) {
      setTelegramStatus({ type: 'error', msg: 'Bot Token dan Chat ID wajib diisi.' });
      return;
    }

    setTelegramLoading(true);
    try {
      await saveTelegramConfig(token, cid);
      const testRes = await testTelegramConnection(token, cid);
      if (testRes.success) {
        setTelegramStatus({ type: 'success', msg: testRes.message });
      } else {
        setTelegramStatus({ type: 'error', msg: testRes.message });
      }
    } catch (err: any) {
      setTelegramStatus({ type: 'error', msg: 'Terjadi kesalahan: ' + (err?.message || err) });
    } finally {
      setTelegramLoading(false);
    }
  };

  const renderTariffEditor = (title: string, group: 'bank' | 'dana') => {
    const rows = tariffDraft[group];
    return (
      <div className="bg-white rounded-xl border border-[#E0E7F2] p-3 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-xs text-[#09275F] uppercase">{title}</h4>
            <p className="text-[10px] text-[#6F7C92]">Satuan ribuan (contoh: 500 = {Money.ribuan(500)})</p>
          </div>
          <button
            type="button"
            onClick={() => addTariffRow(group)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EBF1FD] text-[#1749B5] hover:bg-blue-100 text-[11px] font-bold btn-press"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>

        <div className="grid grid-cols-12 gap-1.5 text-[10px] font-bold text-[#6F7C92] uppercase px-1">
          <div className="col-span-4">Min (rb)</div>
          <div className="col-span-4">Maks (rb)</div>
          <div className="col-span-3">Admin (rb)</div>
          <div className="col-span-1"></div>
        </div>

        <div className="space-y-1.5 font-tabular">
          {rows.map((t, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-1.5 items-center">
              <input
                type="number"
                min={0}
                value={t.minimal}
                onChange={e => updateTariffRow(group, idx, 'minimal', e.target.value)}
                className="col-span-4 h-9 px-2 bg-[#F6F8FC] border border-[#E0E7F2] focus:ring-1 focus:ring-[#1749B5] rounded-lg text-xs font-bold text-[#09275F] outline-none"
              />
              <input
                type="number"
                min={0}
                value={t.maksimal}
                onChange={e => updateTariffRow(group, idx, 'maksimal', e.target.value)}
                className="col-span-4 h-9 px-2 bg-[#F6F8FC] border border-[#E0E7F2] focus:ring-1 focus:ring-[#1749B5] rounded-lg text-xs font-bold text-[#09275F] outline-none"
              />
              <input
                type="number"
                min={0}
                value={t.admin}
                onChange={e => updateTariffRow(group, idx, 'admin', e.target.value)}
                className="col-span-3 h-9 px-2 bg-blue-50/70 border border-blue-200 focus:ring-1 focus:ring-[#1749B5] rounded-lg text-xs font-black text-[#1749B5] outline-none"
              />
              <button
                type="button"
                disabled={rows.length <= 1}
                onClick={() => removeTariffRow(group, idx)}
                className="col-span-1 h-9 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 btn-press"
                title="Hapus baris"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const currentTgConfig = getTelegramConfig();

  return (
    <div className="pb-24 max-w-md mx-auto p-3.5 space-y-4">
      {/* Header */}
      <div className="bg-[#09275F] text-white p-4 rounded-xl flex items-center justify-between shadow-xs">
        <div>
          <h3 className="font-extrabold text-base">Panel Pengaturan Admin</h3>
          <p className="text-xs text-blue-200">Tarif, Modul Transaksi, Password & Cloud</p>
        </div>
        <ShieldCheck className="w-7 h-7 text-amber-400" />
      </div>

      {/* Tab Switcher */}
      <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-xl border border-[#E0E7F2]">
        <button
          onClick={() => setActiveTab('tarif')}
          className={`py-2 text-[11px] font-bold rounded-lg btn-press text-center ${
            activeTab === 'tarif' ? 'bg-[#1749B5] text-white' : 'text-[#6F7C92] hover:bg-slate-50'
          }`}
        >
          Tarif Fee
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-2 text-[11px] font-bold rounded-lg btn-press text-center ${
            activeTab === 'security' ? 'bg-[#1749B5] text-white' : 'text-[#6F7C92] hover:bg-slate-50'
          }`}
        >
          Password
        </button>
        <button
          onClick={() => setActiveTab('telegram')}
          className={`py-2 text-[11px] font-bold rounded-lg btn-press text-center relative ${
            activeTab === 'telegram' ? 'bg-[#1749B5] text-white' : 'text-[#6F7C92] hover:bg-slate-50'
          }`}
        >
          Telegram
          {currentTgConfig.isConfigured && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('cloud')}
          className={`py-2 text-[11px] font-bold rounded-lg btn-press text-center ${
            activeTab === 'cloud' ? 'bg-[#1749B5] text-white' : 'text-[#6F7C92] hover:bg-slate-50'
          }`}
        >
          Supabase
        </button>
      </div>

      {/* TAB 1: PENGATURAN TARIF & CHANNEL */}
      {activeTab === 'tarif' && (
        <div className="space-y-3">
          {/* Pintasan Kelola Modul Transaksi */}
          <button
            type="button"
            onClick={() => setIsChannelManagerOpen(true)}
            className="w-full p-3 bg-white border border-[#E0E7F2] hover:border-[#1749B5] rounded-xl shadow-xs flex items-center justify-between btn-press"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-9 h-9 rounded-lg bg-[#EBF1FD] text-[#1749B5] flex items-center justify-center">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-xs text-[#09275F]">Kelola Modul Transaksi</div>
                <div className="text-[11px] text-[#6F7C92]">Tambah channel, rename, & pilih tarif Bank/Dana</div>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-[#1749B5] text-white text-[10px] font-bold">Buka</span>
          </button>

          {renderTariffEditor('Tarif Admin Bank', 'bank')}
          {renderTariffEditor('Tarif Admin Dana', 'dana')}

          {tariffStatus && (
            <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              tariffStatus.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {tariffStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{tariffStatus.msg}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={requestResetTariffs}
              className="col-span-1 h-11 bg-white border border-[#E0E7F2] hover:bg-slate-50 text-[#6F7C92] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 btn-press"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={requestSaveTariffs}
              className="col-span-2 h-11 bg-[#1749B5] hover:bg-[#09275F] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs btn-press"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Tarif Admin</span>
            </button>
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
                className="w-full h-11 px-3 bg-[#F6F8FC] border border-[#E0E7F2] focus:ring-1 focus:ring-[#1749B5] rounded-xl text-xs font-semibold outline-none"
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
                className="w-full h-11 px-3 bg-[#F6F8FC] border border-[#E0E7F2] focus:ring-1 focus:ring-[#1749B5] rounded-xl text-xs font-semibold outline-none"
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
                className="w-full h-11 px-3 bg-[#F6F8FC] border border-[#E0E7F2] focus:ring-1 focus:ring-[#1749B5] rounded-xl text-xs font-semibold outline-none"
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

      {/* TAB 3: TELEGRAM BOT NOTIFIKASI */}
      {activeTab === 'telegram' && (
        <div className="bg-white rounded-xl border border-[#E0E7F2] p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E0E7F2]">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-sky-500" />
              <div>
                <h4 className="font-extrabold text-sm text-[#09275F]">Notifikasi Telegram</h4>
                <p className="text-[11px] text-[#6F7C92]">Laporan transaksi & error langsung ke Telegram</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
              currentTgConfig.isConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {currentTgConfig.isConfigured ? 'Tersambung' : 'Belum Terhubung'}
            </span>
          </div>

          <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-950 space-y-2 text-xs">
            <div className="font-bold text-[12px] flex items-center gap-1.5 text-sky-900">
              <span>💡 Panduan Telegram Bot Aldea POS</span>
            </div>
            <p className="text-[11px] leading-relaxed text-sky-800">
              Bot ini berfungsi sebagai <b>pengirim laporan otomatis (push notification)</b>. Saat kasir melakukan transaksi, penjualan produk, kasbon, closing, atau ada error sistem, pesan langsung masuk ke Telegram Anda.
            </p>
            <div className="p-2 bg-white/80 rounded-lg text-[11px] text-sky-900 border border-sky-100 space-y-1">
              <p className="font-bold text-sky-950">Kenapa pencet START di bot tidak ada balasan?</p>
              <p className="leading-snug">
                Tombol <b>START</b> di aplikasi Telegram hanya berfungsi untuk <b>memberi izin</b> kepada bot agar bot diperbolehkan mengirim pesan ke akun Anda (syarat resmi Telegram). Bot tidak membalas chat secara manual. Pesan akan terkirim saat Anda klik tombol tes di bawah atau saat transaksi kasir berjalan.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveAndTestTelegram} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#182338] mb-1">
                Telegram Bot Token:
              </label>
              <input
                type="text"
                placeholder="Contoh: 123456789:ABCdefGHIjklmnop..."
                value={telegramToken}
                onChange={e => setTelegramToken(e.target.value)}
                className="w-full h-11 px-3 bg-[#F6F8FC] border border-[#E0E7F2] focus:ring-1 focus:ring-[#1749B5] rounded-xl text-xs font-mono outline-none"
              />
              <p className="text-[10px] text-[#6F7C92] mt-0.5">Dibuat via @BotFather di Telegram</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#182338] mb-1">
                Chat ID Akun Telegram Anda:
              </label>
              <input
                type="text"
                placeholder="Contoh: 9086805999"
                value={telegramChatId}
                onChange={e => setTelegramChatId(e.target.value)}
                className="w-full h-11 px-3 bg-[#F6F8FC] border border-[#E0E7F2] focus:ring-1 focus:ring-[#1749B5] rounded-xl text-xs font-mono outline-none"
              />
              <p className="text-[10px] text-[#6F7C92] mt-0.5">Bisa dicek dengan mengirim pesan ke bot @userinfobot di Telegram</p>
            </div>

            {telegramStatus && (
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-2 ${
                telegramStatus.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {telegramStatus.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{telegramStatus.msg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={telegramLoading}
              className="w-full h-11 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs btn-press"
            >
              <Send className="w-4 h-4" />
              <span>{telegramLoading ? 'Menyimpan & Mengirim Tes...' : 'Simpan & Kirim Pesan Tes Sekarang'}</span>
            </button>
          </form>

          <div className="pt-2 border-t border-[#E0E7F2]">
            <p className="text-[11px] font-bold text-[#09275F] mb-1.5">Laporan Yang Otomatis Dikirim:</p>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-[#6F7C92]">
              <div className="bg-slate-50 p-2 rounded-lg border border-[#E0E7F2]">
                <span className="font-bold text-[#182338]">💳 Transaksi Keuangan</span>
                <p>Tarik & transfer di semua channel</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-[#E0E7F2]">
                <span className="font-bold text-[#182338]">📦 Penjualan Fisik</span>
                <p>Acc, ATK, Voucher & kartu paket</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-[#E0E7F2]">
                <span className="font-bold text-[#182338]">📖 Kasbon Pelanggan</span>
                <p>Catatan kasbon baru & pelunasan</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-[#E0E7F2]">
                <span className="font-bold text-[#182338]">🏁 Closing Harian</span>
                <p>Rekap omset & laba bersih harian</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CLOUD SUPABASE */}
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
            <div className="flex justify-between">
              <span className="text-[#6F7C92]">Notifikasi Telegram:</span>
              <span className={`font-bold ${currentTgConfig.isConfigured ? 'text-emerald-600' : 'text-slate-400'}`}>
                {currentTgConfig.isConfigured ? 'Aktif' : 'Belum Dikonfigurasi'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[#09275F] space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#1749B5]" />
              <span>Skema Database SQL</span>
            </div>
            <p className="text-[11px] text-blue-800/80">
              File <code className="font-semibold">supabase/schema.sql</code> sudah diperbarui agar mendukung channel tambahan secara fleksibel di cloud.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('telegram')}
            className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs rounded-lg btn-press flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Buka Pengaturan Telegram Bot</span>
          </button>
        </div>
      )}

      {/* Modal Kelola Channel Transaksi */}
      <ChannelManagerModal
        isOpen={isChannelManagerOpen}
        onClose={() => setIsChannelManagerOpen(false)}
      />

      {/* Modal Konfirmasi Tarif */}
      <ConfirmModal
        isOpen={Boolean(confirmState)}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        variant={confirmState?.variant || 'primary'}
        loading={tariffSaving}
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          confirmState?.action();
        }}
      />
    </div>
  );
};
