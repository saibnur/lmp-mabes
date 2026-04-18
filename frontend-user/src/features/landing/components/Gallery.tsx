'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

const photos = [
  {
    src: '/gallery/gallery-1.jpg',
    caption: 'H.M. Arsyad Canno – Ketua Umum Markas Besar LMP',
    tag: 'Kepemimpinan',
  },
  {
    src: '/gallery/gallery-2.jpg',
    caption: 'Pengibaran Pataka Markas Besar Laskar Merah Putih',
    tag: 'Seremonial',
  },
  {
    src: '/gallery/gallery-3.jpg',
    caption: 'Sambutan Pimpinan LMP dalam Acara Pelantikan',
    tag: 'Pelantikan',
  },
  {
    src: '/gallery/gallery-4.jpg',
    caption: 'Anggota LMP bersama Pataka di Upacara Pelantikan Pengurus',
    tag: 'Organisasi',
  },
  {
    src: '/gallery/gallery-5.jpg',
    caption: 'Jajaran Pimpinan LMP bersama unsur TNI dalam kegiatan bela negara',
    tag: 'Bela Negara',
  },
];

export default function Gallery() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);
  const prev = () =>
    setLightboxIdx((i) => (i !== null ? (i - 1 + photos.length) % photos.length : null));
  const next = () =>
    setLightboxIdx((i) => (i !== null ? (i + 1) % photos.length : null));

  return (
    <section id="galeri" className="bg-slate-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <span className="inline-block rounded-full bg-red-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-600">
            Dokumentasi Kegiatan
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tighter text-slate-900 uppercase italic sm:text-4xl md:text-5xl">
            Galeri LMP
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Momen dan jejak perjalanan Laskar Merah Putih dalam mengabdi untuk bangsa dan negara.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-5"
        >
          {photos.map((photo, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.07 }}
              onClick={() => openLightbox(idx)}
              className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl bg-slate-200 shadow-sm"
            >
              <img
                src={photo.src}
                alt={photo.caption}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    `https://placehold.co/800x600/1e293b/ffffff?text=Foto+${idx + 1}`;
                }}
              />
              {/* Overlay */}
              <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex justify-end">
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                    {photo.tag}
                  </span>
                </div>
                <div>
                  <ZoomIn className="mb-2 h-5 w-5 text-white/80" />
                  <p className="text-xs font-medium leading-snug text-white">{photo.caption}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={closeLightbox}
          >
            {/* Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-h-[90vh] max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[lightboxIdx].src}
                alt={photos[lightboxIdx].caption}
                className="h-full max-h-[80vh] w-full rounded-2xl object-contain shadow-2xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    `https://placehold.co/800x600/1e293b/ffffff?text=Foto+${lightboxIdx + 1}`;
                }}
              />
              {/* Caption */}
              <div className="mt-4 text-center">
                <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                  {photos[lightboxIdx].tag}
                </span>
                <p className="mt-2 text-sm font-medium text-white/80">
                  {photos[lightboxIdx].caption}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  {lightboxIdx + 1} / {photos.length}
                </p>
              </div>

              {/* Close */}
              <button
                onClick={closeLightbox}
                className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition hover:bg-red-50"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Prev */}
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              {/* Next */}
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
