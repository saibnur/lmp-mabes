'use client';

/**
 * PostCard.tsx
 * Social card for a news post.
 * Features:
 *  - Cloudinary lazy image with responsive transform (w_400,c_scale,q_auto)
 *  - Author avatar, name, region badge
 *  - 2-line excerpt clamp
 *  - Optimistic like button (heart toggle, bounce animation)
 *  - Comment count, WhatsApp share
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Heart, MessageSquare, Share2, Pin, Globe, MapPin, Eye } from 'lucide-react';
import { toggleLike } from '@/lib/postService';
import type { Post } from '@/lib/types';
import SearchHighlight from './SearchHighlight';

interface PostCardProps {
    post: Post;
    isLiked?: boolean;
    onLikeChange?: (postId: string, liked: boolean, newCount: number) => void;
    searchQuery?: string;
}

function cloudinaryOptimized(url: string, width = 400): string {
    if (!url) return '';
    return url.replace('/upload/', `/upload/w_${width},c_scale,q_auto,f_auto/`);
}

/** Parse any timestamp format safely: Firestore Timestamp, {_seconds}, ISO string, or ms number */
function parseTimestamp(ts: any): Date | null {
    if (!ts) return null;
    if (typeof ts?.toDate === 'function') return ts.toDate(); // Firestore Timestamp
    if (typeof ts === 'object' && ts._seconds != null) return new Date(ts._seconds * 1000); // REST JSON
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
}

function formatRelativeDate(timestamp: any): string {
    const date = parseTimestamp(timestamp);
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function PostCard({ post, isLiked: initialLiked = false, onLikeChange, searchQuery = '' }: PostCardProps) {
    const [liked, setLiked] = useState(initialLiked);
    const [likeCount, setLikeCount] = useState(post.metrics?.like_count ?? 0);
    const [likeAnimating, setLikeAnimating] = useState(false);
    const [isLikeLoading, setIsLikeLoading] = useState(false);

    const handleLike = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault(); // Don't navigate to post
            if (isLikeLoading) return;

            // Optimistic update
            const newLiked = !liked;
            const newCount = likeCount + (newLiked ? 1 : -1);
            setLiked(newLiked);
            setLikeCount(Math.max(0, newCount));
            setLikeAnimating(true);
            setTimeout(() => setLikeAnimating(false), 400);

            setIsLikeLoading(true);
            try {
                const result = await toggleLike(post.id!);
                setLiked(result.liked);
                setLikeCount(result.like_count);
                onLikeChange?.(post.id!, result.liked, result.like_count);
            } catch {
                // Revert optimistic update on error
                setLiked(liked);
                setLikeCount(likeCount);
            } finally {
                setIsLikeLoading(false);
            }
        },
        [liked, likeCount, isLikeLoading, post.id, onLikeChange]
    );

    const handleShare = useCallback(
        async (e: React.MouseEvent) => {
            e.preventDefault();
            const url = `${window.location.origin}/berita/${post.id}`;
            const text = `${post.title} — LMP`;
            if (navigator.share) {
                try {
                    await navigator.share({ title: text, url });
                } catch {
                    // User cancelled, do nothing
                }
            } else {
                // Fallback: WhatsApp
                window.open(
                    `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`,
                    '_blank',
                    'noopener'
                );
            }
        },
        [post.id, post.title]
    );

    const coverUrl = post.media?.header_image?.url
        ? cloudinaryOptimized(post.media.header_image.url, 600)
        : null;

    const authorInitials = getInitials(post.author?.display_name ?? 'L');
    const isNational = post.visibility?.scope === 'national';
    const category = post.category ?? 'berita';

    return (
        <Link
            href={`/berita/${post.id}`}
            className="group flex flex-col bg-white rounded-2xl border border-slate-100
                       shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200
                       overflow-hidden active:scale-[0.98]"
        >
            {/* Cover Image */}
            <div className="relative aspect-[16/9] bg-slate-100 overflow-hidden">
                {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={coverUrl}
                        alt={post.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200 text-5xl select-none">
                        📰
                    </div>
                )}

                {/* Badges — top right */}
                <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                    {post.is_pinned && (
                        <span className="bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <Pin className="h-2.5 w-2.5" /> PIN
                        </span>
                    )}
                    {/* Category badge */}
                    <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                        {category}
                    </span>
                </div>

                {/* Visibility badge — top left */}
                <div className="absolute top-2.5 left-2.5">
                    {isNational ? (
                        <span className="bg-slate-800/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                            <Globe className="h-2.5 w-2.5" /> Nasional
                        </span>
                    ) : (
                        <span className="bg-slate-800/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" /> {post.visibility?.region_name ?? 'Regional'}
                        </span>
                    )}
                </div>
            </div>

            {/* Card body */}
            <div className="flex flex-col flex-1 p-4 gap-3">
                {/* Author */}
                <div className="flex items-center gap-2.5">
                    {post.author?.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={post.author.photo_url}
                            alt={post.author.display_name}
                            className="h-7 w-7 rounded-full object-cover shrink-0 border border-slate-200"
                            loading="lazy"
                        />
                    ) : (
                        <div className="h-7 w-7 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                            {authorInitials}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                            {post.author?.display_name ?? 'LMP'}
                        </p>
                        <p className="text-[10px] text-slate-400">{formatRelativeDate(post.created_at || post.published_at)}</p>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-sm sm:text-base font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors">
                    <SearchHighlight text={post.title || ''} query={searchQuery} />
                </h3>

                {/* Excerpt */}
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
                    <SearchHighlight text={post.content?.excerpt || ''} query={searchQuery} />
                </p>

                {/* Tags */}
                {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                #{t}
                            </span>
                        ))}
                    </div>
                )}

                {/* Bottom engagement bar */}
                <div className="flex items-center gap-3 pt-2 border-t border-slate-50">
                    {/* Views */}
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                        <Eye className="h-3.5 w-3.5" />
                        <span>{(post.metrics?.view_count ?? 0) > 0 ? (post.metrics?.view_count ?? 0).toLocaleString('id-ID') : ''}</span>
                    </span>

                    {/* Like */}
                    <button
                        type="button"
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-all
                            ${liked ? 'text-red-500' : 'text-slate-400 hover:text-red-400'}
                            ${likeAnimating ? 'scale-125' : 'scale-100'}`}
                        aria-label={liked ? 'Batalkan suka' : 'Suka'}
                    >
                        <Heart
                            className={`h-4 w-4 transition-all ${liked ? 'fill-red-500' : ''}`}
                            strokeWidth={liked ? 0 : 2}
                        />
                        <span>{likeCount > 0 ? likeCount.toLocaleString('id-ID') : ''}</span>
                    </button>

                    {/* Comments */}
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.metrics?.comment_count > 0 ? post.metrics.comment_count : ''}</span>
                    </span>

                    <div className="flex-1" />

                    {/* Share */}
                    <button
                        type="button"
                        onClick={handleShare}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-green-500 transition-colors"
                        aria-label="Bagikan"
                    >
                        <Share2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </Link>
    );
}
