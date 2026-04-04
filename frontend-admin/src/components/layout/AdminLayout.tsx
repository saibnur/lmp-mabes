'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/viewmodels/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import { Menu } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600/30 border-t-red-600" />
                    <p className="text-sm text-slate-500">Memuat...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const titles: Record<string, string> = {
        '/dashboard': 'Dashboard',
        '/dashboard/members': 'Data Member',
        '/dashboard/verification': 'Verifikasi KTP',
        '/dashboard/news': 'Berita & CMS',
        '/dashboard/pembayaran-manual': 'Pembayaran Manual',
    };
    // Handle sub-routes dynamically
    let title = titles[pathname] ?? 'Dashboard';
    if (pathname.startsWith('/dashboard/news/') && pathname !== '/dashboard/news/buat') {
        const segments = pathname.split('/');
        if (segments.length === 5 && segments[4] !== 'edit') title = 'Detail Berita';
        else if (pathname.includes('/edit/')) title = 'Edit Berita';
        else if (pathname.endsWith('/buat')) title = 'Buat Berita';
    }

    return (
        /* Gunakan min-h-[100dvh] agar di mobile (dengan browser chrome UI) tetap full height */
        <div className="flex min-h-[100dvh] bg-slate-50 text-slate-900 font-sans">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/*
             * lg:ml-72  → geser konten sejauh lebar sidebar di desktop
             * flex flex-col → header + main menumpuk secara vertikal
             * min-w-0   → cegah flex child melebar melebihi parent (fix overflow)
             */}
            <div className="flex flex-1 flex-col min-w-0 lg:ml-72 transition-all">

                {/* Mobile / Tablet Topbar */}
                <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between
                                   border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <h2 className="truncate text-base font-bold text-slate-900">{title}</h2>
                    </div>
                    <div className="shrink-0">
                        <NotificationDropdown uid={user?.uid ?? null} />
                    </div>
                </header>

                <header className="hidden lg:flex sticky top-0 z-30 h-16 shrink-0 items-center justify-between
                                   border-b border-slate-200 bg-white px-8 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                    <div className="flex items-center gap-2">
                        <NotificationDropdown uid={user?.uid ?? null} />
                    </div>
                </header>

                {/*
                 * Main content
                 * - overflow-x-hidden  → cegah horizontal scroll karena konten melebar
                 * - pb-[calc(4rem+env(safe-area-inset-bottom))]  → padding bawah = tinggi BottomNav (h-16 = 4rem)
                 *   + safe area untuk notch iPhone agar BottomNav tidak menumpuk konten
                 * - lg:pb-0  → desktop tidak perlu padding BottomNav
                 */}
                <main className="flex-1 w-full overflow-x-hidden
                                 px-4 md:px-6 lg:px-8
                                 py-5
                                 pb-[calc(4rem+env(safe-area-inset-bottom))]
                                 lg:pb-6">
                    {children}
                </main>
            </div>

            {/* BottomNav sudah fixed, tidak perlu wrapper tambahan */}
            <BottomNav />
        </div>
    );
}