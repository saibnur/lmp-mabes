'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Shield, UserCheck } from 'lucide-react';
import type { Member, Kepengurusan } from '@/models/member.types';
import { useRegions } from '@/viewmodels/useRegions';

interface EditRoleModalProps {
    member: Member | null;
    onClose: () => void;
    onSave: (params: { uid: string; role: string; kepengurusan?: Kepengurusan | null }) => Promise<void>;
    isUpdating: boolean;
}

const KEPENGURUSAN_LEVELS: { value: Kepengurusan['level']; label: string }[] = [
    { value: 'provinsi', label: 'Provinsi' },
    { value: 'kab_kota', label: 'Kabupaten/Kota' },
    { value: 'kecamatan', label: 'Kecamatan' },
    { value: 'kelurahan', label: 'Kelurahan/Desa' },
];

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

    // Initialize from member data
    useEffect(() => {
        if (member) {
            setRole(member.role);
            if (member.kepengurusan) {
                setEnableKepengurusan(true);
                setLevel(member.kepengurusan.level);
                setRegionId(member.kepengurusan.region_id || '');
                setRegionName(member.kepengurusan.region_name || '');
                setJabatan(member.kepengurusan.jabatan || '');
            } else {
                setEnableKepengurusan(false);
            }
        }
    }, [member]);

    if (!member) return null;

    // Get region select options based on level
    const getRegionOptions = () => {
        switch (level) {
            case 'provinsi': return provinces;
            case 'kab_kota': return cities;
            case 'kecamatan': return districts;
            case 'kelurahan': return villages;
            default: return [];
        }
    };

    const handleRegionSelect = (id: string) => {
        setRegionId(id);
        const options = getRegionOptions();
        const found = options.find(o => o.id === id);
        setRegionName(found?.name || '');
    };

    const handleSubmit = async () => {
        const kepengurusan: Kepengurusan | null = enableKepengurusan
            ? { level, region_id: regionId, region_name: regionName, jabatan }
            : null;

        await onSave({ uid: member.uid, role, kepengurusan });
        onClose();
    };

    const inputClass =
        'w-full rounded-xl border border-border-custom bg-surface py-2.5 px-3 text-sm text-white outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border border-border-custom bg-[#0f172a] p-6 shadow-2xl">
                {/* Header */}
                <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/20">
                            <Shield className="h-5 w-5 text-brand-light" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-white">Edit Role & Kepengurusan</h3>
                            <p className="text-xs text-text-muted">{member.displayName} • {member.no_kta || 'No KTA'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 text-text-muted hover:bg-surface-hover">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Role selection */}
                <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-text-muted">Role</label>
                    <div className="flex gap-3">
                        {(['member', 'admin'] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRole(r)}
                                className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all
                  ${role === r
                                        ? 'border-brand bg-brand/15 text-brand-light'
                                        : 'border-border-custom text-text-muted hover:border-brand/50'
                                    }`}
                            >
                                {r === 'admin' ? '🛡 Admin' : '👤 Member'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Kepengurusan toggle */}
                <div className="mb-4">
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            checked={enableKepengurusan}
                            onChange={(e) => setEnableKepengurusan(e.target.checked)}
                            className="h-4 w-4 rounded border-border-custom bg-surface text-brand accent-brand"
                        />
                        <span className="text-sm font-medium text-text-muted">Tetapkan sebagai Pengurus</span>
                    </label>
                </div>

                {enableKepengurusan && (
                    <div className="space-y-3 rounded-xl border border-border-custom/50 bg-surface/50 p-4 mb-4">
                        {/* Level */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-text-muted">Tingkat Kepengurusan</label>
                            <select
                                value={level}
                                onChange={(e) => {
                                    setLevel(e.target.value as Kepengurusan['level']);
                                    setRegionId('');
                                    setRegionName('');
                                }}
                                className={inputClass + ' appearance-none cursor-pointer'}
                            >
                                {KEPENGURUSAN_LEVELS.map((l) => (
                                    <option key={l.value} value={l.value}>{l.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Parent region selectors */}
                        {level !== 'provinsi' && (
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-text-muted">Provinsi</label>
                                <select
                                    value={provinceId}
                                    onChange={(e) => { setProvinceId(e.target.value); setCityId(''); setDistrictId(''); setRegionId(''); }}
                                    className={inputClass + ' appearance-none cursor-pointer'}
                                >
                                    <option value="">Pilih Provinsi</option>
                                    {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        )}

                        {(level === 'kecamatan' || level === 'kelurahan') && (
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-text-muted">Kabupaten/Kota</label>
                                <select
                                    value={cityId}
                                    onChange={(e) => { setCityId(e.target.value); setDistrictId(''); setRegionId(''); }}
                                    className={inputClass + ' appearance-none cursor-pointer'}
                                    disabled={!provinceId}
                                >
                                    <option value="">Pilih Kab/Kota</option>
                                    {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        )}

                        {level === 'kelurahan' && (
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-text-muted">Kecamatan</label>
                                <select
                                    value={districtId}
                                    onChange={(e) => { setDistrictId(e.target.value); setRegionId(''); }}
                                    className={inputClass + ' appearance-none cursor-pointer'}
                                    disabled={!cityId}
                                >
                                    <option value="">Pilih Kecamatan</option>
                                    {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                                </select>
                            </div>
                        )}

                        {/* Target region */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-text-muted">Wilayah Kepengurusan</label>
                            <select
                                value={regionId}
                                onChange={(e) => handleRegionSelect(e.target.value)}
                                className={inputClass + ' appearance-none cursor-pointer'}
                            >
                                <option value="">Pilih Wilayah</option>
                                {getRegionOptions().map((r) => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Jabatan */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-text-muted">Jabatan (opsional)</label>
                            <input
                                type="text"
                                value={jabatan}
                                onChange={(e) => setJabatan(e.target.value)}
                                placeholder="Contoh: Ketua, Sekretaris..."
                                className={inputClass}
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl border border-border-custom py-2.5 text-sm font-medium text-text-muted transition hover:bg-surface-hover"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isUpdating}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-white transition hover:bg-brand-light disabled:opacity-60"
                    >
                        {isUpdating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <UserCheck className="h-4 w-4" />
                                Simpan
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
