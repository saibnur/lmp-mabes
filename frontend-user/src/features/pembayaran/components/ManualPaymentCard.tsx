'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, CheckCircle2, Upload, ArrowRight, Loader2,
  Building2, AlertCircle, Clock, ChevronRight
} from 'lucide-react';
import { paymentApi } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';
import Toast from '@/app/components/Toast';

interface Props {
  isRenewal?: boolean;
  onSuccess?: () => void;
}

const BASE_AMOUNT = 25000;
const BANK = {
  bank: 'BRI',
  accountNumber: '117701000384569',
  accountName: 'Perkumpulan Ormas Laskar Merah Putih',
};

// ─── Step 1: Halaman Instruksi Transfer ────────────────────────────────────────
function TransferInstructionStep({
  orderId,
  uniqueCode,
  grossAmount,
  copied,
  onCopy,
  onNext,
}: {
  orderId: string;
  uniqueCode: number;
  grossAmount: number;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
  onNext: () => void;
}) {
  const uniqueCodeStr = String(uniqueCode).padStart(3, '0');

  return (
    <motion.div
      key="transfer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4"
    >
      {/* Nominal Box */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-1">
          Total yang Harus Ditransfer
        </p>
        <p className="text-4xl font-extrabold text-red-600 tracking-tight">
          Rp {grossAmount.toLocaleString('id-ID')}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <button
            onClick={() => onCopy(String(grossAmount), 'amount')}
            className="flex items-center gap-1 text-xs text-red-600 font-semibold hover:text-red-700"
          >
            {copied === 'amount' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied === 'amount' ? 'Disalin!' : 'Salin nominal'}
          </button>
        </div>
      </div>

      {/* Kode Unik highlight */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="font-bold text-amber-800 mb-0.5">
            Kode Unik Anda: <span className="text-amber-600 font-extrabold text-base tracking-widest">{uniqueCodeStr}</span>
          </p>
          <p className="text-amber-700 text-xs leading-relaxed">
            Pastikan nominal transfer sesuai <strong>persis</strong> — termasuk 3 angka terakhir sebagai kode unik Anda (Rp 25.000 + {uniqueCode} = Rp {grossAmount.toLocaleString('id-ID')}).
          </p>
        </div>
      </div>

      {/* Rekening Tujuan */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Rekening Tujuan</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Bank</p>
            <p className="font-bold text-slate-900">{BANK.bank}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Atas Nama</p>
            <p className="text-sm font-semibold text-slate-700">{BANK.accountName}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Nomor Rekening</p>
            <p className="text-base font-bold text-slate-900 tracking-wider">{BANK.accountNumber}</p>
          </div>
          <button
            onClick={() => onCopy(BANK.accountNumber, 'norek')}
            className="flex items-center gap-1 text-xs text-red-600 font-semibold hover:text-red-700 shrink-0"
          >
            {copied === 'norek' ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied === 'norek' ? 'Disalin!' : 'Salin'}
          </button>
        </div>
      </div>

      {/* ID Order kecil */}
      <p className="text-[10px] text-slate-400 text-center">ID Order: {orderId}</p>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 font-bold text-base text-white transition hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-200"
      >
        Saya Sudah Transfer <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Step 2: Konfirmasi (upload bukti) ────────────────────────────────────────
function ConfirmStep({
  loading,
  buktiPreview,
  onFileChange,
  onSubmit,
}: {
  loading: boolean;
  buktiPreview: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}) {
  return (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-5"
    >
      <div className="text-center">
        <p className="font-bold text-slate-900 text-base">Konfirmasi Pembayaran</p>
        <p className="text-slate-500 text-sm mt-1">
          Upload foto bukti transfer Anda agar admin dapat memverifikasi lebih cepat (opsional namun disarankan).
        </p>
      </div>

      {/* Upload Bukti */}
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-2 block">
          Foto Bukti Transfer <span className="text-slate-400 font-normal">(opsional, maks 5 MB)</span>
        </label>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-red-400 transition bg-slate-50">
          {buktiPreview ? (
            <img src={buktiPreview} alt="bukti" className="h-28 w-full object-contain rounded-xl" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <Upload className="w-7 h-7" />
              <span className="text-xs font-medium">Klik untuk upload foto</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </label>
      </div>

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 font-bold text-base text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-60 shadow-lg shadow-red-200"
      >
        {loading
          ? <Loader2 className="w-5 h-5 animate-spin" />
          : <><ArrowRight className="w-5 h-5" /> Konfirmasi Pembayaran</>
        }
      </button>

      <p className="text-[11px] text-slate-400 text-center">
        Tanpa upload foto, admin tetap bisa verifikasi menggunakan kode unik Anda.
      </p>
    </motion.div>
  );
}

// ─── Step 3: Done ─────────────────────────────────────────────────────────────
function DoneStep({ grossAmount }: { grossAmount: number }) {
  return (
    <motion.div
      key="done"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-4 space-y-4"
    >
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
      </div>
      <div>
        <h3 className="font-bold text-slate-900 text-lg">Konfirmasi Terkirim!</h3>
        <p className="text-slate-500 text-sm mt-1">
          Pembayaran Anda sedang diverifikasi oleh admin LMP.
          Biasanya proses ini membutuhkan 1×24 jam.
        </p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left space-y-1.5">
        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Detail Konfirmasi</p>
        <p className="text-sm text-slate-700">
          <span className="text-slate-400">Total Nominal:</span>{' '}
          <strong className="text-red-600">Rp {grossAmount.toLocaleString('id-ID')}</strong>
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Akun Anda akan aktif otomatis setelah admin mengkonfirmasi.</span>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ManualPaymentCard({ isRenewal = false, onSuccess }: Props) {
  const [step, setStep] = useState<'loading' | 'transfer' | 'confirm' | 'done'>('loading');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [uniqueCode, setUniqueCode] = useState<number>(0);
  const [grossAmount, setGrossAmount] = useState<number>(BASE_AMOUNT);
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  const showToast = (message: string, type: 'success' | 'error' = 'success') =>
    setToast({ show: true, message, type });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file maksimal 5 MB.', 'error');
      return;
    }
    setBuktiFile(file);
    setBuktiPreview(URL.createObjectURL(file));
  };

  // Panggil API create-order saat user klik "Upgrade/Perpanjang"
  const handleStartPayment = async () => {
    setIsInitializing(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Belum login');
      const idToken = await user.getIdToken();
      const { data } = await paymentApi.createManualOrder(idToken);
      if (data.success) {
        setOrderId(data.orderId);
        setUniqueCode(data.uniqueCode ?? 0);
        setGrossAmount(data.amount);
        setStep('transfer');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Gagal membuat order. Coba lagi.', 'error');
      setStep('loading');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSubmitConfirmation = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('Belum login');
      const idToken = await user.getIdToken();

      // Upload bukti jika ada
      let buktiUrl: string | undefined;
      if (buktiFile) {
        const uploadRes = await paymentApi.uploadBukti(idToken, buktiFile);
        if (uploadRes.data?.success) {
          buktiUrl = uploadRes.data.url;
        }
      }

      const payload: Record<string, string> = {
        orderId,
        ...(buktiUrl ? { buktiUrl } : {}),
      };

      const { data } = await paymentApi.submitConfirmation(idToken, payload);
      if (data.success) {
        setStep('done');
        onSuccess?.();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Gagal mengirim konfirmasi. Coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-red-600 rounded-full -mr-10 -mt-10 opacity-90" />
      <div className="absolute top-0 right-0 w-14 h-14 bg-red-400 rounded-full -mr-3 -mt-3 opacity-40" />

      <div className="relative">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold mb-4">
          <Building2 className="w-3.5 h-3.5 text-red-400" />
          Transfer Bank Manual
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
          {isRenewal ? 'Perpanjang' : 'Upgrade'} Sekarang
        </h2>
        <p className="text-slate-500 text-sm mb-5">
          Transfer ke rekening BRI resmi LMP, lalu kirim konfirmasi.
        </p>

        {/* Step indicator */}
        {step !== 'loading' && step !== 'done' && (
          <div className="flex items-center gap-2 mb-5">
            <div className={`flex items-center gap-1.5 text-xs font-bold ${step === 'transfer' ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === 'transfer' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
              Instruksi
            </div>
            <div className="flex-1 h-px bg-slate-200" />
            <div className={`flex items-center gap-1.5 text-xs font-bold ${step === 'confirm' ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${step === 'confirm' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
              Konfirmasi
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── Initial CTA ── */}
          {step === 'loading' && (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="flex items-baseline gap-2 bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100">
                <span className="text-4xl font-extrabold text-slate-900">Rp 25.000</span>
                <span className="text-sm text-slate-400 font-semibold">/ 2 Tahun</span>
              </div>
              <p className="text-xs text-slate-500">
                Total transfer akan ditambahkan kode unik 3 digit agar mudah diverifikasi admin.
              </p>
              <button
                onClick={handleStartPayment}
                disabled={isInitializing}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 font-bold text-base text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-60 shadow-lg shadow-red-200"
              >
                {isInitializing
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <>{isRenewal ? 'Perpanjang' : 'Upgrade'} Sekarang <ArrowRight className="w-5 h-5" /></>
                }
              </button>
            </motion.div>
          )}

          {/* ── Instruksi Transfer ── */}
          {step === 'transfer' && orderId && (
            <TransferInstructionStep
              orderId={orderId}
              uniqueCode={uniqueCode}
              grossAmount={grossAmount}
              copied={copied}
              onCopy={copyToClipboard}
              onNext={() => setStep('confirm')}
            />
          )}

          {/* ── Konfirmasi ── */}
          {step === 'confirm' && (
            <ConfirmStep
              loading={loading}
              buktiPreview={buktiPreview}
              onFileChange={handleFileChange}
              onSubmit={handleSubmitConfirmation}
            />
          )}

          {/* ── Done ── */}
          {step === 'done' && <DoneStep grossAmount={grossAmount} />}
        </AnimatePresence>

        {step !== 'done' && step !== 'loading' && (
          <p className="mt-4 text-center text-[11px] text-slate-400">
            Transfer manual melalui rekening resmi <span className="font-bold text-slate-600">LMP</span>
          </p>
        )}
      </div>

      <Toast
        message={toast.message}
        visible={toast.show}
        onClose={() => setToast(t => ({ ...t, show: false }))}
      />
    </div>
  );
}
