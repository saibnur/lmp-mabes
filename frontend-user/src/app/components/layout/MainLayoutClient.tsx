'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import GlobalNavbar from './GlobalNavbar';
import GlobalSidebar from './GlobalSidebar';
import GlobalBottomNav from './GlobalBottomNav';

export default function MainLayoutClient({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Daftar halaman yang TIDAK menampilkan navigasi global
    const noNavRoutes = ['/login', '/daftar', '/setup-password'];

    const isNoNavRoute = noNavRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

    if (isNoNavRoute) {
        return <>{children}</>;
    }

    // Jika bukan halaman auth, tampilkan navigasi global
    return (
        <>
            <GlobalNavbar onOpenSidebar={() => setIsMobileSidebarOpen(true)} />
            <GlobalSidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

            {/* Kontainer Utama */}
            {/* Navbar tingginya 16 (4rem/64px), jadi butuh pt-16 */}
            {/* Sidebar Desktop lebarnya 72 (18rem/288px), jadi butuh lg:ml-72 */}
            {/* BottomNav tingginya 16 (64px), jadi butuh pb-20 di HP (padding bottom lebih besar dari tingginya) */}
            <div className="flex flex-col min-h-screen pt-16 lg:ml-72 pb-20 lg:pb-0 transition-all">
                <main className="flex-1 w-full mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-6">
                    {children}
                </main>
            </div>

            <GlobalBottomNav />
        </>
    );
}
