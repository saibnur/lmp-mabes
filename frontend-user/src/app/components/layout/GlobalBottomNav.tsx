'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    Newspaper,
    CreditCard,
    User,
    LogIn,
    ShieldCheck,
    Building,
    LogOut,
    X
} from 'lucide-react';
import { useUserProfile } from '@/app/components/dashboard/UserProfileProvider';
import { getFirebaseAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function GlobalBottomNav() {
    const pathname = usePathname();
    const { profile, loading } = useUserProfile();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const isLoggedIn = !loading && !!profile;
    const isProfileComplete = profile?.profileComplete === true;
    const isPaid = profile?.isPaid === true || profile?.membershipStatus === 'active';

    const handleLogout = async () => {
        const auth = getFirebaseAuth();
        await signOut(auth);
        window.location.href = '/';
    };

    const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

    // Menentukan menu untuk mid slot dan member slot
    const renderMenuItems = () => {
        if (!isLoggedIn) {
            return (
                <>
                    <Link href="/" className={`flex flex-1 flex-col items-center justify-center h-full gap-1 transition ${isActive('/') ? 'text-red-500' : 'text-slate-500 hover:text-slate-300'}`}>
                        <Home className={`h-5 w-5 ${isActive('/') ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Beranda</span>
                    </Link>
                    <Link href="/berita" className={`flex flex-1 flex-col items-center justify-center h-full gap-1 transition ${isActive('/berita') ? 'text-red-500' : 'text-slate-500 hover:text-slate-300'}`}>
                        <Newspaper className={`h-5 w-5 ${isActive('/berita') ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Berita</span>
                    </Link>
                    <Link href="/tentang-kami" className={`flex flex-1 flex-col items-center justify-center h-full gap-1 transition ${isActive('/tentang-kami') ? 'text-red-500' : 'text-slate-500 hover:text-slate-300'}`}>
                        <Building className={`h-5 w-5 ${isActive('/tentang-kami') ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Tentang Kami</span>
                    </Link>
                    <Link href="/login" className="flex flex-1 flex-col items-center justify-center h-full gap-1 transition text-slate-500 hover:text-slate-300">
                        <LogIn className="h-5 w-5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Masuk</span>
                    </Link>
                </>
            );
        }

        return (
            <>
                <Link href="/dashboard" className={`flex flex-1 flex-col items-center justify-center h-full gap-1 transition ${pathname === '/dashboard' ? 'text-red-500' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Home className={`h-5 w-5 ${pathname === '/dashboard' ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Beranda</span>
                </Link>
                {isPaid ? (
                    <Link href="/dashboard/status-keanggotaan" className={`flex flex-1 flex-col items-center justify-center h-full gap-1 transition ${isActive('/dashboard/status-keanggotaan') ? 'text-red-500' : 'text-slate-500 hover:text-slate-300'}`}>
                        <ShieldCheck className={`h-5 w-5 ${isActive('/dashboard/status-keanggotaan') ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">KTA</span>
                    </Link>
                ) : (
                    <Link href="/dashboard/pembayaran" className={`flex flex-1 flex-col items-center justify-center h-full gap-1 transition ${isActive('/dashboard/pembayaran') ? 'text-red-500' : 'text-slate-500 hover:text-slate-300'}`}>
                        <CreditCard className={`h-5 w-5 ${isActive('/dashboard/pembayaran') ? 'fill-current' : ''}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Bayar</span>
                    </Link>
                )}
                <Link href="/berita" className={`flex flex-1 flex-col items-center justify-center h-full gap-1 transition ${isActive('/berita') ? 'text-red-500' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Newspaper className={`h-5 w-5 ${isActive('/berita') ? 'fill-current' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Berita</span>
                </Link>
                <button onClick={() => setIsProfileModalOpen(true)} className={`flex flex-1 flex-col items-center justify-center h-full gap-1 transition ${isProfileModalOpen ? 'text-red-500' : 'text-slate-500 hover:text-slate-300'}`}>
                    <div className={`rounded-full border-2 p-0.5 ${isProfileModalOpen ? 'border-red-500' : 'border-transparent'}`}>
                        <User className={`h-5 w-5 ${isProfileModalOpen ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Profil</span>
                </button>
            </>
        );
    };

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-[55] flex h-16 items-center border-t border-slate-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] lg:hidden supports-[backdrop-filter]:bg-white/90 supports-[backdrop-filter]:backdrop-blur-lg">
                {renderMenuItems()}
            </nav>

            {/* Profil Modal (Mobile) */}
            {isProfileModalOpen && isLoggedIn && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsProfileModalOpen(false)} />
                    <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl p-6 transition-transform transform translate-y-0 text-slate-900">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">Menu Profil</h2>
                            <button onClick={() => setIsProfileModalOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-2xl">
                            <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200">
                                {profile?.photoURL ? (
                                    <img src={profile.photoURL} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-lg font-bold text-slate-500">
                                        {(profile?.displayName || 'M').charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-lg leading-tight">{profile?.displayName || 'Member'}</p>
                                <p className="text-sm font-medium text-slate-500">{profile?.phoneNumber || profile?.phone}</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <Link href="/daftar/profil" onClick={() => setIsProfileModalOpen(false)} className="flex w-full items-center justify-between rounded-xl bg-slate-100 p-4 font-bold text-slate-700 hover:bg-slate-200 transition">
                                Edit Profil Saya
                            </Link>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 p-4 text-base font-black text-white hover:bg-red-700 transition active:scale-95 shadow-lg shadow-red-200"
                        >
                            <LogOut className="h-5 w-5" />
                            KELUAR / LOGOUT
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
