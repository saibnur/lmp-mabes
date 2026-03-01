'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Shield, UserCheck, ChevronDown, MapPin } from 'lucide-react';
import type { Member, Kepengurusan } from '@/models/member.types';
import { useRegions } from '@/viewmodels/useRegions';
import toast from 'react-hot-toast';

interface EditRoleModalProps {
    member: Member | null;
    onClose: () => void;
    onSave: (params: { uid: string; role: string; kepengurusan?: Kepengurusan | null; organization?: any }) => Promise<void>;
    isUpdating: boolean;
}

const KEPENGURUSAN_LEVELS: { value: Kepengurusan['level']; label: string }[] = [
    { value: 'pusat', label: 'Pusat' },
    { value: 'provinsi', label: 'Provinsi' },
    { value: 'kab_kota', label: 'Kabupaten / Kota' },
    { value: 'kecamatan', label: 'Kecamatan' },
    { value: 'kelurahan', label: 'Kelurahan / Desa' },
];

// ── CSS Vars (sesuai template LMP) ────────────────────────────
// --lmp-red: #dc2626   --lmp-red-dark: #b91c1c  --lmp-red-light: #fef2f2
// --lmp-white: #ffffff --lmp-black: #0f172a      --lmp-slate: #64748b

const selectCls =
    'w-full appearance-none rounded-xl border border-slate-200 bg-white ' +
    'py-2.5 pl-3.5 pr-9 text-sm text-[#0f172a] outline-none transition-all ' +
    'focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/15 ' +
    'disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white ' +
    'py-2.5 px-3.5 text-sm text-[#0f172a] placeholder:text-slate-400 outline-none transition-all ' +
    'focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/15';

const labelCls = 'mb-1.5 block text-[10px] font-black uppercase tracking-[0.1em] text-[#64748b]';

function SelectField({ label, value, onChange, disabled, children }: {
    label: string; value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className={labelCls}>{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className={selectCls}
                >
                    {children}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
        </div>
    );
}

export default function EditRoleModal({ member, onClose, onSave, isUpdating }: EditRoleModalProps) {
    const [role, setRole] = useState<string>('member');
    const [enableKepengurusan, setEnableKepengurusan] = useState(false);
    const [level, setLevel] = useState<Kepengurusan['level']>('kelurahan');
    const [regionId, setRegionId] = useState('');
    const [regionName, setRegionName] = useState('');
    const [jabatan, setJabatan] = useState('');
    const [provinceId, setProvinceId] = useState('');
    const [cityId, setCityId] = useState('');
    const [districtId, setDistrictId] = useState('');

    const { provinces, cities, districts, villages } = useRegions(provinceId, cityId, districtId);

    useEffect(() => {
        if (!member) return;
        setRole(member.role);

        if (member.kepengurusan) {
            setEnableKepengurusan(true);
            setLevel(member.kepengurusan.level);
            setRegionId(member.kepengurusan.region_id || '');
            setRegionName(member.kepengurusan.region_name || '');
            setJabatan(member.kepengurusan.jabatan || '');

            // ── Isi cascading IDs agar dropdown wilayah terbuka dengan benar ──
            const kep = member.kepengurusan;
            const org = member.organization;

            if (kep.level === 'pusat') {
                setProvinceId('31');
                setCityId('3174');
                setDistrictId('3174040');
            } else if (kep.level === 'provinsi') {
                setProvinceId(kep.region_id);
                setCityId('');
                setDistrictId('');
            } else if (kep.level === 'kab_kota') {
                setProvinceId(org?.province_id || '');
                setCityId(kep.region_id);
                setDistrictId('');
            } else if (kep.level === 'kecamatan') {
                setProvinceId(org?.province_id || '');
                setCityId(org?.regency_id || '');
                setDistrictId(kep.region_id);
            } else if (kep.level === 'kelurahan') {
                setProvinceId(org?.province_id || '');
                setCityId(org?.regency_id || '');
                setDistrictId(org?.district_id || '');
            }
        } else {
            setEnableKepengurusan(false);
            setLevel('kelurahan');
            setRegionId('');
            setRegionName('');
            setJabatan('');
            setProvinceId('');
            setCityId('');
            setDistrictId('');
        }
    }, [member]);

    if (!member) return null;

    const getRegionOptions = () => {
        switch (level) {
            case 'pusat': return [];
            case 'provinsi': return provinces;
            case 'kab_kota': return cities;
            case 'kecamatan': return districts;
            case 'kelurahan': return villages;
            default: return [];
        }
    };

    const handleRegionSelect = (id: string) => {
        setRegionId(id);
        const found = getRegionOptions().find(o => o.id === id);
        setRegionName(found?.name || '');
    };

    const handleSubmit = async () => {
        if (!member) return;

        if (enableKepengurusan && level !== 'pusat' && !regionId) {
            toast.error('Pilih wilayah kepengurusan terlebih dahulu');
            return;
        }

        const kepengurusan: Kepengurusan | null = enableKepengurusan
            ? { level, region_id: regionId, region_name: regionName, jabatan }
            : null;

        const levelMapping: Record<string, any> = {
            'pusat': 'pusat',
            'provinsi': 'daerah',
            'kab_kota': 'cabang',
            'kecamatan': 'anak-cabang',
            'kelurahan': 'ranting'
        };

        let organizationPayload: any = undefined;

        if (enableKepengurusan) {
            organizationPayload = {
                level: levelMapping[level] || ''
            };

            // Helper for names
            const getProvName = (id: string) => provinces.find(p => p.id === id)?.name || '';
            const getRegName = (id: string) => cities.find(c => c.id === id)?.name || '';
            const getDistName = (id: string) => districts.find(d => d.id === id)?.name || '';
            const getVilName = (id: string) => villages.find(v => v.id === id)?.name || '';

            if (level === 'pusat') {
                const finalKepengurusan = {
                    level: 'pusat' as const,
                    region_id: '3174040004',
                    region_name: 'GROGOL',
                    jabatan
                };
                Object.assign(organizationPayload, {
                    province_id: '31',
                    province_name: 'DKI JAKARTA',
                    regency_id: '3174',
                    regency_name: 'KOTA JAKARTA BARAT',
                    district_id: '3174040',
                    district_name: 'GROGOL PETAMBURAN',
                    village_id: '3174040004',
                    village_name: 'GROGOL'
                });

                try {
                    await onSave({ uid: member.uid, role, kepengurusan: finalKepengurusan, organization: organizationPayload });
                    console.log('✅ onSave berhasil (Pusat)');
                    onClose();
                } catch (err) {
                    console.error('❌ onSave error:', err);
                }
                return;
            }

            if (level === 'provinsi') {
                Object.assign(organizationPayload, {
                    province_id: regionId,
                    province_name: regionName,
                    regency_id: '', regency_name: '',
                    district_id: '', district_name: '',
                    village_id: '', village_name: ''
                });
            } else if (level === 'kab_kota') {
                Object.assign(organizationPayload, {
                    province_id: provinceId,
                    province_name: getProvName(provinceId),
                    regency_id: regionId,
                    regency_name: regionName,
                    district_id: '', district_name: '',
                    village_id: '', village_name: ''
                });
            } else if (level === 'kecamatan') {
                Object.assign(organizationPayload, {
                    province_id: provinceId,
                    province_name: getProvName(provinceId),
                    regency_id: cityId,
                    regency_name: getRegName(cityId),
                    district_id: regionId,
                    district_name: regionName,
                    village_id: '', village_name: ''
                });
            } else if (level === 'kelurahan') {
                Object.assign(organizationPayload, {
                    province_id: provinceId,
                    province_name: getProvName(provinceId),
                    regency_id: cityId,
                    regency_name: getRegName(cityId),
                    district_id: districtId,
                    district_name: getDistName(districtId),
                    village_id: regionId,
                    village_name: regionName
                });
            }
        }

        // ── DEBUG ──
        console.log('=== SUBMIT PAYLOAD ===');
        console.log('uid:', member.uid);
        console.log('role:', role);
        console.log('kepengurusan:', JSON.stringify(kepengurusan, null, 2));
        console.log('organization update:', JSON.stringify(organizationPayload, null, 2));
        console.log('======================');

        try {
            await onSave({ uid: member.uid, role, kepengurusan, organization: organizationPayload });
            console.log('✅ onSave berhasil');
            onClose();
        } catch (err) {
            console.error('❌ onSave error:', err);
        }
    };

    return (
        /* Overlay — dark semi-transparent blur */
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center
                        p-0 sm:p-4 bg-[#0f172a]/70 backdrop-blur-sm">

            {/* Panel */}
            <div className="relative w-full sm:max-w-md bg-white
                            rounded-t-[28px] sm:rounded-2xl
                            shadow-[0_32px_80px_rgba(220,38,38,0.12),0_8px_32px_rgba(15,23,42,0.18)]
                            flex flex-col overflow-hidden max-h-[92dvh]">

                {/* ── Red-to-black gradient stripe ── */}
                <div className="h-[3px] w-full shrink-0
                                bg-gradient-to-r from-[#dc2626] via-[#b91c1c] to-[#0f172a]" />

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-5 pt-4 pb-4 shrink-0
                                border-b border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center
                                        rounded-xl bg-[#fef2f2] border border-red-100">
                            <Shield className="h-5 w-5 text-[#dc2626]" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[15px] font-black text-[#0f172a] leading-tight">
                                Edit Role & Kepengurusan
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                                <p className="text-xs text-[#64748b] truncate">
                                    {member.displayName}
                                </p>
                                {member.no_kta && (
                                    <span className="shrink-0 font-mono text-[9px] font-bold
                                                     bg-slate-100 text-[#64748b] px-1.5 py-0.5 rounded-md">
                                        {member.no_kta}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="shrink-0 rounded-xl p-2 text-slate-400
                                   hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* ── Scrollable body ── */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                    {/* Role selection */}
                    <div>
                        <p className={labelCls}>Role Anggota</p>
                        <div className="grid grid-cols-2 gap-2.5">
                            {(['member', 'admin'] as const).map((r) => {
                                const isActive = role === r;
                                const isAdmin = r === 'admin';
                                return (
                                    <button
                                        key={r}
                                        onClick={() => setRole(r)}
                                        className={`flex items-center justify-center gap-2 rounded-xl
                                                    py-3 text-sm font-bold border-2
                                                    transition-all duration-150 active:scale-[0.97]
                                                    ${isActive
                                                ? isAdmin
                                                    ? 'bg-[#dc2626] border-[#dc2626] text-white shadow-[0_4px_16px_rgba(220,38,38,0.30)]'
                                                    : 'bg-[#0f172a] border-[#0f172a] text-white shadow-[0_4px_16px_rgba(15,23,42,0.20)]'
                                                : 'bg-white border-slate-200 text-[#64748b] hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        {isAdmin
                                            ? <Shield className="h-4 w-4" />
                                            : <UserCheck className="h-4 w-4" />
                                        }
                                        {isAdmin ? 'Admin' : 'Member'}
                                    </button>
                                );
                            })}
                        </div>
                        {role === 'admin' && (
                            <p className="mt-2 text-[11px] font-semibold text-[#dc2626] px-0.5">
                                ⚠️ Admin memiliki akses penuh ke panel ini.
                            </p>
                        )}
                    </div>

                    {/* Kepengurusan toggle */}
                    <label className={`flex items-start gap-3 cursor-pointer rounded-xl p-3.5
                                       border-2 select-none transition-all duration-200
                                       ${enableKepengurusan
                            ? 'border-[#fca5a5] bg-[#fef2f2]'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                        }`}>
                        {/* Custom checkbox */}
                        <div className={`relative mt-0.5 h-5 w-5 shrink-0 rounded-md border-2
                                         overflow-hidden transition-all duration-150
                                         ${enableKepengurusan
                                ? 'bg-[#dc2626] border-[#dc2626]'
                                : 'bg-white border-slate-300'
                            }`}>
                            <input
                                type="checkbox"
                                checked={enableKepengurusan}
                                onChange={e => setEnableKepengurusan(e.target.checked)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {enableKepengurusan && (
                                <svg viewBox="0 0 12 12" fill="none"
                                    className="absolute inset-0 m-auto h-3 w-3 text-white">
                                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2"
                                        strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#0f172a]">
                                Tetapkan sebagai Pengurus
                            </p>
                            <p className="text-xs text-[#64748b] mt-0.5">
                                Isi tingkat dan wilayah kepengurusan
                            </p>
                        </div>
                    </label>

                    {/* Kepengurusan detail — collapsible */}
                    {enableKepengurusan && (
                        <div className="rounded-xl border-2 border-[#fca5a5] bg-[#fff7f7]
                                        p-4 space-y-3.5
                                        animate-in fade-in slide-in-from-top-2 duration-200">

                            {/* Section heading */}
                            <div className="flex items-center gap-2 pb-2 border-b border-[#fecaca]">
                                <MapPin className="h-3.5 w-3.5 text-[#dc2626]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-[#dc2626]">
                                    Detail Wilayah
                                </span>
                            </div>

                            <SelectField
                                label="Tingkat Kepengurusan"
                                value={level}
                                onChange={v => {
                                    const newLvl = v as Kepengurusan['level'];
                                    setLevel(newLvl);
                                    if (newLvl === 'pusat') {
                                        setRegionId('3174040004');
                                        setRegionName('GROGOL');
                                        setProvinceId('31');
                                        setCityId('3174');
                                        setDistrictId('3174040');
                                    } else {
                                        setRegionId(''); setRegionName('');
                                    }
                                }}
                            >
                                {KEPENGURUSAN_LEVELS.map(l => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </SelectField>

                            {level !== 'provinsi' && level !== 'pusat' && (
                                <SelectField
                                    label="Provinsi"
                                    value={provinceId}
                                    onChange={v => {
                                        setProvinceId(v);
                                        setCityId(''); setDistrictId(''); setRegionId('');
                                    }}
                                >
                                    <option value="">Pilih Provinsi</option>
                                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </SelectField>
                            )}

                            {(level === 'kecamatan' || level === 'kelurahan') && (
                                <SelectField
                                    label="Kabupaten / Kota"
                                    value={cityId}
                                    onChange={v => { setCityId(v); setDistrictId(''); setRegionId(''); }}
                                    disabled={!provinceId}
                                >
                                    <option value="">Pilih Kab/Kota</option>
                                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </SelectField>
                            )}

                            {level === 'kelurahan' && (
                                <SelectField
                                    label="Kecamatan"
                                    value={districtId}
                                    onChange={v => { setDistrictId(v); setRegionId(''); }}
                                    disabled={!cityId}
                                >
                                    <option value="">Pilih Kecamatan</option>
                                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </SelectField>
                            )}

                            {level !== 'pusat' && (
                                <SelectField
                                    label="Wilayah Kepengurusan"
                                    value={regionId}
                                    onChange={handleRegionSelect}
                                >
                                    <option value="">Pilih Wilayah</option>
                                    {getRegionOptions().map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </SelectField>
                            )}

                            <div>
                                <label className={labelCls}>
                                    Jabatan{' '}
                                    <span className="normal-case font-medium opacity-60">(opsional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={jabatan}
                                    onChange={e => setJabatan(e.target.value)}
                                    placeholder="Ketua, Sekretaris, Bendahara..."
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="shrink-0 flex gap-3 px-5 py-4
                                border-t border-slate-100 bg-slate-50">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border-2 border-slate-200 bg-white
                                   py-2.5 text-sm font-bold text-[#64748b]
                                   hover:border-slate-300 hover:bg-slate-50
                                   active:scale-[0.97] transition-all duration-150"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isUpdating}
                        className="flex flex-1 items-center justify-center gap-2
                                   rounded-xl bg-[#dc2626] py-2.5 text-sm font-bold text-white
                                   hover:bg-[#b91c1c] active:scale-[0.97]
                                   shadow-[0_4px_16px_rgba(220,38,38,0.30)]
                                   disabled:opacity-50 disabled:cursor-not-allowed
                                   transition-all duration-150"
                    >
                        {isUpdating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <UserCheck className="h-4 w-4" />
                                Simpan Perubahan
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}