'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  CreditCard,
  Settings,
  LogOut,
  BadgeCheck,
  Newspaper,
} from 'lucide-react';
import { getFirebaseAuth, getFirestoreDb } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNavigation from './BottomNavigation';

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [hasOpenedMembership, setHasOpenedMembership] = useState<boolean>(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const db = getFirestoreDb();

    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setMembershipStatus(data.membershipStatus || 'pending');
            setHasOpenedMembership(data.hasOpenedMembership ?? false);
          }
        }, (error) => {
          console.error("Firestore onSnapshot error:", error);
        });
      } else {
        setMembershipStatus(null);
        setHasOpenedMembership(true);
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
    { label: 'Berita', href: '/berita', icon: Newspaper },
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
      </div>

      <nav className="flex-1 space-y-2 px-4 py-6">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-200 group ${pathname === '/dashboard/status-keanggotaan'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <div className="relative">
                  <BadgeCheck className={`h-5 w-5 shrink-0 transition-colors ${pathname === '/dashboard/status-keanggotaan' ? 'text-white' : 'group-hover:text-red-500'}`} />
                  {!hasOpenedMembership && pathname !== '/dashboard/status-keanggotaan' && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
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
      {/* Desktop Sidebar */}
      <aside className="hidden h-screen w-64 flex-col bg-slate-900 lg:flex fixed left-0 top-0 z-40">
        <SidebarContent />
      </aside>

      <BottomNavigation
        membershipStatus={membershipStatus}
        hasOpenedMembership={hasOpenedMembership}
      />
    </>
  );
}
