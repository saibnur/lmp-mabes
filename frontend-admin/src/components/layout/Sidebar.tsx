'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    Newspaper,
    LogOut,
    X,
} from 'lucide-react';
import { useAuth } from '@/viewmodels/useAuth';
import { useEffect } from 'react';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/dashboard/members', label: 'Data Member', icon: Users },
    { href: '/dashboard/verification', label: 'Verifikasi KTP', icon: ShieldCheck },
    { href: '/dashboard/news', label: 'Berita & CMS', icon: Newspaper },
];

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { logout } = useAuth();

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-slate-900 text-white">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 lg:hidden border-b border-slate-800">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="relative h-8 w-10 shrink-0 overflow-hidden rounded-md bg-white p-1">
                        <img src="/logo-lmp.svg" alt="LMP" className="h-full w-full object-contain" />
                    </div>
                    <span className="text-lg font-black tracking-tighter uppercase italic">
                        LMP <span className="text-red-600">Admin</span>
                    </span>
                </Link>
                <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                    <X className="h-6 w-6" />
                </button>
            </div>

            {/* Logo / Header for Desktop */}
            <div className="hidden lg:flex h-16 items-center gap-3 border-b border-slate-800 px-4 mt-6 mb-2 mx-2">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1">
                    <img
                        src="/logo-lmp.svg"
                        alt="LMP Logo"
                        className="h-full w-full object-contain"
                    />
                </div>
                <div>
                    <h1 className="text-sm font-black tracking-tight text-white uppercase italic">LMP Mabes</h1>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">Admin Panel</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 no-scrollbar">
                <div>
                    <h3 className="mb-3 px-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                        Menu Utama
                    </h3>
                    <ul className="space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive =
                                item.href === '/dashboard'
                                    ? pathname === '/dashboard'
                                    : pathname.startsWith(item.href);
                            const Icon = item.icon;
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
                                            <Icon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-white' : 'group-hover:text-red-500'}`} />
                                            {item.label}
                                        </div>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </nav>

            {/* Bottom: version + logout */}
            <div className="border-t border-slate-800 p-4 space-y-2 pb-6">
                <div className="px-4 text-[10px] text-slate-500 font-mono">
                    LMP Admin v2.0
                </div>
                <button
                    onClick={logout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 p-3 text-sm font-black text-white hover:bg-red-700 transition active:scale-95 shadow-lg shadow-red-900/20"
                >
                    <LogOut className="h-4 w-4" />
                    KELUAR / LOGOUT
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar (lg:flex) */}
            <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-72 flex-col bg-slate-900 transition-transform shadow-xl shadow-slate-900/10">
                <SidebarContent />
            </aside>

            {/* Mobile Drawer (Overlay + Sidebar) */}
            {open && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity"
                        onClick={onClose}
                    />
                    <div className="absolute inset-y-0 left-0 w-4/5 max-w-sm bg-slate-900 shadow-2xl transition-transform transform translate-x-0">
                        <SidebarContent />
                    </div>
                </div>
            )}
        </>
    );
}
