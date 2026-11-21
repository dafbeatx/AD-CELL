import React, { useState } from 'react';
import { Delete, Check } from 'lucide-react';
import { Money } from '../lib/money';

interface KeypadModalProps {
  isOpen: boolean;
  title: string;
  initialValue?: number;
  onClose: () => void;
  onConfirm: (valRibuan: number) => void;
}

export const KeypadModal: React.FC<KeypadModalProps> = ({
  isOpen,
  title,
  initialValue = 0,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  const [inputStr, setInputStr] = useState<string>(initialValue > 0 ? initialValue.toString() : '');

  const valNum = parseInt(inputStr || '0', 10);

  const handleDigit = (digit: string) => {
    if (inputStr.length >= 7) return; // prevent overflow
    setInputStr(prev => (prev === '0' ? digit : prev + digit));
  };

  const handleBackspace = () => {
    setInputStr(prev => prev.slice(0, -1));
  };

  const handleAddQuick = (amount: number) => {
    const current = parseInt(inputStr || '0', 10);
    setInputStr((current + amount).toString());
  };

  const handleConfirm = () => {
    onConfirm(valNum);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
      <div className="w-full max-w-md bg-white rounded-t-2xl shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-bottom duration-200">
        {/* Title & Preview */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E0E7F2]">
          <h3 className="font-bold text-[#182338] text-base">{title}</h3>
          <button 
            onClick={onClose}
            className="text-[#6F7C92] hover:text-[#182338] font-bold text-lg px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Display Angka */}
        <div className="bg-[#F6F8FC] border-2 border-[#1749B5] rounded-xl p-3 text-right">
          <div className="text-xs text-[#6F7C92] font-semibold">Nominal dalam Ribuan (x 1.000):</div>
          <div className="text-3xl font-extrabold text-[#09275F] font-tabular tracking-tight">
            {inputStr ? inputStr : '0'}
          </div>
          <div className="text-sm font-semibold text-[#1749B5] mt-1 font-tabular">
            = {Money.ribuan(valNum)}
          </div>
        </div>

        {/* Tombol Cepat Denominasi */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            onClick={() => handleAddQuick(5)}
            className="py-2 bg-[#EBF1FD] text-[#1749B5] font-bold text-xs rounded-lg border border-[#1749B5]/20 btn-press"
          >
            +5k
          </button>
          <button
            onClick={() => handleAddQuick(10)}
            className="py-2 bg-[#EBF1FD] text-[#1749B5] font-bold text-xs rounded-lg border border-[#1749B5]/20 btn-press"
          >
            +10k
          </button>
          <button
            onClick={() => handleAddQuick(50)}
            className="py-2 bg-[#EBF1FD] text-[#1749B5] font-bold text-xs rounded-lg border border-[#1749B5]/20 btn-press"
          >
            +50k
          </button>
          <button
            onClick={() => handleAddQuick(100)}
            className="py-2 bg-[#EBF1FD] text-[#1749B5] font-bold text-xs rounded-lg border border-[#1749B5]/20 btn-press"
          >
            +100k
          </button>
        </div>

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="h-13 bg-white hover:bg-slate-50 text-[#182338] font-bold text-xl rounded-xl border border-[#E0E7F2] shadow-sm btn-press flex items-center justify-center font-tabular"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => setInputStr('')}
            className="h-13 bg-slate-100 hover:bg-slate-200 text-[#6F7C92] font-bold text-sm rounded-xl border border-[#E0E7F2] btn-press flex items-center justify-center"
          >
            C
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-13 bg-white hover:bg-slate-50 text-[#182338] font-bold text-xl rounded-xl border border-[#E0E7F2] shadow-sm btn-press flex items-center justify-center font-tabular"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-13 bg-slate-100 hover:bg-slate-200 text-[#182338] font-bold rounded-xl border border-[#E0E7F2] btn-press flex items-center justify-center"
          >
            <Delete className="w-6 h-6 text-[#6F7C92]" />
          </button>
        </div>

        {/* Tombol Simpan */}
        <button
          onClick={handleConfirm}
          className="w-full h-12 bg-[#1749B5] hover:bg-[#09275F] text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-md btn-press"
        >
          <Check className="w-5 h-5" />
          <span>Terapkan Nilai</span>
        </button>
      </div>
    </div>
  );
};
