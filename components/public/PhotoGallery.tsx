"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n";

const PHOTOS = [
  { src: "/images/house/2-cuisineAI 2.jpg", alt: "Cuisine — vue 2" },
  { src: "/images/house/2-cuisineAI.jpg", alt: "Cuisine équipée" },
  { src: "/images/house/3-maison-AI.jpg", alt: "Vue extérieure de la maison" },
  { src: "/images/house/3-salon donnant sur la terrasse.JPG", alt: "Salon" },
  { src: "/images/house/4-salonAI.jpg", alt: "Salon" },
  { src: "/images/house/Salon.jpg", alt: "Salon — vue 2" },
  { src: "/images/house/entrée + buanderie.JPG", alt: "Entrée et buanderie" },
  { src: "/images/house/veranda.JPG", alt: "Véranda" },
];

export default function PhotoGallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const touchStart = useRef(0);
  const { t } = useTranslation();

  const gridPhotos = PHOTOS.slice(0, 5);

  const prev = useCallback(
    () => setLightbox((i) => (i === null ? null : i === 0 ? PHOTOS.length - 1 : i - 1)),
    [],
  );
  const next = useCallback(
    () => setLightbox((i) => (i === null ? null : i === PHOTOS.length - 1 ? 0 : i + 1)),
    [],
  );
  const close = useCallback(() => setLightbox(null), []);

  // Keyboard navigation + body scroll lock
  useEffect(() => {
    if (lightbox === null) return;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [lightbox, next, prev, close]);

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 pt-6">
        {/* Mobile: single hero photo */}
        <div className="md:hidden">
          <button
            onClick={() => setLightbox(0)}
            className="relative w-full overflow-hidden rounded-2xl"
            style={{ aspectRatio: "16/10" }}
          >
            <Image
              src={encodeURI(gridPhotos[0].src)}
              alt={gridPhotos[0].alt}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <span className="absolute bottom-4 right-4 rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-foreground shadow backdrop-blur-sm">
              {t.gallery.showPhotos(PHOTOS.length)}
            </span>
          </button>
        </div>

        {/* Desktop: grid 1 large + 4 small */}
        <div className="hidden gap-2 overflow-hidden rounded-2xl md:grid md:h-[480px] md:grid-cols-4 md:grid-rows-2">
          <button
            onClick={() => setLightbox(0)}
            className="relative col-span-2 row-span-2 overflow-hidden"
          >
            <Image
              src={encodeURI(gridPhotos[0].src)}
              alt={gridPhotos[0].alt}
              fill
              className="object-cover transition-opacity hover:opacity-90"
              sizes="50vw"
              priority
            />
          </button>
          {gridPhotos.slice(1).map((photo, i) => (
            <button
              key={photo.src}
              onClick={() => setLightbox(i + 1)}
              className="relative overflow-hidden"
            >
              <Image
                src={encodeURI(photo.src)}
                alt={photo.alt}
                fill
                className="object-cover transition-opacity hover:opacity-90"
                sizes="25vw"
              />
            </button>
          ))}
        </div>

        {/* Desktop: show all photos button */}
        <div className="mt-3 hidden justify-end md:flex">
          <button
            onClick={() => setLightbox(0)}
            className="rounded-lg border border-foreground px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-light-bg"
          >
            {t.gallery.showAllPhotos}
          </button>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
          onClick={close}
          onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            const delta = e.changedTouches[0].clientX - touchStart.current;
            if (delta > 50) prev();
            if (delta < -50) next();
          }}
        >
          {/* Counter */}
          <div className="absolute left-4 top-4 z-10 text-sm text-white/70">
            {lightbox + 1} / {PHOTOS.length}
          </div>

          {/* Close button */}
          <button
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/30"
            onClick={(e) => { e.stopPropagation(); close(); }}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation arrows */}
          <button
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/30"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label={t.gallery.previous}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/30"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label={t.gallery.next}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Full-screen image */}
          <div
            className="relative h-full w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={encodeURI(PHOTOS[lightbox].src)}
              alt={PHOTOS[lightbox].alt}
              fill
              className="object-contain p-4 md:p-12"
              sizes="100vw"
              priority
            />
          </div>

          {/* Caption */}
          <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-sm text-white/70">
            {PHOTOS[lightbox].alt}
          </p>
        </div>
      )}
    </>
  );
}
