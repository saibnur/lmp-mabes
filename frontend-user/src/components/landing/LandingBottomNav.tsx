'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Newspaper, BadgeCheck, User } from 'lucide-react';

const mobileLinks = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Berita', href: '/berita', icon: Newspaper },
    { label: 'Status KTA', href: '/dashboard/status-keanggotaan', icon: BadgeCheck },
    { label: 'Profile', href: '/dashboard/profil', icon: User },
];

export default function LandingBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/20 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-xl lg:hidden">
            {mobileLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all duration-200 ${isActive
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <link.icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{link.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
