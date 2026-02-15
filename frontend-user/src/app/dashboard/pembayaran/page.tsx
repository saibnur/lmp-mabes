'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Minus,
  X,
  ArrowRight,
  ShieldCheck,
  Scale,
  Network,
  GraduationCap,
  Shirt,
  TrendingUp,
  LayoutGrid,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { paymentApi } from '@/lib/api';
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase';
import Toast from '@/components/Toast';
import { doc, onSnapshot } from 'firebase/firestore';

declare global {
  interface Window {
    snap: any;
  }
}

const features = [
  { name: 'Akses Informasi Publik', non: true, member: true, icon: LayoutGrid },
  { name: 'Legalitas & KTA Resmi', non: false, member: true, icon: ShieldCheck, desc: 'Terdata di Mabes LMP' },
  { name: 'Bantuan Hukum & Advokasi', non: 'Umum', member: 'Prioritas Utama LBH-LMP', icon: Scale },
  { name: 'Jejaring Nasional', non: 'Terbatas', member: '34 Provinsi', icon: Network },
  { name: 'Pendidikan & Pelatihan', non: false, member: 'Diklat Kader', icon: GraduationCap },
  { name: 'Hak Atribut', non: false, member: 'Seragam Resmi', icon: Shirt },
  { name: 'Kesempatan Pengurus', non: false, member: 'Sesuai Jenjang', icon: ShieldCheck },
  { name: 'Program Ekonomi', non: false, member: 'Investasi & UMKM', icon: TrendingUp }
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

    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setMembershipStatus(data.membershipStatus || 'pending');
            // Critical fix: use membershipStatus
            // Redirect to status-keanggotaan if activated
            if (data.membershipStatus === 'active') {
              setToast({ show: true, message: 'Pembayaran terverifikasi! Mengalihkan...', type: 'success' });
              setTimeout(() => {
                router.replace('/dashboard/status-keanggotaan');
              }, 2000);
              return;
            }
          }
          setPageLoading(false);
        }, (error) => {
          console.error("Payment page snapshot error:", error);
          setPageLoading(false);
        });
      } else {
        router.push('/login');
      }
    });

    // Load Midtrans Snap Script
    const snapUrl = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js';
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';

    if (!document.querySelector(`script[src="${snapUrl}"]`)) {
      const script = document.createElement('script');
      script.src = snapUrl;
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      script.onload = () => setIsSnapReady(true);
      document.body.appendChild(script);
    } else {
      setIsSnapReady(true);
    }

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [router]);

  const isRenewal = membershipStatus === 'expired';

  // Development utility for testing
  const updateStatusManual = async () => {
    try {
      const auth = getFirebaseAuth();
      const db = getFirestoreDb();
      if (!auth.currentUser) return;

      const userRef = doc(db, 'users', auth.currentUser.uid);
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 2);

      const { updateDoc, Timestamp } = await import('firebase/firestore');
      await updateDoc(userRef, {
        membershipStatus: 'active',
        membershipExpiry: Timestamp.fromDate(expiryDate),
        updatedAt: Timestamp.now()
      });
      setToast({ show: true, message: 'Status diperbarui secara manual (Dev Mode)', type: 'success' });
    } catch (err) {
      console.error("Manual update error:", err);
    }
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
            // Fallback for dev testing
            if (process.env.NODE_ENV === 'development') {
              await updateStatusManual();
            } else {
              setToast({ show: true, message: 'Pembayaran Berhasil! Mohon tunggu sinkronisasi...', type: 'success' });
            }
          },
          onPending: () => setToast({ show: true, message: 'Menunggu pembayaran...', type: 'success' }),
          onError: () => setToast({ show: true, message: 'Pembayaran gagal.', type: 'error' }),
          onClose: () => setToast({ show: true, message: 'Pembayaran dibatalkan.', type: 'error' })
        });
      }
    } catch (err: any) {
      setToast({ show: true, message: err.response?.data?.message || 'Gagal membuat transaksi.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-red-50/50 to-transparent -z-10" />

      <div className="max-w-6xl mx-auto px-4 pt-16">
        <div className="text-center mb-16 border-b-4 border-slate-900 pb-10 inline-block w-full">
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic"
          >
            {isRenewal ? (
              <>Lanjutkan Keanggotaan <span className="text-red-600">Anda</span></>
            ) : (
              <>Kenapa Harus Jadi <span className="text-red-600">Member?</span></>
            )}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-xl font-bold text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            {isRenewal
              ? "Masa aktif Anda telah habis. Yuk, perpanjang kontribusi Anda untuk LMP."
              : "Dapatkan akses penuh ke seluruh fasilitas organisasi dan jadilah bagian dari perjuangan bersama Nasionalis."
            }
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start mt-12">
          <motion.div className="lg:col-span-2 space-y-6">
            {/* Desktop Headers */}
            <div className="hidden md:grid grid-cols-4 px-8 pb-6 border-b-2 border-slate-900 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <div className="col-span-2">Fasilitas Keanggotaan</div>
              <div className="text-center">Non-Member</div>
              <div className="text-center text-red-600">Member Resmi</div>
            </div>

            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="grid grid-cols-1 md:grid-cols-4 items-center p-6 md:p-8 bg-white border-2 border-slate-100 rounded-[2.5rem] hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 group"
              >
                <div className="col-span-2 flex items-center gap-6">
                  <div className="w-14 h-14 rounded-[1.25rem] bg-slate-900 flex items-center justify-center text-red-600 shadow-xl transform group-hover:rotate-6 transition-transform flex-shrink-0">
                    <f.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{f.name}</h3>
                    {f.desc && <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest leading-none">{f.desc}</p>}
                  </div>
                </div>

                {/* Status Column 1: Non-Member */}
                <div className="mt-8 md:mt-0 flex items-center justify-between md:justify-center border-t border-slate-50 pt-6 md:border-0 md:pt-0">
                  <span className="md:hidden text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Non-Member
                  </span>
                  <div className="flex justify-center flex-1 md:flex-none">
                    {typeof f.non === 'boolean' ? (
                      f.non ? <CheckCircle2 className="w-7 h-7 text-slate-900" /> : <X className="w-7 h-7 text-slate-200" />
                    ) : (
                      <span className="text-sm font-black text-slate-500 uppercase tracking-tighter">{f.non}</span>
                    )}
                  </div>
                </div>

                {/* Status Column 2: Member Resmi */}
                <div className="mt-4 md:mt-0 flex items-center justify-between md:justify-center border-t md:border-t-0 border-slate-50 pt-4 md:pt-0">
                  <span className="md:hidden text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" /> Member Resmi
                  </span>
                  <div className="flex justify-center flex-1 md:flex-none">
                    {typeof f.member === 'boolean' ? (
                      f.member ? <CheckCircle2 className="w-7 h-7 text-red-600" /> : <Minus className="w-7 h-7 text-slate-100" />
                    ) : (
                      <span className="text-sm font-black text-red-600 uppercase tracking-tighter">{f.member}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-8"
          >
            <div className="rounded-[3rem] border-2 border-slate-900 bg-white p-10 shadow-3xl shadow-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest mb-8">
                  <ShieldCheck className="w-4 h-4 text-red-600" /> Kader Premium
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter italic">
                  {isRenewal ? "Perpanjang" : "Upgrade"} <br /> <span className="text-red-600 font-black">Sekarang</span>
                </h2>
                <p className="text-slate-500 font-bold text-sm mb-10">Iuran hanya satu kali untuk akses tak terbatas selama 2 tahun.</p>
                <div className="flex items-baseline gap-2 mb-10 border-l-4 border-red-600 pl-4">
                  <span className="text-5xl font-black text-slate-900 leading-none tracking-tighter">Rp 25K</span>
                  <span className="text-slate-400 text-sm font-black uppercase tracking-widest">/ 2 Tahun</span>
                </div>
                <button
                  onClick={handleUpgrade}
                  disabled={loading || !isSnapReady}
                  className="w-full relative group/btn overflow-hidden active:scale-95 transition-transform"
                >
                  <div className="absolute -inset-1 bg-red-600 rounded-3xl blur opacity-30 group-hover/btn:opacity-60 transition" />
                  <div className="relative flex items-center justify-center gap-3 rounded-2xl bg-red-600 py-5 font-black text-lg text-white transition hover:bg-slate-900 shadow-xl shadow-red-200 group-hover/btn:shadow-slate-300">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{isRenewal ? "PERPANJANG" : "UPGRADE"} <ArrowRight className="w-6 h-6" /></>}
                  </div>
                </button>
                <p className="mt-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Didukung penuh oleh
                  <span className="text-slate-900 ml-1">MIDTRANS SECURE PAY</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Toast
        message={toast.message}
        visible={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  );
}
