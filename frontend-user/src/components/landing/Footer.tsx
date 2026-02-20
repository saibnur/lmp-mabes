'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import { User } from 'firebase/auth';

export default function Footer() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const quickLinks = user
    ? [
      { name: 'Tentang Kami', path: '/tentang-kami' },
      { name: 'Struktur Organisasi', path: '/organisasi' },
      { name: 'Berita & Kegiatan', path: '/berita' },
    ]
    : [
      { name: 'Beranda', path: '/' },
      { name: 'Tentang Kami', path: '/tentang-kami' },
      { name: 'Struktur Organisasi', path: '/organisasi' },
      { name: 'Berita & Kegiatan', path: '/berita' },
      { name: 'Daftar Anggota', path: '/daftar' },
    ];

  return (
    <footer className="border-t-4 border-red-600 bg-slate-900 text-slate-300 pb-20 lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              {/* <div className="h-14 w-14 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">LMP</div> */}
              {/* Replace with actual logo if available */}
              <div className="flex flex-col">
                <p className="text-2xl font-black italic tracking-tighter text-white">
                  MABES <span className="text-red-600">LMP</span>
                </p>
                <p className="text-sm font-medium text-slate-400 tracking-widest uppercase">Satu Komando</p>
              </div>
            </div>
            <p className="text-slate-400 leading-relaxed mb-6 max-w-md">
              Organisasi kemasyarakatan berbasis massa yang berdedikasi menjaga kedaulatan NKRI
              dan mendukung tercapainya visi Indonesia Emas 2045.
            </p>
            <p className="text-xs text-slate-500 font-mono bg-slate-800/50 p-2 rounded inline-block">
              SK Kemenkumham: No. AHU-0000054.AH.01.08.TAHUN 2025
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-6">
              Navigasi Cepat
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-slate-400 hover:text-red-500 transition-colors text-sm font-medium"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-6">
              Hubungi Kami
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-slate-400">
                <MapPin className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                <span>
                  Jl. DR. Muwardi I No. 27, RT.001/RW.004, Kel. Grogol, Kec. Grogol Petamburan,
                  Jakarta Barat, DKI Jakarta
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-400">
                <Mail className="h-5 w-5 shrink-0 text-red-600" />
                <a
                  href="mailto:lmp.pusat.id@gmail.com"
                  className="hover:text-red-500 transition-colors"
                >
                  lmp.pusat.id@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-400">
                <Phone className="h-5 w-5 shrink-0 text-red-600" />
                <a
                  href="tel:082120189513"
                  className="hover:text-red-500 transition-colors"
                >
                  082120189513
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Markas Besar Laskar Merah Putih. Seluruh hak cipta dilindungi.
        </div>
      </div>
    </footer>
  );
}
