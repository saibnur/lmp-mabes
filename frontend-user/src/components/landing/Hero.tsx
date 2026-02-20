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
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl"
            >
              Bersatu Membangun Negeri,{' '}
              <span className="text-red-600 font-black italic">Bersama LMP.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 max-w-xl text-lg text-slate-600 sm:text-xl"
            >
              Organisasi kemasyarakatan yang menjunjung tinggi nilai Pancasila
              dan persatuan Indonesia untuk masa depan bangsa yang lebih gemilang.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-4"
            >
              {!loading && (
                user ? (
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:bg-slate-800 hover:shadow-xl active:scale-95"
                  >
                    Ke Dashboard
                    <LayoutDashboard className="h-5 w-5" />
                  </Link>
                ) : (
                  <Link
                    href="/daftar"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:bg-red-700 hover:shadow-xl active:scale-95"
                  >
                    Gabung Sekarang
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                )
              )}
              <Link
                href="#tentang"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-900 px-6 py-4 text-base font-bold text-slate-900 transition hover:bg-slate-900 hover:text-white active:scale-95"
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
