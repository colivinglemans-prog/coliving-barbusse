"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n";

export type LightboxPhoto = { src: string; alt: string };

/**
 * Lightbox plein écran contrôlé (zoom photo).
 * - `index === null` → rien n'est rendu.
 * - Navigation clavier (←/→/Échap), swipe tactile, verrou de scroll.
 */
export default function Lightbox({
  photos,
  index,
  onChange,
}: {
  photos: LightboxPhoto[];
  index: number | null;
  onChange: (i: number | null) => void;
}) {
  const touchStart = useRef(0);
  const { t } = useTranslation();

  const prev = useCallback(
    () => onChange(index === null ? null : index === 0 ? photos.length - 1 : index - 1),
    [index, photos.length, onChange],
  );
  const next = useCallback(
    () => onChange(index === null ? null : index === photos.length - 1 ? 0 : index + 1),
    [index, photos.length, onChange],
  );
  const close = useCallback(() => onChange(null), [onChange]);

  // Keyboard navigation + body scroll lock
  useEffect(() => {
    if (index === null) return;
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
  }, [index, next, prev, close]);

  if (index === null || photos.length === 0) return null;

  const multiple = photos.length > 1;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black"
      onClick={close}
      onTouchStart={(e) => {
        touchStart.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const delta = e.changedTouches[0].clientX - touchStart.current;
        if (delta > 50) prev();
        if (delta < -50) next();
      }}
    >
      {/* Counter */}
      {multiple && (
        <div className="absolute left-4 top-4 z-10 text-sm text-white/70">
          {index + 1} / {photos.length}
        </div>
      )}

      {/* Close button */}
      <button
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/30"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        aria-label="Fermer"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation arrows */}
      {multiple && (
        <>
          <button
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/30"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label={t.gallery.previous}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/30"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label={t.gallery.next}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Full-screen image */}
      <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
        <Image
          src={encodeURI(photos[index].src)}
          alt={photos[index].alt}
          fill
          className="object-contain p-4 md:p-12"
          sizes="100vw"
          priority
        />
      </div>

      {/* Caption */}
      <p className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 text-sm text-white/70">
        {photos[index].alt}
      </p>
    </div>
  );
}
