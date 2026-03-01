'use client';

import { useState, useEffect, useRef, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShieldCheck,
    Calendar,
    Clock,
    ArrowRight,
    Sparkles,
    LayoutGrid,
    Loader2,
    Download,
    User,
    Settings2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase';
import { doc, onSnapshot, Timestamp, updateDoc } from 'firebase/firestore';
import { format, differenceInDays, intervalToDuration } from 'date-fns';
import { id } from 'date-fns/locale';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import KtaCard from '@/features/kta/components/KtaCard';
import { KtaCardConfig, DEFAULT_KTA_CONFIG } from '@/features/kta/types/KtaCardConfig';

export default function StatusKeanggotaanPage() {
    const router = useRouter();
    const [pageLoading, setPageLoading] = useState(true);
    const [userDoc, setUserDoc] = useState<any>(null);
    const hasFiredConfetti = useRef(false);
    const ktaCardRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const [ktaConfig, setKtaConfig] = useState<KtaCardConfig>(DEFAULT_KTA_CONFIG);

    // Load KTA config dari /api/kta-config
    useEffect(() => {
        fetch('/api/kta-config')
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then((data: KtaCardConfig) => {
                setKtaConfig(prev => ({ ...prev, ...data }));
            })
            .catch(() => { /* fallback ke DEFAULT_KTA_CONFIG */ });
    }, []);

    const handleDownloadKta = async () => {
        if (!ktaCardRef.current) return;
        setDownloading(true);

        // Isolated off-screen container — completely detached from body CSS
        const offscreenWrapper = document.createElement('div');
        Object.assign(offscreenWrapper.style, {
            all: 'initial',           // Reset SEMUA CSS inherited dari body/global
            position: 'fixed',
            left: '-99999px',
            top: '0',
            zIndex: '-9999',
            overflow: 'hidden',
            lineHeight: '1',
            fontSize: '16px',         // baseline agar 'em' units stabil
        } as CSSProperties);
        document.body.appendChild(offscreenWrapper);

        try {
            const nativeW = ktaConfig.canvas?.width ?? 800;
            const nativeH = ktaConfig.canvas?.height ?? 1280;

            // Clone the inner KtaCard div (ref points to it)
            const clone = ktaCardRef.current.cloneNode(true) as HTMLElement;

            // Override SEMUA style pada clone: hapus transform scale, pastikan ukuran native
            Object.assign(clone.style, {
                position: 'relative',
                top: '0',
                left: '0',
                width: `${nativeW}px`,
                height: `${nativeH}px`,
                transform: 'none',          // hapus scale(0.45)
                transformOrigin: 'top left',
                boxShadow: 'none',
                margin: '0',
                padding: '0',
                lineHeight: '1',
                fontSize: '16px',
                overflow: 'hidden',
            } as CSSProperties);

            // Inject style tag ke dalam clone untuk mereset semua elemen anak
            // Ini kunci utama: mencegah line-height dari global CSS melorot ke teks absolut
            const resetStyle = document.createElement('style');
            resetStyle.textContent = `
                * {
                    box-sizing: border-box !important;
                    line-height: 1 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    font-synthesis: none !important;
                }
            `;
            clone.insertBefore(resetStyle, clone.firstChild);

            offscreenWrapper.appendChild(clone);

            // Tunggu SEMUA font Google selesai di-load sebelum capture
            await document.fonts.ready;
            // Beri extra tick agar browser menyelesaikan layout setelah font loaded
            await new Promise(r => setTimeout(r, 300));

            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(clone, {
                scale: 2,             // High DPI: 2x agar gambar tajam
                width: nativeW,
                height: nativeH,
                useCORS: true,
                allowTaint: true,
                backgroundColor: ktaConfig.canvas?.backgroundColor ?? '#111113',
                // Clone ada di posisi fixed off-screen, paksa scroll offset = 0
                scrollX: 0,
                scrollY: 0,
                logging: false,
            });

            const link = document.createElement('a');
            link.download = `KTA-LMP-${userDoc?.no_kta || 'member'}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        } catch (e) {
            console.error('Download KTA error:', e);
            alert('Gagal mengunduh KTA. Silakan coba lagi.');
        } finally {
            document.body.removeChild(offscreenWrapper);
            setDownloading(false);
        }
    };

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

    const orgLevel = userDoc?.organization?.level as ('daerah' | 'cabang' | 'anak-cabang' | 'ranting' | '') | undefined;
    const orgRegionNames = userDoc?.organization ? {
        provinceName: userDoc.organization.province_name || '',
        regencyName: userDoc.organization.regency_name || '',
        districtName: userDoc.organization.district_name || '',
        villageName: userDoc.organization.village_name || '',
    } : undefined;

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

                        {/* Digital KTA Card */}
                        {userDoc?.no_kta && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">KTA Digital Anda</h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => router.push('/dashboard/kta-format-editor')}
                                            className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-slate-900"
                                        >
                                            <Settings2 className="h-3 w-3" />
                                            Edit Format
                                        </button>
                                        <button
                                            onClick={handleDownloadKta}
                                            disabled={downloading}
                                            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black text-white transition hover:bg-red-600 disabled:opacity-50"
                                        >
                                            {downloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                                            Download KTA
                                        </button>
                                    </div>
                                </div>

                                {/* KTA Card — Downloadable */}
                                <div className="w-full flex justify-center py-4 bg-slate-100 rounded-3xl shadow-inner border-2 border-slate-200 overflow-hidden">
                                    <KtaCard
                                        ref={ktaCardRef}
                                        config={ktaConfig}
                                        scale={ktaConfig.preview?.scale ?? 0.45}
                                        photoUrl={userDoc?.photoURL || ''}
                                        displayName={userDoc?.displayName || 'NAMA ANDA'}
                                        orgLevel={orgLevel}
                                        regionNames={orgRegionNames}
                                        jabatanText={(userDoc?.kepengurusan?.jabatan ?? 'ANGGOTA').toUpperCase()}
                                        noKta={userDoc.no_kta}
                                        isActive={userDoc?.membershipStatus === 'active'}
                                        expiryDate={expiryDate}
                                    />
                                </div>
                            </motion.div>
                        )}

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
