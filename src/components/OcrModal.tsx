import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Send, 
  Eye, 
  EyeOff,
  Sparkles
} from 'lucide-react';
import { recognizeReceipt, OcrParseResult } from '../lib/ocr';
import { Money } from '../lib/money';
import { notifyOcrReceipt } from '../lib/telegram';

interface OcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTransaction?: (data: {
    channel: 'BCA' | 'Bank' | 'Dana' | 'Ovo' | 'QRIS' | 'Lainnya';
    nominalRibuan: number;
    nominalRupiah: number;
    adminFee?: number;
    refNumber?: string;
  }) => void;
  onApplyExpense?: (data: {
    name: string;
    amountRibuan: number;
    amountRupiah: number;
  }) => void;
}

export const OcrModal: React.FC<OcrModalProps> = ({
  isOpen,
  onClose,
  onApplyTransaction,
  onApplyExpense
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; status: string }>({ percent: 0, status: '' });
  const [result, setResult] = useState<OcrParseResult | null>(null);
  const [customNominal, setCustomNominal] = useState<string>('');
  const [showRawText, setShowRawText] = useState(false);
  const [telegramSent, setTelegramSent] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessImage = async (file: File) => {
    // Tampilkan preview gambar
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setSelectedImage(dataUrl);
      setIsProcessing(true);
      setResult(null);
      setTelegramSent(false);

      try {
        const ocrRes = await recognizeReceipt(file, (pct, status) => {
          setProgress({ percent: pct, status });
        });
        setResult(ocrRes);
        setCustomNominal(ocrRes.amount ? ocrRes.amount.toString() : '');
      } catch (err: any) {
        alert('Gagal memindai struk: ' + (err?.message || err));
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessImage(e.target.files[0]);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setResult(null);
    setIsProcessing(false);
    setProgress({ percent: 0, status: '' });
    setCustomNominal('');
    setTelegramSent(false);
  };

  // Hitung nominal final (bisa diedit kasir jika OCR keliru)
  const finalRupiah = parseInt(customNominal.replace(/[^0-9]/g, ''), 10) || (result?.amount || 0);
  const finalRibuan = Math.round(finalRupiah / 1000);

  const handleSendToTelegram = () => {
    if (!result) return;
    notifyOcrReceipt({
      channel: result.channel,
      amountRupiah: finalRupiah,
      recipient: result.recipient,
      refNumber: result.refNumber,
      txType: result.txType
    });
    setTelegramSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#E0E7F2] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#09275F] text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight">Scan Struk & Bukti Transfer (OCR)</h3>
              <p className="text-[11px] text-blue-200">Deteksi otomatis nominal & bank dari struk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Hidden Inputs for Camera and Gallery */}
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* 1. STATE AWAL: PILIH GAMBAR */}
          {!selectedImage && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#B0C4DE] hover:border-[#1749B5] bg-[#F6F8FC] p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-[#1749B5] mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="font-extrabold text-xs text-[#09275F]">
                  Pilih Foto Struk / Screenshot Transfer
                </span>
                <span className="text-[11px] text-[#6F7C92] mt-0.5">
                  Mendukung bukti BCA, BRI, Mandiri, Dana, OVO, QRIS & Nota Belanja
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="h-11 bg-[#1749B5] hover:bg-[#09275F] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs btn-press"
                >
                  <Camera className="w-4 h-4" />
                  <span>Buka Kamera HP</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 bg-white border border-[#E0E7F2] hover:bg-slate-50 text-[#09275F] font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs btn-press"
                >
                  <Upload className="w-4 h-4 text-[#1749B5]" />
                  <span>Pilih dari Galeri</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. STATE PROSES SCANNING */}
          {selectedImage && isProcessing && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-[#E0E7F2] flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#1749B5] animate-spin" />
              <div>
                <h4 className="font-black text-sm text-[#09275F]">Menganalisis Struk...</h4>
                <p className="text-xs text-[#6F7C92] mt-0.5">{progress.status || 'Membaca teks...'}</p>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#1749B5] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-[#1749B5] font-tabular">
                {progress.percent}%
              </span>
            </div>
          )}

          {/* 3. STATE HASIL SCAN (OCR COMPLETED) */}
          {selectedImage && !isProcessing && result && (
            <div className="space-y-3">
              {/* Preview Gambar Thumbnail */}
              <div className="relative rounded-xl overflow-hidden border border-[#E0E7F2] max-h-36 bg-slate-900 flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Struk Preview"
                  className="w-full h-full object-contain max-h-36"
                />
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Scan Ulang</span>
                </button>
              </div>

              {/* Kartu Ringkasan Hasil OCR */}
              <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 text-[11px] font-extrabold rounded-full bg-[#1749B5] text-white">
                    {result.channel} • {result.txType}
                  </span>
                  <span className="text-[10px] font-semibold text-sky-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Akurasi {result.confidence}%</span>
                  </span>
                </div>

                {/* Input Nominal Terdeteksi (Bisa Diedit Kasir) */}
                <div>
                  <label className="block text-[11px] font-bold text-[#09275F] mb-1">
                    Nominal Terdeteksi (Rupiah):
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-black text-sm text-[#1749B5]">Rp</span>
                    <input
                      type="text"
                      value={customNominal}
                      onChange={(e) => setCustomNominal(e.target.value)}
                      placeholder="0"
                      className="w-full h-11 pl-10 pr-3 font-black text-lg text-[#09275F] bg-white border border-sky-200 focus:ring-2 focus:ring-[#1749B5] rounded-xl outline-none font-tabular"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[11px] text-[#6F7C92]">
                    <span>Format Sistem: <b>{finalRibuan}</b> (ribuan)</span>
                    <span>Tampilan: <b>{Money.rupiah(finalRupiah)}</b></span>
                  </div>
                </div>

                {/* Info Tambahan */}
                <div className="text-[11px] space-y-1 bg-white/70 p-2.5 rounded-lg border border-sky-100 font-medium text-[#182338]">
                  {result.recipient && (
                    <div className="flex justify-between">
                      <span className="text-[#6F7C92]">Penerima / Tujuan:</span>
                      <span className="font-bold truncate max-w-[180px]">{result.recipient}</span>
                    </div>
                  )}
                  {result.refNumber && (
                    <div className="flex justify-between">
                      <span className="text-[#6F7C92]">No. Referensi:</span>
                      <span className="font-mono font-bold text-xs">{result.refNumber}</span>
                    </div>
                  )}
                  {result.adminFee ? (
                    <div className="flex justify-between">
                      <span className="text-[#6F7C92]">Biaya Admin:</span>
                      <span className="font-bold text-emerald-600">{Money.rupiah(result.adminFee)}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Toggle Lihat Teks Asli OCR */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="text-[11px] text-[#1749B5] font-bold flex items-center gap-1 hover:underline"
                >
                  {showRawText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showRawText ? 'Sembunyikan Teks Mentah OCR' : 'Lihat Teks Mentah Hasil Scan'}</span>
                </button>
                {showRawText && (
                  <pre className="mt-1 p-2 bg-slate-100 text-[10px] font-mono rounded-lg max-h-24 overflow-y-auto text-[#182338] whitespace-pre-wrap border border-slate-200">
                    {result.rawText || '(Tidak ada teks terdeteksi)'}
                  </pre>
                )}
              </div>

              {/* Tombol Aksi Kasir */}
              <div className="space-y-2 pt-1">
                {/* 1. Tombol Terapkan ke Transaksi Keuangan */}
                <button
                  type="button"
                  onClick={() => {
                    if (onApplyTransaction) {
                      onApplyTransaction({
                        channel: result.channel === 'Pengeluaran' ? 'Lainnya' : result.channel,
                        nominalRibuan: finalRibuan,
                        nominalRupiah: finalRupiah,
                        adminFee: result.adminFee,
                        refNumber: result.refNumber
                      });
                    }
                    onClose();
                  }}
                  className="w-full h-11 bg-[#1749B5] hover:bg-[#09275F] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs btn-press"
                >
                  <span>Catat ke Transaksi {result.channel !== 'Pengeluaran' ? result.channel : 'Kasir'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* 2. Tombol Terapkan ke Pengeluaran Toko */}
                <button
                  type="button"
                  onClick={() => {
                    if (onApplyExpense) {
                      onApplyExpense({
                        name: result.recipient || `Struk ${result.channel}`,
                        amountRibuan: finalRibuan,
                        amountRupiah: finalRupiah
                      });
                    }
                    onClose();
                  }}
                  className="w-full h-10 bg-white border border-[#E0E7F2] hover:bg-slate-50 text-[#09275F] font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs btn-press"
                >
                  <FileText className="w-4 h-4 text-[#1749B5]" />
                  <span>Catat sebagai Pengeluaran Toko</span>
                </button>

                {/* 3. Tombol Kirim ke Telegram */}
                <button
                  type="button"
                  onClick={handleSendToTelegram}
                  disabled={telegramSent}
                  className={`w-full h-9 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                    telegramSent
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                  }`}
                >
                  {telegramSent ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Bukti Berhasil Dikirim ke Telegram!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Detail Struk ke Telegram</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
