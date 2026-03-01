'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { BeritaArticle } from '@/models/member.types';
import Link from 'next/link';

interface NewsTableProps {
    news: BeritaArticle[];
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

export default function NewsTable({ news, isLoading, onDelete, isDeleting }: NewsTableProps) {
    if (isLoading) {
        return (
            <div className="glass-card flex h-64 items-center justify-center bg-surface/50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand/30 border-t-brand" />
            </div>
        );
    }

    return (
        <div className="glass-card overflow-hidden shadow-sm border border-border-custom bg-surface">
            {/* Header — hanya jumlah artikel, tanpa tombol tambah */}
            <div className="border-b border-border-custom bg-surface-hover/30 px-4 sm:px-6 py-4">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    {news.length} Artikel
                </p>
            </div>

            {news.length === 0 ? (
                <div className="py-24 text-center text-text-muted space-y-2">
                    <p className="text-2xl">📰</p>
                    <p className="text-sm font-medium">Belum ada artikel. Tambah dari tombol di atas.</p>
                </div>
            ) : (
                <div className="divide-y divide-border-custom/50">
                    {news.map((item) => {
                        const cat =
                            CATEGORY_MAP[item.category?.toLowerCase()] ?? CATEGORY_MAP.berita;
                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 px-4 sm:px-6 py-4
                                           transition-colors hover:bg-surface-hover/40"
                            >
                                {/* Thumbnail */}
                                {item.headerImage ? (
                                    <img
                                        src={item.headerImage}
                                        alt=""
                                        className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl object-cover
                                                   border border-border-custom"
                                    />
                                ) : (
                                    <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center
                                                    justify-center rounded-xl bg-surface-hover
                                                    border border-border-custom text-xl">
                                        📰
                                    </div>
                                )}

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <h4 className="truncate text-sm sm:text-base font-bold text-foreground">
                                            {item.title}
                                        </h4>
                                        {item.status !== 'published' && (
                                            <span className="shrink-0 rounded bg-lmp-navy/5 px-1.5 py-0.5
                                                             text-[9px] font-bold uppercase text-text-muted">
                                                DRAFT
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 line-clamp-1 text-xs text-text-muted leading-relaxed">
                                        {item.excerpt}
                                    </p>
                                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold
                                                          uppercase tracking-wider ${cat.bg} ${cat.text}`}>
                                            {cat.label}
                                        </span>
                                        <span className="text-[10px] text-text-muted/60">
                                            {item.authorName}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex shrink-0 items-center gap-1">
                                    <Link
                                        href={`/dashboard/news/edit/${item.id}`}
                                        className="rounded-xl p-2 text-text-muted transition-all
                                                   hover:bg-brand-primary/10 hover:text-brand-primary"
                                        title="Edit"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Link>
                                    <button
                                        onClick={() => {
                                            if (confirm('Hapus berita ini secara permanen?'))
                                                onDelete(item.id!);
                                        }}
                                        disabled={isDeleting}
                                        className="rounded-xl p-2 text-text-muted transition-all
                                                   hover:bg-red-100 hover:text-red-600
                                                   disabled:opacity-30"
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