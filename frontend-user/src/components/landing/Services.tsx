'use client';

import { motion } from 'framer-motion';
import {
  CreditCard,
  Scale,
  HeartHandshake,
  GraduationCap,
} from 'lucide-react';

const services = [
  {
    title: 'KTA Digital',
    description:
      'Kartu Tanda Anggota digital untuk memudahkan verifikasi dan akses layanan anggota.',
    icon: CreditCard,
  },
  {
    title: 'Bantuan Hukum',
    description:
      'Pendampingan dan konsultasi hukum bagi anggota dan masyarakat yang membutuhkan.',
    icon: Scale,
  },
  {
    title: 'Bakti Sosial',
    description:
      'Program bakti sosial dan pemberdayaan masyarakat di berbagai daerah.',
    icon: HeartHandshake,
  },
  {
    title: 'Pelatihan UKM',
    description:
      'Pelatihan dan pendampingan Usaha Kecil Menengah untuk anggota dan warga.',
    icon: GraduationCap,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const card = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function Services() {
  return (
    <section id="program" className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic sm:text-4xl md:text-5xl">
            Program Utama
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Berbagai layanan dan program unggulan untuk anggota dan masyarakat.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {services.map((s) => (
            <motion.div
              key={s.title}
              variants={card}
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="inline-flex rounded-xl bg-red-50 p-3 text-red-600">
                <s.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{s.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
