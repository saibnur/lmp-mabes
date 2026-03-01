'use client';

import { Search, X } from 'lucide-react';

interface MemberSearchProps {
    value: string;
    onChange: (v: string) => void;
    // Prop lama dipertahankan agar tidak breaking change,
    // tapi tidak dipakai di UI — filtering dilakukan di viewmodel
    email?: string;
    onEmailChange?: (v: string) => void;
    phone?: string;
    onPhoneChange?: (v: string) => void;
}

export default function MemberSearch({ value, onChange }: MemberSearchProps) {
    return (
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Cari nama, no. KTA, email, atau no. HP..."
                className="w-full rounded-xl border border-border-custom bg-surface
                           py-2.5 pl-10 pr-9
                           text-sm text-foreground placeholder:text-text-muted/50
                           focus:border-brand-primary/50 focus:outline-none focus:ring-4 focus:ring-brand-primary/5
                           transition-all shadow-sm"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}