'use client';

import { useEffect, useState } from 'react';
import { useUserProfile } from '@/store/UserProfileProvider';
import { getArticlesByAuthor } from '@/lib/beritaService';
import { BeritaArticle } from '@/lib/types';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Newspaper, UserCircle, Settings, Camera, MapPin, Building2, Pencil } from 'lucide-react';

export default function ProfilPage() {
  const { profile, uid, loading } = useUserProfile();
  const [articles, setArticles] = useState<BeritaArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  useEffect(() => {
    if (uid) {
      getArticlesByAuthor(uid)
        .then(data => {
          setArticles(data);
          setArticlesLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch user articles', err);
          setArticlesLoading(false);
        });
    }
  }, [uid]);

  if (loading) return <div className="p-8 text-center pt-32">Memuat...</div>;
  if (!profile) return null;

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="h-32 bg-slate-900 overflow-hidden relative">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          </div>

          <div className="px-6 sm:px-10 pb-8 flex flex-col sm:flex-row gap-6 relative">
            {/* Avatar */}
            <div className="-mt-16 relative">
              <div className="h-32 w-32 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-lg relative bg-white">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName || 'Profile'} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl font-bold text-slate-400">
                    {(profile.displayName || 'M').charAt(0)}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 sm:pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900">{profile.displayName || 'Anggota LMP'}</h1>
                  <p className="font-bold text-slate-500">{profile.no_kta || 'Nomor KTA Belum Terbit'}</p>
                </div>
                <Link
                  href="/daftar/profil"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Profil
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-y-2 gap-x-6 text-sm font-medium text-slate-600">
                {profile.organization?.level && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="capitalize">Markas {profile.organization.level.replace('-', ' ')}</span>
                  </div>
                )}
                {profile.organization?.village_name && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{profile.organization.village_name}, Kec. {profile.organization.district_name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <UserCircle className="h-4 w-4 text-slate-400" />
                  <span className="capitalize">Role: {profile.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Area */}
        <Tabs defaultValue="berita" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 bg-slate-200 rounded-xl p-1">
            <TabsTrigger value="berita" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm">
              <Newspaper className="w-4 h-4 mr-2" />
              Berita Saya
            </TabsTrigger>
            <TabsTrigger value="pengaturan" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Settings className="w-4 h-4 mr-2" />
              Pengaturan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="berita" className="outline-none">
            {articlesLoading ? (
              <div className="py-12 text-center text-slate-500 font-medium animate-pulse">Memuat berita Anda...</div>
            ) : articles.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 flex flex-col items-center">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Camera className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Belum Ada Berita</h3>
                <p className="text-slate-500 mb-6 max-w-sm">Anda belum menulis berita atau kegiatan apapun. Mulai bagikan momen Anda sekarang.</p>
                <Link href="/berita/buat" className="inline-flex items-center font-bold text-white bg-red-600 hover:bg-red-700 px-6 py-3 rounded-xl shadow-lg shadow-red-200 transition active:scale-95">
                  Buat Berita Pertama
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 sm:gap-4 md:gap-6">
                {articles.map(article => (
                  <div key={article.id} className="relative group aspect-square bg-slate-100 rounded-lg sm:rounded-2xl overflow-hidden shadow-sm">
                    {article.headerImage ? (
                      <img src={article.headerImage} alt={article.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                        <Newspaper className="w-8 h-8 sm:w-12 sm:h-12" />
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 gap-3">
                      <Link href={`/berita/${article.id}`} className="w-full sm:w-auto px-4 py-2 bg-white text-slate-900 text-xs sm:text-sm font-bold rounded-lg text-center hover:bg-slate-100 transition">
                        Lihat Berita
                      </Link>
                      <Link href={`/berita/edit/${article.id}`} className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white text-xs sm:text-sm font-bold rounded-lg text-center hover:bg-red-700 transition">
                        Edit Berita
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pengaturan" className="outline-none">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
              <Link href="/daftar/profil" className="flex items-center justify-between p-6 hover:bg-slate-50 transition">
                <div>
                  <h3 className="font-bold text-slate-900">Ubah Data Pribadi</h3>
                  <p className="text-sm text-slate-500 mt-1">Perbarui identitas fisik, domisili, dan wilayah keanggotaan.</p>
                </div>
                <div className="text-red-600 bg-red-50 p-3 rounded-full">
                  <UserCircle className="w-5 h-5" />
                </div>
              </Link>

              <Link href="/dashboard/status-keanggotaan" className="flex items-center justify-between p-6 hover:bg-slate-50 transition">
                <div>
                  <h3 className="font-bold text-slate-900">Lihat KTA Digital</h3>
                  <p className="text-sm text-slate-500 mt-1">Unduh dan cetak Kartu Tanda Anggota Anda.</p>
                </div>
                <div className="text-blue-600 bg-blue-50 p-3 rounded-full">
                  <Building2 className="w-5 h-5" />
                </div>
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
