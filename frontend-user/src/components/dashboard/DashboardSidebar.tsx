'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  CreditCard,
  Settings,
  LogOut,
  Home,
  Menu,
  X,
  BadgeCheck,
} from 'lucide-react';
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setMembershipStatus(docSnap.data().membershipStatus || 'pending');
          }
        }, (error) => {
          console.error("Firestore onSnapshot error:", error);
        });
      } else {
        setMembershipStatus(null);
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = undefined;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const handleLogout = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
    window.location.href = '/login';
  };

  const menuItems = [
    { label: 'Member', href: '/dashboard', icon: User },
    { label: 'Edit Profil', href: '/dashboard/profil', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-6 md:justify-center md:border-0">
        <Link href="/" className="group flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform">
            <BadgeCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic">
            Mabes <span className="text-red-600">LMP</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          aria-label="Tutup menu"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-200 group ${isActive
                ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <item.icon className={`h-5 w-5 shrink-0 transition-colors ${isActive ? 'text-white' : 'group-hover:text-red-500'}`} />
              {item.label}
            </Link>
          );
        })}

        <AnimatePresence mode='wait'>
          {membershipStatus === 'active' ? (
            <motion.div
              key="status-active"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <Link
                href="/dashboard/status-keanggotaan"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-200 group ${pathname === '/dashboard/status-keanggotaan'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <div className="relative">
                  <BadgeCheck className={`h-5 w-5 shrink-0 transition-colors ${pathname === '/dashboard/status-keanggotaan' ? 'text-white' : 'group-hover:text-red-500'}`} />
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                </div>
                Status Keanggotaan
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="status-inactive"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <Link
                href="/dashboard/pembayaran"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-200 group ${pathname === '/dashboard/pembayaran'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <CreditCard className={`h-5 w-5 shrink-0 transition-colors ${pathname === '/dashboard/pembayaran' ? 'text-white' : 'group-hover:text-red-500'}`} />
                Pembayaran
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-400 transition-all hover:bg-red-600 hover:text-white group"
        >
          <LogOut className="h-5 w-5 shrink-0 transition-colors group-hover:text-white" />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header - Clean & Minimal */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6 text-white md:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center shadow-lg shadow-red-900/20">
            <BadgeCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-black tracking-tighter uppercase italic">Mabes <span className="text-red-500">LMP</span></span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-xl p-2.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden h-screen w-64 flex-col bg-slate-900 md:flex fixed left-0 top-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-[70] flex h-full w-[85%] max-w-sm flex-col bg-slate-900 md:hidden shadow-2xl border-r border-slate-800"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav - Thumb Friendly & Modern */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-800 bg-slate-900/90 backdrop-blur-xl pb-safe pt-2 md:hidden">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1.5 px-6 py-2 transition-all ${pathname === '/dashboard' ? 'text-red-600 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className={`p-2 rounded-xl transition-colors ${pathname === '/dashboard' ? 'bg-red-600/10' : ''}`}>
            <Home className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Home</span>
        </Link>

        <Link
          href="/dashboard/profil"
          className={`flex flex-col items-center gap-1.5 px-6 py-2 transition-all ${pathname === '/dashboard/profil' ? 'text-red-600 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <div className={`p-2 rounded-xl transition-colors ${pathname === '/dashboard/profil' ? 'bg-red-600/10' : ''}`}>
            <Settings className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Profil</span>
        </Link>

        {membershipStatus === 'active' ? (
          <Link
            href="/dashboard/status-keanggotaan"
            className={`flex flex-col items-center gap-1.5 px-6 py-2 transition-all ${pathname === '/dashboard/status-keanggotaan' ? 'text-red-600 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${pathname === '/dashboard/status-keanggotaan' ? 'bg-red-600/10' : ''}`}>
              <div className="relative">
                <BadgeCheck className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                </span>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">KTA</span>
          </Link>
        ) : (
          <Link
            href="/dashboard/pembayaran"
            className={`flex flex-col items-center gap-1.5 px-6 py-2 transition-all ${pathname === '/dashboard/pembayaran' ? 'text-red-600 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${pathname === '/dashboard/pembayaran' ? 'bg-red-600/10' : ''}`}>
              <CreditCard className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Bayar</span>
          </Link>
        )}
      </nav>
    </>
  );
}
