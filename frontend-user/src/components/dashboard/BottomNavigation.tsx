'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Newspaper,
    PlusSquare,
    BadgeCheck,
    CreditCard,
    User,
} from 'lucide-react';

interface BottomNavigationProps {
    membershipStatus: string | null;
    hasOpenedMembership: boolean;
}

export default function BottomNavigation({ membershipStatus, hasOpenedMembership }: BottomNavigationProps) {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] flex h-16 items-center justify-around border-t border-slate-800 bg-slate-900 px-2 lg:hidden">
            {/* Beranda */}
            <Link
                href="/dashboard"
                className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/dashboard' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Home className={`h-6 w-6 ${pathname === '/dashboard' ? 'fill-current' : ''}`} />
            </Link>

            {/* Berita */}
            <Link
                href="/berita"
                className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/berita' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Newspaper className={`h-6 w-6 ${pathname === '/berita' ? 'fill-current' : ''}`} />
            </Link>


            {/* Pembayaran / Keanggotaan */}
            {membershipStatus === 'active' ? (
                <Link
                    href="/dashboard/status-keanggotaan"
                    className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/dashboard/status-keanggotaan' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <div className="relative">
                        <BadgeCheck className={`h-6 w-6 ${pathname === '/dashboard/status-keanggotaan' ? 'fill-current' : ''}`} />
                        {!hasOpenedMembership && pathname !== '/dashboard/status-keanggotaan' && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                    </div>
                </Link>
            ) : (
                <Link
                    href="/dashboard/pembayaran"
                    className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/dashboard/pembayaran' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <CreditCard className={`h-6 w-6 ${pathname === '/dashboard/pembayaran' ? 'fill-current' : ''}`} />
                </Link>
            )}

            {/* Profil */}
            <Link
                href="/dashboard/profil"
                className={`flex flex-col items-center justify-center w-full h-full ${pathname === '/dashboard/profil' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <div className={`rounded-full border-2 p-0.5 ${pathname === '/dashboard/profil' ? 'border-white' : 'border-transparent'}`}>
                    <User className={`h-5 w-5 ${pathname === '/dashboard/profil' ? 'fill-current' : ''}`} />
                </div>
            </Link>
        </nav>
    );
}
