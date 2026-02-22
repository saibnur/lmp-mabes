'use client';

import { FileCheck, Calendar, Target, CheckCircle2 } from 'lucide-react';

const milestones = [
    { year: '2000', event: 'Laskar Merah Putih didirikan pada 28 Desember 2000' },
    { year: '2004', event: 'Akta Pendirian No. 8 di hadapan Notaris Irma Bonita, S.H.' },
    { year: '2008', event: 'SK No. 001/SK/MB/FB/LMP/IX/08 sebagai pondasi tata kelola' },
    { year: '2025', event: 'Kepemimpinan H. Muhammad Arsyad Cannu untuk periode 2025-2030' },
];

const missions = [
    'Menyelaraskan program kerja organisasi dengan Visi, Misi, dan Asta Cita Pemerintah RI.',
    'Meningkatkan kualitas kaderisasi yang berkarakter dan berintegritas.',
    'Berperan aktif dalam pengabdian masyarakat di bidang sosial, hukum, dan ekonomi.',
];

export default function TentangKamiPage() {
    return (
        <div className="bg-white">

            {/* Hero Section */}
            <section className="pt-24 pb-12 md:pt-32 md:pb-20 bg-slate-50">
                <div className="container mx-auto px-4 md:px-8 lg:px-12 text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
                        Tentang Kami
                    </h1>
                    <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto">
                        Mengenal lebih dekat Laskar Merah Putih: sejarah, filosofi, dan komitmen kami
                    </p>
                    <div className="mx-auto mt-6 h-1 w-24 bg-red-600" />
                </div>
            </section>

            {/* Sejarah Section */}
            <section className="py-12 md:py-20 bg-white">
                <div className="container mx-auto px-4 md:px-8 lg:px-12">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-5 md:mb-6">Sejarah &amp; Filosofi</h2>
                            <div className="space-y-4 text-slate-600 leading-relaxed text-sm md:text-base lg:text-lg">
                                <p>
                                    <strong className="text-slate-900">Laskar Merah Putih (LMP)</strong> lahir dari semangat
                                    patriotisme murni sebagai organisasi kemasyarakatan berbasis massa pada tanggal
                                    <strong className="text-slate-900"> 28 Desember 2000</strong>. Didorong oleh keinginan
                                    kuat untuk menjaga kedaulatan NKRI, organisasi ini kemudian memperkuat landasan hukumnya
                                    melalui Akta Pendirian No. 8 Tanggal 30 Agustus 2004 di hadapan Notaris Irma Bonita, S.H.
                                </p>
                                <p>
                                    Perjalanan besar FB LMP diawali dan dibesarkan oleh Badan Pengurus Markas Besar di bawah
                                    kepemimpinan almarhum <strong className="text-slate-900">Edi Hartawan</strong> selaku
                                    Ketua Umum pertama. Tonggak sejarah ini dipertegas dengan terbitnya SK No.
                                    001/SK/MB/FB/LMP/IX/08 pada September 2008 yang menjadi pondasi tata kelola organisasi
                                    hingga berkembang pesat seperti sekarang.
                                </p>
                                <p>
                                    Kini, di bawah kepemimpinan <strong className="text-slate-900">H. Muhammad Arsyad Cannu</strong> untuk
                                    periode 2025-2030, Laskar Merah Putih melanjutkan estafet perjuangan tersebut dengan
                                    visi yang lebih modern, bersinergi dengan Pemerintah menuju Indonesia Emas 2045, namun
                                    tetap setia pada semangat pendirian tahun 2000.
                                </p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-slate-50 rounded-2xl p-5 md:p-8 border border-slate-100">
                            <h3 className="font-bold text-lg md:text-xl mb-5 md:mb-6 flex items-center gap-2 text-slate-900">
                                <Calendar className="text-red-600 shrink-0" size={22} />
                                Tonggak Sejarah
                            </h3>
                            <div className="space-y-5">
                                {milestones.map((item, index) => (
                                    <div key={index} className="flex gap-3 md:gap-4">
                                        <div className="flex-shrink-0">
                                            <span className="inline-block bg-red-600 text-white font-bold px-2.5 py-1 rounded-md text-sm">
                                                {item.year}
                                            </span>
                                        </div>
                                        <p className="text-slate-700 font-medium text-sm md:text-base">{item.event}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Visi Misi Section */}
            <section className="py-12 md:py-20 bg-slate-50">
                <div className="container mx-auto px-4 md:px-8 lg:px-12">
                    <div className="grid sm:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
                        {/* Visi */}
                        <div className="bg-white rounded-2xl p-5 md:p-8 shadow-sm border border-slate-100">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 md:mb-6">
                                <Target className="text-red-600" size={28} />
                            </div>
                            <h3 className="font-bold text-xl md:text-2xl text-slate-900 mb-3 md:mb-4">Visi</h3>
                            <p className="text-slate-600 leading-relaxed text-sm md:text-base lg:text-lg">
                                Menjadi organisasi kemasyarakatan yang mandiri, profesional, dan sinergis dalam
                                mendukung tercapainya visi <strong className="text-slate-900">Indonesia Emas 2045</strong>.
                            </p>
                        </div>

                        {/* Misi */}
                        <div className="bg-white rounded-2xl p-5 md:p-8 shadow-sm border border-slate-100">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 md:mb-6">
                                <CheckCircle2 className="text-red-600" size={28} />
                            </div>
                            <h3 className="font-bold text-xl md:text-2xl text-slate-900 mb-3 md:mb-4">Misi</h3>
                            <ul className="space-y-3 md:space-y-4">
                                {missions.map((mission, index) => (
                                    <li key={index} className="flex gap-3">
                                        <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </span>
                                        <p className="text-slate-600 text-sm md:text-base">{mission}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Legalitas Section */}
            <section className="py-12 md:py-20 bg-white">
                <div className="container mx-auto px-4 md:px-8 lg:px-12">
                    <div className="text-center mb-8 md:mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Legalitas Organisasi</h2>
                        <p className="text-slate-600 text-sm md:text-lg max-w-2xl mx-auto mt-3 md:mt-4">
                            Kredibilitas adalah prioritas kami. Markas Besar Laskar Merah Putih beroperasi
                            dengan legalitas hukum yang sah.
                        </p>
                        <div className="mx-auto mt-4 md:mt-6 h-1 w-24 bg-red-600" />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5 md:gap-8 max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-100 hover:border-red-600/20 transition-colors shadow-sm text-center">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                                <FileCheck className="text-red-600" size={28} />
                            </div>
                            <h3 className="font-bold text-base md:text-lg text-slate-900 mb-2">Keputusan Menteri Hukum RI</h3>
                            <p className="text-sm md:text-base font-mono font-bold text-slate-700 bg-slate-50 py-2 px-3 rounded-lg inline-block break-all">
                                No. AHU-0000054.AH.01.08.TAHUN 2025
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-5 md:p-8 border-2 border-slate-100 hover:border-red-600/20 transition-colors shadow-sm text-center">
                            <div className="w-12 h-12 md:w-16 md:h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                                <FileCheck className="text-red-600" size={28} />
                            </div>
                            <h3 className="font-bold text-base md:text-lg text-slate-900 mb-2">Akta Perubahan Terbaru</h3>
                            <p className="text-sm md:text-lg text-slate-600">
                                Notaris <strong className="text-slate-900">Kurnia Yusmartina, S.H.</strong> (2025)
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
