'use client';

/**
 * /dashboard/news/[id] — Admin: Article Detail View
 * Menampilkan berita secara mengalir seperti frontend-user,
 * dengan tambahan tombol Edit dan akses admin.
 */

import { useEffect, useState, use } from 'react';
import { getPostById } from '@/lib/postService';
import type { Post } from '@/models/member.types';
import {
    ArrowLeft, Pencil, Loader2, Calendar, User,
    Globe, MapPin, Tag, Pin, Heart, MessageSquare,
    Newspaper, Eye
} from 'lucide-react';
import Link from 'next/link';

function cloudinaryOptimized(url: string, width = 1200): string {
    if (!url) return '';
    return url.replace('/upload/', `/upload/w_${width},c_scale,q_auto,f_auto/`);
}

function formatDate(ts: any) {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

export default function AdminNewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [sanitizedHtml, setSanitizedHtml] = useState('');
    const [htmlReady, setHtmlReady] = useState(false);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const data = await getPostById(id);
                setPost(data);
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }
        if (id) load();
    }, [id]);

    useEffect(() => {
        if (!post?.content?.html_body) return;
        const raw = post.content.html_body;
        import('dompurify').then((DOMPurify) => {
            setSanitizedHtml(DOMPurify.default.sanitize(raw, {
                ADD_TAGS: ['iframe'],
                ADD_ATTR: ['allowfullscreen', 'frameborder', 'src'],
            }));
            setHtmlReady(true);
        }).catch(() => {
            setSanitizedHtml(raw);
            setHtmlReady(true);
        });
    }, [post?.content?.html_body]);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-10 w-10 text-red-600 animate-spin" />
            </div>
        );
    }

    if (notFound || !post) {
        return (
            <div className="text-center py-24">
                <Newspaper className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">Berita Tidak Ditemukan</h2>
                <p className="text-slate-500 mb-6">Post dengan ID ini tidak tersedia atau sudah dihapus.</p>
                <Link
                    href="/dashboard/news"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Daftar
                </Link>
            </div>
        );
    }

    const coverUrl = post.media?.header_image?.url
        ? cloudinaryOptimized(post.media.header_image.url, 1200)
        : null;
    const isNational = post.visibility?.scope === 'national';

    return (
        <div className="max-w-4xl mx-auto">
            {/* Top action bar */}
            <div className="flex items-center justify-between mb-6">
                <Link
                    href="/dashboard/news"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-900 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Daftar
                </Link>
                <div className="flex items-center gap-2">
                    {post.status !== 'published' && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                            Draft
                        </span>
                    )}
                    <Link
                        href={`/dashboard/news/edit/${id}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-red-700 transition shadow-sm shadow-red-200"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit Post
                    </Link>
                </div>
            </div>

            {/* Article card */}
            <div className="glass-card border border-border-custom bg-surface overflow-hidden">

                {/* Cover image */}
                {coverUrl && (
                    <div className="aspect-[21/9] w-full overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={coverUrl}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            loading="eager"
                        />
                    </div>
                )}

                <div className="p-6 md:p-8">
                    {/* Metadata row */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
                            <Tag className="h-3 w-3" /> {post.category}
                        </span>
                        {isNational ? (
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <Globe className="h-3 w-3" /> Nasional
                            </span>
                        ) : (
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {post.visibility?.region_name}
                            </span>
                        )}
                        {post.is_pinned && (
                            <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                                <Pin className="h-3 w-3" /> Dipin
                            </span>
                        )}
                        <span className="text-slate-400 text-xs flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(post.published_at || post.created_at)}
                        </span>
                        <span className="text-slate-400 text-xs flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            {post.author?.display_name}
                            {post.author?.role === 'admin' && (
                                <span className="bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">Admin</span>
                            )}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-black text-foreground leading-tight mb-6">
                        {post.title}
                    </h1>

                    {/* Engagement stats (read-only for admin) */}
                    <div className="flex items-center gap-4 pb-6 mb-6 border-b border-border-custom/50 text-sm text-text-muted">
                        <span className="flex items-center gap-1.5">
                            <Eye className="h-4 w-4 text-slate-400" />
                            {(post.metrics?.view_count ?? 0).toLocaleString('id-ID')} dilihat
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Heart className="h-4 w-4 text-red-400" />
                            {(post.metrics?.like_count ?? 0).toLocaleString('id-ID')} suka
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MessageSquare className="h-4 w-4 text-sky-400" />
                            {(post.metrics?.comment_count ?? 0).toLocaleString('id-ID')} komentar
                        </span>
                    </div>

                    {/* Article content */}
                    {htmlReady ? (
                        <div
                            className="prose prose-slate prose-lg max-w-none
                                       prose-img:rounded-xl prose-img:shadow-md
                                       prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline
                                       prose-headings:font-black prose-headings:text-foreground
                                       prose-blockquote:border-red-500
                                       prose-code:bg-slate-100 prose-code:rounded"
                            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                        />
                    ) : (
                        <div className="space-y-4 animate-pulse">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-4 bg-slate-200 rounded w-full" />
                            ))}
                        </div>
                    )}

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-border-custom/50">
                            <div className="flex flex-wrap gap-2">
                                {post.tags.map((t) => (
                                    <span key={t} className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full border border-brand-primary/20">
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bottom action bar */}
                    <div className="mt-8 pt-6 border-t border-border-custom/50 flex items-center gap-3">
                        <Link
                            href={`/dashboard/news/edit/${id}`}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-bold hover:bg-red-700 transition shadow-sm"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit Post Ini
                        </Link>
                        <Link
                            href="/dashboard/news"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-custom text-text-muted text-sm font-bold hover:bg-surface-hover transition"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
