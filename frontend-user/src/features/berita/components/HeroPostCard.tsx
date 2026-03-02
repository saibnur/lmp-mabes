'use client';

/**
 * HeroPostCard.tsx
 * Large hero card for the top/pinned story in the feed.
 * Features: full-width image with gradient overlay, floating badges,
 * engagement stats (views, likes, comments), and author info.
 */

import Link from 'next/link';
import { Heart, MessageSquare, Eye, Pin } from 'lucide-react';
import type { Post } from '@/lib/types';

function cloudinaryOptimized(url: string, width = 800): string {
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

function formatCount(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toString();
}

function getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

interface HeroPostCardProps {
    post: Post;
}

export default function HeroPostCard({ post }: HeroPostCardProps) {
    const coverUrl = post.media?.header_image?.url
        ? cloudinaryOptimized(post.media.header_image.url, 800)
        : null;

    const authorInitials = getInitials(post.author?.display_name ?? 'L');
    const metrics = post.metrics ?? { like_count: 0, comment_count: 0, view_count: 0, share_count: 0 };

    return (
        <Link
            href={`/berita/${post.id}`}
            className="group block rounded-2xl overflow-hidden bg-white border border-slate-100
                       shadow-lg hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
        >
            {/* Image */}
            <div className="relative aspect-[16/9] sm:aspect-[21/9] bg-slate-100 overflow-hidden">
                {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={coverUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        loading="eager"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800 text-white text-6xl">
                        📰
                    </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Top badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    {post.is_pinned && (
                        <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                            <Pin className="h-2.5 w-2.5" /> BREAKING
                        </span>
                    )}
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg shadow-sm">
                        {post.category ?? 'Berita'}
                    </span>
                </div>

                {/* Bottom content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                    <h2 className="text-lg sm:text-2xl font-black text-white leading-tight mb-3 drop-shadow-lg line-clamp-2">
                        {post.title}
                    </h2>

                    {/* Author + meta */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                            {post.author?.photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={post.author.photo_url}
                                    alt=""
                                    className="h-6 w-6 rounded-full object-cover border border-white/30"
                                />
                            ) : (
                                <div className="h-6 w-6 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">
                                    {authorInitials}
                                </div>
                            )}
                            <span className="text-white/80 text-xs font-medium">
                                {post.author?.display_name} · {formatRelativeDate(post.created_at || post.published_at)}
                            </span>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-white/70 text-xs font-bold">
                                <Eye className="h-3.5 w-3.5" />
                                {formatCount(metrics.view_count)}
                            </span>
                            <span className="flex items-center gap-1 text-white/70 text-xs font-bold">
                                <Heart className="h-3.5 w-3.5" />
                                {formatCount(metrics.like_count)}
                            </span>
                            <span className="flex items-center gap-1 text-white/70 text-xs font-bold">
                                <MessageSquare className="h-3.5 w-3.5" />
                                {formatCount(metrics.comment_count)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
