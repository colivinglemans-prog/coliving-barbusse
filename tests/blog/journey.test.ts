import { describe, expect, it } from "vitest";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { LE_MANS_EVENTS } from "@/lib/events";
import {
  MIN_FILTER_SIZE,
  filterKeysOf,
  homeSelection,
  isPastEvent,
  listedPosts,
  sortForList,
  visibleFilters,
} from "@/lib/blog/journey";

/** Le jour de la refonte : les assertions de dates restent vraies quelle que soit l'horloge. */
const TODAY = "2026-11-08";

describe("métadonnées du blog", () => {
  it("chaque article a au moins une étape, sans doublon", () => {
    for (const p of BLOG_POSTS) {
      expect(p.journey.length, p.slug).toBeGreaterThan(0);
      expect(new Set(p.journey).size, p.slug).toBe(p.journey.length);
    }
  });

  it("un article d'événement (event ou events) est dans l'étape « evenement »", () => {
    for (const p of BLOG_POSTS.filter((p) => p.event || p.events)) {
      expect(p.journey, p.slug).toContain("evenement");
    }
  });

  it("les clés event et events existent dans LE_MANS_EVENTS", () => {
    const keys = new Set(LE_MANS_EVENTS.map((e) => e.key));
    for (const p of BLOG_POSTS) {
      for (const k of [p.event, ...(p.events ?? [])].filter(Boolean) as string[]) {
        expect(keys.has(k), `${p.slug} → ${k}`).toBe(true);
      }
    }
  });

  it("la cible d'une archive existe et n'est pas elle-même une archive", () => {
    for (const p of BLOG_POSTS.filter((p) => p.supersededBy)) {
      const target = BLOG_POSTS.find((q) => q.slug === p.supersededBy);
      expect(target, p.slug).toBeDefined();
      expect(target?.supersededBy, p.slug).toBeUndefined();
    }
  });
});

describe("liste du blog", () => {
  const listed = listedPosts();

  it("les archives sortent de la liste", () => {
    expect(listed.some((p) => p.supersededBy)).toBe(false);
    expect(listed.length).toBe(BLOG_POSTS.filter((p) => !p.supersededBy).length);
  });

  it("chaque pastille affichée compte au moins le minimum", () => {
    for (const f of visibleFilters(listed).filter((f) => f.key !== "tous")) {
      expect(f.count, f.key).toBeGreaterThanOrEqual(MIN_FILTER_SIZE);
    }
  });

  it("chaque article appartient à au moins une pastille", () => {
    for (const p of listed) expect(filterKeysOf(p).length, p.slug).toBeGreaterThan(0);
  });

  it("les événements à venir aux dates officielles ouvrent la liste, dans l'ordre du calendrier", () => {
    const sorted = sortForList(listed, TODAY);
    expect(sorted.slice(0, 3).map((p) => p.slug)).toEqual([
      "24-heures-moto-le-mans-2027",
      "motogp-france-le-mans-2027",
      "ou-se-loger-24h-du-mans-2027",
    ]);
  });

  it("les éditions passées ferment la liste", () => {
    const sorted = sortForList(listed, TODAY);
    const firstPast = sorted.findIndex((p) => isPastEvent(p, TODAY) || p.soldOut);
    expect(firstPast).toBeGreaterThan(0);
    expect(sorted.slice(firstPast).every((p) => isPastEvent(p, TODAY) || p.soldOut)).toBe(true);
  });

  it("les éditions 2026 terminées sont reconnues comme passées", () => {
    const bySlug = (s: string) => BLOG_POSTS.find((p) => p.slug === s)!;
    for (const s of ["24-heures-rollers-le-mans", "championnat-monde-karting-kz-le-mans", "porsche-sprint-challenge-le-mans"]) {
      expect(isPastEvent(bySlug(s), TODAY), s).toBe(true);
    }
  });
});

describe("accueil", () => {
  it("3 prochains événements officiels puis 3 séjours de groupe, sans archive ni édition passée", () => {
    const home = homeSelection(TODAY);
    expect(home).toHaveLength(6);
    expect(home.slice(0, 3).map((p) => p.slug)).toEqual([
      "24-heures-moto-le-mans-2027",
      "motogp-france-le-mans-2027",
      "ou-se-loger-24h-du-mans-2027",
    ]);
    expect(home.slice(3).every((p) => p.journey.includes("groupe"))).toBe(true);
    expect(home.some((p) => p.supersededBy || isPastEvent(p, TODAY))).toBe(false);
  });
});
