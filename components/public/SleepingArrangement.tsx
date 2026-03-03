"use client";

import Image from "next/image";
import { useState } from "react";

const ROOMS = [
  {
    name: "Chambre 1",
    bed: "1 lit double",
    features: "SDB privative · Smart TV · Bureau · Dressing · Clé individuelle",
    photos: [
      "/images/rooms/chambre-1/Chambre 1 AI (1).png",
      "/images/rooms/chambre-1/Chambre 1 AI (2).png",
      "/images/rooms/chambre-1/Chambre 1 AI (3).png",
      "/images/rooms/chambre-1/Chambre 1 AI (4).png",
      "/images/rooms/chambre-1/Chambre 1 AI SDB 2.png",
      "/images/rooms/chambre-1/Chambre 1 AI SDB.png",
    ],
  },
  {
    name: "Chambre 2",
    bed: "1 lit double",
    features: "SDB privative · Smart TV · Bureau · Dressing · Clé individuelle",
    photos: [
      "/images/rooms/chambre-2/1-chambre2-AI.png",
      "/images/rooms/chambre-2/2-chambre2 AI 3.png",
      "/images/rooms/chambre-2/3-chambre2 AI 2.png",
      "/images/rooms/chambre-2/chambre 2 SDB AI.png",
      "/images/rooms/chambre-2/sdb-AI.png",
    ],
  },
  {
    name: "Chambre 3",
    bed: "1 lit double",
    features: "SDB privative · Smart TV · Bureau · Dressing · Clé individuelle",
    photos: [
      "/images/rooms/chambre-3/1-Chambre 3 AI.png",
      "/images/rooms/chambre-3/Chambre 3 AI 2.png",
      "/images/rooms/chambre-3/Chambre 3 SDB AI 2.png",
      "/images/rooms/chambre-3/chambre 3 AI (2).png",
      "/images/rooms/chambre-3/chambre 3 SDB AI.png",
    ],
  },
  {
    name: "Chambre 4",
    bed: "1 lit double",
    features: "SDB privative · Smart TV · Bureau · Dressing · Clé individuelle",
    photos: [
      "/images/rooms/chambre-4/1-chambre 4 AI.png",
      "/images/rooms/chambre-4/Chambre_4_SDB_AI_1280x900_min.png",
      "/images/rooms/chambre-4/chambre 4 A1.png",
      "/images/rooms/chambre-4/chambre 4 AI 3.png",
      "/images/rooms/chambre-4/chambre 4 SDB AI 2.png",
    ],
  },
  {
    name: "Chambre 5",
    bed: "1 lit double",
    features: "SDB privative · Smart TV · Bureau · Dressing · Clé individuelle",
    photos: [
      "/images/rooms/chambre-5/1-chambre 5 AI.png",
      "/images/rooms/chambre-5/chambre 5 AI 2.png",
      "/images/rooms/chambre-5/chambre 5 AI 3.png",
      "/images/rooms/chambre-5/chambre 5 AI SDB 2.png",
      "/images/rooms/chambre-5/chambre 5 AI SDB.png",
    ],
  },
  {
    name: "Chambre 6",
    bed: "1 lit double",
    features: "SDB privative · Smart TV · Bureau · Dressing · Clé individuelle",
    photos: [
      "/images/rooms/chambre-6/1-chambre 6 AI.png",
      "/images/rooms/chambre-6/2-chambre 6 AI 2.png",
      "/images/rooms/chambre-6/Chambre 6 AI SDB.png",
      "/images/rooms/chambre-6/chambre 6 AI - 2.png",
      "/images/rooms/chambre-6/chambre 6 SDB AI 2.png",
    ],
  },
  {
    name: "Chambre 7",
    bed: "1 lit double",
    features: "SDB privative · Smart TV · Bureau · Dressing · Clé individuelle",
    photos: [
      "/images/rooms/chambre-7/1-Chambre7.png",
      "/images/rooms/chambre-7/Chambre7 SDB.png",
      "/images/rooms/chambre-7/IMG_5862.JPG",
      "/images/rooms/chambre-7/chambre 7 AI.png",
    ],
  },
  {
    name: "Chambre 8",
    bed: "1 lit double",
    features: "SDB privative · Smart TV · Bureau · Dressing · Clé individuelle",
    photos: [
      "/images/rooms/chambre-8/1-chambre 8 AI 5.png",
      "/images/rooms/chambre-8/2-Chambre 8 AI.png",
      "/images/rooms/chambre-8/3-Chambre 8 AI (2).png",
      "/images/rooms/chambre-8/4-chambre 8 AI 3.png",
      "/images/rooms/chambre-8/Chambre 8 AI SDB 2.png",
      "/images/rooms/chambre-8/Chambre 8 AI SDB.png",
      "/images/rooms/chambre-8/chambre 8 AI 2.png",
      "/images/rooms/chambre-8/chambre 8 AI 4.png",
      "/images/rooms/chambre-8/chambre 8 AI 7.png",
    ],
  },
  {
    name: "Chambre 9",
    bed: "1 lit double",
    features: "SDB privative · Smart TV · Bureau · Dressing · Clé individuelle",
    photos: [
      "/images/rooms/chambre-9/1-chambre 9 AI 4.png",
      "/images/rooms/chambre-9/2-chambre 9 AI.png",
      "/images/rooms/chambre-9/chambre 9 AI 2.png",
      "/images/rooms/chambre-9/chambre 9 AI 3.png",
      "/images/rooms/chambre-9/chambre 9 AI 5.png",
      "/images/rooms/chambre-9/chambre 9 AI SDB.png",
      "/images/rooms/chambre-9/chambre_9_AI_SBD_2_1280x900_min.png",
    ],
  },
];

function RoomCarousel({ photos, name }: { photos: string[]; name: string }) {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === photos.length - 1 ? 0 : i + 1));

  return (
    <div className="group relative aspect-[4/3] overflow-hidden bg-gray-100">
      <Image
        src={encodeURI(photos[index])}
        alt={`${name} — photo ${index + 1}`}
        fill
        className="object-cover"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100"
            aria-label="Photo précédente"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100"
            aria-label="Photo suivante"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`block h-1.5 w-1.5 rounded-full transition-colors ${
                  i === index ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SleepingArrangement() {
  return (
    <div id="chambres" className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">Où vous dormirez</h2>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROOMS.map((room) => (
          <div
            key={room.name}
            className="overflow-hidden rounded-xl border border-border"
          >
            <RoomCarousel photos={room.photos} name={room.name} />
            <div className="p-4">
              <h3 className="font-medium text-foreground">{room.name}</h3>
              <p className="mt-1 text-sm text-secondary">{room.bed}</p>
              <p className="mt-2 text-xs text-secondary">{room.features}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
