"use client";

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
      <div className="mt-8 overflow-hidden rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="shrink-0 text-5xl">🏁</div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t.location.circuitTitle}
            </h3>
            <p className="mt-1 text-sm text-secondary">
              {t.location.circuitDesc}
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
