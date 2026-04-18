'use client';

import { motion } from 'framer-motion';
import { Users, MapPin, Heart, Award, Calendar, Scale } from 'lucide-react';

const stats = [
  {
    label: 'Total Anggota',
    value: '50K+',
    icon: Users,
    color: 'text-red-600',
    bg: 'bg-red-50',
    sub: 'Di seluruh Indonesia',
  },
  {
    label: 'Tahun Berdiri',
    value: '2000',
    icon: Calendar,
    color: 'text-red-600',
    bg: 'bg-red-50',
    sub: '28 Oktober, Sumpah Pemuda',
  },
  {
    label: 'Wilayah DPW',
    value: '38',
    icon: MapPin,
    color: 'text-red-600',
    bg: 'bg-red-50',
    sub: 'Seluruh provinsi Indonesia',
  },
  {
    label: 'Kegiatan Sosial',
    value: '200+',
    icon: Heart,
    color: 'text-red-600',
    bg: 'bg-red-50',
    sub: 'Bakti sosial & bantuan',
  },
  {
    label: 'Bantuan Hukum',
    value: 'LBH',
    icon: Scale,
    color: 'text-red-600',
    bg: 'bg-red-50',
    sub: 'Gratis & berintegritas',
  },
  {
    label: 'Tahun Berkontribusi',
    value: `${new Date().getFullYear() - 2000}`,
    icon: Award,
    color: 'text-red-600',
    bg: 'bg-red-50',
    sub: 'Konsisten untuk bangsa',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Stats() {
  return (
    <section className="relative z-10 -mt-20 px-4 md:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-lg transition hover:border-red-100 hover:shadow-xl"
            >
              <div
                className={`inline-flex rounded-xl p-3 ${stat.bg} ${stat.color} transition group-hover:bg-red-600 group-hover:text-white`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="mt-4 text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm font-medium text-slate-800">{stat.label}</p>
              <p className="mt-0.5 text-xs text-slate-500">{stat.sub}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
