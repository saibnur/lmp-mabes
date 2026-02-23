'use client';

import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import type { RegistrationDataPoint, TimeRange } from '@/models/member.types';

interface RegistrationChartProps {
    data: RegistrationDataPoint[];
    range: TimeRange;
    onRangeChange: (range: TimeRange) => void;
    selectedDate?: string;
    onDateChange?: (date: string) => void;
}

const RANGES: { value: TimeRange; label: string }[] = [
    { value: 'hourly', label: 'Harian' },
    { value: 'weekly', label: 'Mingguan' },
    { value: 'monthly', label: 'Bulanan' },
    { value: 'yearly', label: 'Tahunan' },
];

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color: string }>;
    label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-border-custom bg-white p-3 shadow-xl">
            <p className="mb-1.5 text-xs font-semibold text-text-muted">{label}</p>
            {payload.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-text-muted">{p.name}:</span>
                    <span className="font-bold text-foreground">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

export default function RegistrationChart({
    data,
    range,
    onRangeChange,
    selectedDate,
    onDateChange,
}: RegistrationChartProps) {
    const hasData = useMemo(() => data.some(d => d.active > 0 || d.pending > 0), [data]);

    return (
        <div className="glass-card p-5 lmp-glow">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-black text-foreground">Grafik Pendaftaran Member</h3>
                    <p className="mt-0.5 text-xs text-text-muted">Aktif (Hijau) vs Pending (Kuning)</p>
                </div>

                {/* Range tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Date picker — only for hourly */}
                    {range === 'hourly' && onDateChange && (
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => onDateChange(e.target.value)}
                            className="rounded-lg border border-border-custom bg-surface-hover px-2 py-1.5 text-xs text-foreground focus:border-brand-primary focus:outline-none transition-colors"
                        />
                    )}
                    <div className="flex gap-1 rounded-xl bg-surface-hover p-1 border border-border-custom">
                        {RANGES.map((r) => (
                            <button
                                key={r.value}
                                onClick={() => onRangeChange(r.value)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200
                                ${range === r.value
                                        ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                                        : 'text-text-muted hover:text-foreground'
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="h-72 w-full">
                {!hasData ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                        <div className="h-12 w-12 rounded-full border-2 border-border-custom flex items-center justify-center">
                            <span className="text-text-muted/30 text-xl">📊</span>
                        </div>
                        <p className="text-sm text-text-muted">Belum ada data pendaftaran</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                            <XAxis
                                dataKey="label"
                                tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                formatter={(val) => (
                                    <span className="text-xs font-semibold text-text-muted">{val}</span>
                                )}
                            />
                            <Line
                                type="monotone"
                                dataKey="active"
                                name="Aktif"
                                stroke="#10B981"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }}
                                activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="pending"
                                name="Pending"
                                stroke="#F59E0B"
                                strokeWidth={3}
                                dot={{ r: 4, fill: '#F59E0B', strokeWidth: 0 }}
                                activeDot={{ r: 6, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }}
                                strokeDasharray="5 5"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
