'use client';

/**
 * MiniPostCard.tsx
 * Compact card for the "Trending" horizontal carousel.
 * Features: cover image, category badge, title, time, view count.
 */

import Link from 'next/link';
import { Eye } from 'lucide-react';
import type { Post } from '@/lib/types';

const CATEGORY_COLORS: Record<string, string> = {
    berita: 'text-red-500',
    kegiatan: 'text-emerald-500',
    acara: 'text-amber-500',
    sosial: 'text-sky-500',
    organisasi: 'text-purple-500',
};

function cloudinaryOptimized(url: string, width = 400): string {
    if (!url) return '';
    return url.replace('/upload/', `/upload/w_${width},c_scale,q_auto,f_auto/`);
}

function parseTimestamp(ts: any): Date | null {
    if (!ts) return null;

    // 1. Firebase SDK Timestamp
    if (typeof ts?.toDate === 'function') return ts.toDate();

    // 2. REST API Timestamp Object
    if (typeof ts === 'object' && ts._seconds != null) {
        return new Date(ts._seconds * 1000);
    }

    // 3. String atau Number
    let d = new Date(ts);

    // Jika gagal parsing dan inputnya String, coba bersihkan spasi standar SQL
    if (isNaN(d.getTime()) && typeof ts === 'string') {
        // Hanya lakukan konversi T jika formatnya terlihat seperti YYYY-MM-DD HH:MM:SS
        const sqlFormat = ts.replace(' ', 'T');
        d = new Date(sqlFormat);
    }

    return isNaN(d.getTime()) ? null : d;
}


function formatRelativeDate(timestamp: any): string {
    const date = parseTimestamp(timestamp);
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)}m lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}j lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}h lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function formatCount(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toString();
}

interface MiniPostCardProps {
    post: Post;
}

export default function MiniPostCard({ post }: MiniPostCardProps) {
    const coverUrl = post.media?.header_image?.url
        ? cloudinaryOptimized(post.media.header_image.url, 400)
        : null;
    const catColor = CATEGORY_COLORS[post.category?.toLowerCase()] ?? 'text-red-500';
    const viewCount = post.metrics?.view_count ?? 0;
    console.log("Debug Post Date:", post.id, post.created_at);

    return (
        <Link
            href={`/berita/${post.id}`}
            className="group flex-shrink-0 w-48 sm:w-52 bg-white rounded-2xl overflow-hidden
                       border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1
                       transition-all duration-200 active:scale-[0.96]"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={coverUrl}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200 text-4xl">
                        📰
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Body */}
            <div className="p-3">
                <p className={`text-[9px] font-black uppercase tracking-wider ${catColor} mb-1`}>
                    {post.category ?? 'Berita'}
                </p>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug mb-2 group-hover:text-red-600 transition-colors">
                    {post.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>{formatRelativeDate(post.created_at || post.published_at)}</span>
                    {viewCount > 0 && (
                        <span className="flex items-center gap-0.5">
                            <Eye className="h-3 w-3" />
                            {formatCount(viewCount)}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
