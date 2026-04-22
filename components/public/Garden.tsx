"use client";

import Image from "next/image";
import { useTranslation } from "@/lib/i18n";

const PHOTOS = [
  { src: "/images/garden/IMG_5947.JPG", alt: "Jardin clos 90 m² — exposition sud" },
  { src: "/images/garden/20260422_153827.jpg", alt: "Salon de jardin — 8 places pour les apéros" },
  { src: "/images/garden/IMG_5948.JPG", alt: "Massif planté et véranda" },
];

export default function Garden() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">{t.garden.title}</h2>
      <p className="mt-2 text-sm text-secondary">{t.garden.subtitle}</p>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {PHOTOS.map((photo) => (
          <div key={photo.src} className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image
              src={encodeURI(photo.src)}
              alt={photo.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 33vw"
            />
          </div>
        ))}
      </div>

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
