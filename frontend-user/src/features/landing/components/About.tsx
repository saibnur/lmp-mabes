'use client';

import { motion } from 'framer-motion';
import { Shield, Scale, Users, Landmark, Flag, BookOpen } from 'lucide-react';

const timeline = [
  {
    year: '2000',
    title: 'Pendirian LMP',
    desc: 'Didirikan pada 28 Oktober 2000, bertepatan dengan Hari Sumpah Pemuda, oleh almarhum Eddy Hartawan Siswono bersama sejumlah rekan, dengan nama awal Forum Bersama Laskar Merah Putih.',
  },
  {
    year: '2004',
    title: 'Legalisasi Hukum',
    desc: 'Organisasi disahkan secara resmi melalui Akta Notaris Irma Bonita, S.H., menjadi Organisasi Kemasyarakatan (Ormas) yang diakui secara hukum di Indonesia.',
  },
  {
    year: '2010',
    title: 'Ekspansi Nasional',
    desc: 'LMP memperluas jaringan ke seluruh provinsi di Indonesia, membentuk Markas Daerah (MADA) dan Markas Cabang (MACAB) di berbagai wilayah.',
  },
  {
    year: '2024',
    title: 'Kepemimpinan HM. Arsyad Canno',
    desc: 'H.M. Arsyad Canno dikukuhkan sebagai Ketua Umum Markas Besar Laskar Merah Putih, memimpin organisasi menuju era baru pengabdian kepada bangsa.',
  },
];

const pillars = [
  {
    icon: Shield,
    title: 'Bela Negara',
    desc: 'Mendukung upaya bela negara dan mempertahankan kedaulatan NKRI sebagai komponen masyarakat yang aktif.',
  },
  {
    icon: Scale,
    title: 'Bantuan Hukum',
    desc: 'Menyediakan Lembaga Bantuan Hukum (LBH) di berbagai daerah untuk membantu masyarakat kecil secara gratis.',
  },
  {
    icon: Users,
    title: 'Bakti Sosial',
    desc: 'Menjalankan program bakti sosial rutin: pembagian bantuan bagi warga kurang mampu, kaum dhuafa, dan pekerja harian.',
  },
  {
    icon: BookOpen,
    title: 'Pelatihan UKM',
    desc: 'Memberdayakan anggota dan masyarakat melalui pelatihan kewirausahaan dan pengembangan Usaha Kecil Menengah.',
  },
  {
    icon: Landmark,
    title: 'Nilai Pancasila',
    desc: 'Menjunjung tinggi nilai-nilai Pancasila, merawat kebhinnekaan, dan memperkuat persatuan Indonesia.',
  },
  {
    icon: Flag,
    title: 'Tegakkan Keadilan',
    desc: 'Membela kebenaran dan menegakkan keadilan sebagai wujud nyata perjuangan organisasi bagi seluruh rakyat.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function About() {
  return (
    <section id="tentang" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="inline-block rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-600">
            Berdiri Sejak 28 Oktober 2000
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tighter text-slate-900 uppercase italic sm:text-4xl md:text-5xl">
            Tentang Laskar Merah Putih
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-slate-600">
            Laskar Merah Putih (LMP) adalah organisasi kemasyarakatan yang lahir dari semangat Sumpah Pemuda.
            Didirikan untuk mewujudkan kemerdekaan yang hakiki, membela kebenaran, menegakkan keadilan, serta
            mempertahankan kedaulatan Negara Kesatuan Republik Indonesia.
          </p>
        </motion.div>

        {/* Visi & Misi */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid gap-6 sm:grid-cols-2"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-800 p-8 text-white shadow-xl">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/10" />
            <div className="relative">
              <span className="text-xs font-bold uppercase tracking-widest text-red-200">Visi</span>
              <p className="mt-3 text-xl font-bold leading-snug">
                Mewujudkan kemerdekaan yang hakiki bagi seluruh rakyat Indonesia dengan menjunjung tinggi
                nilai kebangsaan, persatuan, dan keadilan sosial.
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-red-50" />
            <div className="relative">
              <span className="text-xs font-bold uppercase tracking-widest text-red-600">Misi</span>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  Memberdayakan masyarakat melalui program sosial, hukum, dan ekonomi.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  Menjaga persatuan dan kesatuan NKRI dari ancaman perpecahan.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  Menjadi komponen masyarakat yang aktif dalam upaya bela negara.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  Memberikan bantuan hukum dan advokasi bagi masyarakat yang membutuhkan.
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Pilar Program */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mt-20"
        >
          <motion.div variants={itemVariants} className="text-center">
            <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic sm:text-3xl">
              Pilar Program
            </h3>
            <p className="mt-2 text-slate-600">Enam pilar utama yang menopang pengabdian LMP kepada bangsa</p>
          </motion.div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p) => (
              <motion.div
                key={p.title}
                variants={itemVariants}
                className="group flex gap-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm transition hover:border-red-100 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white">
                  <p.icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{p.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline Sejarah */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="text-center">
            <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic sm:text-3xl">
              Perjalanan Sejarah
            </h3>
            <p className="mt-2 text-slate-600">Jejak langkah LMP dari awal berdiri hingga kini</p>
          </div>
          <div className="relative mt-12">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 h-full w-0.5 bg-red-100 sm:left-1/2 sm:-translate-x-0.5" />
            <div className="space-y-10">
              {timeline.map((item, idx) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative flex items-start gap-6 sm:items-center ${
                    idx % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
                  }`}
                >
                  {/* Dot on the line */}
                  <div className="absolute left-6 flex h-4 w-4 -translate-x-1.5 items-center justify-center rounded-full border-2 border-red-600 bg-white sm:left-1/2 sm:-translate-x-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                  </div>
                  {/* Spacer for desktop alternating */}
                  <div className="hidden sm:block sm:w-1/2" />
                  {/* Card */}
                  <div
                    className={`ml-12 w-full sm:ml-0 sm:w-1/2 ${
                      idx % 2 === 0 ? 'sm:pr-12' : 'sm:pl-12'
                    }`}
                  >
                    <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                      <span className="inline-block rounded-lg bg-red-600 px-3 py-1 text-xs font-bold text-white">
                        {item.year}
                      </span>
                      <h4 className="mt-2 font-bold text-slate-900">{item.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
