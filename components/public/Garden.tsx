"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import Lightbox from "./Lightbox";

const PHOTOS = [
  { src: "/images/garden/IMG_5947.JPG", alt: "Jardin clos 90 m² — exposition sud" },
  { src: "/images/garden/20260528_183511.jpg", alt: "Salon de jardin 8 places — canapés pour les apéros" },
  { src: "/images/garden/20260528_183440.jpg", alt: "Grandes tables pour manger dehors jusqu'à 20 personnes" },
];

export default function Garden() {
  const { t } = useTranslation();
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">{t.garden.title}</h2>
      <p className="mt-2 text-sm text-secondary">{t.garden.subtitle}</p>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {PHOTOS.map((photo, i) => (
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

      <Lightbox photos={PHOTOS} index={lightbox} onChange={setLightbox} />

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {t.garden.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm text-foreground">
            <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
