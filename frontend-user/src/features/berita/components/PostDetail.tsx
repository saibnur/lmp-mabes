'use client';

/**
 * PostDetail.tsx
 * Full article detail with:
 *  - Immersive hero image with gradient overlay
 *  - Floating back button, category badge, title overlaid on image
 *  - Optimistic like button + view count
 *  - WhatsApp / Web Share API share
 *  - CommentSection
 *  - Related stories section
 */

import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from '@/store/UserProfileProvider';
import { checkLike, toggleLike, getFeedPosts } from '@/lib/postService';
import CommentSection from './CommentSection';
import type { Post } from '@/lib/types';
import {
    Heart, Share2, MessageSquare, Calendar, User,
    ArrowLeft, Globe, MapPin, Tag, Pin, Loader2, Eye
} from 'lucide-react';
import Link from 'next/link';
import Footer from '@/features/landing/components/Footer';
import MiniPostCard from './MiniPostCard';

interface PostDetailProps {
    post: Post;
}

function cloudinaryOptimized(url: string, width = 1200): string {
    if (!url) return '';
    return url.replace('/upload/', `/upload/w_${width},c_scale,q_auto,f_auto/`);
}

function parseTimestamp(ts: any): Date | null {
    if (!ts) return null;
    if (typeof ts?.toDate === 'function') return ts.toDate();
    if (typeof ts === 'object' && ts._seconds != null) return new Date(ts._seconds * 1000);
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

function formatDate(ts: any) {
    const d = parseTimestamp(ts);
    if (!d) return '';
    return d.toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
}

function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
}

export default function PostDetail({ post }: PostDetailProps) {
    const { uid } = useUserProfile();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.metrics?.like_count ?? 0);
    const [commentCount, setCommentCount] = useState(post.metrics?.comment_count ?? 0);
    const [likeAnimating, setLikeAnimating] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);
    const [sanitizedHtml, setSanitizedHtml] = useState('');
    const [htmlReady, setHtmlReady] = useState(false);
    const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);

    // Check initial like status
    useEffect(() => {
        if (uid && post.id) {
            checkLike(post.id).then(setLiked);
        }
    }, [uid, post.id]);

    // Sanitize HTML (client-only with DOMPurify)
    useEffect(() => {
        let raw = post.content?.html_body ?? '';
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
    }, [post.content?.html_body]);

    // Load related posts from same category
    useEffect(() => {
        if (!post.category) return;
        getFeedPosts({ category: post.category, limit: 4 })
            .then(({ posts }) => {
                setRelatedPosts(posts.filter((p) => p.id !== post.id).slice(0, 3));
            })
            .catch(() => { });
    }, [post.id, post.category]);

    const handleLike = useCallback(async () => {
        if (!uid) { alert('Login terlebih dahulu untuk menyukai post ini'); return; }
        if (isLikeLoading) return;

        // Optimistic
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount((c) => Math.max(0, c + (newLiked ? 1 : -1)));
        setLikeAnimating(true);
        setTimeout(() => setLikeAnimating(false), 400);

        setIsLikeLoading(true);
        try {
            const r = await toggleLike(post.id!);
            setLiked(r.liked);
            setLikeCount(r.like_count);
        } catch {
            // Revert
            setLiked(liked);
            setLikeCount(post.metrics?.like_count ?? 0);
        } finally {
            setIsLikeLoading(false);
        }
    }, [uid, liked, isLikeLoading, post.id, post.metrics?.like_count]);

    const handleShare = useCallback(async () => {
        const url = `${window.location.origin}/berita/${post.id}`;
        const title = post.title;
        if (navigator.share) {
            try { await navigator.share({ title, url }); } catch { /* cancelled */ }
        } else {
            // WhatsApp fallback
            window.open(
                `https://wa.me/?text=${encodeURIComponent(title + '\n' + url)}`,
                '_blank',
                'noopener'
            );
        }
    }, [post.id, post.title]);

    const coverUrl = post.media?.header_image?.url
        ? cloudinaryOptimized(post.media.header_image.url, 1200)
        : null;
    const isNational = post.visibility?.scope === 'national';
    const viewCount = post.metrics?.view_count ?? 0;

    return (
        <div className="bg-white min-h-screen">
            <article className="pb-12">

                {/* ── Immersive Hero ── */}
                <div className="relative w-full" style={{ minHeight: coverUrl ? 360 : 120 }}>
                    {coverUrl ? (
                        <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden bg-slate-900">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={coverUrl}
                                alt={post.title}
                                className="w-full h-full object-cover"
                                loading="eager"
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />

                            {/* Floating back button */}
                            <Link
                                href="/berita"
                                className="absolute top-4 left-4 h-9 w-9 rounded-full bg-black/60 backdrop-blur-sm
                                           border border-white/20 flex items-center justify-center text-white
                                           hover:bg-black/80 transition-all active:scale-90"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>

                            {/* Floating badges top-right */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                {post.is_pinned && (
                                    <span className="bg-red-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                        <Pin className="h-2.5 w-2.5" /> PIN
                                    </span>
                                )}
                                <span className="bg-white/20 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                    {post.category}
                                </span>
                            </div>

                            {/* Title + meta overlaid on image bottom */}
                            <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-10">
                                <h1 className="text-xl sm:text-3xl font-black text-white leading-tight drop-shadow-lg line-clamp-3">
                                    {post.title}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center gap-3 text-white/70 text-xs">
                                    <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" /> {post.author?.display_name}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" /> {formatDate(post.published_at || post.created_at)}
                                    </span>
                                    {isNational ? (
                                        <span className="flex items-center gap-1">
                                            <Globe className="h-3 w-3" /> Nasional
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" /> {post.visibility?.region_name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* No image fallback — classic title header */
                        <div className="bg-slate-50 pt-4 pb-6 px-4">
                            <Link href="/berita" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition gap-1.5 mb-4">
                                <ArrowLeft className="h-4 w-4" /> Kembali ke Berita
                            </Link>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1">
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
                            </div>
                            <h1 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">
                                {post.title}
                            </h1>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-slate-400 text-xs">
                                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {post.author?.display_name}</span>
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(post.published_at || post.created_at)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Engagement bar ── */}
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="flex items-center gap-3 py-4 border-b border-slate-100 flex-wrap">
                        {/* Like */}
                        <button
                            type="button"
                            onClick={handleLike}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                                ${liked
                                    ? 'bg-red-50 text-red-500 border border-red-200'
                                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-red-50 hover:text-red-400 hover:border-red-200'}
                                ${likeAnimating ? 'scale-110' : 'scale-100'}`}
                            aria-label={liked ? 'Batalkan suka' : 'Suka'}
                        >
                            {isLikeLoading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Heart className={`h-4 w-4 transition-all ${liked ? 'fill-red-500' : ''}`} strokeWidth={liked ? 0 : 2} />}
                            <span>{likeCount.toLocaleString('id-ID')}</span>
                            <span className="hidden sm:inline">{liked ? 'Disukai' : 'Suka'}</span>
                        </button>

                        {/* Comment count */}
                        <span className="flex items-center gap-1.5 text-sm text-slate-500">
                            <MessageSquare className="h-4 w-4" />
                            {commentCount.toLocaleString('id-ID')} komentar
                        </span>

                        {/* View count */}
                        {viewCount > 0 && (
                            <span className="flex items-center gap-1.5 text-sm text-slate-400">
                                <Eye className="h-4 w-4" />
                                {viewCount.toLocaleString('id-ID')} dilihat
                            </span>
                        )}

                        <div className="flex-1" />

                        {/* Share */}
                        <button
                            type="button"
                            onClick={handleShare}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
                                       bg-green-50 text-green-600 border border-green-200
                                       hover:bg-green-100 transition-all"
                        >
                            <Share2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Bagikan</span>
                        </button>
                    </div>

                    {/* ── Prose content ── */}
                    <div className="max-w-3xl mx-auto mt-8">
                        {htmlReady ? (
                            <div
                                className="prose prose-slate prose-lg max-w-none
                                           prose-img:rounded-xl prose-img:shadow-md
                                           prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline
                                           prose-headings:font-black prose-headings:text-slate-900
                                           prose-blockquote:border-l-4 prose-blockquote:border-red-600 prose-blockquote:bg-red-50/40 prose-blockquote:rounded-r-xl
                                           prose-code:bg-slate-100 prose-code:rounded"
                                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                            />
                        ) : (
                            <div className="space-y-4 animate-pulse">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-4 bg-slate-200 rounded w-full" />
                                ))}
                            </div>
                        )}

                        {/* Tags */}
                        {post.tags?.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <div className="flex flex-wrap gap-2">
                                    {post.tags.map((t) => (
                                        <span key={t} className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                                            #{t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Bottom engagement */}
                        <div className="mt-8 flex items-center gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                            <button
                                type="button"
                                onClick={handleLike}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                                    ${liked
                                        ? 'bg-red-600 text-white shadow-md shadow-red-300'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-red-50 hover:text-red-500'}
                                    ${likeAnimating ? 'scale-105' : 'scale-100'}`}
                            >
                                <Heart className={`h-4 w-4 ${liked ? 'fill-white' : ''}`} strokeWidth={liked ? 0 : 2} />
                                {liked ? 'Disukai ❤️' : 'Suka'}
                            </button>
                            <button
                                type="button"
                                onClick={handleShare}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
                                           bg-green-600 text-white hover:bg-green-700 transition-all shadow-md shadow-green-200"
                            >
                                <Share2 className="h-4 w-4" />
                                Bagikan via WhatsApp
                            </button>
                        </div>

                        {/* Comment section */}
                        <CommentSection
                            postId={post.id!}
                            onCountChange={setCommentCount}
                        />

                        {/* ── Related Stories ── */}
                        {relatedPosts.length > 0 && (
                            <div className="mt-12 pt-8 border-t border-slate-100">
                                <h2 className="text-lg font-black text-slate-900 mb-4">Berita Terkait</h2>
                                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                                    {relatedPosts.map((rp) => (
                                        <MiniPostCard key={rp.id} post={rp} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </article>
            <Footer />
        </div>
    );
}
