"use client";

import Image from "next/image";
import { useTranslation } from "@/lib/i18n";

const ICONS = ["🚄", "🏁", "🏢", "🌳", "🚊", "🏛️"];

export default function LocationSection() {
  const { t } = useTranslation();

  return (
    <div id="localisation" className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">{t.location.title}</h2>
      <p className="mt-2 text-sm text-secondary">
        {t.location.address}
      </p>

      {/* Map embed */}
      <div className="mt-6 overflow-hidden rounded-xl">
        <iframe
          title="Localisation Coliving Barbusse"
          src="https://www.openstreetmap.org/export/embed.html?bbox=0.185%2C47.983%2C0.200%2C47.993&layer=mapnik&marker=47.9881%2C0.1924"
          width="100%"
          height="300"
          className="border-0"
          loading="lazy"
        />
      </div>

      {/* Circuit Bugatti highlight */}
      <div className="mt-8 overflow-hidden rounded-xl bg-gradient-to-r from-rose-50 to-amber-50">
        <div className="flex flex-col md:flex-row">
          <div className="relative h-56 w-full md:h-auto md:w-2/5">
            <Image
              src="/images/house/circuit-bugatti.jpg"
              alt="Circuit Bugatti — Le Mans"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>
          <div className="flex flex-1 flex-col justify-center p-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏁</span>
              <h3 className="text-lg font-semibold text-foreground">
                {t.location.circuitTitle}
              </h3>
            </div>
            <p className="mt-2 text-sm text-secondary">
              {t.location.circuitDesc}
            </p>
            <p className="mt-3 text-[10px] text-secondary/50">
              Photo : duky.duke — CC BY-SA 2.0
            </p>
          </div>
        </div>
      </div>

      {/* Points of interest grid */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {t.location.nearby.map((place, i) => (
          <div key={place.name} className="rounded-xl border border-border p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{ICONS[i]}</span>
              <div>
                <h4 className="font-medium text-foreground">{place.name}</h4>
                <p className="text-sm font-medium text-primary">{place.distance}</p>
                <p className="mt-1 text-xs text-secondary">{place.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
