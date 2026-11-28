import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Dialog konfirmasi terstandar untuk aksi penting (tarif, channel, penghapusan) */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-[#E0E7F2] shadow-2xl overflow-hidden">
        <div className="p-4 flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDanger ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-[#1749B5]'
          }`}>
            {isDanger ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-[#09275F]">{title}</h4>
            <p className="text-xs text-[#6F7C92] leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>

        <div className="px-4 py-3 bg-[#F6F8FC] border-t border-[#E0E7F2] flex gap-2 justify-end">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-[#6F7C92] bg-white border border-[#E0E7F2] rounded-xl hover:bg-slate-50 btn-press"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-extrabold text-white rounded-xl shadow-xs btn-press ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-[#1749B5] hover:bg-[#09275F]'
            }`}
          >
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
