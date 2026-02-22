'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Newspaper, ArrowRight } from 'lucide-react';

const news = [
  {
    id: 1,
    title: 'LMP Gelar Bakti Sosial di Daerah Terpencil',
    date: '12 Februari 2025',
    snippet:
      'Kegiatan bakti sosial melibatkan puluhan relawan dan bantuan sembako untuk warga.',
    image: null,
  },
  {
    id: 2,
    title: 'Peluncuran KTA Digital untuk Seluruh Anggota',
    date: '8 Februari 2025',
    snippet:
      'Kartu Tanda Anggota digital resmi diluncurkan untuk memudahkan verifikasi.',
    image: null,
  },
  {
    id: 3,
    title: 'Kerja Sama LMP dengan Kementerian Terkait',
    date: '1 Februari 2025',
    snippet:
      'Penandatanganan MoU untuk program pemberdayaan masyarakat dan UKM.',
    image: null,
  },
];

export default function News() {
  return (
    <section id="berita" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end"
        >
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic sm:text-4xl md:text-5xl">
              Berita Terkini
            </h2>
            <p className="mt-4 max-w-xl text-lg text-slate-600">
              Informasi dan update terbaru seputar kegiatan LMP.
            </p>
          </div>
          <Link
            href="#"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-red-600 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Lihat Semua Berita
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {news.map((item, i) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-44 items-center justify-center bg-slate-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Newspaper className="h-12 w-12 text-slate-400" />
                )}
              </div>
              <div className="p-5">
                <time className="text-sm text-slate-500">{item.date}</time>
                <h3 className="mt-2 text-lg font-bold text-slate-900 line-clamp-2">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                  {item.snippet}
                </p>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
