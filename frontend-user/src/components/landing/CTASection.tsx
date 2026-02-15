'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { getFirebaseAuth } from '@/lib/firebase';
import { User } from 'firebase/auth';

export default function CTASection() {
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
    <section className="bg-slate-900 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Siap Berkontribusi untuk Bangsa?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            Bergabung dengan LMP dan wujudkan kontribusi nyata bagi masyarakat
            dan negara.
          </p>
          <div className="mt-10">
            {!loading && (
              user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-slate-900 shadow-lg transition hover:bg-slate-100 hover:shadow-xl"
                >
                  Ke Dashboard
                  <LayoutDashboard className="h-5 w-5" />
                </Link>
              ) : (
                <Link
                  href="/daftar"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-red-500 hover:shadow-xl"
                >
                  Gabung Sekarang
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
