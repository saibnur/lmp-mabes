'use client';

import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { motion } from 'framer-motion';
import { Newspaper, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const news = [
    {
        id: 1,
        title: 'LMP Gelar Bakti Sosial di Daerah Terpencil',
        date: '12 Februari 2025',
        category: 'Sosial',
        snippet:
            'Kegiatan bakti sosial melibatkan puluhan relawan dan bantuan sembako untuk warga. Program ini merupakan wujud nyata kepedulian Laskar Merah Putih terhadap masyarakat yang membutuhkan.',
        image: null,
    },
    {
        id: 2,
        title: 'Peluncuran KTA Digital untuk Seluruh Anggota',
        date: '8 Februari 2025',
        category: 'Organisasi',
        snippet:
            'Kartu Tanda Anggota digital resmi diluncurkan untuk memudahkan verifikasi dan database keanggotaan yang lebih terintegrasi secara nasional.',
        image: null,
    },
    {
        id: 3,
        title: 'Kerja Sama LMP dengan Kementerian Terkait',
        date: '1 Februari 2025',
        category: 'Kerjasama',
        snippet:
            'Penandatanganan MoU untuk program pemberdayaan masyarakat dan UKM sebagai langkah strategis mendukung ekonomi kerakyatan.',
        image: null,
    },
    {
        id: 4,
        title: 'Pelatihan Kepemimpinan Tingkat Dasar',
        date: '25 Januari 2025',
        category: 'Pendidikan',
        snippet:
            'Mencetak kader-kader pemimpin masa depan yang berkarakter Pancasila dan memiliki wawasan kebangsaan yang kuat.',
        image: null,
    },
    {
        id: 5,
        title: 'Rapat Koordinasi Nasional 2025',
        date: '15 Januari 2025',
        category: 'Organisasi',
        snippet:
            'Membahas agenda strategis organisasi unuk satu tahun ke depan, termasuk program prioritas dan target pencapaian.',
        image: null,
    },
];

export default function BeritaPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

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
                                    {item.image ? (
                                        <img
                                            src={item.image}
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
                                        {item.category}
                                    </div>
                                </div>

                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                                        <Calendar className="h-4 w-4" />
                                        <time>{item.date}</time>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-red-600 transition-colors">
                                        {item.title}
                                    </h3>

                                    <p className="text-slate-600 mb-6 line-clamp-3 flex-grow">
                                        {item.snippet}
                                    </p>

                                    <Link
                                        href={`/berita/${item.id}`}
                                        className="inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 transition-colors mt-auto"
                                    >
                                        Baca Selengkapnya
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            </motion.article>
                        ))}
                    </div>

                    <div className="mt-16 text-center">
                        <button className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-8 py-4 text-base font-bold text-white transition hover:bg-slate-800 shadow-lg hover:shadow-xl">
                            Muat Lebih Banyak
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
