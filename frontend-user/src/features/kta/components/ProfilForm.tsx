'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, MapPin, CheckCircle2, ArrowRight, ArrowLeft,
    Camera, UploadCloud, Loader2, ShieldCheck, AlertCircle,
    Save, Building2, Lock, X, RotateCw
} from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase';
import { updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { memberApi, mediaApi } from '@/lib/api';
import { uploadToCloudinary } from '@/lib/cloudinary';
import Toast from '@/app/components/Toast';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import KtaCard from './KtaCard';
import { useRegionCache } from '@/hooks/useRegionCache';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
interface Region { id: string; name: string; }

type Step = 'data-diri' | 'alamat' | 'kepengurusan' | 'preview';
type OrgLevel = 'daerah' | 'cabang' | 'anak-cabang' | 'ranting' | '';

const STEPS: { key: Step; label: string }[] = [
    { key: 'data-diri', label: 'Data Diri' },
    { key: 'alamat', label: 'Alamat' },
    { key: 'kepengurusan', label: 'Wilayah' },
    { key: 'preview', label: 'Preview KTA' },
];

interface OrgLevelOption {
    value: OrgLevel;
    label: string;
    sub: string;
    disabled?: boolean;
    disabledNote?: string;
}

const ORG_LEVEL_OPTIONS: OrgLevelOption[] = [
    {
        value: '',
        label: 'Mabes Pusat',
        sub: 'Tingkat Nasional',
        disabled: true,
        disabledNote: 'Hanya dapat ditentukan oleh Administrator Pusat',
    },
    { value: 'daerah', label: 'Markas Daerah', sub: 'Basis: Provinsi Domisili' },
    { value: 'cabang', label: 'Markas Cabang', sub: 'Basis: Kabupaten / Kota Domisili' },
    { value: 'anak-cabang', label: 'Markas Anak Cabang', sub: 'Basis: Kecamatan Domisili' },
    { value: 'ranting', label: 'Markas Ranting', sub: 'Basis: Desa / Kelurahan Domisili' },
];

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
function getEffectiveWilayah(
    level: OrgLevel,
    sel: { provinceId: string; regencyId: string; districtId: string; villageId: string },
    names: { provinceName: string; regencyName: string; districtName: string; villageName: string }
): { id: string; name: string; levelLabel: string } {
    switch (level) {
        case 'daerah': return { id: sel.provinceId, name: names.provinceName, levelLabel: 'Markas Daerah' };
        case 'cabang': return { id: sel.regencyId, name: names.regencyName, levelLabel: 'Markas Cabang' };
        case 'anak-cabang': return { id: sel.districtId, name: names.districtName, levelLabel: 'Markas Anak Cabang' };
        case 'ranting': return { id: sel.villageId, name: names.villageName, levelLabel: 'Markas Ranting' };
        default: return { id: '', name: '', levelLabel: '' };
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Unified Profile Page: handles BOTH registration (empty) and edit (pre-filled)
// ──────────────────────────────────────────────────────────────────────────────
export default function DaftarProfilPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('data-diri');
    const [loading, setLoading] = useState(false);
    const [authReady, setAuthReady] = useState(false);
    const [idToken, setIdToken] = useState<string>('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [existingNoKta, setExistingNoKta] = useState<string | null>(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

    // Form data
    const [form, setForm] = useState({ displayName: '', nik: '', email: '' });
    const [nikStatus, setNikStatus] = useState<'idle' | 'checking' | 'ok' | 'duplicate'>('idle');
    const nikTimer = useRef<NodeJS.Timeout | null>(null);

    // Media
    const [files, setFiles] = useState<{ photo: File | null; ktp: File | null }>({ photo: null, ktp: null });
    const [previews, setPreviews] = useState({ photo: '', ktp: '' });
    const photoRef = useRef<HTMLInputElement>(null);
    const ktpRef = useRef<HTMLInputElement>(null);

    // Cropper State
    const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [showCropper, setShowCropper] = useState(false);

    // Regions (domisili) — fetched via useRegionCache (sessionStorage-backed)
    const [sel, setSel] = useState({ provinceId: '', regencyId: '', districtId: '', villageId: '' });
    const [selNames, setSelNames] = useState({ provinceName: '', regencyName: '', districtName: '', villageName: '' });

    const { data: provinces, loading: loadingProvinces, error: errorProvinces } =
        useRegionCache('provinces');
    const { data: regencies, loading: loadingRegencies, error: errorRegencies } =
        useRegionCache('regencies', sel.provinceId, !!sel.provinceId);
    const { data: districts, loading: loadingDistricts, error: errorDistricts } =
        useRegionCache('districts', sel.regencyId, !!sel.regencyId);
    const { data: villages, loading: loadingVillages, error: errorVillages } =
        useRegionCache('villages', sel.districtId, !!sel.districtId);

    // Computed: is any region level currently loading?
    const loadingRegion: string | null =
        loadingProvinces ? 'provinces' :
            loadingRegencies ? 'regencies' :
                loadingDistricts ? 'districts' :
                    loadingVillages ? 'villages' : null;

    // Org level (Step 3)
    const [orgLevel, setOrgLevel] = useState<OrgLevel>('');

    // ──────────────────────────────────────────────────────────────────────────
    // Auth guard + profile load
    // ──────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const auth = getFirebaseAuth();
        const unsub = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                router.replace('/daftar');
                return;
            }
            try {
                const token = await user.getIdToken();
                setIdToken(token);
                setForm(prev => ({ ...prev, email: user.email || '' }));

                const { data: profileRes } = await memberApi.getProfile(token);
                if (profileRes.success && profileRes.data) {
                    const p = profileRes.data;
                    if (p.profileComplete && p.organization?.village_id) {
                        setIsEditMode(true);
                        setExistingNoKta(p.no_kta || null);
                        setForm({
                            displayName: p.displayName || '',
                            nik: p.nik || '',
                            email: p.email || user.email || '',
                        });
                        setPreviews({
                            photo: p.photoURL || '',
                            ktp: p.ktpURL || '',
                        });
                        if (p.organization) {
                            setSel({
                                provinceId: p.organization.province_id || '',
                                regencyId: p.organization.regency_id || '',
                                districtId: p.organization.district_id || '',
                                villageId: p.organization.village_id || '',
                            });
                            setSelNames({
                                provinceName: p.organization.province_name || '',
                                regencyName: p.organization.regency_name || '',
                                districtName: p.organization.district_name || '',
                                villageName: p.organization.village_name || '',
                            });
                            setOrgLevel((p.organization.level as OrgLevel) || 'ranting');
                        }
                        setNikStatus('ok');
                    }
                }
            } catch (e) {
                console.warn('[DaftarProfil] Profile fetch failed:', e);
            }
            setAuthReady(true);
        });
        return () => unsub();
    }, [router]);

    // ──────────────────────────────────────────────────────────────────────────
    // Reset orgLevel whenever domisili address changes (Step 2 → Step 3 auto-reset)
    // ──────────────────────────────────────────────────────────────────────────
    const prevSelRef = useRef(sel);
    useEffect(() => {
        const prev = prevSelRef.current;
        if (
            prev.provinceId !== sel.provinceId ||
            prev.regencyId !== sel.regencyId ||
            prev.districtId !== sel.districtId ||
            prev.villageId !== sel.villageId
        ) {
            if (!isEditMode) {
                setOrgLevel('');
            }
            prevSelRef.current = sel;
        }
    }, [sel, isEditMode]);

    // ──────────────────────────────────────────────────────────────────────────
    // Surface region fetch errors as toast messages
    // ──────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        const firstError = errorProvinces || errorRegencies || errorDistricts || errorVillages;
        if (firstError) {
            setToast({ show: true, message: firstError, type: 'error' });
        }
    }, [errorProvinces, errorRegencies, errorDistricts, errorVillages]);

    // ──────────────────────────────────────────────────────────────────────────
    // NIK debounced check
    // ──────────────────────────────────────────────────────────────────────────
    const checkNik = useCallback(async (nik: string, token: string) => {
        if (nik.length !== 16) { setNikStatus('idle'); return; }
        setNikStatus('checking');
        try {
            const { data } = await memberApi.checkNik(token, nik);
            setNikStatus(data.exists ? 'duplicate' : 'ok');
        } catch {
            setNikStatus('idle');
        }
    }, []);

    const handleNikChange = (val: string) => {
        const cleaned = val.replace(/\D/g, '').slice(0, 16);
        setForm(prev => ({ ...prev, nik: cleaned }));
        setNikStatus('idle');
        if (nikTimer.current) clearTimeout(nikTimer.current);
        if (cleaned.length === 16 && idToken) {
            nikTimer.current = setTimeout(() => checkNik(cleaned, idToken), 800);
        }
    };

    const handleMedia = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'ktp') => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                setToast({ show: true, message: 'Ukuran file terlalu besar. Maks 5MB.', type: 'error' });
                return;
            }
            if (type === 'ktp') {
                setCropImageSrc(URL.createObjectURL(file));
                setShowCropper(true);
            } else {
                setFiles(prev => ({ ...prev, [type]: file }));
                setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
            }
        }
    };

    const handleCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const processCrop = async () => {
        if (!cropImageSrc || !croppedAreaPixels) return;
        try {
            const croppedImage = await getCroppedImg(cropImageSrc, croppedAreaPixels, rotation);
            if (!croppedImage) throw new Error("Gagal memproses gambar");
            setFiles(prev => ({ ...prev, ktp: croppedImage }));
            setPreviews(prev => ({ ...prev, ktp: URL.createObjectURL(croppedImage) }));
            setShowCropper(false);
            setRotation(0);
            setZoom(1);
        } catch (e) {
            console.error(e);
            setToast({ show: true, message: 'Gagal memproses crop KTP', type: 'error' });
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Validation & navigation
    // ──────────────────────────────────────────────────────────────────────────
    const canProceedStep1 = form.displayName.trim().length > 2 && form.nik.length === 16 && nikStatus === 'ok';
    // Block step 2 advance if region data is still loading OR village not selected
    const canProceedStep2 = sel.villageId !== '' && loadingRegion === null;
    const canProceedStep3 = orgLevel !== '';

    const STEP_ORDER: Step[] = ['data-diri', 'alamat', 'kepengurusan', 'preview'];

    const handleNextStep = () => {
        const idx = STEP_ORDER.indexOf(step);
        if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
    };

    const handlePrevStep = () => {
        const idx = STEP_ORDER.indexOf(step);
        if (idx > 0) setStep(STEP_ORDER[idx - 1]);
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Submit
    // ──────────────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!navigator.onLine) {
            setToast({ show: true, message: 'Koneksi internet terputus. Periksa jaringan Anda dan coba lagi.', type: 'error' });
            return;
        }
        setLoading(true);
        try {
            const auth = getFirebaseAuth();
            const user = auth.currentUser;
            if (!user) throw new Error('Tidak terautentikasi');
            const freshToken = await user.getIdToken(true);

            let finalPhotoURL = previews.photo;
            let finalKtpURL = previews.ktp;

            if (files.photo) {
                try {
                    const { data: signRes } = await mediaApi.getSignUpload(freshToken, 'profiles');
                    if (!signRes.success) throw new Error('Gagal mendapatkan izin upload');
                    finalPhotoURL = await uploadToCloudinary(files.photo, 'profiles', signRes);
                } catch (uploadErr: any) {
                    throw new Error(
                        uploadErr.message?.includes('network') || !navigator.onLine
                            ? 'Unggah foto profil gagal — koneksi internet bermasalah.'
                            : 'Unggah foto profil gagal — pastikan format JPG/PNG dan ukuran < 5MB.'
                    );
                }
            }

            if (files.ktp) {
                try {
                    const { data: signRes } = await mediaApi.getSignUpload(freshToken, 'ktp');
                    if (!signRes.success) throw new Error('Gagal mendapatkan izin upload KTP');
                    finalKtpURL = await uploadToCloudinary(files.ktp, 'ktp', signRes);
                } catch (uploadErr: any) {
                    throw new Error(
                        uploadErr.message?.includes('network') || !navigator.onLine
                            ? 'Unggah foto KTP gagal — koneksi internet bermasalah.'
                            : 'Unggah foto KTP gagal — pastikan format JPG/PNG dan ukuran < 5MB.'
                    );
                }
            }

            const { data } = await memberApi.updateProfile(freshToken, {
                fullName: form.displayName.trim(),
                nik: form.nik,
                email: form.email,
                phoneNumber: user.phoneNumber || '',
                organization: {
                    province_id: sel.provinceId, province_name: selNames.provinceName,
                    regency_id: sel.regencyId, regency_name: selNames.regencyName,
                    district_id: sel.districtId, district_name: selNames.districtName,
                    village_id: sel.villageId, village_name: selNames.villageName,
                    level: orgLevel,
                },
                photoURL: finalPhotoURL,
                ktpURL: finalKtpURL,
            });

            if (data.success) {
                await firebaseUpdateProfile(user, {
                    displayName: form.displayName.trim(),
                    photoURL: finalPhotoURL || undefined
                });
                if (isEditMode) {
                    setToast({ show: true, message: 'Profil berhasil diperbarui!', type: 'success' });
                    setTimeout(() => router.push('/dashboard'), 1500);
                } else {
                    router.push('/dashboard/pembayaran');
                }
            } else {
                throw new Error(data.message || 'Gagal menyimpan profil');
            }
        } catch (err: any) {
            setToast({
                show: true,
                message: err.response?.data?.message || err.message || 'Gagal menyimpan. Coba lagi.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Derived display values
    // ──────────────────────────────────────────────────────────────────────────
    const currentStepIndex = STEPS.findIndex(s => s.key === step);
    const effectiveWilayah = getEffectiveWilayah(orgLevel, sel, selNames);

    const stepDisabledNext =
        loading ||
        (step === 'data-diri' && !canProceedStep1) ||
        (step === 'alamat' && (!canProceedStep2 || loadingRegion !== null)) ||
        (step === 'kepengurusan' && !canProceedStep3);

    if (!authReady) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <Loader2 className="h-10 w-10 animate-spin text-red-600" />
            </div>
        );
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* ── Header / Progress ── */}
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-4 py-4 backdrop-blur-sm">
                <div className="mx-auto max-w-lg">
                    {/* Tombol Kembali / Judul */}
                    <div className="mb-4 flex items-center gap-3">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <p className="flex-1 text-sm font-black uppercase tracking-widest text-slate-800">
                            {isEditMode ? 'Edit Profil Anggota' : 'Pendaftaran Anggota LMP'}
                        </p>
                        {isEditMode && (
                            <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600">
                                Mode Edit
                            </span>
                        )}
                    </div>

                    {/* 4-Step Progress Bar */}
                    <div className="flex items-center gap-0">
                        {STEPS.map((s, i) => (
                            <div key={s.key} className="flex flex-1 items-center">
                                <div className="flex flex-col items-center">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all ${i < currentStepIndex ? 'bg-emerald-500 text-white' :
                                        i === currentStepIndex ? 'bg-red-600 text-white shadow-lg shadow-red-200' :
                                            'bg-slate-100 text-slate-400'
                                        }`}>
                                        {i < currentStepIndex ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                                    </div>
                                    <span className={`mt-1 text-[10px] font-black uppercase tracking-wider ${i === currentStepIndex ? 'text-red-600' :
                                        i < currentStepIndex ? 'text-emerald-500' :
                                            'text-slate-300'
                                        }`}>{s.label}</span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`mx-2 mb-4 h-0.5 flex-1 transition-all ${i < currentStepIndex ? 'bg-emerald-400' : 'bg-slate-100'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <div className="flex-1 px-4 py-8">
                <div className="mx-auto max-w-lg">
                    <AnimatePresence mode="wait">

                        {/* ════════════════════ STEP 1: Data Diri ════════════════════ */}
                        {step === 'data-diri' && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">
                                        Data <span className="text-red-600">Diri</span>
                                    </h1>
                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                        {isEditMode ? 'Perbarui identitas resmi sesuai KTP' : 'Lengkapi identitas resmi sesuai KTP'}
                                    </p>
                                </div>

                                {/* Foto Profil */}
                                <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
                                    <div className="relative group">
                                        <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-slate-200 bg-white shadow-lg">
                                            {previews.photo ? (
                                                <img src={previews.photo} alt="Foto" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <User className="h-12 w-12 text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => photoRef.current?.click()}
                                            className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-red-600 text-white shadow-lg transition hover:scale-110"
                                        >
                                            <Camera className="h-4 w-4" />
                                        </button>
                                        <input type="file" ref={photoRef} hidden accept="image/*" onChange={e => handleMedia(e, 'photo')} />
                                    </div>
                                    <p className="text-center text-xs font-medium italic text-slate-400">
                                        Foto rapi / berseragam. Akan tampil di KTA. Maks 5MB.
                                    </p>
                                </div>

                                {/* NIK */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">
                                        NIK (16 digit) <span className="text-red-600">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={16}
                                            value={form.nik}
                                            onChange={e => handleNikChange(e.target.value)}
                                            placeholder="Nomor Induk Kependudukan"
                                            className={`w-full rounded-2xl border-2 bg-white px-5 py-4 font-black tracking-widest text-slate-900 outline-none transition ${nikStatus === 'ok' ? 'border-emerald-400 focus:border-emerald-500' :
                                                nikStatus === 'duplicate' ? 'border-red-400 focus:border-red-500' :
                                                    'border-slate-200 focus:border-red-600'
                                                }`}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {nikStatus === 'checking' && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
                                            {nikStatus === 'ok' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                            {nikStatus === 'duplicate' && <AlertCircle className="h-5 w-5 text-red-500" />}
                                        </div>
                                    </div>
                                    {nikStatus === 'duplicate' && (
                                        <p className="mt-1.5 text-xs font-bold text-red-600">
                                            NIK ini sudah terdaftar di akun lain. Hubungi Mabes jika ada kesalahan.
                                        </p>
                                    )}
                                    {nikStatus === 'ok' && (
                                        <p className="mt-1.5 text-xs font-bold text-emerald-600">NIK valid ✓</p>
                                    )}
                                </div>

                                {/* Nama */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">
                                        Nama Lengkap <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.displayName}
                                        onChange={e => setForm(prev => ({ ...prev, displayName: e.target.value }))}
                                        placeholder="Sesuai KTP"
                                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 font-bold text-slate-900 outline-none transition focus:border-red-600"
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">
                                        Email (opsional)
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="contoh@email.com"
                                        className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 font-bold text-slate-900 outline-none transition focus:border-red-600"
                                    />
                                </div>

                                {/* Foto KTP */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-slate-500">
                                        Foto KTP (disarankan)
                                    </label>
                                    <div
                                        onClick={() => ktpRef.current?.click()}
                                        className="relative flex h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-red-600"
                                    >
                                        {previews.ktp ? (
                                            <img src={previews.ktp} alt="KTP" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <UploadCloud className="h-8 w-8 text-slate-300" />
                                                <p className="text-xs font-bold text-slate-400">Ketuk untuk unggah foto KTP</p>
                                            </div>
                                        )}
                                        <input type="file" ref={ktpRef} hidden accept="image/*" onChange={e => handleMedia(e, 'ktp')} />
                                    </div>
                                </div>

                                {/* Edit mode: existing KTA badge */}
                                {isEditMode && existingNoKta && (
                                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">No. KTA Resmi</p>
                                        <p className="font-black text-slate-900 tracking-widest text-lg">{existingNoKta}</p>
                                        <p className="text-xs text-emerald-600 mt-1 font-medium">Nomor KTA bersifat permanen dan tidak akan berubah saat Anda mengedit profil.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ════════════════════ STEP 2: Alamat Domisili ════════════════════ */}
                        {step === 'alamat' && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">
                                        Alamat <span className="text-red-600">Domisili</span>
                                    </h1>
                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                        Pilih hingga level Desa/Kelurahan sesuai tempat tinggal Anda saat ini
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Province */}
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                                            Provinsi <span className="text-red-600">*</span>
                                            {loadingProvinces && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
                                        </label>
                                        <select
                                            disabled={loadingProvinces}
                                            value={sel.provinceId}
                                            onChange={e => {
                                                const id = e.target.value;
                                                const name = provinces.find(p => p.id === id)?.name || '';
                                                setSel({ provinceId: id, regencyId: '', districtId: '', villageId: '' });
                                                setSelNames({ provinceName: name, regencyName: '', districtName: '', villageName: '' });
                                            }}
                                            className="w-full appearance-none rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 font-bold text-slate-900 outline-none transition focus:border-red-600 disabled:bg-slate-50 disabled:text-slate-400"
                                        >
                                            <option value="">{loadingProvinces ? 'Memuat...' : 'Pilih Provinsi'}</option>
                                            {provinces.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>

                                    {/* Regency */}
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                                            Kabupaten / Kota
                                            {!sel.provinceId && <span className="normal-case font-normal text-slate-300">— pilih provinsi dulu</span>}
                                            {sel.provinceId && !loadingRegencies && <span className="text-red-600">*</span>}
                                            {loadingRegencies && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
                                        </label>
                                        <select
                                            disabled={!sel.provinceId || loadingRegencies}
                                            value={sel.regencyId}
                                            onChange={e => {
                                                const id = e.target.value;
                                                const name = regencies.find(r => r.id === id)?.name || '';
                                                setSel(prev => ({ ...prev, regencyId: id, districtId: '', villageId: '' }));
                                                setSelNames(prev => ({ ...prev, regencyName: name, districtName: '', villageName: '' }));
                                            }}
                                            className="w-full appearance-none rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 font-bold text-slate-900 outline-none transition focus:border-red-600 disabled:bg-slate-50 disabled:text-slate-300"
                                        >
                                            <option value="">{loadingRegencies ? 'Memuat...' : 'Pilih Kabupaten/Kota'}</option>
                                            {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>

                                    {/* District */}
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                                            Kecamatan
                                            {!sel.regencyId && <span className="normal-case font-normal text-slate-300">— pilih kab/kota dulu</span>}
                                            {sel.regencyId && !loadingDistricts && <span className="text-red-600">*</span>}
                                            {loadingDistricts && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
                                        </label>
                                        <select
                                            disabled={!sel.regencyId || loadingDistricts}
                                            value={sel.districtId}
                                            onChange={e => {
                                                const id = e.target.value;
                                                const name = districts.find(r => r.id === id)?.name || '';
                                                setSel(prev => ({ ...prev, districtId: id, villageId: '' }));
                                                setSelNames(prev => ({ ...prev, districtName: name, villageName: '' }));
                                            }}
                                            className="w-full appearance-none rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 font-bold text-slate-900 outline-none transition focus:border-red-600 disabled:bg-slate-50 disabled:text-slate-300"
                                        >
                                            <option value="">{loadingDistricts ? 'Memuat...' : 'Pilih Kecamatan'}</option>
                                            {districts.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>

                                    {/* Village */}
                                    <div>
                                        <label className="mb-1.5 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500">
                                            Desa / Kelurahan
                                            {!sel.districtId && <span className="normal-case font-normal text-slate-300">— pilih kecamatan dulu</span>}
                                            {sel.districtId && !loadingVillages && <span className="text-red-600">*</span>}
                                            {loadingVillages && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
                                        </label>
                                        <select
                                            disabled={!sel.districtId || loadingVillages}
                                            value={sel.villageId}
                                            onChange={e => {
                                                const id = e.target.value;
                                                const name = villages.find(r => r.id === id)?.name || '';
                                                setSel(prev => ({ ...prev, villageId: id }));
                                                setSelNames(prev => ({ ...prev, villageName: name }));
                                            }}
                                            className="w-full appearance-none rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 font-bold text-slate-900 outline-none transition focus:border-red-600 disabled:bg-slate-50 disabled:text-slate-300"
                                        >
                                            <option value="">{loadingVillages ? 'Memuat...' : 'Pilih Desa/Kelurahan'}</option>
                                            {villages.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>

                                    {/* Address summary card */}
                                    {sel.villageId && (
                                        <div className="rounded-2xl bg-emerald-50 px-5 py-4 border border-emerald-100">
                                            <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-1">Alamat Domisili Terpilih</p>
                                            <p className="font-bold text-slate-900 text-sm">{selNames.villageName}, Kec. {selNames.districtName}</p>
                                            <p className="text-xs text-slate-500 font-medium">{selNames.regencyName}, {selNames.provinceName}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ════════════════════ STEP 3: Wilayah Keanggotaan ════════════════════ */}
                        {step === 'kepengurusan' && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">
                                        Wilayah <span className="text-red-600">Keanggotaan</span>
                                    </h1>
                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                        Pilih tingkat kepengurusan sesuai peran Anda. Wilayah otomatis diambil dari alamat domisili.
                                    </p>
                                </div>

                                {/* Org Level Radio Cards */}
                                <div className="space-y-3">
                                    {ORG_LEVEL_OPTIONS.map((opt) => {
                                        const isDisabled = !!opt.disabled;
                                        const isSelected = orgLevel === opt.value && !isDisabled;

                                        // Compute the basis label for active options
                                        let basisText = '';
                                        if (!isDisabled && sel.villageId) {
                                            const mapped = getEffectiveWilayah(opt.value as OrgLevel, sel, selNames);
                                            basisText = mapped.name;
                                        }

                                        return (
                                            <button
                                                key={opt.label}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => !isDisabled && setOrgLevel(opt.value as OrgLevel)}
                                                className={`w-full text-left rounded-2xl border-2 px-5 py-4 transition-all active:scale-[0.98] ${isDisabled
                                                    ? 'border-slate-100 bg-slate-50 cursor-not-allowed opacity-60'
                                                    : isSelected
                                                        ? 'border-red-600 bg-red-50 shadow-lg shadow-red-100'
                                                        : 'border-slate-200 bg-white hover:border-slate-400'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {/* Radio indicator */}
                                                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${isDisabled ? 'border-slate-300 bg-slate-100' :
                                                        isSelected ? 'border-red-600 bg-red-600' :
                                                            'border-slate-300 bg-white'
                                                        }`}>
                                                        {isDisabled && <Lock className="h-2.5 w-2.5 text-slate-400" />}
                                                        {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className={`h-4 w-4 shrink-0 ${isDisabled ? 'text-slate-400' : isSelected ? 'text-red-600' : 'text-slate-500'}`} />
                                                            <p className={`font-black text-sm ${isDisabled ? 'text-slate-400' : isSelected ? 'text-red-700' : 'text-slate-800'}`}>
                                                                {opt.label}
                                                            </p>
                                                        </div>
                                                        <p className={`mt-0.5 text-xs font-medium ${isDisabled ? 'text-slate-400' : 'text-slate-500'}`}>
                                                            {isDisabled ? opt.disabledNote : opt.sub}
                                                        </p>
                                                        {/* Show resolved address basis */}
                                                        {!isDisabled && basisText && (
                                                            <p className={`mt-1 text-xs font-black uppercase tracking-wider ${isSelected ? 'text-red-600' : 'text-slate-400'}`}>
                                                                → {basisText}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Confirmation card once level selected */}
                                {orgLevel && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-5 py-4 space-y-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                            <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Wilayah Keanggotaan Dikonfirmasi</p>
                                        </div>
                                        <div>
                                            <span className="inline-block rounded-full bg-red-600 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white mb-1">
                                                {effectiveWilayah.levelLabel}
                                            </span>
                                            <p className="font-black text-slate-900 text-base uppercase tracking-wide">{effectiveWilayah.name}</p>
                                        </div>
                                        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                                            <p className="text-xs font-black text-amber-700">
                                                ⚠️ Nomor KTA hanya dapat di-generate <strong>1 kali</strong>. Pastikan tingkat kepengurusan sudah benar sebelum melanjutkan.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        )}

                        {/* ════════════════════ STEP 4: Preview KTA ════════════════════ */}
                        {step === 'preview' && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h1 className="text-2xl font-black tracking-tighter text-slate-900">
                                        {isEditMode ? 'Konfirmasi' : 'Preview'} <span className="text-red-600">KTA</span>
                                    </h1>
                                    <p className="mt-1 text-sm font-medium text-slate-500">
                                        {isEditMode ? 'Periksa perubahan sebelum menyimpan' : 'Periksa data sebelum melanjutkan ke pembayaran'}
                                    </p>
                                </div>

                                {/* KTA Card */}
                                <div className="w-full flex justify-center py-4 bg-slate-100 rounded-3xl overflow-hidden border-2 border-slate-200">
                                    <KtaCard
                                        scale={0.35}
                                        photoUrl={previews.photo || ''}
                                        displayName={form.displayName || 'NAMA ANDA'}
                                        orgLevel={orgLevel || undefined}
                                        regionNames={selNames}
                                        noKta={existingNoKta || '----------------'}
                                        isActive={!!existingNoKta}
                                    />
                                </div>

                                {/* Data confirmation table */}
                                <div className="rounded-2xl border-2 border-slate-100 bg-white p-5 space-y-3">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Konfirmasi Data Anda</h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">NIK</p>
                                            <p className="font-black text-slate-900 tracking-widest">{form.nik}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Nama</p>
                                            <p className="font-bold text-slate-900">{form.displayName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Tingkat Kepengurusan</p>
                                            <p className="font-bold text-slate-900">{effectiveWilayah.levelLabel || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Wilayah Keanggotaan</p>
                                            <p className="font-bold text-slate-900">{effectiveWilayah.name || '—'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Alamat Domisili</p>
                                            <p className="font-bold text-slate-900">
                                                {selNames.villageName}, Kec. {selNames.districtName}, {selNames.regencyName}, {selNames.provinceName}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment info or edit note */}
                                {!isEditMode && (
                                    <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4">
                                        <p className="text-xs font-black uppercase tracking-widest text-amber-700 mb-1">Selanjutnya</p>
                                        <p className="text-sm font-medium text-amber-800">
                                            Setelah konfirmasi, Anda akan diarahkan ke halaman pembayaran iuran keanggotaan <strong>Rp 25.000 / 2 Tahun</strong>.
                                            Nomor KTA akan diterbitkan otomatis setelah pembayaran dikonfirmasi.
                                        </p>
                                    </div>
                                )}
                                {isEditMode && existingNoKta && (
                                    <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-4">
                                        <p className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-1">Info KTA</p>
                                        <p className="text-sm font-medium text-emerald-800">
                                            Nomor KTA Anda (<strong>{existingNoKta}</strong>) bersifat permanen dan tidak akan berubah setelah edit profil.
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Navigation Buttons ── */}
                    <div className="mt-8 flex gap-3">
                        {step !== 'data-diri' && (
                            <button
                                onClick={handlePrevStep}
                                className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 py-4 font-black text-slate-700 transition hover:border-slate-900 hover:text-slate-900 active:scale-95"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        )}
                        <button
                            onClick={step === 'preview' ? handleSubmit : handleNextStep}
                            disabled={stepDisabledNext}
                            className="flex flex-1 items-center justify-center gap-3 rounded-2xl bg-red-600 px-6 py-4 font-black text-white shadow-xl shadow-red-200 transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : step === 'preview' ? (
                                isEditMode
                                    ? <><Save className="h-5 w-5" /> Simpan Perubahan</>
                                    : <>Simpan &amp; Lanjut ke Pembayaran <ArrowRight className="h-5 w-5" /></>
                            ) : step === 'data-diri' && !canProceedStep1 ? (
                                <>Lengkapi Data Diri</>
                            ) : step === 'alamat' && !canProceedStep2 ? (
                                <>Pilih Desa/Kelurahan</>
                            ) : step === 'kepengurusan' && !canProceedStep3 ? (
                                <>Pilih Tingkat Kepengurusan</>
                            ) : (
                                <>Lanjut <ArrowRight className="h-5 w-5" /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── KTP Cropper Modal ── */}
            <AnimatePresence>
                {showCropper && cropImageSrc && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative flex h-full max-h-[600px] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b px-6 py-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Atur Foto KTP</h3>
                                <button onClick={() => setShowCropper(false)} className="rounded-full p-2 hover:bg-slate-100">
                                    <X className="h-5 w-5 text-slate-500" />
                                </button>
                            </div>

                            <div className="relative flex-1 bg-slate-100">
                                <Cropper
                                    image={cropImageSrc}
                                    crop={crop}
                                    zoom={zoom}
                                    rotation={rotation}
                                    aspect={4 / 2.5} // Standard ID Card Ratio
                                    onCropChange={setCrop}
                                    onRotationChange={setRotation}
                                    onZoomChange={setZoom}
                                    onCropComplete={handleCropComplete}
                                />
                            </div>

                            <div className="border-t bg-white px-6 py-6">
                                <div className="mb-6 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <RotateCw className="h-4 w-4 text-slate-400" />
                                        <input
                                            type="range"
                                            value={rotation}
                                            min={0}
                                            max={360}
                                            step={1}
                                            onChange={(e) => setRotation(Number(e.target.value))}
                                            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-red-600"
                                        />
                                        <span className="min-w-[40px] text-right text-xs font-bold text-slate-600">{rotation}°</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Camera className="h-4 w-4 text-slate-400" />
                                        <input
                                            type="range"
                                            value={zoom}
                                            min={1}
                                            max={3}
                                            step={0.1}
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-red-600"
                                        />
                                        <span className="min-w-[40px] text-right text-xs font-bold text-slate-600">{zoom.toFixed(1)}x</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCropper(false)}
                                        className="flex-1 rounded-2xl border-2 border-slate-200 py-4 text-sm font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={processCrop}
                                        className="flex-1 rounded-2xl bg-red-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-slate-900 active:scale-95"
                                    >
                                        Simpan Foto
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Toast message={toast.message} visible={toast.show} onClose={() => setToast(t => ({ ...t, show: false }))} />
        </div>
    );
}
