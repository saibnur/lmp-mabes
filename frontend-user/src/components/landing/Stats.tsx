'use client';

import { motion } from 'framer-motion';
import { Users, MapPin, Heart, Award } from 'lucide-react';

const stats = [
  {
    label: 'Total Anggota',
    value: '50K+',
    icon: Users,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    label: 'Jumlah Cabang',
    value: '34',
    icon: MapPin,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    label: 'Kegiatan Sosial',
    value: '200+',
    icon: Heart,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    label: 'Penghargaan',
    value: '15+',
    icon: Award,
    color: 'text-red-600',
    bg: 'bg-red-50',
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
    <section className="relative z-10 -mt-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={item}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-lg"
            >
              <div
                className={`inline-flex rounded-xl p-3 ${stat.bg} ${stat.color}`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <p className="mt-4 text-2xl font-bold text-slate-900">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
