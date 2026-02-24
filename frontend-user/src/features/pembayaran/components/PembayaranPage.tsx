'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2, X, ArrowRight, ShieldCheck, Scale, Network,
  GraduationCap, Shirt, TrendingUp, LayoutGrid, Loader2,
  Calendar, CreditCard, Minus, BadgeCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { paymentApi } from '@/lib/api';
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase';
import Toast from '@/app/components/Toast';
import { doc, onSnapshot } from 'firebase/firestore';

declare global {
  interface Window { snap: any; }
}

const features = [
  { name: 'Akses Informasi Publik', non: true, member: true, icon: LayoutGrid },
  { name: 'Legalitas & KTA Resmi', non: false, member: true, icon: ShieldCheck, desc: 'Terdata di Mabes LMP' },
  { name: 'Bantuan Hukum & Advokasi', non: 'Umum', member: 'Prioritas LBH-LMP', icon: Scale },
  { name: 'Jejaring Nasional', non: 'Terbatas', member: '38 Provinsi', icon: Network },
  { name: 'Pendidikan & Pelatihan', non: false, member: 'Diklat Kader', icon: GraduationCap },
  { name: 'Hak Atribut', non: false, member: 'Seragam Resmi', icon: Shirt },
  { name: 'Kesempatan Pengurus', non: false, member: 'Sesuai Jenjang', icon: ShieldCheck },
  { name: 'Program Ekonomi', non: false, member: 'Investasi & UMKM', icon: TrendingUp },
];

export default function PembayaranPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [isSnapReady, setIsSnapReady] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();
    let unsubSnap: (() => void) | undefined;

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const ref = doc(db, 'users', user.uid);
        unsubSnap = onSnapshot(ref, (snap) => {
          if (snap.exists()) setMembershipStatus(snap.data().membershipStatus || 'pending');
          setPageLoading(false);
        }, () => setPageLoading(false));
      } else {
        router.push('/login');
      }
    });

    const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js';
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
    if (!document.querySelector(`script[src="${snapUrl}"]`)) {
      const s = document.createElement('script');
      s.src = snapUrl;
      s.setAttribute('data-client-key', clientKey);
      s.async = true;
      s.onload = () => setIsSnapReady(true);
      document.body.appendChild(s);
    } else {
      setIsSnapReady(true);
    }

    return () => { unsubAuth(); unsubSnap?.(); };
  }, [router]);

  const updateStatusManual = async () => {
    try {
      const auth = getFirebaseAuth();
      const db = getFirestoreDb();
      if (!auth.currentUser) return;
      const expiry = new Date();
      expiry.setFullYear(expiry.getFullYear() + 2);
      const { updateDoc, Timestamp } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        membershipStatus: 'active',
        membershipExpiry: Timestamp.fromDate(expiry),
        updatedAt: Timestamp.now(),
      });
      setToast({ show: true, message: 'Status diperbarui (Dev Mode)', type: 'success' });
    } catch (err) { console.error(err); }
  };

  const handleUpgrade = async () => {
    if (!isSnapReady) {
      setToast({ show: true, message: 'Menyiapkan sistem pembayaran...', type: 'success' });
      return;
    }
    setLoading(true);
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) return;
      const idToken = await user.getIdToken();
      const { data } = await paymentApi.createTransaction(idToken);
      if (data.success && data.token) {
        window.snap.pay(data.token, {
          onSuccess: async () => {
            if (process.env.NODE_ENV === 'development') await updateStatusManual();
            else setToast({ show: true, message: 'Pembayaran berhasil! Mohon tunggu sinkronisasi...', type: 'success' });
          },
          onPending: () => setToast({ show: true, message: 'Menunggu konfirmasi pembayaran...', type: 'success' }),
          onError: () => setToast({ show: true, message: 'Pembayaran gagal. Coba lagi.', type: 'error' }),
          onClose: () => setToast({ show: true, message: 'Pembayaran dibatalkan.', type: 'error' }),
        });
      }
    } catch (err: any) {
      setToast({ show: true, message: err.response?.data?.message || 'Gagal membuat transaksi.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const isRenewal = membershipStatus === 'expired';

  if (pageLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  // If status is active, show redirecting state instead of history layout
  if (membershipStatus === 'active') {
    return (
      <div className="flex flex-col min-h-[60vh] items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-red-600" />
        <p className="text-slate-600 font-medium">Sinkronisasi selesai. Mengalihkan...</p>
        <Toast message={toast.message} visible={toast.show} onClose={() => setToast(t => ({ ...t, show: false }))} />
      </div>
    );
  }

  /* ── Form Pembayaran (pending / expired) ── */
  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Subtle red gradient top */}
      <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-red-500 to-rose-600" />

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 md:mb-14">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
            {isRenewal ? 'Perpanjang Keanggotaan' : 'Kenapa Harus Jadi Member?'}
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-xl">
            {isRenewal
              ? 'Masa aktif Anda telah habis. Perpanjang sekarang untuk tetap menikmati seluruh fasilitas.'
              : 'Dapatkan akses penuh ke seluruh fasilitas dan jadilah bagian resmi perjuangan LMP.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* ── Comparison Table ── */}
          <div className="lg:col-span-2 space-y-3">
            {/* Desktop header */}
            <div className="hidden md:grid grid-cols-[1fr_auto_auto] gap-4 px-5 pb-4 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <div>Fasilitas</div>
              <div className="w-28 text-center">Non-Member</div>
              <div className="w-28 text-center text-red-600">Member Resmi</div>
            </div>

            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 group"
              >
                {/* Mobile layout */}
                <div className="md:hidden">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-red-500 shrink-0">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{f.name}</p>
                      {f.desc && <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wide">{f.desc}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-slate-50 rounded-xl p-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Non-Member</p>
                      {typeof f.non === 'boolean' ? (
                        f.non
                          ? <CheckCircle2 className="w-5 h-5 text-slate-600 mx-auto" />
                          : <X className="w-5 h-5 text-slate-300 mx-auto" />
                      ) : (
                        <span className="text-xs font-semibold text-slate-500">{f.non}</span>
                      )}
                    </div>
                    <div className="bg-red-50 rounded-xl p-2 border border-red-100">
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1.5">Member</p>
                      {typeof f.member === 'boolean' ? (
                        f.member
                          ? <CheckCircle2 className="w-5 h-5 text-red-600 mx-auto" />
                          : <Minus className="w-5 h-5 text-slate-200 mx-auto" />
                      ) : (
                        <span className="text-xs font-semibold text-red-600">{f.member}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden md:grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-red-500 shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{f.name}</p>
                      {f.desc && <p className="text-[10px] text-slate-400 uppercase tracking-wide">{f.desc}</p>}
                    </div>
                  </div>
                  <div className="w-28 flex justify-center">
                    {typeof f.non === 'boolean' ? (
                      f.non
                        ? <CheckCircle2 className="w-5 h-5 text-slate-500" />
                        : <X className="w-5 h-5 text-slate-200" />
                    ) : (
                      <span className="text-xs font-semibold text-slate-500">{f.non}</span>
                    )}
                  </div>
                  <div className="w-28 flex justify-center">
                    {typeof f.member === 'boolean' ? (
                      f.member
                        ? <CheckCircle2 className="w-5 h-5 text-red-600" />
                        : <Minus className="w-5 h-5 text-slate-200" />
                    ) : (
                      <span className="text-xs font-semibold text-red-600">{f.member}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Payment Card ── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:sticky lg:top-24"
          >
            <div className="bg-white border-2 border-slate-900 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
              {/* Decorative circle */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-600 rounded-full -mr-10 -mt-10 opacity-90" />
              <div className="absolute top-0 right-0 w-14 h-14 bg-red-400 rounded-full -mr-3 -mt-3 opacity-40" />

              <div className="relative">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold mb-6">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                  Kader Resmi LMP
                </div>

                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                  {isRenewal ? 'Perpanjang' : 'Upgrade'} Sekarang
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  Iuran satu kali untuk akses penuh selama <strong>2 tahun</strong>.
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-6 bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100">
                  <span className="text-4xl font-extrabold text-slate-900">Rp 25.000</span>
                  <span className="text-sm text-slate-400 font-semibold">/ 2 Tahun</span>
                </div>

                {/* Checklist */}
                <ul className="space-y-2.5 mb-8">
                  {['KTA Digital Resmi', 'Akses Diklat Kader', 'Jejaring 38 Provinsi', 'Bantuan Hukum Prioritas'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-red-600 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={handleUpgrade}
                  disabled={loading || !isSnapReady}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-6 py-4 font-bold text-base text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-60 shadow-lg shadow-red-200"
                >
                  {loading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <>{isRenewal ? 'Perpanjang' : 'Upgrade'} Sekarang <ArrowRight className="w-5 h-5" /></>
                  }
                </button>

                <p className="mt-4 text-center text-[11px] text-slate-400">
                  Aman & terenkripsi via <span className="font-bold text-slate-600">Midtrans</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Toast message={toast.message} visible={toast.show} onClose={() => setToast(t => ({ ...t, show: false }))} />
    </div>
  );
}