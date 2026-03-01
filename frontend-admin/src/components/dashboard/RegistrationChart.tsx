'use client';

import { useMemo, useState } from 'react';
import {
    AreaChart, Area,
    XAxis, YAxis,
    CartesianGrid, Tooltip,
    ResponsiveContainer,
} from 'recharts';
import type { RegistrationDataPoint, TimeRange } from '@/models/member.types';
import { TrendingUp } from 'lucide-react';

interface RegistrationChartProps {
    data: RegistrationDataPoint[];
    range: TimeRange;
    onRangeChange: (range: TimeRange) => void;
    isLoading?: boolean;
}

const RANGES: { value: TimeRange; label: string; desc: string }[] = [
    { value: 'daily', label: 'Harian', desc: '7 hari terakhir' },
    { value: 'weekly', label: 'Mingguan', desc: '8 minggu terakhir' },
    { value: 'monthly', label: 'Bulanan', desc: '12 bulan terakhir' },
    { value: 'yearly', label: 'Tahunan', desc: '5 tahun terakhir' },
];

// ── Skeleton bar chart — animasi pulse menyerupai bar vertikal ──
function ChartSkeleton() {
    // Tinggi bar bervariasi agar terlihat natural seperti grafik sungguhan
    const bars = [30, 55, 40, 70, 50, 85, 45, 65];
    return (
        <div className="flex h-full w-full items-end justify-between gap-1.5 px-1 pb-6">
            {bars.map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                    {/* Bar aktif */}
                    <div
                        className="w-full rounded-t-md bg-emerald-100 animate-pulse"
                        style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
                    />
                    {/* Bar pending (lebih pendek) */}
                    <div
                        className="w-full rounded-t-md bg-amber-100 animate-pulse"
                        style={{ height: `${h * 0.4}%`, animationDelay: `${i * 60 + 30}ms` }}
                    />
                    {/* Label sumbu X */}
                    <div
                        className="h-2.5 w-full max-w-[32px] rounded bg-slate-100 animate-pulse"
                        style={{ animationDelay: `${i * 60}ms` }}
                    />
                </div>
            ))}
        </div>
    );
}

// ── Skeleton pill (legend) ──
function PillSkeleton() {
    return (
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 border border-border-custom bg-surface-hover">
            <div className="h-2.5 w-2.5 rounded-full bg-slate-200 animate-pulse" />
            <div className="space-y-1">
                <div className="h-2 w-10 rounded bg-slate-200 animate-pulse" />
                <div className="h-4 w-8 rounded bg-slate-200 animate-pulse" />
            </div>
        </div>
    );
}

function CustomTooltip({ active, payload, label, showActive, showPending }: {
    active?: boolean;
    payload?: Array<{ dataKey: string; value: number }>;
    label?: string;
    showActive: boolean;
    showPending: boolean;
}) {
    if (!active || !payload?.length) return null;
    const a = payload.find(p => p.dataKey === 'active');
    const p = payload.find(p => p.dataKey === 'pending');
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xl min-w-[150px]">
            <p className="mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
            {showActive && a && (
                <div className="flex items-center justify-between gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />Aktif
                    </span>
                    <span className="font-black text-slate-800">{a.value}</span>
                </div>
            )}
            {showPending && p && (
                <div className="flex items-center justify-between gap-4 text-xs mt-1">
                    <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />Pending
                    </span>
                    <span className="font-black text-slate-800">{p.value}</span>
                </div>
            )}
            {showActive && showPending && a && p && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-xs">
                    <span className="text-slate-400">Total</span>
                    <span className="font-black text-slate-800">{a.value + p.value}</span>
                </div>
            )}
        </div>
    );
}

function LegendPill({ label, value, dotColor, active, onClick }: {
    label: string; value: number; dotColor: string;
    active: boolean; onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 border
                        transition-all duration-200 select-none
                        ${active
                    ? 'border-border-custom bg-surface-hover'
                    : 'border-transparent opacity-40 grayscale hover:opacity-60'
                }`}
        >
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
            <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted leading-none">{label}</p>
                <p className="text-base font-black text-foreground leading-tight mt-0.5">
                    {value.toLocaleString('id-ID')}
                </p>
            </div>
        </button>
    );
}

export default function RegistrationChart({ data, range, onRangeChange, isLoading = false }: RegistrationChartProps) {
    const [showActive, setShowActive] = useState(true);
    const [showPending, setShowPending] = useState(true);

    const hasData = useMemo(() => data.some(d => d.active > 0 || d.pending > 0), [data]);

    const totals = useMemo(() => ({
        active: data.reduce((s, d) => s + (d.active ?? 0), 0),
        pending: data.reduce((s, d) => s + (d.pending ?? 0), 0),
    }), [data]);

    const currentRange = RANGES.find(r => r.value === range);

    return (
        <div className="glass-card p-4 sm:p-5 lmp-glow overflow-hidden">

            {/* ── Header ── */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-brand-primary shrink-0" />
                        {isLoading ? (
                            <div className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
                        ) : (
                            <h3 className="text-sm sm:text-base font-black text-foreground">
                                Tren Pendaftaran Member
                            </h3>
                        )}
                    </div>
                    {isLoading ? (
                        <div className="mt-1.5 h-3 w-24 rounded bg-slate-100 animate-pulse" />
                    ) : (
                        <p className="mt-0.5 text-xs text-text-muted">{currentRange?.desc}</p>
                    )}
                </div>

                {/* Range tabs — tetap tampil saat loading agar bisa diklik */}
                <div className="flex w-full sm:w-auto gap-1 rounded-xl bg-surface-hover p-1
                                border border-border-custom shrink-0">
                    {RANGES.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => onRangeChange(r.value)}
                            disabled={isLoading}
                            className={`flex-1 sm:flex-none rounded-lg px-2.5 sm:px-3 py-1.5
                                        text-[11px] sm:text-xs font-bold whitespace-nowrap
                                        transition-all duration-200 disabled:cursor-wait
                                        ${range === r.value
                                    ? 'bg-slate-800 text-white shadow-md'
                                    : 'text-text-muted hover:text-foreground hover:bg-surface'
                                }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Legend pills ── */}
            <div className="flex items-center gap-1 sm:gap-2 mb-4 flex-wrap">
                {isLoading ? (
                    <>
                        <PillSkeleton />
                        <div className="h-8 w-px bg-border-custom/40 mx-1" />
                        <PillSkeleton />
                    </>
                ) : (
                    <>
                        <LegendPill label="Aktif" value={totals.active}
                            dotColor="#10B981" active={showActive}
                            onClick={() => setShowActive(v => !v)} />
                        <div className="h-8 w-px bg-border-custom/40 mx-1" />
                        <LegendPill label="Pending" value={totals.pending}
                            dotColor="#F59E0B" active={showPending}
                            onClick={() => setShowPending(v => !v)} />
                        <p className="text-[10px] text-text-muted/50 ml-1 hidden sm:block self-end pb-0.5">
                            ← klik untuk sembunyikan
                        </p>
                    </>
                )}
            </div>

            {/* ── Chart area ── */}
            <div className="w-full min-w-0" style={{ height: '240px' }}>
                {isLoading ? (
                    <ChartSkeleton />
                ) : !hasData ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3">
                        <div className="h-14 w-14 rounded-2xl border-2 border-dashed border-border-custom
                                        flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-text-muted/30" />
                        </div>
                        <p className="text-sm text-text-muted font-medium">Belum ada data pendaftaran</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.2} />
                                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
                                tickLine={false} axisLine={false}
                                interval="preserveStartEnd" minTickGap={28}
                            />
                            <YAxis
                                tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}
                                tickLine={false} axisLine={false}
                                allowDecimals={false} width={28}
                            />
                            <Tooltip
                                content={<CustomTooltip showActive={showActive} showPending={showPending} />}
                                cursor={{ stroke: 'rgba(0,0,0,0.07)', strokeWidth: 1.5 }}
                            />
                            {showActive && (
                                <Area type="monotone" dataKey="active" name="Aktif"
                                    stroke="#10B981" strokeWidth={2.5} fill="url(#gradActive)"
                                    dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }}
                                    activeDot={{ r: 5, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                                />
                            )}
                            {showPending && (
                                <Area type="monotone" dataKey="pending" name="Pending"
                                    stroke="#F59E0B" strokeWidth={2.5} strokeDasharray="5 5"
                                    fill="url(#gradPending)"
                                    dot={{ r: 3, fill: '#F59E0B', strokeWidth: 0 }}
                                    activeDot={{ r: 5, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
                                />
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Footer */}
            {isLoading ? (
                <div className="mt-3 flex justify-end">
                    <div className="h-2.5 w-32 rounded bg-slate-100 animate-pulse" />
                </div>
            ) : hasData && (
                <p className="mt-3 text-[10px] text-text-muted/50 text-right font-medium">
                    {range === 'daily' ? 'Data 7 hari terakhir' :
                        range === 'weekly' ? 'Dikelompokkan per minggu' :
                            range === 'monthly' ? 'Dikelompokkan per bulan' :
                                'Dikelompokkan per tahun'}
                </p>
            )}
        </div>
    );
}