'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Bell, User as UserIcon, LogOut, Settings } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useUserProfile } from '@/app/components/dashboard/UserProfileProvider';

export default function GlobalNavbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
    const pathname = usePathname();
    const { profile, loading } = useUserProfile();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        const auth = getFirebaseAuth();
        await signOut(auth);
        window.location.href = '/';
    };

    const isLoggedIn = !loading && !!profile;

    return (
        <header className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8 lg:px-12">
                {/* Left: Logo */}
                <Link href="/" className="group flex items-center gap-3">
                    <div className="relative h-10 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 p-1 shadow-sm transition-transform group-hover:scale-105">
                        <img
                            src="/logo-lmp.svg"
                            alt="LMP Logo"
                            className="h-full w-full object-contain"
                        />
                    </div>
                    <span className="text-lg md:text-xl font-black tracking-tighter uppercase italic text-slate-900 hidden sm:block">
                        Laskar <span className="text-red-600">Merah Putih</span>
                    </span>
                    <span className="flex flex-col text-[11px] leading-[1.1] font-black tracking-widest uppercase italic text-slate-900 sm:hidden">
                        <span>Laskar</span>
                        <span className="text-red-600">Merah Putih</span>
                    </span>
                </Link>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 md:gap-4">
                    {(!loading && !isLoggedIn) && (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="rounded-xl border-2 border-red-600 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-50 hover:shadow-md active:scale-95"
                            >
                                Masuk
                            </Link>
                            <Link
                                href="/daftar"
                                className="hidden sm:inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 hover:shadow-xl active:scale-95"
                            >
                                Daftar
                            </Link>
                        </div>
                    )}

                    {isLoggedIn && (
                        <>
                            {/* Notification Icon */}
                            <button className="relative p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600" />
                            </button>

                            {/* User Profile Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 rounded-full border border-slate-200 p-1 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-slate-600">
                                        {profile.photoURL ? (
                                            <img
                                                src={profile.photoURL}
                                                alt="Profile"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-sm font-semibold">
                                                {(profile.displayName || 'M').charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <span className="hidden md:block max-w-[120px] truncate text-sm font-medium text-slate-700 mr-2">
                                        {profile.displayName || 'Member'}
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 bg-white shadow-xl py-2">
                                        <div className="px-4 py-3 border-b border-slate-100 mb-1 flex flex-col">
                                            <span className="text-sm font-semibold text-slate-900 truncate">
                                                {profile.displayName || 'Member'}
                                            </span>
                                            <span className="text-xs text-slate-500 truncate mt-0.5">
                                                {profile.phoneNumber || profile.phone || 'No phone'}
                                            </span>
                                        </div>
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex md:hidden items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600"
                                        >
                                            <UserIcon className="h-4 w-4" />
                                            Dashboard
                                        </Link>
                                        <Link
                                            href="/daftar/profil"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-red-600"
                                        >
                                            <Settings className="h-4 w-4" />
                                            Edit Profil
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                handleLogout();
                                            }}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Keluar / Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Hamburger Menu (Mobile/Tablet) */}
                    <button
                        onClick={onOpenSidebar}
                        className="block lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </div>
            </nav>
        </header>
    );
}
