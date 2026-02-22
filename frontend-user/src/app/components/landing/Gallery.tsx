'use client';

import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';

const placeholders = [1, 2, 3, 4, 5, 6];

export default function Gallery() {
  return (
    <section id="galeri" className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic sm:text-4xl md:text-5xl">
            Galeri
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Dokumentasi kegiatan dan momen bersama LMP.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6"
        >
          {placeholders.map((i) => (
            <div
              key={i}
              className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-200"
            >
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-12 w-12 text-slate-400" />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
