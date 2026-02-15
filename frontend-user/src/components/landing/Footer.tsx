'use client';

import Link from 'next/link';
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from 'lucide-react';

const quickLinks = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Tentang Kami', href: '#tentang' },
  { label: 'Program', href: '#program' },
  { label: 'Berita', href: '#berita' },
  { label: 'Galeri', href: '#galeri' },
  { label: 'Masuk', href: '/login' },
];

export default function Footer() {
  return (
    <footer className="border-t-4 border-red-600 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <p className="text-xl font-bold text-red-600">LMP PUSAT</p>
            <p className="mt-4 text-sm text-slate-600">
              Organisasi kemasyarakatan yang menjunjung tinggi nilai Pancasila
              dan persatuan Indonesia.
            </p>
            <div className="mt-4 flex gap-4">
              <a
                href="#"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Tautan Cepat
            </h3>
            <ul className="mt-4 space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 transition hover:text-red-600"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Alamat
            </h3>
            <div className="mt-4 flex gap-3 text-sm text-slate-600">
              <MapPin className="h-5 w-5 shrink-0 text-red-600" />
              <span>
                Jl. Contoh No. 123, Jakarta Pusat
                <br />
                DKI Jakarta, Indonesia
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Kontak
            </h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition hover:text-red-600"
              >
                <Phone className="h-5 w-5 shrink-0 text-red-600" />
                +62 812-3456-7890
              </a>
              <a
                href="mailto:info@lmp.or.id"
                className="flex items-center gap-3 transition hover:text-red-600"
              >
                <Mail className="h-5 w-5 shrink-0 text-red-600" />
                info@lmp.or.id
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} LMP Pusat. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
