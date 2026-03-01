'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/viewmodels/useAuth';
import { adminService } from '@/services/adminService';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { createArticle } from '@/lib/beritaService';
import BeritaEditor from '@/components/news/BeritaEditor';
import { ArrowLeft, Image as ImageIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function BuatBeritaPage() {
    const router = useRouter();
    const { user, idToken, loading } = useAuth();

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Berita');
    const [content, setContent] = useState('');
    const [headerImage, setHeaderImage] = useState<File | null>(null);
    const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [headerUploading, setHeaderUploading] = useState(false);

    if (loading) return <div className="p-8 text-center text-text-muted pt-32">Memuat...</div>;

    if (!user || !idToken) {
        if (typeof window !== 'undefined') {
            router.replace('/login');
        }
        return null;
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setHeaderImage(file);
            setHeaderImagePreview(URL.createObjectURL(file));
        }
    };

    const generateExcerpt = (html: string) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        return text.length > 150 ? text.substring(0, 150) + '...' : text;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            toast.error('Judul dan konten berita tidak boleh kosong.');
            return;
        }

        setIsSubmitting(true);
        try {
            let headerUrl = '';
            if (headerImage) {
                setHeaderUploading(true);
                const signRes = await adminService.getSignUpload(idToken, 'berita/headers');
                if (!signRes.success) throw new Error("Gagal mendapatkan izin unggahan Header.");

                headerUrl = await uploadToCloudinary(headerImage, 'berita/headers', signRes);
                setHeaderUploading(false);
            }

            const excerpt = generateExcerpt(content);

            await createArticle({
                title,
                content,
                headerImage: headerUrl,
                excerpt,
                authorId: user.uid,
                authorName: user.displayName || 'Admin LMP',
                authorRole: 'admin',
                category,
                status: 'published',
            });

            toast.success('Berita berhasil dipublikasikan!');
            router.push('/dashboard/news');
        } catch (error) {
            console.error('Error creating article:', error);
            toast.error('Gagal menyimpan berita.');
        } finally {
            setIsSubmitting(false);
            setHeaderUploading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="mb-2">
                <Link href="/dashboard/news" className="inline-flex items-center text-sm font-bold text-text-muted hover:text-foreground transition">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Daftar Berita
                </Link>
            </div>

            <div className="glass-card overflow-hidden border border-border-custom bg-surface p-6 md:p-8">
                <h1 className="text-xl font-bold text-foreground mb-6">Buat Berita Baru (Admin)</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Header Image */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-widest text-text-muted/80">
                            Gambar Header
                        </label>
                        <div className="relative border-2 border-dashed border-border-custom rounded-xl overflow-hidden bg-surface-hover/30 hover:bg-surface-hover/50 transition h-64 flex flex-col items-center justify-center cursor-pointer">
                            {headerImagePreview ? (
                                <>
                                    <img
                                        src={headerImagePreview}
                                        alt="Header preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <span className="text-white font-bold px-4 py-2 rounded-lg bg-black/50 backdrop-blur-sm">Ganti Gambar</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-text-muted">
                                    <ImageIcon className="h-10 w-10 opacity-50" />
                                    <span className="text-sm font-medium">Klik untuk upload gambar header</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Judul */}
                        <div className="space-y-2 md:col-span-2">
                            <label htmlFor="title" className="block text-xs font-black uppercase tracking-widest text-text-muted/80">
                                Judul Berita *
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full rounded-xl border border-border-custom bg-surface-hover/30 px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-text-muted/50 focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 shadow-sm"
                                placeholder="Masukkan judul..."
                                maxLength={100}
                                required
                            />
                        </div>

                        {/* Kategori */}
                        <div className="space-y-2 md:col-span-1">
                            <label htmlFor="category" className="block text-xs font-black uppercase tracking-widest text-text-muted/80">
                                Kategori
                            </label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full rounded-xl border border-border-custom bg-surface-hover/30 px-4 py-3 text-sm text-foreground outline-none transition-all focus:border-brand-primary/50 focus:ring-4 focus:ring-brand-primary/10 shadow-sm"
                            >
                                <option value="Berita">Berita</option>
                                <option value="Kegiatan">Kegiatan</option>
                                <option value="Sosial">Sosial</option>
                                <option value="Organisasi">Organisasi</option>
                            </select>
                        </div>
                    </div>

                    {/* Konten */}
                    <div className="space-y-2">
                        <label className="block text-xs font-black uppercase tracking-widest text-text-muted/80">
                            Isi Konten *
                        </label>
                        <BeritaEditor content={content} onChange={setContent} />
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-border-custom flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 rounded-xl text-sm font-bold text-text-muted border border-border-custom bg-surface hover:bg-surface-hover transition-all"
                            disabled={isSubmitting}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-light transition-all shadow-md shadow-brand-primary/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {headerUploading ? 'Upload Gambar...' : 'Menyimpan...'}
                                </>
                            ) : (
                                'Publish Berita'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
