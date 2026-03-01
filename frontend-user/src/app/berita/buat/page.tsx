'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/store/UserProfileProvider';
import { getFirebaseAuth } from '@/lib/firebase';
import { mediaApi } from '@/lib/api/media.api';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { createArticle } from '@/lib/beritaService';
import BeritaEditor from '@/features/berita/components/BeritaEditor';
import { ArrowLeft, Image as ImageIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function BuatBeritaPage() {
    const router = useRouter();
    const { profile, uid, loading } = useUserProfile();

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Berita');
    const [content, setContent] = useState('');
    const [headerImage, setHeaderImage] = useState<File | null>(null);
    const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [headerUploading, setHeaderUploading] = useState(false);

    if (loading) return <div className="p-8 text-center pt-32">Memuat...</div>;

    if (!uid || !profile) {
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
            alert('Judul dan konten berita tidak boleh kosong.');
            return;
        }

        setIsSubmitting(true);
        try {
            let headerUrl = '';
            if (headerImage) {
                setHeaderUploading(true);
                const auth = getFirebaseAuth();
                const user = auth.currentUser;
                if (!user) throw new Error("Pengguna tidak terautentikasi.");

                const token = await user.getIdToken(true);
                const { data: signRes } = await mediaApi.getSignUpload(token, 'berita/headers');
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
                authorId: uid,
                authorName: profile.displayName || 'Anggota LMP',
                authorRole: profile.role === 'admin' ? 'admin' : 'member',
                category,
                status: 'published',
            });

            router.push('/berita');
        } catch (error) {
            console.error('Error creating article:', error);
            alert('Gagal menyimpan berita.');
        } finally {
            setIsSubmitting(false);
            setHeaderUploading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pt-24 pb-20">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-6">
                    <Link href="/berita" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Berita
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 md:p-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-6">Buat Berita Baru</h1>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Header Image */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">
                                    Gambar Header
                                </label>
                                <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 hover:bg-slate-100 transition h-64 flex flex-col items-center justify-center cursor-pointer">
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
                                        <div className="flex flex-col items-center gap-3 text-slate-400">
                                            <ImageIcon className="h-10 w-10 text-slate-300" />
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
                                    <label htmlFor="title" className="block text-sm font-bold text-slate-700">
                                        Judul Berita *
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full rounded-xl border-slate-200 shadow-sm focus:border-red-500 focus:ring-red-500 transition px-4 py-3 bg-white text-slate-900"
                                        placeholder="Masukkan judul..."
                                        maxLength={100}
                                        required
                                    />
                                </div>

                                {/* Kategori */}
                                <div className="space-y-2 md:col-span-1">
                                    <label htmlFor="category" className="block text-sm font-bold text-slate-700">
                                        Kategori
                                    </label>
                                    <select
                                        id="category"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full rounded-xl border-slate-200 shadow-sm focus:border-red-500 focus:ring-red-500 transition px-4 py-3 bg-white text-slate-900"
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
                                <label className="block text-sm font-bold text-slate-700">
                                    Isi Konten *
                                </label>
                                <BeritaEditor content={content} onChange={setContent} />
                            </div>

                            {/* Actions */}
                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition"
                                    disabled={isSubmitting}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition shadow-lg shadow-red-200 disabled:opacity-70 flex items-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
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
            </div>
        </div>
    );
}
