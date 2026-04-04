'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, ShieldCheck, Newspaper, Plus, Building2 } from 'lucide-react';

// ─── Feature Flag ─────────────────────────────────────────────────────────────
const PAYMENT_MODE = process.env.NEXT_PUBLIC_PAYMENT_MODE || 'midtrans';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/dashboard/members', label: 'Member', icon: Users },
    { href: '/dashboard/verification', label: 'Verif KTP', icon: ShieldCheck },
    { href: '/dashboard/news', label: 'Berita', icon: Newspaper },
    ...(PAYMENT_MODE === 'manual'
        ? [{ href: '/dashboard/pembayaran-manual', label: 'Bayar', icon: Building2 }]
        : []),
];

/**
 * Daftar halaman yang menampilkan FAB tombol "+"
 * Tambahkan entry baru di sini jika halaman lain juga butuh FAB.
 */
const FAB_MAP: Record<string, { href: string; label: string }> = {
    '/dashboard/news': { href: '/dashboard/news/buat', label: 'Buat Berita' },
};

export default function BottomNav() {
    const pathname = usePathname();

    // Cari FAB yang cocok dengan pathname saat ini (exact match)
    const fab = FAB_MAP[pathname];

    return (
        <>
            {/*
             * ── FAB (Floating Action Button) kontekstual ──
             *
             * Muncul hanya di halaman yang terdaftar di FAB_MAP.
             * Posisi: tepat di atas BottomNav dengan jarak 1rem.
             *   bottom = tinggi nav (4rem) + safe-area + 1rem gap
             *
             * Pill shape (rounded-full + padding horizontal) agar terlihat
             * sebagai CTA yang jelas, bukan sekadar ikon bulat.
             */}
            {fab && (
                <Link
                    href={fab.href}
                    className="fixed z-[56] lg:hidden
                               right-5
                               bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)]
                               flex items-center gap-2
                               rounded-full bg-red-600 pl-4 pr-5 py-3
                               text-sm font-black text-white
                               shadow-lg shadow-red-700/35
                               hover:bg-red-700 active:scale-[0.96]
                               transition-all duration-150"
                >
                    <Plus className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                    {fab.label}
                </Link>
            )}

            {/* ── Bottom Navigation Bar ── */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-[55] lg:hidden
                           flex items-stretch
                           h-[calc(4rem+env(safe-area-inset-bottom))]
                           pb-[env(safe-area-inset-bottom)]
                           border-t border-slate-200 bg-white
                           shadow-[0_-4px_12px_rgba(0,0,0,0.08)]
                           supports-[backdrop-filter]:bg-white/95
                           supports-[backdrop-filter]:backdrop-blur-lg"
            >
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
                            className={`flex flex-1 flex-col items-center justify-center gap-1 h-16
                                        transition-colors duration-150
                                        ${isActive
                                    ? 'text-red-500'
                                    : 'text-slate-400 hover:text-slate-600 active:text-slate-800'
                                }`}
                        >
                            <Icon
                                className={`h-5 w-5 shrink-0 ${isActive ? 'fill-red-100 stroke-red-500' : ''}`}
                            />
                            <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}