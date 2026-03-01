'use client';

import { useState, useEffect } from 'react';
import { getAllArticles, deleteArticle } from '@/lib/beritaService';
import NewsTable from '@/components/news/NewsTable';
import type { BeritaArticle } from '@/models/member.types';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function NewsPage() {
    const [news, setNews] = useState<BeritaArticle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchNews = async () => {
        setIsLoading(true);
        try {
            const data = await getAllArticles();
            setNews(data);
        } catch (error) {
            console.error(error);
            toast.error('Gagal mengambil daftar berita');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        try {
            await deleteArticle(id);
            toast.success('Berita berhasil dihapus');
            fetchNews();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Gagal menghapus berita');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground">Berita & CMS</h1>
                    <p className="text-sm text-text-muted">
                        Kelola semua berita, acara, dan kegiatan
                    </p>
                </div>

                {/*
                 * Tombol "Buat Berita" hanya muncul di desktop (lg:flex).
                 * Di mobile/tablet sudah ada FAB dari BottomNav — tidak perlu dobel.
                 */}
                <Link
                    href="/dashboard/news/buat"
                    className="hidden lg:flex items-center gap-2 shrink-0
                               rounded-xl bg-red-600 px-5 py-2.5
                               text-sm font-bold text-white
                               hover:bg-red-700 active:scale-[0.97]
                               shadow-md shadow-red-600/20 transition-all duration-150"
                >
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
                    Buat Berita
                </Link>
            </div>

            <NewsTable
                news={news}
                isLoading={isLoading}
                onDelete={handleDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
}