'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/viewmodels/useAuth';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import { Menu, Bell } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Auth guard — redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand/30 border-t-brand" />
                    <p className="text-sm text-text-muted">Memuat...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    // Page title mapping
    const titles: Record<string, string> = {
        '/dashboard': 'Dashboard',
        '/dashboard/members': 'Manajemen Member',
        '/dashboard/verification': 'Verifikasi KTP',
        '/dashboard/news': 'Berita & CMS',
    };
    const title = titles[pathname] ?? 'Dashboard';

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex flex-1 flex-col lg:ml-64">
                {/* Top bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-custom bg-surface/80 px-4 backdrop-blur-xl lg:px-6 shadow-sm shadow-lmp-navy/5">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-foreground lg:hidden transition-colors"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <h2 className="text-lg font-bold text-foreground">{title}</h2>
                    </div>
                    <button className="relative rounded-lg p-2 text-text-muted hover:bg-surface-hover hover:text-foreground transition-colors">
                        <Bell className="h-5 w-5" />
                        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-primary border-2 border-surface" />
                    </button>
                </header>

                {/* Main content */}
                <main className="flex-1 p-4 pb-24 lg:p-6 lg:pb-6">
                    {children}
                </main>
            </div>

            <BottomNav />
        </div>
    );
}
