"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslation, type Dictionary } from "@/lib/i18n";
import Lightbox from "./Lightbox";

/** Les textes `alt` viennent du dictionnaire (`commonSpaces.alts`). */
const PHOTOS: { src: string; alt: keyof Dictionary["commonSpaces"]["alts"] }[] = [
  { src: "/images/house/5-sportAI.jpg", alt: "gym" },
  { src: "/images/house/5-sportAI-2.JPG", alt: "gymEquipment" },
  { src: "/images/house/Salle Zen AI.jpg", alt: "zen" },
];

export default function CommonSpaces() {
  const { t } = useTranslation();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const photos = PHOTOS.map((p) => ({ src: p.src, alt: t.commonSpaces.alts[p.alt] }));

  return (
    <div className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">{t.commonSpaces.title}</h2>
      <p className="mt-2 text-sm text-secondary">
        {t.commonSpaces.subtitle}
      </p>

      {/* 3 photos côte à côte */}
      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {photos.map((photo, i) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setLightbox(i)}
            className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-xl"
            aria-label={photo.alt}
          >
            <Image
              src={encodeURI(photo.src)}
              alt={photo.alt}
              fill
              className="object-cover transition-opacity group-hover:opacity-90"
              sizes="(max-width: 640px) 100vw, 33vw"
            />
          </button>
        ))}
      </div>

      <Lightbox photos={photos} index={lightbox} onChange={setLightbox} />

      {/* Descriptions */}
      <div className="mt-6 space-y-4">
        <div>
          <h3 className="font-medium text-foreground">{t.commonSpaces.gym}</h3>
          <p className="mt-1 text-sm text-secondary">
            {t.commonSpaces.gymDesc}
          </p>
        </div>
        <div>
          <h3 className="font-medium text-foreground">{t.commonSpaces.zen}</h3>
          <p className="mt-1 text-sm text-secondary">
            {t.commonSpaces.zenDesc}
          </p>
        </div>
      </div>
    </div>
  );
}
