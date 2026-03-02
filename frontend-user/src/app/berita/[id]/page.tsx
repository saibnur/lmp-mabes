'use client';

/**
 * /berita/[id] — Article Detail Page
 *
 * Load order:
 *  1. Try to load from `posts` collection (new schema) via backend API
 *  2. If not found (404), fall back to legacy `berita` Firestore collection
 *     (for backward-compatible old URLs from before migration)
 *  3. If neither exists, show 404-style error
 */

import { useEffect, useState, use } from 'react';
import { getPostById } from '@/lib/postService';
import { getArticleById } from '@/lib/beritaService';
import PostDetail from '@/features/berita/components/PostDetail';
import type { Post } from '@/lib/types';
import type { BeritaArticle } from '@/lib/types';
import { Loader2, ArrowLeft, Newspaper } from 'lucide-react';
import Link from 'next/link';
import Footer from '@/features/landing/components/Footer';

// ── Convert legacy BeritaArticle → Post (for rendering via PostDetail)
function legacyToPost(article: BeritaArticle): Post {
    return {
        id: article.id,
        _schema_version: 1,
        title: article.title,
        content: {
            html_body: article.content,
            excerpt: article.excerpt,
            format: 'tiptap_html',
        },
        media: {
            header_image: { url: article.headerImage, public_id: '', width: null, height: null },
            inline_assets: [],
        },
        author: {
            uid: article.authorId,
            display_name: article.authorName,
            photo_url: '',
            role: article.authorRole,
            region_id: '00',
            region_name: 'Nasional',
        },
        visibility: {
            scope: 'national',
            region_id: '00',
            region_name: 'Nasional',
            region_level: 'pusat',
            visible_to_ancestors: true,
            visible_to_descendants: true,
        },
        category: article.category ?? 'berita',
        tags: [],
        status: article.status,
        is_pinned: false,
        metrics: { like_count: 0, comment_count: 0, view_count: 0, share_count: 0 },
        created_at: article.createdAt,
        updated_at: article.updatedAt,
        published_at: article.createdAt,
    };
}

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            setNotFound(false);

            try {
                // 1. Try new `posts` collection
                const newPost = await getPostById(id);
                setPost(newPost);
            } catch (err: any) {
                // 404 or auth error → try legacy berita collection
                console.info('[ArticleDetailPage] Not found in posts, trying berita fallback:', err?.response?.status);
                try {
                    const legacy = await getArticleById(id);
                    if (legacy) {
                        setPost(legacyToPost(legacy));
                    } else {
                        setNotFound(true);
                    }
                } catch {
                    setNotFound(true);
                }
            } finally {
                setLoading(false);
            }
        }

        if (id) load();
    }, [id]);

    if (loading) {
        return (
            <div className="bg-slate-50 min-h-screen flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-red-600 animate-spin" />
            </div>
        );
    }

    if (notFound || !post) {
        return (
            <div className="bg-white min-h-screen pt-24 pb-20">
                <div className="container mx-auto px-4 max-w-3xl text-center py-24">
                    <Newspaper className="h-20 w-20 text-slate-200 mx-auto mb-6" />
                    <h1 className="text-3xl font-black text-slate-900 mb-3">Berita Tidak Ditemukan</h1>
                    <p className="text-slate-500 mb-8">
                        Berita yang Anda cari mungkin sudah dihapus atau tidak tersedia.
                    </p>
                    <Link
                        href="/berita"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Indeks Berita
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    return <PostDetail post={post} />;
}
