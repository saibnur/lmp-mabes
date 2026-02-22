'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Newspaper,
    BadgeCheck,
    CreditCard,
    User,
    LogIn,
    Settings,
    UserCheck,
} from 'lucide-react';
import { useUserProfile } from '@/store/UserProfileProvider';

/**
 * Global Bottom Navigation — shown only on mobile/tablet (lg:hidden)
 * 
 * 3 states:
 *  1. Guest (not logged in): Beranda | Berita | Masuk
 *  2. Member — profile incomplete: Beranda | Berita | Lengkapi Profil | Pengaturan
 *  3. Member — active + no_kta: Beranda | Berita | KTA Digital | Pengaturan
 *  4. Member — paid/pending KTA: Beranda | Berita | Pembayaran | Pengaturan
 */
export default function BottomNavigation() {
    const pathname = usePathname();
    const { profile, uid, loading } = useUserProfile();

    const isLoggedIn = !!uid && !loading;
    const profileComplete = profile?.profileComplete === true && !!profile?.organization?.village_id;
    const hasKta = !!profile?.no_kta;
    const membershipActive = profile?.membershipStatus === 'active';

    // Determine the 3rd slot (middle-right)
    const getMidSlot = () => {
        if (!isLoggedIn) {
            return {
                href: '/login',
                icon: LogIn,
                label: 'Masuk',
            };
        }
        if (!profileComplete) {
            return {
                href: '/daftar/profil',
                icon: UserCheck,
                label: 'Profil',
                badge: true, // pulsing indicator
            };
        }
        if (hasKta && membershipActive) {
            return {
                href: '/dashboard/status-keanggotaan',
                icon: BadgeCheck,
                label: 'KTA',
            };
        }
        // Logged in, profile complete, but no KTA yet
        return {
            href: '/dashboard/pembayaran',
            icon: CreditCard,
            label: 'Bayar',
        };
    };

    const midSlot = getMidSlot();
    const MidIcon = midSlot.icon;

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] flex h-16 items-center border-t border-slate-800 bg-slate-900 lg:hidden">
            {/* ── Beranda ── */}
            <Link
                href={isLoggedIn ? '/dashboard' : '/'}
                className={`flex flex-1 flex-col items-center justify-center h-full gap-0.5 transition ${isActive(isLoggedIn ? '/dashboard' : '/') ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Home className={`h-5 w-5 ${isActive(isLoggedIn ? '/dashboard' : '/') ? 'fill-current' : ''}`} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Beranda</span>
            </Link>

            {/* ── Berita ── */}
            <Link
                href="/berita"
                className={`flex flex-1 flex-col items-center justify-center h-full gap-0.5 transition ${isActive('/berita') ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Newspaper className={`h-5 w-5 ${isActive('/berita') ? 'fill-current' : ''}`} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Berita</span>
            </Link>

            {/* ── Mid Slot (dynamic) ── */}
            <Link
                href={midSlot.href}
                className={`flex flex-1 flex-col items-center justify-center h-full gap-0.5 transition ${isActive(midSlot.href) ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <div className="relative">
                    <MidIcon className={`h-5 w-5 ${isActive(midSlot.href) ? 'fill-current' : ''}`} />
                    {/* Pulsing badge for incomplete profile */}
                    {'badge' in midSlot && midSlot.badge && !isActive(midSlot.href) && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                    )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider">{midSlot.label}</span>
            </Link>

            {/* ── Profil / Pengaturan (only for logged-in) ── */}
            {isLoggedIn ? (
                <Link
                    href="/daftar/profil"
                    className={`flex flex-1 flex-col items-center justify-center h-full gap-0.5 transition ${isActive('/daftar/profil') ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <div className={`rounded-full border-2 p-0.5 ${isActive('/daftar/profil') ? 'border-white' : 'border-transparent'}`}>
                        <User className={`h-4 w-4 ${isActive('/daftar/profil') ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider">Profil</span>
                </Link>
            ) : (
                /* Filler slot for guests — show logo/home */
                <div className="flex flex-1" />
            )}
        </nav>
    );
}
