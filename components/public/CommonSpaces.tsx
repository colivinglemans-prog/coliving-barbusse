import Image from "next/image";

const PHOTOS = [
  { src: "/images/house/5-sportAI.png", alt: "Salle de sport" },
  { src: "/images/house/5-sportAI-2.JPG", alt: "Salle de sport — équipements" },
  { src: "/images/house/Salle Zen AI.png", alt: "Salle zen" },
];

export default function CommonSpaces() {
  return (
    <div className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">Espace Sport</h2>
      <p className="mt-2 text-sm text-secondary">
        Espace privatif dans une annexe de la maison, en accès libre 7j/7, 24h/24 — sans risque de réveiller qui que ce soit.
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
          <h3 className="font-medium text-foreground">Salle de sport</h3>
          <p className="mt-1 text-sm text-secondary">
            Équipements fitness à disposition : vélo elliptique, tapis de course, haltères et banc de musculation.
          </p>
        </div>
        <div>
          <h3 className="font-medium text-foreground">Salle zen</h3>
          <p className="mt-1 text-sm text-secondary">
            Un espace détente pour se ressourcer : yoga, méditation et relaxation.
          </p>
        </div>
      </div>
    </div>
  );
}
