'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase';
import { User } from 'firebase/auth';

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Tentang Kami', href: '/tentang-kami' },
  { label: 'Organisasi', href: '/organisasi' },
  { label: 'Berita', href: '/berita' },
  { label: 'Galeri', href: '#galeri' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <header className="fixed top-0 z-[60] w-full border-b border-white/10 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white shadow-lg transition-transform group-hover:rotate-6">
            <span className="text-xs font-black">LMP</span>
          </div>
          <span className="text-lg font-black tracking-tighter uppercase italic text-slate-900 sm:text-xl">
            Laskar <span className="text-red-600">Merah Putih</span>
          </span>
        </Link>

        {/* Desktop Links (lg and above) */}
        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-bold tracking-tight text-slate-600 transition hover:text-red-600"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          {!loading && (
            user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition hover:bg-slate-800 hover:shadow-xl active:scale-95 sm:text-sm"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-xl border-2 border-red-600 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 hover:shadow-md active:scale-95 sm:text-sm"
                >
                  Masuk
                </Link>
                <Link
                  href="/daftar"
                  className="hidden sm:inline-flex rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 hover:shadow-xl active:scale-95"
                >
                  Daftar
                </Link>
              </div>
            )
          )}
        </div>
      </nav>
    </header>
  );
}
