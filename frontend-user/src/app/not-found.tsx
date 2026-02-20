'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function NotFound() {
    const pathname = usePathname();

    useEffect(() => {
        console.error("404 Error: User attempted to access non-existent route:", pathname);
    }, [pathname]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <div className="text-center">
                <h1 className="mb-4 text-9xl font-black text-red-600">404</h1>
                <p className="mb-8 text-2xl font-bold text-slate-900">Oops! Halaman tidak ditemukan</p>
                <p className="mb-8 text-slate-600">Halaman yang Anda cari mungkin telah dihapus, <br /> namanya diubah, atau sementara tidak tersedia.</p>
                <Link
                    href="/"
                    className="inline-flex items-center justify-center rounded-xl bg-red-600 px-6 py-3 text-base font-bold text-white transition hover:bg-red-700 shadow-lg shadow-red-900/20"
                >
                    Kembali ke Beranda
                </Link>
            </div>
        </div>
    );
}
