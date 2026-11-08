"use client";

import { useEffect, useState, type ReactNode } from "react";
import FilterChips from "@sejour/socle/components/FilterChips";
import type { FilterKey } from "@/lib/blog/journey";
import type { Locale } from "@/lib/i18n";

/**
 * Les pastilles de la liste du blog et le filtrage, **par CSS** : la liste est rendue côté serveur
 * en entier (toutes les cartes dans le HTML initial, rien ne change pour le référencement), ce
 * composant pose seulement `data-active` sur son conteneur, et une règle masque les cartes dont
 * `data-f` ne contient pas la pastille active.
 *
 * L'ancre choisit la pastille au chargement (`/fr/blog#groupes`) et suit les changements : c'est
 * ce qui permet d'y envoyer quelqu'un depuis le guide d'arrivée, un message ou un QR code. Les clés
 * sont fixes dans les 5 langues et ne se renomment jamais ; une ancre inconnue retombe sur « tous ».
 */
const LABELS: Record<Locale, { aria: string } & Record<FilterKey, string>> = {
  fr: { aria: "Filtrer les articles", tous: "Tous", evenements: "Grands événements", groupes: "Séjours de groupe", "pendant-le-sejour": "Pendant votre séjour" },
  en: { aria: "Filter articles", tous: "All", evenements: "Major events", groupes: "Group stays", "pendant-le-sejour": "During your stay" },
  it: { aria: "Filtra gli articoli", tous: "Tutti", evenements: "Grandi eventi", groupes: "Soggiorni di gruppo", "pendant-le-sejour": "Durante il tuo soggiorno" },
  de: { aria: "Artikel filtern", tous: "Alle", evenements: "Große Events", groupes: "Gruppenaufenthalte", "pendant-le-sejour": "Während Ihres Aufenthalts" },
  es: { aria: "Filtrar los artículos", tous: "Todos", evenements: "Grandes eventos", groupes: "Estancias de grupo", "pendant-le-sejour": "Durante tu estancia" },
};

export default function BlogListFilter({
  locale,
  filters,
  children,
}: {
  locale: Locale;
  filters: { key: FilterKey; count: number }[];
  children: ReactNode;
}) {
  const t = LABELS[locale] ?? LABELS.fr;
  const [active, setActive] = useState<FilterKey>("tous");
  const keys = filters.map((f) => f.key);

  useEffect(() => {
    const fromHash = () => {
      let h = "";
      try {
        h = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        // Ancre malformée (`#%E0`) : on retombe sur « tous » plutôt que de planter.
      }
      setActive(keys.includes(h as FilterKey) ? (h as FilterKey) : "tous");
    };
    // Voulu : l'ancre s'applique après l'hydratation, pour que le HTML initial (celui des
    // robots) reste la liste complète.
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join("|")]);

  const choose = (key: FilterKey) => {
    setActive(key);
    const url = key === "tous" ? window.location.pathname : `${window.location.pathname}#${key}`;
    window.history.replaceState(null, "", url);
  };

  // Une règle par pastille : masquer les cartes qui n'en font pas partie.
  const css = keys
    .filter((k) => k !== "tous")
    .map((k) => `[data-active="${k}"] [data-f]:not([data-f~="${k}"]){display:none}`)
    .join("");

  return (
    <div data-active={active}>
      <style>{css}</style>
      <FilterChips<FilterKey>
        items={filters.map((f) => ({ key: f.key, label: t[f.key], count: f.count }))}
        active={active}
        onChange={choose}
        ariaLabel={t.aria}
        className="mt-8"
      />
      {children}
    </div>
  );
}
