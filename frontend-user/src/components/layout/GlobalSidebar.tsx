'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    UserCircle,
    CreditCard,
    Settings,
    ShieldCheck,
    Newspaper,
    FileText,
    LifeBuoy,
    X,
    User,
    BadgeCheck,
    Building,
    Image as ImageIcon
} from 'lucide-react';
import { useUserProfile } from '@/store/UserProfileProvider';

interface GlobalSidebarProps {
    isOpen: boolean; // For mobile drawer
    onClose: () => void;
}

export default function GlobalSidebar({ isOpen, onClose }: GlobalSidebarProps) {
    const pathname = usePathname();
    const { profile, loading } = useUserProfile();

    // Prevent scrolling when mobile drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const isLoggedIn = !loading && !!profile;

    // Don't render sidebar items for non-logged in users (or you could render a public version)
    // But usually Sidebar is for Members. If not logged in, we only show public links.

    type MenuItem = {
        label: string;
        href: string;
        icon: React.ElementType;
        activeCheck?: string;
        badge?: string | null;
    };

    type MenuGroup = {
        group: string;
        items: MenuItem[];
    };

    const memberMenus: MenuGroup[] = [
        {
            group: 'Utama',
            items: [
                { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { label: 'Beranda Publik', href: '/', icon: User },
            ],
        },
        {
            group: 'Data Keanggotaan',
            items: [
                { label: 'Status Anggota', href: '/dashboard/status-keanggotaan', icon: ShieldCheck, activeCheck: '/dashboard/status-keanggotaan', badge: (profile?.isPaid === true || profile?.membershipStatus === 'active') ? null : '!' },
                { label: 'Update Data Pribadi', href: '/daftar/profil', icon: UserCircle },
            ],
        },
        {
            group: 'Keuangan',
            items: [
                { label: 'Bayar Iuran', href: '/dashboard/pembayaran', icon: CreditCard },
            ],
        },
        {
            group: 'Informasi & Dokumen',
            items: [
                { label: 'Berita', href: '/berita', icon: Newspaper },
                { label: 'Organisasi', href: '/organisasi', icon: Building },
                { label: 'Galeri', href: '/#galeri', icon: ImageIcon },
                { label: 'Bantuan & Support', href: '#', icon: LifeBuoy },
            ],
        },
    ];

    const publicMenus: MenuGroup[] = [
        {
            group: 'Menu Utama',
            items: [
                { label: 'Beranda', href: '/', icon: LayoutDashboard },
                { label: 'Tentang Kita', href: '/tentang-kami', icon: UserCircle },
                { label: 'Organisasi', href: '/organisasi', icon: ShieldCheck },
                { label: 'Galeri', href: '/#galeri', icon: ImageIcon },
                { label: 'Berita', href: '/berita', icon: Newspaper },
            ],
        }
    ];

    const menusToRender = isLoggedIn ? memberMenus : publicMenus;

    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-slate-900 text-white">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 lg:hidden border-b border-slate-800">
                <Link href="/" className="flex items-center gap-3">
                    <div className="relative h-8 w-10 shrink-0 overflow-hidden rounded-md bg-white p-1">
                        <img src="/logo-lmp.svg" alt="LMP" className="h-full w-full object-contain" />
                    </div>
                    <span className="text-lg font-black tracking-tighter uppercase italic">
                        Laskar <span className="text-red-600">Merah Putih</span>
                    </span>
                </Link>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                    <X className="h-6 w-6" />
                </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 no-scrollbar">
                {menusToRender.map((group, idx) => (
                    <div key={idx}>
                        <h3 className="mb-3 px-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                            {group.group}
                        </h3>
                        <ul className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={onClose}
                                            className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 group ${isActive
                                                ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <item.icon
                                                    className={`h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-white' : 'group-hover:text-red-500'
                                                        }`}
                                                />
                                                {item.label}
                                            </div>
                                            {item.badge && (
                                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                                                    {item.badge}
                                                </div>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar (lg:flex) */}
            <aside className="hidden lg:flex fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-72 flex-col border-r border-slate-800 bg-slate-900 transition-transform">
                <SidebarContent />
            </aside>

            {/* Mobile Drawer (Overlay + Sidebar) */}
            {isOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                        onClick={onClose}
                    />
                    {/* Drawer */}
                    <div className="absolute inset-y-0 left-0 w-4/5 max-w-sm bg-slate-900 shadow-2xl transition-transform transform translate-x-0">
                        <SidebarContent />
                    </div>
                </div>
            )}
        </>
    );
}
