'use client';

import { Pencil, Trash2, Heart, MessageSquare, Pin, Globe, MapPin, Eye } from 'lucide-react';
import type { Post } from '@/models/member.types';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

interface PostsTableProps {
    posts: Post[];
    isLoading: boolean;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string }> = {
    berita: { label: 'Berita', bg: 'bg-brand/10', text: 'text-brand-primary' },
    acara: { label: 'Acara', bg: 'bg-green-100', text: 'text-green-700' },
    kegiatan: { label: 'Kegiatan', bg: 'bg-amber-100', text: 'text-amber-700' },
    sosial: { label: 'Sosial', bg: 'bg-sky-100', text: 'text-sky-700' },
    organisasi: { label: 'Organisasi', bg: 'bg-purple-100', text: 'text-purple-700' },
};

function MetricBadge({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
    return (
        <span className="inline-flex items-center gap-1 text-[10px] text-text-muted/70 font-medium" title={label}>
            {icon}
            {value.toLocaleString('id-ID')}
        </span>
    );
}

function parseTimestamp(ts: any): Date | null {
    if (!ts) return null;
    if (typeof ts?.toDate === 'function') return ts.toDate();
    if (typeof ts === 'object' && ts._seconds != null) return new Date(ts._seconds * 1000);
    let d = new Date(ts);
    if (isNaN(d.getTime()) && typeof ts === 'string') {
        d = new Date(ts.replace(' ', 'T'));
    }
    return isNaN(d.getTime()) ? null : d;
}

function formatDisplayDate(timestamp: any): string {
    const date = parseTimestamp(timestamp);
    if (!date) return '—';
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function PostsTable({ posts, isLoading, onDelete, isDeleting }: PostsTableProps) {
    if (isLoading) {
        return (
            <div className="glass-card flex h-64 items-center justify-center bg-surface/50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand/30 border-t-brand" />
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden shadow-sm border border-border-custom bg-surface">
            {/* Header */}
            <div className="border-b border-border-custom bg-surface-hover/30 px-4 sm:px-6 py-4">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    {posts.length} Post
                </p>
            </div>

            {posts.length === 0 ? (
                <div className="py-24 text-center text-text-muted space-y-2">
                    <p className="text-2xl">📰</p>
                    <p className="text-sm font-medium">Belum ada post. Buat post pertama menggunakan tombol di atas.</p>
                </div>
            ) : (
                <div className="divide-y divide-border-custom/50">
                    {posts.map((item) => {
                        const cat = CATEGORY_MAP[item.category?.toLowerCase()] ?? CATEGORY_MAP.berita;
                        const coverUrl = item.media?.header_image?.url;
                        const authorName = item.author?.display_name ?? '—';
                        const metrics = item.metrics ?? { like_count: 0, comment_count: 0, view_count: 0, share_count: 0 };

                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 px-4 sm:px-6 py-4 transition-colors hover:bg-surface-hover/40"
                            >
                                {/* Thumbnail */}
                                {coverUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={coverUrl}
                                        alt=""
                                        className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl object-cover border border-border-custom"
                                    />
                                ) : (
                                    <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl bg-surface-hover border border-border-custom text-xl">
                                        📰
                                    </div>
                                )}

                                {/* Main content */}
                                <div className="min-w-0 flex-1">
                                    {/* Title row */}
                                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                        {item.is_pinned && (
                                            <span title="Dipin">
                                                <Pin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            </span>
                                        )}
                                        <h4 className="truncate text-sm sm:text-base font-bold text-foreground">
                                            {item.title}
                                        </h4>
                                        {item.status !== 'published' && (
                                            <span className="shrink-0 rounded bg-lmp-navy/5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-text-muted">
                                                DRAFT
                                            </span>
                                        )}
                                    </div>

                                    {/* Excerpt */}
                                    <p className="mt-0.5 line-clamp-1 text-xs text-text-muted leading-relaxed">
                                        {item.content?.excerpt}
                                    </p>

                                    {/* Meta row */}
                                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cat.bg} ${cat.text}`}>
                                            {cat.label}
                                        </span>
                                        {/* Visibility badge */}
                                        {item.visibility?.scope === 'national' ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-text-muted/60">
                                                <Globe className="h-3 w-3" /> Nasional
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] text-text-muted/60">
                                                <MapPin className="h-3 w-3" /> {item.visibility?.region_name ?? 'Regional'}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-text-muted/60">{authorName}</span>
                                        <span className="inline-flex items-center gap-1 text-[10px] text-text-muted/60">
                                            <Calendar className="h-3 w-3" /> {formatDisplayDate(item.published_at || item.created_at)}
                                        </span>
                                        {/* Engagement metrics */}
                                        <span className="hidden sm:flex items-center gap-2">
                                            <MetricBadge icon={<Eye className="h-3 w-3" />} value={metrics.view_count} label="Dilihat" />
                                            <MetricBadge icon={<Heart className="h-3 w-3" />} value={metrics.like_count} label="Likes" />
                                            <MetricBadge icon={<MessageSquare className="h-3 w-3" />} value={metrics.comment_count} label="Komentar" />
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex shrink-0 items-center gap-1">
                                    <Link
                                        href={`/dashboard/news/${item.id}`}
                                        className="rounded-xl p-2 text-text-muted transition-all hover:bg-sky-100 hover:text-sky-600"
                                        title="Lihat Detail"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Link>
                                    <Link
                                        href={`/dashboard/news/edit/${item.id}`}
                                        className="rounded-xl p-2 text-text-muted transition-all hover:bg-slate-900 hover:text-white"
                                        title="Edit"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                    <button
                                        onClick={() => {
                                            if (confirm('Hapus post ini? Semua aset Cloudinary akan ikut dihapus.'))
                                                onDelete(item.id!);
                                        }}
                                        disabled={isDeleting}
                                        className="rounded-xl p-2 text-text-muted transition-all hover:bg-red-100 hover:text-red-600 disabled:opacity-30"
                                        title="Hapus"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
