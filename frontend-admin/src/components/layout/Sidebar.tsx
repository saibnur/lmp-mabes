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

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/members', label: 'Members', icon: Users },
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

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border-custom bg-surface transition-transform duration-300
                    lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* Logo / Header */}
                <div className="flex h-16 items-center justify-between gap-2 border-b border-border-custom px-4">
                    <div className="flex items-center gap-3">
                        {/* LMP Logo */}
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-lmp-navy/5">
                            <Image
                                src="/logo-lmp.svg"
                                alt="LMP Logo"
                                width={40}
                                height={40}
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-sm font-black tracking-tight text-foreground">LMP Mabes</h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">Admin Panel</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1 text-text-muted hover:text-foreground lg:hidden">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-0.5 px-3 py-4">
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
                                onClick={onClose}
                                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200
                                    ${isActive
                                        ? 'bg-brand/10 text-brand-primary border-l-2 border-brand-primary ml-0 font-semibold'
                                        : 'text-text-muted hover:bg-surface-hover hover:text-foreground'
                                    }`}
                            >
                                <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-brand-primary' : ''}`} />
                                {item.label}
                                {isActive && (
                                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-primary" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom: version + logout */}
                <div className="border-t border-border-custom p-3 space-y-1">
                    <div className="px-3 py-1.5 text-[10px] text-text-muted font-mono">
                        LMP Admin v2.0
                    </div>
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted transition-all hover:bg-danger/10 hover:text-danger"
                    >
                        <LogOut className="h-[18px] w-[18px]" />
                        Keluar
                    </button>
                </div>
            </aside>
        </>
    );
}
