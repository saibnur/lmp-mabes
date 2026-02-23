'use client';

import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    label: string;
    value: number | string;
    icon: LucideIcon;
    color: 'brand' | 'success' | 'warning' | 'danger' | 'accent';
    subtitle?: string;
}

const COLOR_MAP = {
    brand: {
        bg: 'bg-brand/10',
        text: 'text-brand-primary',
        glow: 'shadow-brand/5',
    },
    success: {
        bg: 'bg-success/10',
        text: 'text-success',
        glow: 'shadow-success/5',
    },
    warning: {
        bg: 'bg-warning/10',
        text: 'text-warning',
        glow: 'shadow-warning/5',
    },
    danger: {
        bg: 'bg-danger/10',
        text: 'text-danger',
        glow: 'shadow-danger/5',
    },
    accent: {
        bg: 'bg-accent/10',
        text: 'text-accent',
        glow: 'shadow-accent/5',
    },
};

export default function StatsCard({ label, value, icon: Icon, color, subtitle }: StatsCardProps) {
    const c = COLOR_MAP[color];

    return (
        <div className={`glass-card flex items-center gap-4 p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${c.glow}`}>
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${c.bg}`}>
                <Icon className={`h-6 w-6 ${c.text}`} />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">{label}</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                    <p className="text-2xl font-black text-foreground">{value}</p>
                </div>
                {subtitle && <p className="text-[10px] text-text-muted mt-0.5 font-medium">{subtitle}</p>}
            </div>
        </div>
    );
}
