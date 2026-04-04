'use client';

/**
 * PostEditor.tsx — Admin CMS
 * Rich-text post editor using the existing Tiptap setup (BeritaEditor).
 * Handles:
 *  - Cover image upload via signed Cloudinary (stores public_id)
 *  - Title, Category, Visibility scope dropdowns
 *  - Tags input
 *  - Publish / Draft buttons
 *  - Create and Edit modes via optional `initialPost` prop
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/viewmodels/useAuth';
import { adminService } from '@/services/adminService';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { createPost, updatePost } from '@/lib/postService';
import BeritaEditor from '@/components/news/BeritaEditor';
import { ArrowLeft, Image as ImageIcon, Loader2, Pin, Globe, MapPin, Tag, X } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Post } from '@/models/member.types';

const CATEGORIES = [
    { value: 'berita', label: 'Berita' },
    { value: 'kegiatan', label: 'Kegiatan' },
    { value: 'acara', label: 'Acara' },
    { value: 'sosial', label: 'Sosial' },
    { value: 'organisasi', label: 'Organisasi' },
];

interface PostEditorProps {
    initialPost?: Post;
    mode: 'create' | 'edit';
}

function generateExcerpt(html: string, maxLength = 200): string {
    const tmp = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (!tmp) return html.replace(/<[^>]*>/g, '').substring(0, maxLength);
    tmp.innerHTML = html;
    const text = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) return text;
    const cut = text.substring(0, maxLength);
    const last = cut.lastIndexOf(' ');
    return (last > maxLength * 0.8 ? cut.substring(0, last) : cut) + '…';
}

export default function PostEditor({ initialPost, mode }: PostEditorProps) {
    const router = useRouter();
    const { user, idToken } = useAuth();

    // ── Form state ──
    const [title, setTitle] = useState(initialPost?.title ?? '');
    const [content, setContent] = useState(initialPost?.content?.html_body ?? '');
    const [category, setCategory] = useState(initialPost?.category ?? 'berita');
    const [scope, setScope] = useState<'national' | 'regional'>(
        (initialPost?.visibility?.scope as 'national' | 'regional') ?? 'national'
    );
    const [isPinned, setIsPinned] = useState(initialPost?.is_pinned ?? false);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>(initialPost?.tags ?? []);

    // ── Cover image state ──
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(
        initialPost?.media?.header_image?.url || null
    );
    const [coverMeta, setCoverMeta] = useState<{
        url: string;
        public_id: string;
        width?: number | null;
        height?: number | null;
    }>({
        url: initialPost?.media?.header_image?.url ?? '',
        public_id: initialPost?.media?.header_image?.public_id ?? '',
        width: initialPost?.media?.header_image?.width,
        height: initialPost?.media?.header_image?.height,
    });

    // ── Submitting state ──
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    const handleCoverChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    }, []);

    const addTag = useCallback(() => {
        const t = tagInput.trim().toLowerCase();
        if (t && !tags.includes(t) && tags.length < 10) {
            setTags((prev) => [...prev, t]);
        }
        setTagInput('');
    }, [tagInput, tags]);

    const removeTag = useCallback((t: string) => {
        setTags((prev) => prev.filter((x) => x !== t));
    }, []);

    const handleSubmit = useCallback(
        async (status: 'published' | 'draft') => {
            if (!title.trim()) {
                toast.error('Judul tidak boleh kosong');
                return;
            }
            if (!content.trim()) {
                toast.error('Isi konten tidak boleh kosong');
                return;
            }
            if (!idToken) {
                toast.error('Sesi telah habis, silakan login kembali');
                return;
            }

            setIsSubmitting(true);
            try {
                let finalCoverMeta = { ...coverMeta };

                // Upload cover image if new file selected
                if (coverFile) {
                    setUploadingCover(true);
                    const signRes = await adminService.getSignUpload(idToken, 'posts/headers');
                    if (!signRes.success) throw new Error('Gagal mendapatkan izin upload gambar');
                    const url = await uploadToCloudinary(coverFile, 'posts/headers', signRes);
                    // Extract public_id from URL
                    const parts = url.split('/upload/');
                    let publicId = parts[1] || '';
                    publicId = publicId.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
                    finalCoverMeta = { url, public_id: publicId, width: null, height: null };
                    setUploadingCover(false);
                }

                const excerpt = generateExcerpt(content);

                const payload = {
                    title: title.trim(),
                    content: {
                        html_body: content,
                        excerpt,
                        format: 'tiptap_html',
                    },
                    media: {
                        header_image: finalCoverMeta,
                        inline_assets: initialPost?.media?.inline_assets ?? [],
                    },
                    visibility: {
                        scope,
                        region_id: scope === 'national' ? '00' : (user as any)?.regionId ?? '00',
                        region_name: scope === 'national' ? 'Nasional' : (user as any)?.regionName ?? 'Nasional',
                        region_level: scope === 'national' ? 'pusat' : (user as any)?.regionLevel ?? 'pusat',
                        visible_to_ancestors: true,
                        visible_to_descendants: true,
                    },
                    category,
                    tags,
                    status,
                    is_pinned: isPinned,
                };

                if (mode === 'create') {
                    await createPost(payload);
                    toast.success('Post berhasil dipublikasikan!');
                } else {
                    await updatePost(initialPost!.id!, payload);
                    toast.success('Post berhasil diperbarui!');
                }

                router.push('/dashboard/news');
            } catch (error: any) {
                console.error('[PostEditor] submit error:', error);
                toast.error(error?.response?.data?.message || error.message || 'Gagal menyimpan post');
            } finally {
                setIsSubmitting(false);
                setUploadingCover(false);
            }
        },
        [title, content, coverFile, coverMeta, category, scope, tags, isPinned, idToken, mode, initialPost, router, user]
    );

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Back link */}
            <div>
                <Link
                    href="/dashboard/news"
                    className="inline-flex items-center text-sm font-bold text-text-muted hover:text-foreground transition gap-1.5"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Daftar Berita
                </Link>
            </div>

            <div className="glass-card overflow-hidden border border-border-custom bg-surface p-6 md:p-8 space-y-6">
                <h1 className="text-xl font-bold text-foreground">
                    {mode === 'create' ? 'Buat Post Baru' : 'Edit Post'}
                </h1>

                {/* ── Cover Image ── */}
                <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-text-muted/80">
                        Gambar Cover
                    </label>
                    <div
                        className="relative border-2 border-dashed border-border-custom rounded-2xl overflow-hidden
                                   bg-surface-hover/20 hover:bg-surface-hover/40 transition h-56
                                   flex flex-col items-center justify-center cursor-pointer group"
                    >
                        {coverPreview ? (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={coverPreview}
                                    alt="Cover preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-white font-bold text-sm bg-black/40 px-4 py-2 rounded-lg backdrop-blur-sm">
                                        Ganti Gambar
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-text-muted pointer-events-none">
                                <ImageIcon className="h-10 w-10 opacity-40" />
                                <span className="text-sm font-medium">Klik untuk upload gambar cover</span>
                                <span className="text-xs text-text-muted/60">PNG, JPG, WEBP — maks 5 MB</span>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                {/* ── Title + Category ── */}
                <div className="grid md:grid-cols-3 gap-5">
                    <div className="space-y-2 md:col-span-2">
                        <label htmlFor="post-title" className="block text-xs font-black uppercase tracking-widest text-text-muted/80">
                            Judul Post *
                        </label>
                        <input
                            id="post-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full rounded-xl border border-border-custom bg-surface-hover/20 px-4 py-3
                                       text-sm text-foreground placeholder:text-text-muted/50
                                       outline-none focus:border-brand-primary/60 focus:ring-4 focus:ring-brand-primary/10
                                       transition-all"
                            placeholder="Masukkan judul post..."
                            maxLength={150}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="post-category" className="block text-xs font-black uppercase tracking-widest text-text-muted/80">
                            Kategori
                        </label>
                        <select
                            id="post-category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full rounded-xl border border-border-custom bg-surface-hover/20 px-4 py-3
                                       text-sm text-foreground outline-none focus:border-brand-primary/60
                                       focus:ring-4 focus:ring-brand-primary/10 transition-all"
                            disabled={isSubmitting}
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ── Visibility + Pin ── */}
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-widest text-text-muted/80">
                            Jangkauan
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setScope('national')}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all
                                    ${scope === 'national'
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                        : 'border-border-custom text-text-muted hover:bg-surface-hover'}`}
                            >
                                <Globe className="h-3.5 w-3.5" /> Nasional
                            </button>
                            <button
                                type="button"
                                onClick={() => setScope('regional')}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all
                                    ${scope === 'regional'
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                        : 'border-border-custom text-text-muted hover:bg-surface-hover'}`}
                            >
                                <MapPin className="h-3.5 w-3.5" /> Regional (Wilayah Saya)
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-black uppercase tracking-widest text-text-muted/80">
                            Opsi
                        </label>
                        <button
                            type="button"
                            onClick={() => setIsPinned(!isPinned)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all
                                ${isPinned
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                    : 'border-border-custom text-text-muted hover:bg-surface-hover'}`}
                        >
                            <Pin className="h-3.5 w-3.5" /> {isPinned ? 'Dipin' : 'Pin Post'}
                        </button>
                    </div>
                </div>

                {/* ── Tags ── */}
                <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-text-muted/80">
                        Tags (opsional, maks 10)
                    </label>
                    <div className="flex gap-2 flex-wrap mb-2">
                        {tags.map((t) => (
                            <span
                                key={t}
                                className="inline-flex items-center gap-1.5 bg-slate-900 text-white
                                           text-xs font-bold px-3 py-1 rounded-full"
                            >
                                <Tag className="h-3 w-3" />
                                {t}
                                <button
                                    type="button"
                                    onClick={() => removeTag(t)}
                                    className="ml-0.5 hover:text-red-500 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    {tags.length < 10 && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                placeholder="Tambah tag, tekan Enter"
                                className="flex-1 rounded-xl border border-border-custom bg-surface-hover/20 px-4 py-2.5
                                           text-sm text-foreground placeholder:text-text-muted/50
                                           outline-none focus:border-brand-primary/60 transition-all"
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                className="px-4 py-2 rounded-xl text-sm font-bold border border-border-custom
                                           text-text-muted hover:bg-surface-hover transition-all"
                            >
                                + Tag
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Content ── */}
                <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-text-muted/80">
                        Isi Konten *
                    </label>
                    <BeritaEditor content={content} onChange={setContent} />
                </div>

                {/* ── Actions ── */}
                <div className="pt-6 border-t border-border-custom flex flex-wrap justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 border border-slate-300
                                   bg-white hover:bg-slate-50 transition-all"
                        disabled={isSubmitting}
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit('draft')}
                        disabled={isSubmitting}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-slate-700 border border-slate-300
                                   bg-white hover:bg-slate-50 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Simpan Draft
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit('published')}
                        disabled={isSubmitting}
                        className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-red-600
                                   hover:bg-red-700 transition-all shadow-md shadow-brand-primary/20
                                   disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {uploadingCover ? 'Upload Gambar…' : 'Menyimpan…'}
                            </>
                        ) : (
                            mode === 'create' ? 'Publish Post' : 'Simpan Perubahan'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
