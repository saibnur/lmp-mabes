'use client';

import { useEffect, useState } from 'react';
import Footer from '@/features/landing/components/Footer';
import { motion } from 'framer-motion';
import { Newspaper, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getArticles } from '@/lib/beritaService';
import { BeritaArticle } from '@/lib/types';

export default function BeritaPage() {
    const [news, setNews] = useState<BeritaArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getArticles('published')
            .then(data => {
                setNews(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch articles:", err);
                setLoading(false);
            });
    }, []);

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white min-h-screen">

            {/* Hero Section */}
            <section className="pt-32 pb-20 bg-slate-50">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                        Berita & Kegiatan
                    </h1>
                    <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                        Informasi terkini seputar aktivitas dan pencapaian Laskar Merah Putih
                    </p>
                    <div className="mx-auto mt-6 h-1 w-24 bg-red-600" />
                </div>
            </section>

            {/* News Grid */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-red-600" />
                        </div>
                    ) : news.length === 0 ? (
                        <div className="text-center py-20 max-w-md mx-auto">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Newspaper className="h-10 w-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Belum Ada Berita</h3>
                            <p className="text-slate-500 mb-8">Saat ini belum ada artikel yang diterbitkan. Silakan kembali lagi nanti.</p>
                        </div>
                    ) : (
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                            {news.map((item, i) => (
                                <motion.article
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    key={item.id}
                                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full"
                                >
                                    <div className="relative h-56 overflow-hidden bg-slate-100 flex items-center justify-center">
                                        {item.headerImage ? (
                                            <img
                                                src={item.headerImage}
                                                alt={item.title}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <Newspaper className="h-12 w-12" />
                                                <span className="text-sm font-medium">No Image</span>
                                            </div>
                                        )}
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-red-600 uppercase tracking-wider shadow-sm">
                                            {item.category || 'Berita'}
                                        </div>
                                    </div>

                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                                            <Calendar className="h-4 w-4" />
                                            <time>{formatDate(item.createdAt)}</time>
                                            <span className="mx-1">•</span>
                                            <span>Oleh {item.authorName}</span>
                                        </div>

                                        <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-red-600 transition-colors">
                                            {item.title}
                                        </h3>

                                        <p className="text-slate-600 mb-6 line-clamp-3 w-full max-w-full text-ellipsis overflow-hidden">
                                            {item.excerpt}
                                        </p>

                                        <div className="mt-auto">
                                            <Link
                                                href={`/berita/${item.id}`}
                                                className="inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 transition-colors"
                                            >
                                                Baca Selengkapnya
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </Link>
                                        </div>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
