'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Save, RotateCcw, Download, ChevronDown, ChevronUp,
    Eye, Layers, Image as ImageIcon, Type, User, Hash,
    ShieldCheck, Monitor, CheckCircle2, AlertTriangle,
    Loader2, ArrowLeft, AlignLeft, AlignCenter, AlignRight,
    Move, Underline, Bold, Minus, Plus, ZapOff, Zap,
} from 'lucide-react';
import KtaCard from '@/features/kta/components/KtaCard';
import { KtaCardConfig, DEFAULT_KTA_CONFIG, LayerConfig, TingkatConfig } from '@/features/kta/types/KtaCardConfig';

// ─── Utilities ────────────────────────────────────────────────────────────────

function deepMerge<T>(base: T, override: Partial<T>): T {
    const result = { ...base };
    for (const key in override) {
        const val = override[key];
        if (val && typeof val === 'object' && !Array.isArray(val)) {
            result[key] = deepMerge((base as any)[key] ?? {}, val as any);
        } else if (val !== undefined) {
            result[key] = val as any;
        }
    }
    return result;
}

// ─── UI Atoms ─────────────────────────────────────────────────────────────────

function Section({ title, icon, defaultOpen = false, children }: {
    title: string; icon: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
            <button type="button" onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 text-slate-800 font-bold text-sm">
                    <span className="text-red-600">{icon}</span>{title}
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {open && <div className="px-5 pb-5 pt-1 border-t border-slate-100">{children}</div>}
        </div>
    );
}

function Label({ children }: { children: React.ReactNode }) {
    return <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{children}</p>;
}

function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
    return (
        <div className={`grid gap-3 mb-3 ${cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
            {children}
        </div>
    );
}

function NumInput({ value, onChange, min = 0, max = 2000, step = 1, suffix }: {
    value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string;
}) {
    return (
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
            <button type="button" onClick={() => onChange(+(Math.max(min, value - step).toFixed(2)))}
                className="px-2 py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0">
                <Minus className="w-3 h-3" />
            </button>
            <input type="number" value={value}
                onChange={e => onChange(parseFloat(e.target.value) || 0)}
                min={min} max={max} step={step}
                className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none text-center" />
            <button type="button" onClick={() => onChange(+(Math.min(max, value + step).toFixed(2)))}
                className="px-2 py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0">
                <Plus className="w-3 h-3" />
            </button>
            {suffix && <span className="px-2 text-xs text-slate-400 font-bold shrink-0">{suffix}</span>}
        </div>
    );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5">
            <input type="color" value={value} onChange={e => onChange(e.target.value)}
                className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent shrink-0" />
            <input type="text" value={value} onChange={e => onChange(e.target.value)}
                className="w-full bg-transparent text-xs font-mono font-bold text-slate-800 outline-none uppercase" maxLength={9} />
        </div>
    );
}

function TextInput({ value, onChange, placeholder, mono }: {
    value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean;
}) {
    return (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
            className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm ${mono ? 'font-mono' : 'font-bold'} text-slate-800 outline-none focus:border-red-400 transition-colors`} />
    );
}

function SelectInput({ value, onChange, options }: {
    value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
    return (
        <select value={value} onChange={e => onChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-red-400 transition-colors">
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
    return (
        <button type="button" onClick={() => onChange(!value)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-colors
                ${value ? 'bg-red-600 border-red-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            <span className={`w-3 h-3 rounded-full border-2 border-current ${value ? 'bg-white' : 'bg-transparent'}`} />
            {label ?? (value ? 'ON' : 'OFF')}
        </button>
    );
}

function AlignPicker({ value, onChange }: {
    value: 'left' | 'center' | 'right'; onChange: (v: 'left' | 'center' | 'right') => void;
}) {
    return (
        <div className="flex rounded-xl overflow-hidden border border-slate-200">
            {(['left', 'center', 'right'] as const).map(a => (
                <button key={a} type="button" onClick={() => onChange(a)}
                    className={`flex-1 flex items-center justify-center py-2 text-xs font-bold transition-colors
                        ${value === a ? 'bg-red-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                    {a === 'left' ? <AlignLeft className="w-4 h-4" /> : a === 'center' ? <AlignCenter className="w-4 h-4" /> : <AlignRight className="w-4 h-4" />}
                </button>
            ))}
        </div>
    );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT_OPTIONS = [
    { value: 'Anton', label: 'Anton' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Montserrat', label: 'Montserrat' },
    { value: 'Inter', label: 'Inter' },
    { value: 'Oswald', label: 'Oswald' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Arial', label: 'Arial' },
    { value: 'Arial Narrow', label: 'Arial Narrow' },
];

const OBJECTFIT_OPTIONS = [
    { value: 'fill', label: 'Fill (Penuh)' },
    { value: 'cover', label: 'Cover (Crop)' },
    { value: 'contain', label: 'Contain (Fit)' },
];

// ─── Layer sub-editors ───────────────────────────────────────────────────────

function StrokeUnderlineEditor({ lyr, onChange }: {
    lyr: Pick<LayerConfig, 'stroke' | 'strokeColor' | 'strokeWidth' | 'underline' | 'underlineColor' | 'underlineWidth' | 'underlineGap' | 'underlineStroke' | 'underlineStrokeColor' | 'underlineStrokeWidth'>;
    onChange: (p: Partial<LayerConfig>) => void;
}) {
    return (
        <>
            {/* Stroke */}
            <div className="rounded-xl bg-slate-50 p-3 space-y-3 border border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Bold className="w-3.5 h-3.5 text-red-600" /><Label>Stroke Teks</Label></div>
                    <Toggle value={lyr.stroke} onChange={v => onChange({ stroke: v })} />
                </div>
                {lyr.stroke && (
                    <Row cols={2}>
                        <div><Label>Warna Stroke</Label><ColorInput value={lyr.strokeColor} onChange={v => onChange({ strokeColor: v })} /></div>
                        <div><Label>Tebal (px)</Label><NumInput value={lyr.strokeWidth} onChange={v => onChange({ strokeWidth: v })} min={0} max={20} step={0.5} suffix="px" /></div>
                    </Row>
                )}
            </div>
            {/* Underline */}
            <div className="rounded-xl bg-slate-50 p-3 space-y-3 border border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Underline className="w-3.5 h-3.5 text-red-600" /><Label>Garis Bawah</Label></div>
                    <Toggle value={lyr.underline} onChange={v => onChange({ underline: v })} />
                </div>
                {lyr.underline && (
                    <div className="space-y-3">
                        <Row cols={2}>
                            <div><Label>Warna Garis</Label><ColorInput value={lyr.underlineColor} onChange={v => onChange({ underlineColor: v })} /></div>
                            <div><Label>Ketebalan</Label><NumInput value={lyr.underlineWidth} onChange={v => onChange({ underlineWidth: v })} min={0.5} max={20} step={0.5} suffix="px" /></div>
                        </Row>
                        <div><Label>Jarak dari Teks (px)</Label><NumInput value={lyr.underlineGap} onChange={v => onChange({ underlineGap: v })} min={0} max={50} step={0.5} suffix="px" /></div>
                        <div className="flex items-center justify-between pt-1">
                            <Label>Stroke Garis Bawah</Label>
                            <Toggle value={lyr.underlineStroke} onChange={v => onChange({ underlineStroke: v })} />
                        </div>
                        {lyr.underlineStroke && (
                            <Row cols={2}>
                                <div><Label>Warna Stroke Garis</Label><ColorInput value={lyr.underlineStrokeColor} onChange={v => onChange({ underlineStrokeColor: v })} /></div>
                                <div><Label>Tebal Stroke</Label><NumInput value={lyr.underlineStrokeWidth} onChange={v => onChange({ underlineStrokeWidth: v })} min={0} max={10} step={0.5} suffix="px" /></div>
                            </Row>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

/** Full layer editor (for nama, jabatan, kta, expired) */
function LayerEditor({ lyr, onChange, showBold }: {
    lyr: LayerConfig; onChange: (p: Partial<LayerConfig>) => void; showBold?: boolean;
}) {
    return (
        <div className="space-y-4">
            {/* Sample Value */}
            <div>
                <Label>Teks Contoh / Default</Label>
                <TextInput value={lyr.value} onChange={v => onChange({ value: v })} placeholder="Teks..." />
            </div>
            {/* Position */}
            <div>
                <div className="flex items-center gap-2 mb-2"><Move className="w-3.5 h-3.5 text-red-600" /><Label>Posisi &amp; Lebar Area</Label></div>
                <Row cols={3}>
                    <div><Label>X</Label><NumInput value={lyr.x} onChange={v => onChange({ x: v })} min={-200} max={2000} suffix="px" /></div>
                    <div><Label>Y</Label><NumInput value={lyr.y} onChange={v => onChange({ y: v })} min={-200} max={2000} suffix="px" /></div>
                    <div><Label>Lebar</Label><NumInput value={lyr.width} onChange={v => onChange({ width: v })} min={10} max={2000} suffix="px" /></div>
                </Row>
            </div>
            {/* Align */}
            <div><Label>Perataan Teks</Label><AlignPicker value={lyr.align} onChange={v => onChange({ align: v })} /></div>
            {/* Font */}
            <div>
                <div className="flex items-center gap-2 mb-2"><Type className="w-3.5 h-3.5 text-red-600" /><Label>Font &amp; Ukuran</Label></div>
                <Row cols={2}>
                    <div><Label>Font</Label><SelectInput value={lyr.font} onChange={v => onChange({ font: v })} options={FONT_OPTIONS} /></div>
                    <div><Label>Ukuran (px)</Label><NumInput value={lyr.size} onChange={v => onChange({ size: v })} min={6} max={300} step={1} suffix="px" /></div>
                </Row>
                <div><Label>Letter Spacing</Label><NumInput value={lyr.letterSpacing} onChange={v => onChange({ letterSpacing: v })} min={-10} max={50} step={0.5} suffix="px" /></div>
            </div>
            {/* Bold toggle (optional, e.g. for Jabatan) */}
            {showBold && (
                <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <div className="flex items-center gap-2">
                        <Bold className="w-3.5 h-3.5 text-red-600" />
                        <Label>Bold (Font-Weight)</Label>
                    </div>
                    <Toggle value={lyr.bold ?? false} onChange={v => onChange({ bold: v })} label={lyr.bold ? 'Bold ON' : 'Bold OFF'} />
                </div>
            )}
            {/* Color */}
            <div><Label>Warna Teks</Label><ColorInput value={lyr.color} onChange={v => onChange({ color: v })} /></div>
            <StrokeUnderlineEditor lyr={lyr} onChange={onChange} />
        </div>
    );
}

/** Tingkat editor — 2-baris terpisah dengan font independen & auto-scale */
function TingkatEditor({ tin, onChange }: {
    tin: TingkatConfig; onChange: (p: Partial<TingkatConfig>) => void;
}) {
    return (
        <div className="space-y-5">
            {/* Shared visual */}
            <div>
                <div className="flex items-center gap-2 mb-2"><Label>Warna &amp; Tipografi (shared)</Label></div>
                <div className="mb-3"><Label>Perataan Teks (shared)</Label><AlignPicker value={tin.align} onChange={v => onChange({ align: v })} /></div>
                <Row cols={2}>
                    <div><Label>Letter Spacing</Label><NumInput value={tin.letterSpacing} onChange={v => onChange({ letterSpacing: v })} min={-10} max={50} step={0.5} suffix="px" /></div>
                    <div><Label>Warna Teks (shared)</Label><ColorInput value={tin.color} onChange={v => onChange({ color: v })} /></div>
                </Row>
            </div>
            <StrokeUnderlineEditor lyr={tin as any} onChange={p => onChange(p as Partial<TingkatConfig>)} />

            {/* Auto-Scale Container Width (shared) */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-2">
                <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                        Lebar Container Auto-Scale
                    </p>
                </div>
                <p className="text-[10px] text-indigo-500 font-medium">
                    Batas lebar (px) yang digunakan saat Auto-Scale aktif pada salah satu baris.
                    Tidak mempengaruhi baris yang Auto-Scale-nya OFF.
                </p>
                <NumInput
                    value={tin.autoScaleContainerWidth ?? 760}
                    onChange={v => onChange({ autoScaleContainerWidth: v })}
                    min={50} max={2000} step={10} suffix="px"
                />
            </div>

            {/* Line 1 */}
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-4 space-y-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-blue-700">
                    Baris 1 — Label Level<br />
                    <span className="font-medium normal-case text-blue-500">"MARKAS", "MARKAS RANTING", "MARKAS CABANG", dst.</span>
                </p>
                <div><Label>Teks Contoh</Label><TextInput value={tin.line1Value} onChange={v => onChange({ line1Value: v })} placeholder="MARKAS RANTING" /></div>
                <Row cols={3}>
                    <div><Label>X</Label><NumInput value={tin.line1X} onChange={v => onChange({ line1X: v })} min={-200} max={2000} suffix="px" /></div>
                    <div><Label>Y</Label><NumInput value={tin.line1Y} onChange={v => onChange({ line1Y: v })} min={-200} max={2000} suffix="px" /></div>
                    <div><Label>Lebar Area</Label><NumInput value={tin.line1Width} onChange={v => onChange({ line1Width: v })} min={10} max={2000} suffix="px" /></div>
                </Row>
                <Row cols={2}>
                    <div><Label>Font Baris 1</Label><SelectInput value={tin.line1Font ?? 'Anton'} onChange={v => onChange({ line1Font: v })} options={FONT_OPTIONS} /></div>
                    <div><Label>Ukuran Font (px)</Label><NumInput value={tin.line1Size} onChange={v => onChange({ line1Size: v })} min={6} max={300} step={1} suffix="px" /></div>
                </Row>
                {/* Auto-scale toggle */}
                <div className="flex items-center justify-between rounded-xl bg-white border border-blue-100 px-3 py-2">
                    <div className="flex items-center gap-2">
                        {tin.line1AutoScale ? <Zap className="w-3.5 h-3.5 text-blue-600" /> : <ZapOff className="w-3.5 h-3.5 text-slate-400" />}
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Auto-Scale Teks</span>
                    </div>
                    <Toggle value={tin.line1AutoScale ?? false} onChange={v => onChange({ line1AutoScale: v })}
                        label={tin.line1AutoScale ? 'Auto-Fit ON' : 'Auto-Fit OFF'} />
                </div>
                {tin.line1AutoScale && (
                    <p className="text-[10px] text-blue-600 font-medium bg-blue-100 rounded-lg px-3 py-2">
                        ⚡ Teks akan direntang/dipersempit agar memenuhi Lebar Container ({tin.autoScaleContainerWidth ?? 760}px).
                        Lihat bagian "Lebar Container Auto-Scale" di atas untuk mengubah nilainya.
                    </p>
                )}
            </div>

            {/* Line 2 */}
            <div className="rounded-xl border-2 border-purple-200 bg-purple-50/50 p-4 space-y-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-purple-700">
                    Baris 2 — Nama Wilayah<br />
                    <span className="font-medium normal-case text-purple-500">"KEBAYORAN BARU", "DKI JAKARTA", dst. (tersembunyi jika hanya "MARKAS")</span>
                </p>
                <div><Label>Teks Contoh</Label><TextInput value={tin.line2Value} onChange={v => onChange({ line2Value: v })} placeholder="KEBAYORAN BARU" /></div>
                <Row cols={3}>
                    <div><Label>X</Label><NumInput value={tin.line2X} onChange={v => onChange({ line2X: v })} min={-200} max={2000} suffix="px" /></div>
                    <div><Label>Y</Label><NumInput value={tin.line2Y} onChange={v => onChange({ line2Y: v })} min={-200} max={2000} suffix="px" /></div>
                    <div><Label>Lebar Area</Label><NumInput value={tin.line2Width} onChange={v => onChange({ line2Width: v })} min={10} max={2000} suffix="px" /></div>
                </Row>
                <Row cols={2}>
                    <div><Label>Font Baris 2</Label><SelectInput value={tin.line2Font ?? 'Anton'} onChange={v => onChange({ line2Font: v })} options={FONT_OPTIONS} /></div>
                    <div><Label>Ukuran Font (px)</Label><NumInput value={tin.line2Size} onChange={v => onChange({ line2Size: v })} min={6} max={300} step={1} suffix="px" /></div>
                </Row>
                {/* Auto-scale toggle */}
                <div className="flex items-center justify-between rounded-xl bg-white border border-purple-100 px-3 py-2">
                    <div className="flex items-center gap-2">
                        {tin.line2AutoScale ? <Zap className="w-3.5 h-3.5 text-purple-600" /> : <ZapOff className="w-3.5 h-3.5 text-slate-400" />}
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Auto-Scale Teks</span>
                    </div>
                    <Toggle value={tin.line2AutoScale ?? false} onChange={v => onChange({ line2AutoScale: v })}
                        label={tin.line2AutoScale ? 'Auto-Fit ON' : 'Auto-Fit OFF'} />
                </div>
                {tin.line2AutoScale && (
                    <p className="text-[10px] text-purple-600 font-medium bg-purple-100 rounded-lg px-3 py-2">
                        ⚡ Teks akan direntang/dipersempit agar memenuhi Lebar Container ({tin.autoScaleContainerWidth ?? 760}px).
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Preview Modes ────────────────────────────────────────────────────────────

type PreviewMode = 'hanya_markas' | 'ranting' | 'anak_cabang' | 'cabang' | 'daerah';

const PREVIEW_LEVELS: Record<PreviewMode, {
    label: string;
    orgLevel: 'daerah' | 'cabang' | 'anak-cabang' | 'ranting' | '';
    regionNames: { provinceName: string; regencyName: string; districtName: string; villageName: string };
}> = {
    hanya_markas: {
        label: 'MARKAS',
        orgLevel: '',
        regionNames: { provinceName: '', regencyName: '', districtName: '', villageName: '' },
    },
    ranting: {
        label: 'RANTING',
        orgLevel: 'ranting',
        regionNames: {
            provinceName: 'DKI Jakarta',
            regencyName: 'Kota Jakarta Selatan',
            districtName: 'Kebayoran Baru',
            villageName: 'Kelurahan Senayan',
        },
    },
    anak_cabang: {
        label: 'ANAK CABANG',
        orgLevel: 'anak-cabang',
        regionNames: {
            provinceName: 'Jawa Barat',
            regencyName: 'Kabupaten Bogor',
            districtName: 'Kecamatan Ciomas',
            villageName: 'Desa Ciomas',
        },
    },
    cabang: {
        label: 'CABANG',
        orgLevel: 'cabang',
        regionNames: {
            provinceName: 'Jawa Barat',
            regencyName: 'Kabupaten Bogor',
            districtName: '',
            villageName: '',
        },
    },
    daerah: {
        label: 'DAERAH',
        orgLevel: 'daerah',
        regionNames: {
            provinceName: 'DKI Jakarta',
            regencyName: '',
            districtName: '',
            villageName: '',
        },
    },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KtaFormatEditorPage() {
    const router = useRouter();
    const [config, setConfig] = useState<KtaCardConfig>(DEFAULT_KTA_CONFIG);
    const [savedConfig, setSavedConfig] = useState<KtaCardConfig>(DEFAULT_KTA_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isDirty, setIsDirty] = useState(false);
    const [previewMode, setPreviewMode] = useState<PreviewMode>('ranting');

    // Load config from API (Firestore)
    useEffect(() => {
        fetch('/api/kta-config')
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then((data: KtaCardConfig) => {
                const merged = deepMerge(DEFAULT_KTA_CONFIG, data);
                setConfig(merged);
                setSavedConfig(merged);
            })
            .catch(() => {
                setConfig(DEFAULT_KTA_CONFIG);
                setSavedConfig(DEFAULT_KTA_CONFIG);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setIsDirty(JSON.stringify(config) !== JSON.stringify(savedConfig));
    }, [config, savedConfig]);

    // ── Updaters ──────────────────────────────────────────────────────────

    const updateCanvas = useCallback(<K extends keyof KtaCardConfig['canvas']>(
        field: K, value: KtaCardConfig['canvas'][K]
    ) => setConfig(p => ({ ...p, canvas: { ...p.canvas, [field]: value } })), []);

    const updatePreviewScale = useCallback((scale: number) =>
        setConfig(p => ({ ...p, preview: { scale } })), []);

    const updateBg = useCallback(<K extends keyof KtaCardConfig['background']>(
        field: K, value: KtaCardConfig['background'][K]
    ) => setConfig(p => ({ ...p, background: { ...p.background, [field]: value } })), []);

    const updatePhoto = useCallback(<K extends keyof KtaCardConfig['photo']>(
        field: K, value: KtaCardConfig['photo'][K]
    ) => setConfig(p => ({ ...p, photo: { ...p.photo, [field]: value } })), []);

    const updateLayer = useCallback(<L extends keyof KtaCardConfig['layers']>(
        layer: L, patch: Partial<KtaCardConfig['layers'][L]>
    ) => setConfig(p => ({
        ...p,
        layers: { ...p.layers, [layer]: { ...p.layers[layer], ...patch } },
    })), []);

    // ── Save / Reset ──────────────────────────────────────────────────────

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: KtaCardConfig = { ...config, _updatedAt: new Date().toISOString() };
            const res = await fetch('/api/kta-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || err.error || res.statusText);
            }
            setSavedConfig(payload);
            setConfig(payload);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (e) {
            console.error('Save error:', e);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 4000);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => setConfig(savedConfig);

    const handleDownloadJson = () => {
        const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'kta-config.json'; a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
        );
    }

    const previewScale = config.preview?.scale ?? 0.5;
    const currentPreview = PREVIEW_LEVELS[previewMode];

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ── Toolbar ── */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                <div className="mx-auto max-w-screen-2xl px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-bold">
                            <ArrowLeft className="w-4 h-4" /> Kembali
                        </button>
                        <div className="h-5 w-px bg-slate-200" />
                        <div>
                            <h1 className="text-base font-black text-slate-900 uppercase tracking-tighter">
                                KTA Format <span className="text-red-600">Editor</span>
                            </h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                Config disimpan di Firestore
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {isDirty && (
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                                <AlertTriangle className="w-3 h-3" /> Belum Disimpan
                            </span>
                        )}
                        {saveStatus === 'success' && (
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Tersimpan ke Firestore!
                            </span>
                        )}
                        {saveStatus === 'error' && (
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
                                <AlertTriangle className="w-3 h-3" /> Gagal Simpan
                            </span>
                        )}
                        <button onClick={handleDownloadJson}
                            className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:border-slate-900 transition-colors">
                            <Download className="w-3.5 h-3.5" /> Export JSON
                        </button>
                        <button onClick={handleReset} disabled={!isDirty}
                            className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 hover:border-slate-900 transition-colors disabled:opacity-30">
                            <RotateCcw className="w-3.5 h-3.5" /> Reset
                        </button>
                        <button onClick={handleSave} disabled={saving || !isDirty}
                            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-xs font-black text-white hover:bg-slate-900 transition-colors disabled:opacity-40 shadow-lg shadow-red-200">
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Simpan Format
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="mx-auto max-w-screen-2xl px-6 py-8">
                <div className="grid grid-cols-1 xl:grid-cols-[460px_1fr] gap-8">

                    {/* ── LEFT: Controls ── */}
                    <div className="space-y-3">

                        {/* Canvas & Preview Scale */}
                        <Section title="Canvas — Dimensi &amp; Preview" icon={<Monitor className="w-4 h-4" />} defaultOpen>
                            <p className="text-[10px] text-slate-500 font-medium mb-3">
                                Canvas = ukuran asli file export (px). Preview scale = skala tampilan editor saja.
                            </p>
                            <Row cols={2}>
                                <div><Label>Lebar Canvas (px)</Label><NumInput value={config.canvas.width} onChange={v => updateCanvas('width', v)} min={300} max={2000} step={10} suffix="px" /></div>
                                <div><Label>Tinggi Canvas (px)</Label><NumInput value={config.canvas.height} onChange={v => updateCanvas('height', v)} min={400} max={3000} step={10} suffix="px" /></div>
                                <div><Label>Border Radius</Label><NumInput value={config.canvas.borderRadius} onChange={v => updateCanvas('borderRadius', v)} min={0} max={100} suffix="px" /></div>
                                <div><Label>Warna Latar</Label><ColorInput value={config.canvas.backgroundColor} onChange={v => updateCanvas('backgroundColor', v)} /></div>
                            </Row>
                            <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
                                <Label>Skala Preview (editor saja, tidak memengaruhi export)</Label>
                                <div className="flex items-center gap-3 mt-1">
                                    <input type="range" min={0.2} max={1} step={0.05} value={previewScale}
                                        onChange={e => updatePreviewScale(parseFloat(e.target.value))}
                                        className="flex-1 accent-red-600" />
                                    <span className="text-sm font-black text-indigo-700 w-12 text-right">{Math.round(previewScale * 100)}%</span>
                                </div>
                                <p className="text-[10px] text-indigo-600 font-medium mt-1">
                                    Tampilan: {Math.round(config.canvas.width * previewScale)} × {Math.round(config.canvas.height * previewScale)} px
                                </p>
                            </div>
                        </Section>

                        {/* Background */}
                        <Section title="Background Image" icon={<ImageIcon className="w-4 h-4" />}>
                            <div className="space-y-3">
                                <div><Label>URL Gambar</Label><TextInput value={config.background.imageUrl} onChange={v => updateBg('imageUrl', v)} placeholder="https://..." /></div>
                                <div><Label>Fit Mode</Label><SelectInput value={config.background.objectFit} onChange={v => updateBg('objectFit', v as any)} options={OBJECTFIT_OPTIONS} /></div>
                            </div>
                        </Section>

                        {/* Photo */}
                        <Section title="Foto Profil" icon={<User className="w-4 h-4" />}>
                            <Row cols={2}>
                                <div><Label>X (kiri)</Label><NumInput value={config.photo.left} onChange={v => updatePhoto('left', v)} suffix="px" /></div>
                                <div><Label>Y (atas)</Label><NumInput value={config.photo.top} onChange={v => updatePhoto('top', v)} suffix="px" /></div>
                                <div><Label>Ukuran</Label><NumInput value={config.photo.size} onChange={v => updatePhoto('size', v)} min={20} max={800} suffix="px" /></div>
                                <div><Label>Tebal Border</Label><NumInput value={config.photo.borderWidth} onChange={v => updatePhoto('borderWidth', v)} step={0.5} suffix="px" /></div>
                                <div className="col-span-2"><Label>Warna Border</Label><ColorInput value={config.photo.borderColor} onChange={v => updatePhoto('borderColor', v)} /></div>
                                <div className="col-span-2"><Label>Border Radius</Label><TextInput value={config.photo.borderRadius} onChange={v => updatePhoto('borderRadius', v)} placeholder="50% atau 8px" /></div>
                            </Row>
                        </Section>

                        {/* Tingkat */}
                        <Section title="Layer: Tingkat / Level Organisasi (2 Baris)" icon={<Layers className="w-4 h-4" />}>
                            <TingkatEditor tin={config.layers.tingkat} onChange={p => updateLayer('tingkat', p as any)} />
                        </Section>

                        {/* Nama */}
                        <Section title="Layer: Nama Anggota (Underline Dinamis)" icon={<Type className="w-4 h-4" />}>
                            <p className="text-[10px] text-emerald-700 font-medium bg-emerald-50 rounded-lg px-3 py-2 mb-3">
                                ✨ Garis bawah Nama mengikuti panjang teks secara otomatis (dynamic underline).
                            </p>
                            <LayerEditor lyr={config.layers.nama} onChange={p => updateLayer('nama', p)} />
                        </Section>

                        {/* Jabatan */}
                        <Section title="Layer: Jabatan" icon={<ShieldCheck className="w-4 h-4" />}>
                            <LayerEditor lyr={config.layers.jabatan} onChange={p => updateLayer('jabatan', p)} showBold />
                        </Section>

                        {/* No KTA */}
                        <Section title="Layer: Nomor KTA" icon={<Hash className="w-4 h-4" />}>
                            <LayerEditor lyr={config.layers.kta} onChange={p => updateLayer('kta', p)} />
                        </Section>

                        {/* Expired */}
                        <Section title="Layer: Tanggal Expired / Status" icon={<Eye className="w-4 h-4" />}>
                            <LayerEditor lyr={config.layers.expired} onChange={p => updateLayer('expired', p)} />
                        </Section>

                        {/* Raw JSON */}
                        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                                <Eye className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-bold text-slate-800">Raw JSON Config</span>
                            </div>
                            <div className="p-4">
                                <pre className="text-[10px] text-slate-500 font-mono overflow-auto max-h-64 leading-relaxed whitespace-pre-wrap break-all">
                                    {JSON.stringify(config, null, 2)}
                                </pre>
                            </div>
                        </div>

                    </div>

                    {/* ── RIGHT: Live Preview ── */}
                    <div className="xl:sticky xl:top-[73px] xl:self-start space-y-4">
                        <div className="rounded-3xl border-2 border-slate-200 bg-white overflow-hidden shadow-xl">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Eye className="w-4 h-4 text-red-600" />
                                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight">Live Preview</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400">
                                        {config.canvas.width} × {config.canvas.height} px
                                    </span>
                                    {isDirty && <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />}
                                </div>
                            </div>

                            {/* Level switcher */}
                            <div className="px-6 pt-4 flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">Preview Tingkat:</span>
                                {(Object.entries(PREVIEW_LEVELS) as [PreviewMode, typeof PREVIEW_LEVELS[PreviewMode]][]).map(([k, v]) => (
                                    <button key={k} type="button" onClick={() => setPreviewMode(k)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors border
                                            ${previewMode === k ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                                        {v.label}
                                    </button>
                                ))}
                            </div>

                            {/* Preview Area */}
                            <div
                                className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center overflow-auto"
                                style={{ minHeight: Math.min(config.canvas.height * previewScale + 48, 720) }}
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-full blur-3xl bg-red-600/20 scale-75" />
                                    <KtaCard
                                        config={config}
                                        scale={previewScale}
                                        photoUrl=""
                                        displayName="BUDI SANTOSO"
                                        orgLevel={currentPreview.orgLevel}
                                        regionNames={currentPreview.regionNames}
                                        jabatanText="KETUA RANTING"
                                        noKta="31.07.25.01.0001"
                                        isActive={true}
                                        expiryDate={new Date('2026-12-31')}
                                    />
                                </div>
                            </div>

                            {/* Save reminder */}
                            <div className={`mx-6 mb-6 mt-4 rounded-xl p-4 text-center transition-all ${isDirty ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                                {isDirty ? (
                                    <p className="text-xs font-bold text-amber-700">
                                        ⚠️ Perubahan belum disimpan. Klik <strong>Simpan Format</strong> → tersimpan ke Firestore.
                                    </p>
                                ) : (
                                    <p className="text-xs font-bold text-emerald-700">
                                        ✅ Format tersimpan di Firestore — aktif digunakan semua KTA Card.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="rounded-2xl bg-slate-900 p-6 text-white">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-3">Cara Kerja</h3>
                            <ul className="space-y-2 text-slate-400 text-xs font-medium">
                                <li className="flex gap-2"><span className="text-red-500 shrink-0">01.</span>Ubah nilai di panel kiri — preview berubah realtime.</li>
                                <li className="flex gap-2"><span className="text-red-500 shrink-0">02.</span>Canvas = ukuran asli (export). Preview scale = tampilan editor saja.</li>
                                <li className="flex gap-2"><span className="text-red-500 shrink-0">03.</span>Layer <strong className="text-white">Tingkat</strong> punya 2 baris dengan font & auto-scale independen.</li>
                                <li className="flex gap-2"><span className="text-red-500 shrink-0">04.</span>Underline Nama mengikuti panjang teks secara otomatis.</li>
                                <li className="flex gap-2"><span className="text-red-500 shrink-0">05.</span>Klik <strong className="text-white">Simpan Format</strong> → disimpan ke <code className="text-emerald-400">Firestore: config/kta</code>.</li>
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
