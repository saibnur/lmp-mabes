'use client';

import { Pencil, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
import type { NewsItem } from '@/models/member.types';

interface NewsTableProps {
    news: NewsItem[];
    isLoading: boolean;
    onEdit: (item: NewsItem) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
    isDeleting: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; bg: string; text: string }> = {
    berita: { label: 'Berita', bg: 'bg-brand/10', text: 'text-brand-primary' },
    acara: { label: 'Acara', bg: 'bg-green-100', text: 'text-green-700' },
    kegiatan: { label: 'Kegiatan', bg: 'bg-amber-100', text: 'text-amber-700' },
};

export default function NewsTable({ news, isLoading, onEdit, onDelete, onCreate, isDeleting }: NewsTableProps) {
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
            <div className="flex items-center justify-between border-b border-border-custom bg-surface-hover/30 px-6 py-4">
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{news.length} Artikel Berita</p>
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-primary/20 transition hover:bg-brand-primary-light active:scale-95"
                >
                    <Plus className="h-4 w-4" />
                    Tambah Berita
                </button>
            </div>

            {news.length === 0 ? (
                <div className="py-24 text-center text-text-muted">
                    <p className="text-sm font-medium">Belum ada berita. Klik "Tambah" untuk membuat yang baru.</p>
                </div>
            ) : (
                <div className="divide-y divide-border-custom/50">
                    {news.map((item) => {
                        const cat = CATEGORY_MAP[item.category] || CATEGORY_MAP.berita;
                        return (
                            <div
                                key={item.id}
                                className="flex items-center gap-5 px-6 py-4 transition-colors hover:bg-surface-hover/40"
                            >
                                {/* Thumbnail */}
                                {item.imageURL ? (
                                    <img
                                        src={item.imageURL}
                                        alt=""
                                        className="h-16 w-16 flex-shrink-0 rounded-xl object-cover border border-border-custom"
                                    />
                                ) : (
                                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-surface-hover text-text-muted border border-border-custom">
                                        📰
                                    </div>
                                )}

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="truncate text-sm font-bold text-foreground">{item.title}</h4>
                                        {!item.published && (
                                            <span className="inline-flex items-center gap-1 rounded bg-lmp-navy/5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-text-muted">
                                                DRAFT
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 line-clamp-1 text-xs text-text-muted leading-relaxed">{item.content}</p>
                                    <div className="mt-2 flex items-center gap-3">
                                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cat.bg} ${cat.text}`}>
                                            {cat.label}
                                        </span>
                                        <span className="text-[10px] font-medium text-text-muted/60">ditulis oleh {item.author || 'Admin'}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-shrink-0 items-center gap-1">
                                    <button
                                        onClick={() => onEdit(item)}
                                        className="rounded-xl p-2.5 text-text-muted transition-all hover:bg-brand-primary/10 hover:text-brand-primary"
                                    >
                                        <Pencil className="h-4.5 w-4.5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Hapus berita ini?')) onDelete(item.id);
                                        }}
                                        disabled={isDeleting}
                                        className="rounded-xl p-2.5 text-text-muted transition-all hover:bg-danger/10 hover:text-danger disabled:opacity-30"
                                    >
                                        <Trash2 className="h-4.5 w-4.5" />
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
