"use client";

import Image from "next/image";
import { useState } from "react";

const PHOTOS = [
  { src: "/images/house/2-cuisineAI 2.png", alt: "Cuisine — vue 2" },
  { src: "/images/house/2-cuisineAI.png", alt: "Cuisine équipée" },
  { src: "/images/house/3-maison-AI.png", alt: "Vue extérieure de la maison" },
  { src: "/images/house/3-salon donnant sur la terrasse.JPG", alt: "Salon donnant sur la terrasse" },
  { src: "/images/house/4-salonAI.png", alt: "Salon" },
  { src: "/images/house/Salon.png", alt: "Salon — vue 2" },
  { src: "/images/house/entrée + buanderie.JPG", alt: "Entrée et buanderie" },
  { src: "/images/house/veranda.JPG", alt: "Véranda" },
];

export default function PhotoGallery() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const gridPhotos = PHOTOS.slice(0, 5);

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <div
          className="grid grid-cols-1 gap-2 overflow-hidden rounded-2xl md:grid-cols-4 md:grid-rows-2"
          style={{ height: "clamp(300px, 50vw, 480px)" }}
        >
          {/* Main large photo */}
          <button
            onClick={() => setLightbox(0)}
            className="relative col-span-1 row-span-2 overflow-hidden md:col-span-2"
          >
            <Image
              src={encodeURI(gridPhotos[0].src)}
              alt={gridPhotos[0].alt}
              fill
              className="object-cover transition-opacity hover:opacity-90"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </button>

          {/* 4 smaller photos */}
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
                sizes="(max-width: 768px) 100vw, 25vw"
              />
            </button>
          ))}
        </div>

        {/* "Show all photos" button */}
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => setLightbox(0)}
            className="rounded-lg border border-foreground px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-light-bg"
          >
            Afficher toutes les photos
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/40"
            onClick={() => setLightbox(null)}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="mx-4 w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-video overflow-hidden rounded-xl">
              <Image
                src={encodeURI(PHOTOS[lightbox].src)}
                alt={PHOTOS[lightbox].alt}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
            <p className="mt-2 text-center text-sm text-white/70">
              {PHOTOS[lightbox].alt}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() =>
                  setLightbox(lightbox === 0 ? PHOTOS.length - 1 : lightbox - 1)
                }
                className="rounded-full bg-white/20 px-4 py-2 text-sm text-white hover:bg-white/40"
              >
                Précédent
              </button>
              <span className="px-4 py-2 text-sm text-white/70">
                {lightbox + 1} / {PHOTOS.length}
              </span>
              <button
                onClick={() =>
                  setLightbox(lightbox === PHOTOS.length - 1 ? 0 : lightbox + 1)
                }
                className="rounded-full bg-white/20 px-4 py-2 text-sm text-white hover:bg-white/40"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
