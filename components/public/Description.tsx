"use client";

import { useState } from "react";

const DESCRIPTION_FR = `Notre maison de 240 m² offre un niveau de confort introuvable ailleurs en location au Mans.

9 chambres doubles, chacune avec sa salle de douche privative — personne n'a à partager la salle de bain, même dans un grand groupe !

Literie de qualité, rangements et vraie intimité dans chaque chambre. Chaque suite dispose d'un lit double avec rangements, d'un bureau avec prise Ethernet, d'une salle de bain privative, d'une smart TV, d'un dressing et d'une clé individuelle.

La maison est répartie sur 3 niveaux avec un grand salon, une cuisine-salle à manger entièrement équipée, un jardin, une terrasse, un garage et une salle de sport complète avec espace zen.

Idéal pour groupes mixtes, collaborateurs, amis ou familles recomposées. Ce concept permet à chacun de vivre à son rythme, tout en profitant du plaisir d'être ensemble.

Parfait pour les événements, les équipes de course, les séjours d'entreprise et les voyages de groupe pendant les 24 Heures du Mans et les grands événements du circuit. Accès facile au Circuit Bugatti via le Tramway T1 depuis la gare TGV.

Jusqu'à 18 personnes.`;

const DESCRIPTION_EN = `Our 240 m² house offers a level of comfort unmatched elsewhere in Le Mans rentals.

9 double bedrooms, each with its own private shower room — no one has to share a bathroom, even in a large group!

Quality bedding, storage and real privacy in every room. Each suite features a double bed with storage, a desk with Ethernet connection, a private bathroom, a smart TV, a dressing area and an individual key.

The house is spread over 3 levels with a large living room, a fully equipped dining kitchen, a garden, a terrace, a garage and a fully equipped gym with zen area.

Ideal for mixed groups, colleagues, friends or blended families. This concept allows everyone to live at their own pace while enjoying the pleasure of being together.

Perfect for events, race teams, corporate stays and group travel during the 24 Hours of Le Mans and major circuit events. Easy access to the Bugatti Circuit via Tramway T1 from the TGV station.

Sleeps up to 18 guests.`;

export default function Description() {
  const [expanded, setExpanded] = useState(false);
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const text = lang === "fr" ? DESCRIPTION_FR : DESCRIPTION_EN;
  const lines = text.split("\n").filter(Boolean);
  const preview = lines.slice(0, 3).join("\n\n");

  return (
    <div className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Description</h2>
        <div className="flex gap-1 rounded-lg bg-light-bg p-0.5 text-xs">
          <button
            onClick={() => setLang("fr")}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${lang === "fr" ? "bg-white text-foreground shadow-sm" : "text-secondary"}`}
          >
            FR
          </button>
          <button
            onClick={() => setLang("en")}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${lang === "en" ? "bg-white text-foreground shadow-sm" : "text-secondary"}`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-foreground">
        {expanded ? text : preview + "..."}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 flex items-center gap-1 text-sm font-semibold text-foreground underline decoration-1 underline-offset-4 hover:text-primary"
      >
        {expanded ? "Voir moins" : "Lire la suite"}
        <svg
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
