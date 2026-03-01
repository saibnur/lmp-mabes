'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getArticleById, deleteArticle } from '@/lib/beritaService';
import { BeritaArticle } from '@/lib/types';
import { useUserProfile } from '@/store/UserProfileProvider';
import Footer from '@/features/landing/components/Footer';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Tag, Pencil, Trash2, Loader2, Newspaper } from 'lucide-react';

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { profile, uid } = useUserProfile();

    const [article, setArticle] = useState<BeritaArticle | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (id) {
            getArticleById(id)
                .then(data => {
                    setArticle(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Failed to load article:", err);
                    setLoading(false);
                });
        }
    }, [id]);

    const handleDelete = async () => {
        if (confirm('Apakah Anda yakin ingin menghapus berita ini? Tindakan ini tidak dapat dibatalkan.')) {
            setIsDeleting(true);
            try {
                await deleteArticle(id);
                router.push('/berita');
            } catch (error) {
                console.error("Failed to delete article", error);
                alert("Gagal menghapus berita.");
                setIsDeleting(false);
            }
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="bg-slate-50 min-h-screen pt-24 pb-20 flex justify-center items-center">
                <Loader2 className="w-10 h-10 animate-spin text-red-600" />
            </div>
        );
    }

    if (!article) {
        return (
            <div className="bg-slate-50 min-h-screen pt-32 pb-20">
                <div className="container mx-auto px-4 max-w-3xl text-center">
                    <h1 className="text-3xl font-black text-slate-900 mb-4">Berita Tidak Ditemukan</h1>
                    <p className="text-slate-500 mb-8">Berita yang Anda cari mungkin sudah dihapus atau tidak tersedia.</p>
                    <Link href="/berita" className="inline-flex items-center text-sm font-bold text-red-600 hover:text-red-700 transition">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Indeks Berita
                    </Link>
                </div>
            </div>
        );
    }

    // Permission check
    const isAuthor = uid === article.authorId;
    const isAdmin = profile?.role === 'admin';
    const canEdit = isAuthor || isAdmin;

    return (
        <div className="bg-white min-h-screen">
            {/* Header Content */}
            <article className="pt-24 pb-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-8">
                        <Link href="/berita" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Kembali ke Indeks Berita
                        </Link>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
                            <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {article.category}
                            </span>
                            <span className="text-slate-400 flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {formatDate(article.createdAt)}
                            </span>
                            <span className="text-slate-400 flex items-center gap-1.5">
                                <User className="w-4 h-4" />
                                {article.authorName} {article.authorRole === 'admin' && <span className="bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">Admin</span>}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                            {article.title}
                        </h1>

                        {canEdit && (
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                <Link
                                    href={`/berita/edit/${article.id}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Edit Berita
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-bold transition disabled:opacity-50"
                                >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    Hapus Berita
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hero Image */}
                <div className="container mx-auto px-4 max-w-5xl mt-10">
                    <div className="aspect-[21/9] w-full rounded-3xl overflow-hidden bg-slate-100 shadow-md">
                        {article.headerImage ? (
                            <img
                                src={article.headerImage}
                                alt={article.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                <Newspaper className="w-20 h-20 mb-4" />
                                <span className="text-lg font-medium">Gambar Tidak Tersedia</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Article Prose Content */}
                <div className="container mx-auto px-4 max-w-3xl mt-12 mb-20">
                    <div
                        className="prose prose-slate prose-lg max-w-none prose-img:rounded-xl prose-img:shadow-md prose-a:text-red-600 prose-headings:text-slate-900"
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                </div>
            </article>

            <Footer />
        </div>
    );
}
