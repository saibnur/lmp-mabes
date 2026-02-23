'use client';

import { Search, Phone, Mail, X } from 'lucide-react';

interface MemberSearchProps {
    value: string;
    onChange: (v: string) => void;
    email: string;
    onEmailChange: (v: string) => void;
    phone: string;
    onPhoneChange: (v: string) => void;
}

function SearchField({
    value,
    onChange,
    placeholder,
    icon: Icon,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    icon: React.ElementType;
}) {
    return (
        <div className="relative flex-1 min-w-[200px]">
            <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-border-custom bg-surface py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-text-muted/60
                           focus:border-brand-primary/50 focus:outline-none focus:ring-4 focus:ring-brand-primary/5 transition-all shadow-sm"
            />
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

export default function MemberSearch({
    value,
    onChange,
    email,
    onEmailChange,
    phone,
    onPhoneChange,
}: MemberSearchProps) {
    return (
        <div className="bg-surface p-4 rounded-xl border border-border-custom shadow-sm flex flex-wrap gap-3">
            <SearchField
                value={value}
                onChange={onChange}
                placeholder="Cari Nama / No. KTA..."
                icon={Search}
            />
            <SearchField
                value={email}
                onChange={onEmailChange}
                placeholder="Cari Email..."
                icon={Mail}
            />
            <SearchField
                value={phone}
                onChange={onPhoneChange}
                placeholder="Cari No. HP..."
                icon={Phone}
            />
        </div>
    );
}
