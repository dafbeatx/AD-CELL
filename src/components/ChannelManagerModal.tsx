import React, { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { TariffProfile, TxChannelConfig } from '../types';
import {
  getChannels,
  addCustomChannel,
  updateChannel,
  deleteCustomChannel
} from '../lib/channels';
import { ConfirmModal } from './ConfirmModal';

interface ChannelManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

/** Modal untuk menambah, me-rename, memilih tarif Bank/Dana, dan menghapus channel transaksi */
export const ChannelManagerModal: React.FC<ChannelManagerModalProps> = ({
  isOpen,
  onClose,
  onChanged
}) => {
  const [channels, setChannels] = useState<TxChannelConfig[]>([]);
  const [newName, setNewName] = useState('');
  const [newTariff, setNewTariff] = useState<TariffProfile>('Bank');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTariff, setEditTariff] = useState<TariffProfile>('Bank');

  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    title: string;
    message: string;
    variant: 'primary' | 'danger';
    action: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setChannels(getChannels());
      setStatus(null);
      setEditingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const refresh = () => {
    setChannels(getChannels());
    onChanged?.();
  };

  const requestAddChannel = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const clean = newName.trim();
    if (!clean) {
      setStatus({ type: 'error', msg: 'Nama channel transaksi wajib diisi!' });
      return;
    }

    setConfirmState({
      title: 'Konfirmasi Tambah Channel',
      message: `Tambahkan modul transaksi "${clean}" dengan perhitungan biaya admin menggunakan Tarif ${newTariff}?`,
      variant: 'primary',
      action: async () => {
        setSaving(true);
        try {
          const res = await addCustomChannel(clean, newTariff);
          setNewName('');
          refresh();
          setStatus({
            type: 'success',
            msg: res.cloudSaved
              ? `Channel "${clean}" berhasil ditambahkan & tersinkron ke Supabase.`
              : `Channel "${clean}" berhasil ditambahkan secara lokal.${res.error ? ` (Cloud: ${res.error})` : ''}`
          });
        } catch (err: any) {
          setStatus({ type: 'error', msg: err?.message || 'Gagal menambah channel' });
        } finally {
          setSaving(false);
          setConfirmState(null);
        }
      }
    });
  };

  const startEdit = (ch: TxChannelConfig) => {
    setEditingId(ch.id);
    setEditName(ch.name);
    setEditTariff(ch.tariffProfile);
    setStatus(null);
  };

  const requestSaveEdit = (ch: TxChannelConfig) => {
    setStatus(null);
    const clean = editName.trim();
    if (!clean) {
      setStatus({ type: 'error', msg: 'Nama channel tidak boleh kosong!' });
      return;
    }

    const tariffInfo = ch.kind === 'ledger' ? ` (Tarif Admin: ${editTariff})` : '';
    setConfirmState({
      title: 'Konfirmasi Ubah Channel',
      message: `Simpan perubahan nama "${ch.name}" menjadi "${clean}"${tariffInfo}?`,
      variant: 'primary',
      action: async () => {
        setSaving(true);
        try {
          const res = await updateChannel(ch.id, {
            name: clean,
            tariffProfile: editTariff
          });
          setEditingId(null);
          refresh();
          setStatus({
            type: 'success',
            msg: res.cloudSaved
              ? `Channel "${clean}" berhasil diperbarui & tersinkron ke Supabase.`
              : `Channel "${clean}" berhasil diperbarui secara lokal.`
          });
        } catch (err: any) {
          setStatus({ type: 'error', msg: err?.message || 'Gagal menyimpan perubahan' });
        } finally {
          setSaving(false);
          setConfirmState(null);
        }
      }
    });
  };

  const requestDelete = (ch: TxChannelConfig) => {
    if (ch.isDefault) return;
    setStatus(null);

    setConfirmState({
      title: 'Konfirmasi Hapus Channel',
      message: `Yakin ingin menghapus channel "${ch.name}"?\nSeluruh baris transaksi di channel ini juga akan dihapus permanen.`,
      variant: 'danger',
      action: async () => {
        setSaving(true);
        try {
          const res = await deleteCustomChannel(ch.id);
          if (res.deleted) {
            refresh();
            setStatus({
              type: 'success',
              msg: `Channel "${ch.name}" berhasil dihapus.`
            });
          } else {
            setStatus({ type: 'error', msg: res.error || 'Gagal menghapus channel.' });
          }
        } finally {
          setSaving(false);
          setConfirmState(null);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#09275F] text-white px-4 py-3.5 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm">Kelola Modul Transaksi</h3>
            <p className="text-[11px] text-blue-200">
              Tambah channel baru, rename, & pilih tarif Bank/Dana
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {status && (
            <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              status.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{status.msg}</span>
            </div>
          )}

          {/* Form Tambah Channel Baru */}
          <form onSubmit={requestAddChannel} className="bg-[#F6F8FC] border border-[#E0E7F2] rounded-xl p-3.5 space-y-3">
            <div className="text-xs font-extrabold text-[#09275F] flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-[#1749B5]" />
              <span>Tambah Channel Transaksi Baru</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#182338] mb-1">
                Nama Channel (misal: BCA, OVO, SeaBank, BRI):
              </label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Masukkan nama modul transaksi..."
                className="w-full h-10 px-3 bg-white border border-[#E0E7F2] focus:ring-1 focus:ring-[#1749B5] rounded-xl text-xs font-semibold outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#182338] mb-1">
                Pilihan Tarif Admin:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Bank', 'Dana'] as TariffProfile[]).map(prof => (
                  <button
                    key={prof}
                    type="button"
                    onClick={() => setNewTariff(prof)}
                    className={`h-9 rounded-lg text-xs font-bold border btn-press ${
                      newTariff === prof
                        ? 'bg-[#1749B5] text-white border-[#1749B5]'
                        : 'bg-white text-[#182338] border-[#E0E7F2]'
                    }`}
                  >
                    Pakai Tarif {prof}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-10 bg-[#1749B5] hover:bg-[#09275F] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs btn-press"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Channel (Kolom Sama)</span>
            </button>
          </form>

          {/* Daftar Channel Saat Ini */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-[#6F7C92] uppercase tracking-wider">
              Daftar Channel Aktif ({channels.length})
            </div>

            <div className="space-y-2">
              {channels.map(ch => {
                const isEditing = editingId === ch.id;
                return (
                  <div
                    key={ch.id}
                    className="bg-white border border-[#E0E7F2] rounded-xl p-3 shadow-2xs space-y-2"
                  >
                    {isEditing ? (
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-[#6F7C92] mb-1">
                            Rename Channel:
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            className="w-full h-9 px-3 bg-[#F6F8FC] border border-[#1749B5] rounded-lg text-xs font-bold outline-none"
                          />
                        </div>

                        {ch.kind === 'ledger' && (
                          <div>
                            <label className="block text-[11px] font-bold text-[#6F7C92] mb-1">
                              Pakai Tarif Admin:
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {(['Bank', 'Dana'] as TariffProfile[]).map(prof => (
                                <button
                                  key={prof}
                                  type="button"
                                  onClick={() => setEditTariff(prof)}
                                  className={`py-1.5 rounded-lg text-xs font-bold border ${
                                    editTariff === prof
                                      ? 'bg-[#1749B5] text-white border-[#1749B5]'
                                      : 'bg-slate-50 text-[#182338] border-[#E0E7F2]'
                                  }`}
                                >
                                  Tarif {prof}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-xs font-bold text-[#6F7C92] bg-slate-100 rounded-lg btn-press"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => requestSaveEdit(ch)}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-[#1749B5] rounded-lg btn-press"
                          >
                            Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-[#09275F]">{ch.name}</span>
                            {ch.isDefault ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 text-[#1749B5] text-[10px] font-bold border border-blue-200">
                                <Lock className="w-2.5 h-2.5" />
                                Bawaan
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                Tambahan
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#6F7C92] mt-0.5">
                            {ch.kind === 'ledger'
                              ? `Kolom standar • Admin Tarif ${ch.tariffProfile}`
                              : `Modul khusus • ${ch.subtitle}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => startEdit(ch)}
                            className="p-2 rounded-lg bg-[#F6F8FC] hover:bg-blue-50 text-[#1749B5] border border-[#E0E7F2] btn-press"
                            title="Rename / Ubah"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {!ch.isDefault && (
                            <button
                              type="button"
                              onClick={() => requestDelete(ch)}
                              className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 btn-press"
                              title="Hapus Channel"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(confirmState)}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        variant={confirmState?.variant || 'primary'}
        loading={saving}
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          confirmState?.action();
        }}
      />
    </div>
  );
};
