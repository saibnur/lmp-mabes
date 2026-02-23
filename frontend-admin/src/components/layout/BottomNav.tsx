'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ShieldCheck, Newspaper } from 'lucide-react';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/dashboard/members', label: 'Members', icon: Users },
    { href: '/dashboard/verification', label: 'Verifikasi', icon: ShieldCheck },
    { href: '/dashboard/news', label: 'Berita', icon: Newspaper },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border-custom bg-surface/95 backdrop-blur-xl lg:hidden shadow-[0_-4px_12px_rgba(26,43,95,0.05)]">
            {NAV_ITEMS.map((item) => {
                const isActive =
                    item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-semibold transition-all duration-200
                            ${isActive ? 'text-brand-primary' : 'text-text-muted hover:text-foreground'}`}
                    >
                        {isActive && (
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b-full bg-brand-primary shadow-[0_2px_4px_rgba(204,28,56,0.2)]" />
                        )}
                        <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(204,28,56,0.3)]' : ''}`} />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
