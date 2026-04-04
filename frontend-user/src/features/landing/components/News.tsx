'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Newspaper, ArrowRight } from 'lucide-react';
import { getTrendingPosts } from '@/lib/postService';
import type { Post } from '@/lib/types';

export default function News() {
  const [news, setNews] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      try {
        const posts = await getTrendingPosts(3);
        setNews(posts);
      } catch (error) {
        console.error('Failed to load news:', error);
      } finally {
        setLoading(false);
      }
    }
    loadNews();
  }, []);

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
            href="/berita"
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
          {loading ? (
            // Skeleton Loader
            [1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="h-44 bg-slate-200" />
                <div className="p-5">
                  <div className="h-4 w-24 bg-slate-200 rounded mb-2" />
                  <div className="h-6 w-full bg-slate-200 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-slate-200 rounded" />
                </div>
              </div>
            ))
          ) : news.length > 0 ? (
            news.map((item) => {
              const epoch = item.published_at?._seconds || item.published_at?.seconds || item.created_at?._seconds || item.created_at?.seconds;
              const dateStr = epoch
                ? new Date(epoch * 1000).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })
                : 'Tanggal Tidak Diketahui';

              return (
                <Link
                  href={`/berita/${item.id}`}
                  key={item.id}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md block"
                >
                  <div className="flex h-44 items-center justify-center bg-slate-100 overflow-hidden relative">
                    {item.media?.header_image?.url ? (
                      <img
                        src={item.media.header_image.url}
                        alt={item.title || 'Berita'}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <Newspaper className="h-12 w-12 text-slate-400" />
                    )}
                  </div>
                  <div className="p-5">
                    <time className="text-sm font-medium text-red-600">{dateStr}</time>
                    <h3 className="mt-2 text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                      {item.content?.excerpt || 'Tidak ada ringkasan.'}
                    </p>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center">
              <Newspaper className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">Belum Ada Berita</h3>
              <p className="mt-2 text-slate-500">Berita terbaru akan segera hadir.</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
