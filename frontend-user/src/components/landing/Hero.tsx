'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ArrowRight, BookOpen, LayoutDashboard } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase';
import { User } from 'firebase/auth';

export default function Hero() {
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
    <section id="beranda" className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 bg-[radial-gradient(#fef2f2_1px,transparent_1px)] bg-[size:24px_24px] opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-32 sm:px-6 sm:pt-24 sm:pb-40 lg:px-8 lg:pt-32 lg:pb-48">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
            >
              Bersatu Membangun Negeri,{' '}
              <span className="text-red-600">Bersama LMP.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 max-w-xl text-lg text-slate-600"
            >
              Organisasi kemasyarakatan yang menjunjung tinggi nilai Pancasila
              dan persatuan Indonesia.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              {!loading && (
                user ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-slate-800 hover:shadow-xl"
                  >
                    Ke Dashboard
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                ) : (
                  <Link
                    href="/daftar"
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-red-700 hover:shadow-xl"
                  >
                    Gabung Sekarang
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                )
              )}
              <Link
                href="#tentang"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-900 px-6 py-3.5 text-base font-semibold text-slate-900 transition hover:bg-slate-900 hover:text-white"
              >
                Pelajari Lebih Lanjut
                <BookOpen className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative h-72 w-full max-w-md rounded-2xl bg-slate-100 sm:h-80 lg:h-96">
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                <Users className="h-24 w-24 text-slate-400" />
                <span className="absolute bottom-6 text-sm font-medium text-slate-500">
                  Ilustrasi: Orang berkumpul / Bendera
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
