'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, CreditCard, Settings } from 'lucide-react';
import { useUserProfile } from '@/components/dashboard/UserProfileProvider';

export default function DashboardMemberPage() {
  const { profile, loading } = useUserProfile();

  const displayPhone = profile?.phoneNumber || profile?.phone;
  const displayName = profile?.displayName || 'Member';

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 bg-white min-h-full">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto max-w-5xl space-y-8"
      >
        <div className="flex items-end justify-between border-b-4 border-slate-900 pb-4">
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
            Dashboard <span className="text-red-600">Kader</span>
          </h1>
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selamat Datang</p>
            <p className="text-lg font-black text-slate-900">{displayName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Status Card */}
          <div className="md:col-span-2 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            <h2 className="mb-6 text-xs font-black uppercase tracking-widest text-slate-400">Status Keanggotaan</h2>

            {profile?.membershipStatus === 'active' ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-5 w-5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-5 w-5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
                  </div>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter italic">KADER AKTIF</p>
                </div>
                <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-100 w-fit">
                  KEANGGOTAAN TERVERIFIKASI
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-5 w-5 shrink-0 rounded-full bg-red-600 shadow-lg shadow-red-200" />
                  <p className="text-4xl font-black text-slate-900 tracking-tighter italic">PENDING</p>
                </div>
                <div>
                  <p className="text-slate-500 font-medium max-w-md">
                    Bayar iuran <span className="text-red-600 font-bold">Rp25.000 / 2 Tahun</span> via Midtrans untuk mengaktifkan status kader resmi dan akses penuh dashboard.
                  </p>
                  <Link href="/dashboard/pembayaran">
                    <button className="mt-6 flex items-center gap-2 rounded-2xl bg-red-600 px-8 py-4 font-black text-white transition hover:bg-slate-900 hover:shadow-2xl active:scale-95">
                      AKTIFKAN SEKARANG <CreditCard className="w-5 h-5" />
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Info Card */}
          <div className="rounded-[2rem] border border-slate-100 bg-slate-900 p-8 shadow-xl shadow-slate-900/10 text-white">
            <h2 className="mb-6 text-xs font-black uppercase tracking-widest text-slate-400">Data Personal</h2>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase text-red-600 tracking-widest mb-1">Nama Lengkap</p>
                <p className="font-black text-xl tracking-tight">{displayName}</p>
              </div>
              {displayPhone && (
                <div>
                  <p className="text-[10px] font-black uppercase text-red-600 tracking-widest mb-1">WhatsApp</p>
                  <p className="font-black text-lg">+{displayPhone}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-black uppercase text-red-600 tracking-widest mb-1">Tingkatan</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-xs font-bold">
                  MEMBER RESMI
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid gap-6 sm:grid-cols-2">
          <Link href="/dashboard/profil">
            <motion.div
              whileHover={{ y: -8, scale: 1.02 }}
              className="group flex items-center gap-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50 transition duration-300 hover:border-red-100"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-200 transform group-hover:rotate-6 transition-transform">
                <Settings className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Edit Profil</h3>
                <p className="text-sm font-bold text-slate-400">Perbarui data diri dan foto</p>
              </div>
            </motion.div>
          </Link>

          {profile?.membershipStatus === 'active' ? (
            <Link href="/dashboard/status-keanggotaan">
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                className="group flex items-center gap-6 rounded-3xl border border-slate-100 bg-white p-8 shadow-lg shadow-slate-200/50 transition duration-300 hover:border-red-100"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-300 transform group-hover:rotate-6 transition-transform">
                  <User className="h-7 w-7 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Status Kader</h3>
                  <p className="text-sm font-bold text-slate-400">Lihat masa aktif & sertifikat</p>
                </div>
              </motion.div>
            </Link>
          ) : (
            <Link href="/dashboard/pembayaran">
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                className="group flex items-center gap-6 rounded-3xl border border-red-600/20 bg-red-50 p-8 shadow-lg shadow-red-100 transition duration-300"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-300 transform group-hover:rotate-6 transition-transform">
                  <CreditCard className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-red-600 tracking-tight">Iuran Keanggotaan</h3>
                  <p className="text-sm font-bold text-red-700/60">Aktifkan member Anda sekarang</p>
                </div>
              </motion.div>
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}
