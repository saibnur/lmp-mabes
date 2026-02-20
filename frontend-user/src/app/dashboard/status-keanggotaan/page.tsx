'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShieldCheck,
    Calendar,
    Clock,
    ArrowRight,
    Sparkles,
    LayoutGrid,
    Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase';
import { doc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { format, differenceInDays, intervalToDuration } from 'date-fns';
import { id } from 'date-fns/locale';
import confetti from 'canvas-confetti';

export default function StatusKeanggotaanPage() {
    const router = useRouter();
    const [pageLoading, setPageLoading] = useState(true);
    const [userDoc, setUserDoc] = useState<any>(null);
    const hasFiredConfetti = useRef(false);

    useEffect(() => {
        const auth = getFirebaseAuth();
        const db = getFirestoreDb();

        let unsubscribeSnapshot: (() => void) | undefined;

        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                unsubscribeSnapshot = onSnapshot(userRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserDoc(data);

                        const now = new Date();
                        const expiryDate = data.membershipExpiry instanceof Timestamp
                            ? data.membershipExpiry.toDate()
                            : null;

                        // Auto-expiry logic
                        if (expiryDate && expiryDate <= now && data.membershipStatus === 'active') {
                            console.log("Membership expired, updating Firestore...");
                            await updateDoc(userRef, {
                                membershipStatus: 'expired',
                                updatedAt: Timestamp.now()
                            });
                            router.replace('/dashboard/pembayaran');
                            return;
                        }

                        // Redirect if not active
                        if (data.membershipStatus !== 'active') {
                            router.replace('/dashboard/pembayaran');
                            return;
                        }

                        // Fire confetti if active and not seen yet
                        if (data.membershipStatus === 'active' && !data.hasSeenWelcomeAnim && !hasFiredConfetti.current) {
                            confetti({
                                particleCount: 150,
                                spread: 70,
                                origin: { y: 0.6 },
                                colors: ['#DC2626', '#FFFFFF', '#000000']
                            });
                            hasFiredConfetti.current = true;
                            // Mark as seen in Firestore
                            await updateDoc(userRef, { hasSeenWelcomeAnim: true });
                        }

                        // Mark membership as opened to clear notification dot
                        if (!data.hasOpenedMembership) {
                            await updateDoc(userRef, { hasOpenedMembership: true });
                        }
                    }
                    setPageLoading(false);
                }, (error) => {
                    console.error("Status page snapshot error:", error);
                    setPageLoading(false);
                });
            } else {
                router.push('/login');
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
        };
    }, [router]);

    // Simulation Debug Utility: 
    // Untuk simulasi expired, jalankan ini di Console Browser:
    // const db = (await import('@/lib/firebase')).getFirestoreDb();
    // const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
    // const auth = (await import('@/lib/firebase')).getFirebaseAuth();
    // await updateDoc(doc(db, 'users', auth.currentUser.uid), { 
    //   membershipExpiry: Timestamp.fromDate(new Date(Date.now() - 86400000)) 
    // });

    if (pageLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
        );
    }

    if (!userDoc || userDoc.membershipStatus !== 'active') {
        return null; // Redirecting
    }

    const expiryDate = userDoc.membershipExpiry instanceof Timestamp
        ? userDoc.membershipExpiry.toDate()
        : new Date();

    const now = new Date();
    const diffDays = differenceInDays(expiryDate, now);

    // Precise countdown using intervalToDuration
    const duration = intervalToDuration({ start: now, end: expiryDate });

    const countdownText = diffDays < 0
        ? "Masa Aktif Habis"
        : diffDays === 0
            ? "Masa Aktif Habis Hari Ini"
            : `${duration.years || 0} Tahun, ${duration.months || 0} Bulan, ${duration.days || 0} Hari`;

    // New variables for the updated UI
    const registrationDate = userDoc.registrationDate instanceof Timestamp
        ? userDoc.registrationDate.toDate()
        : new Date(); // Fallback to current date if not available

    const timeRemaining = {
        years: duration.years || 0,
        months: duration.months || 0,
        days: duration.days || 0,
    };

    const isHabisHariIni = diffDays === 0;

    return (
        <div className="min-h-screen bg-white pb-20">
            <div className="mx-auto max-w-5xl px-6 pt-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b-4 border-slate-900 pb-6 mb-12 gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter italic">
                            Status <span className="text-red-600">Keanggotaan</span>
                        </h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Informasi Resmi Kader LMP</p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition hover:bg-red-600"
                    >
                        <LayoutGrid className="w-4 h-4" /> KEMBALI KE DASHBOARD
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Status Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative overflow-hidden rounded-[3rem] border-2 border-slate-900 bg-white p-10 shadow-3xl shadow-slate-200"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-red-600/5 rounded-full -mr-20 -mt-20" />

                            <div className="relative flex flex-col md:flex-row items-center gap-10">
                                <div className="relative">
                                    <div className="flex h-32 w-32 items-center justify-center rounded-[2.5rem] bg-slate-900 text-red-600 shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform">
                                        <ShieldCheck className="h-16 w-16" />
                                    </div>
                                    {userDoc?.membershipStatus === 'active' && (
                                        <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg border-4 border-white">
                                            <Sparkles className="h-5 w-5" />
                                        </div>
                                    )}
                                </div>

                                <div className="text-center md:text-left space-y-4 flex-1">
                                    <div>
                                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-slate-500 mb-2">
                                            Masa Kontribusi
                                        </span>
                                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                                            {userDoc?.membershipStatus === 'active' ? 'Kader Terverifikasi' : 'Menunggu Pelunasan'}
                                        </h2>
                                        {userDoc?.no_kta && (
                                            <p className="text-sm font-bold text-slate-400 mt-1">NO. KTA: {userDoc.no_kta}</p>
                                        )}
                                    </div>

                                    {userDoc?.membershipStatus === 'active' ? (
                                        <div className="flex items-center justify-center md:justify-start gap-3">
                                            <div className="relative flex h-4 w-4">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500"></span>
                                            </div>
                                            <p className="text-lg font-black text-emerald-600 uppercase tracking-tighter">Status: Aktif</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center md:justify-start gap-3">
                                            <div className="h-4 w-4 rounded-full bg-red-600"></div>
                                            <p className="text-lg font-black text-red-600 uppercase tracking-tighter italic">Status: Expired / Inactive</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {userDoc?.membershipStatus === 'active' && expiryDate && (
                                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="rounded-3xl bg-slate-50 p-6 border-2 border-slate-100 group hover:border-red-600/20 transition-colors">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Mulai Aktif</p>
                                        <p className="text-xl font-black text-slate-900">{format(registrationDate, 'd MMM yyyy', { locale: id })}</p>
                                    </div>
                                    <div className="rounded-3xl bg-slate-50 p-6 border-2 border-slate-100 group hover:border-red-600/20 transition-colors">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Berakhir Pada</p>
                                        <p className="text-xl font-black text-slate-900">{format(expiryDate, 'd MMM yyyy', { locale: id })}</p>
                                    </div>
                                    <div className="rounded-3xl bg-red-600 p-6 shadow-xl shadow-red-200">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">Sertifikat Resmi</p>
                                        <button className="text-sm font-black text-white hover:underline flex items-center gap-2">
                                            DOWNLOAD SERTIFIKAT <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Benefits / Notice */}
                        <div className="rounded-[2.5rem] bg-slate-900 p-8 text-white relative overflow-hidden group">
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-red-600/20 rounded-full blur-3xl" />
                            <div className="relative flex items-start gap-6">
                                <div className="p-4 rounded-2xl bg-white/10 text-red-600">
                                    <ShieldCheck className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter italic mb-2">Benefit Kader Terdaftar</h3>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-slate-400 text-sm font-bold">
                                        <li className="flex items-center gap-2 italic">• Pelatihan Kepemimpinan</li>
                                        <li className="flex items-center gap-2 italic">• Jaringan Ekonomi Umat</li>
                                        <li className="flex items-center gap-2 italic">• Advokasi Hukum Anggota</li>
                                        <li className="flex items-center gap-2 italic">• Kartu Tanda Anggota Digital</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Countdown / Action Column */}
                    <div className="space-y-6">
                        <div className="rounded-[2.5rem] border-2 border-slate-900 bg-white p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4">
                                <Clock className="w-6 h-6 text-red-600/20" />
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8">Sisa Masa Aktif</h3>

                            {userDoc?.membershipStatus === 'active' ? (
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-4">
                                        {timeRemaining.years > 0 && (
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-5xl font-black text-slate-900 tracking-tighter">{timeRemaining.years}</span>
                                                <span className="text-xl font-black text-slate-400 italic uppercase tracking-tighter">Tahun</span>
                                            </div>
                                        )}
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-slate-900 tracking-tighter">{timeRemaining.months}</span>
                                            <span className="text-xl font-black text-slate-400 italic uppercase tracking-tighter">Bulan</span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-5xl font-black text-red-600 tracking-tighter">{timeRemaining.days}</span>
                                            <span className="text-xl font-black text-slate-400 italic uppercase tracking-tighter">Hari</span>
                                        </div>
                                    </div>

                                    {isHabisHariIni && (
                                        <div className="rounded-2xl bg-red-50 p-4 border border-red-100 flex items-center gap-3">
                                            <div className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
                                            <p className="text-red-600 text-[10px] font-black uppercase tracking-widest">Masa Aktif Habis Hari Ini!</p>
                                        </div>
                                    )}

                                    <div className="pt-6 border-t border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 leading-relaxed italic">
                                            Lakukan perpanjangan iuran sebelum masa aktif habis untuk menjaga keberlanjutan status kader resmi Anda.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <p className="text-slate-500 font-bold mb-4 italic">Masa aktif Anda telah berakhir. Segera lakukan pelunasan iuran untuk menikmati kembali seluruh fasilitas kader LMP.</p>
                                    <button
                                        onClick={() => router.push('/dashboard/pembayaran')}
                                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600 py-4 font-black text-white hover:bg-slate-900 transition-colors shadow-xl shadow-red-200"
                                    >
                                        BAYAR IURAN SEKARANG <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl bg-slate-50 p-6 border-2 border-slate-100 text-center">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 leading-tight">Butuh Bantuan? <br /> Hubungi Mabes Pusat</p>
                            <button className="inline-flex items-center gap-2 text-xs font-black text-slate-900 hover:text-red-600 transition-colors italic uppercase tracking-tighter border-b-2 border-slate-900 pb-1">
                                WhatsApp Admin Organisasi
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
