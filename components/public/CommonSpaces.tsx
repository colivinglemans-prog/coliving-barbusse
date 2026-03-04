"use client";

import Image from "next/image";
import { useTranslation } from "@/lib/i18n";

const PHOTOS = [
  { src: "/images/house/5-sportAI.png", alt: "Salle de sport" },
  { src: "/images/house/5-sportAI-2.JPG", alt: "Salle de sport — équipements" },
  { src: "/images/house/Salle Zen AI.png", alt: "Salle zen" },
];

export default function CommonSpaces() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">{t.commonSpaces.title}</h2>
      <p className="mt-2 text-sm text-secondary">
        {t.commonSpaces.subtitle}
      </p>

      {/* 3 photos côte à côte */}
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
