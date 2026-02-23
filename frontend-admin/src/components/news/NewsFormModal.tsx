'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Image as ImageIcon, Upload, Plus } from 'lucide-react';
import type { NewsItem } from '@/models/member.types';

interface NewsFormModalProps {
    item: NewsItem | null; // null = create mode
    open: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    isSaving: boolean;
}

export default function NewsFormModal({ item, open, onClose, onSave, isSaving }: NewsFormModalProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<'berita' | 'acara' | 'kegiatan'>('berita');
    const [imageURL, setImageURL] = useState('');
    const [published, setPublished] = useState(true);

    useEffect(() => {
        if (item) {
            setTitle(item.title || '');
            setContent(item.content || '');
            setCategory(item.category || 'berita');
            setImageURL(item.imageURL || '');
            setPublished(item.published !== false);
        } else {
            setTitle('');
            setContent('');
            setCategory('berita');
            setImageURL('');
            setPublished(true);
        }
    }, [item, open]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (item) {
            await onSave({ id: item.id, data: { title, content, category, imageURL, published } });
        } else {
            await onSave({ title, content, category, imageURL, published, author: '' });
        }
        onClose();
    };

    const inputClass =
        'w-full rounded-xl border border-border-custom bg-surface py-2.5 px-4 text-sm text-foreground outline-none transition-all focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/5 placeholder:text-text-muted/60 shadow-sm';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-lmp-navy/30 backdrop-blur-md p-4">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-border-custom bg-surface p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between border-b border-border-custom pb-4">
                    <h3 className="text-lg font-black text-foreground">
                        {item ? 'Edit Berita' : 'Tambah Berita'}
                    </h3>
                    <button onClick={onClose} className="rounded-xl p-2 text-text-muted hover:bg-surface-hover hover:text-foreground transition-all">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-text-muted/80">Judul Berita</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={inputClass}
                            placeholder="Tulis judul yang menarik..."
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-text-muted/80">Kategori</label>
                        <div className="flex gap-2">
                            {(['berita', 'acara', 'kegiatan'] as const).map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCategory(c)}
                                    className={`flex-1 rounded-xl border py-2.5 text-xs font-bold capitalize transition-all
                                        ${category === c
                                            ? 'border-brand-primary bg-brand/10 text-brand-primary shadow-sm'
                                            : 'border-border-custom bg-surface text-text-muted hover:border-brand/50'
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-text-muted/80">Isi Konten</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className={inputClass + ' min-h-[140px] resize-y'}
                            placeholder="Deskripsikan berita secara detail..."
                            required
                        />
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="mb-1.5 block text-xs font-black uppercase tracking-widest text-text-muted/80">URL Gambar (Opsional)</label>
                        <div className="relative">
                            <ImageIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-text-muted/50" />
                            <input
                                type="url"
                                value={imageURL}
                                onChange={(e) => setImageURL(e.target.value)}
                                className={inputClass + ' pl-11'}
                                placeholder="Tautan gambar (https://...)"
                            />
                        </div>
                        {imageURL && (
                            <div className="mt-3 overflow-hidden rounded-xl border border-border-custom shadow-inner">
                                <img
                                    src={imageURL}
                                    alt="Preview"
                                    className="h-40 w-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Published toggle */}
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border-custom bg-surface-hover/30 p-3 transition-all hover:bg-surface-hover/50">
                        <input
                            type="checkbox"
                            checked={published}
                            onChange={(e) => setPublished(e.target.checked)}
                            className="h-5 w-5 rounded-lg border-border-custom bg-surface text-brand-primary accent-brand-primary focus:ring-0"
                        />
                        <span className="text-sm font-bold text-text-muted">Langsung publikasikan berita ini</span>
                    </label>

                    {/* Actions */}
                    <div className="flex gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-border-custom bg-surface py-3 text-sm font-bold text-text-muted transition-all hover:bg-surface-hover hover:text-foreground active:scale-95"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || !title || !content}
                            className="flex flex-[1.5] items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition-all hover:bg-brand-primary-light active:scale-95 disabled:opacity-50 disabled:grayscale"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    {item ? <Plus className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                                    {item ? 'Perbarui Berita' : 'Simpan Berita'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
