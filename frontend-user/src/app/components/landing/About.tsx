'use client';

import { motion } from 'framer-motion';
import { Target, Eye, Award } from 'lucide-react';

export default function About() {
  return (
    <section id="tentang" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic sm:text-4xl md:text-5xl">
              Tentang Kami
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              LMP (Laskar Merah Putih) adalah organisasi
              kemasyarakatan yang berkomitmen menjaga nilai-nilai Pancasila dan
              persatuan Indonesia. Melalui berbagai program pemberdayaan,
              bakti sosial, dan layanan kepada anggota, kami hadir untuk
              masyarakat.
            </p>
            <div className="mt-10 space-y-6">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Visi</h3>
                  <p className="text-sm text-slate-600">
                    Menjadi organisasi kemasyarakatan yang unggul dan
                    berkontribusi nyata bagi bangsa.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <Eye className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Misi</h3>
                  <p className="text-sm text-slate-600">
                    Memperkuat persatuan, memberdayakan masyarakat, dan
                    menjunjung tinggi nilai-nilai kebangsaan.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-slate-100 p-8 lg:p-12"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-600 text-white">
                <Award className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold text-slate-900">15+</p>
                <p className="text-sm font-medium text-slate-600">
                  Tahun Berkontribusi
                </p>
              </div>
            </div>
            <p className="mt-6 text-slate-600">
              Sejak berdiri, LMP konsisten mengadakan program bakti sosial,
              bantuan hukum, dan pelatihan UKM di berbagai daerah di Indonesia.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
