import { LE_MANS_EVENTS, eventForStay, type LocalEvent } from "@/lib/events";
import { BLOG_POSTS, type BlogPostMeta } from "./posts";

/**
 * Le parcours du voyageur appliqué au blog (plan « Blog, guide et parcours voyageur »,
 * 2026-11-08).
 *
 * Chaque article porte une ou plusieurs étapes (`BlogPostMeta.journey`) :
 * - `evenement` et `groupe` : décider et réserver, souvent des mois à l'avance ;
 * - `preparer` : préparer le séjour une fois réservé ;
 * - `sur-place` : pendant le séjour, pour tout le groupe.
 *
 * Les pastilles de la liste regroupent ces étapes par **motif** (`FILTERS`). Tant que
 * « préparer » et « sur place » comptent peu d'articles, ils partagent la pastille
 * « Pendant votre séjour ». Les clés de pastille servent d'ancre (`/fr/blog#groupes`) : elles
 * sont identiques dans les 5 langues et **ne se renomment jamais** (liens dans les messages,
 * le guide d'arrivée et les QR codes imprimés).
 *
 * « Passé » se **calcule** à partir de la date de fin de l'événement de l'article : il n'y a
 * rien à cocher à la main quand une édition se termine.
 */
export type Journey = "evenement" | "groupe" | "preparer" | "sur-place";

export type FilterKey = "tous" | "evenements" | "groupes" | "pendant-le-sejour";

/** Étapes couvertes par chaque pastille. `tous` couvre tout. */
export const FILTERS: Record<Exclude<FilterKey, "tous">, readonly Journey[]> = {
  evenements: ["evenement"],
  groupes: ["groupe"],
  "pendant-le-sejour": ["preparer", "sur-place"],
};

/** Une pastille n'apparaît que si elle compte au moins autant d'articles. */
export const MIN_FILTER_SIZE = 3;

/** Les articles de la liste : les archives (`supersededBy`) sortent, comme du sitemap. */
export function listedPosts(posts: readonly BlogPostMeta[] = BLOG_POSTS): BlogPostMeta[] {
  return posts.filter((p) => !p.supersededBy);
}

/** L'événement de l'article, quand il en référence un (`event`). */
export function eventOf(post: BlogPostMeta): LocalEvent | undefined {
  return post.event ? LE_MANS_EVENTS.find((e) => e.key === post.event) : undefined;
}

/** L'édition couverte par l'article est terminée (date de fin passée). */
export function isPastEvent(post: BlogPostMeta, today: string): boolean {
  const event = eventOf(post);
  return !!event && event.end < today;
}

/** À venir, dates officielles : ce que l'on peut réserver en confiance. */
export function isUpcomingOfficial(post: BlogPostMeta, today: string): boolean {
  const event = eventOf(post);
  return !!event && event.confirmed && event.end >= today;
}

export function matchesFilter(post: BlogPostMeta, filter: FilterKey): boolean {
  if (filter === "tous") return true;
  return post.journey.some((j) => FILTERS[filter].includes(j));
}

/** Les pastilles à afficher, avec leur compteur (`tous` toujours, les autres si assez fournies). */
export function visibleFilters(
  posts: readonly BlogPostMeta[],
): { key: FilterKey; count: number }[] {
  const out: { key: FilterKey; count: number }[] = [{ key: "tous", count: posts.length }];
  for (const key of Object.keys(FILTERS) as Exclude<FilterKey, "tous">[]) {
    const count = posts.filter((p) => matchesFilter(p, key)).length;
    if (count >= MIN_FILTER_SIZE) out.push({ key, count });
  }
  return out;
}

/**
 * Ordre de la liste « Tous » : les événements à venir aux dates officielles (par date), puis
 * les séjours de groupe, puis « pendant le séjour », puis les éditions passées. À rang égal,
 * l'ordre du tableau `BLOG_POSTS` (chronologique, du plus récent au plus ancien).
 */
export function sortForList(posts: readonly BlogPostMeta[], today: string): BlogPostMeta[] {
  const rank = (p: BlogPostMeta) => {
    if (isUpcomingOfficial(p, today)) return 0;
    if (isPastEvent(p, today) || p.soldOut) return 4;
    if (p.journey.includes("groupe")) return 1;
    if (p.journey.includes("evenement")) return 2;
    return 3;
  };
  const index = new Map(posts.map((p, i) => [p.slug, i]));
  return [...posts].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (ra === 0) return eventOf(a)!.start.localeCompare(eventOf(b)!.start);
    return index.get(a.slug)! - index.get(b.slug)!;
  });
}

/**
 * Les 6 articles de l'accueil : les 3 prochains événements officiels (les seuls visibles sur
 * mobile), puis 3 séjours de groupe. Jamais d'archive ni d'édition passée.
 */
export function homeSelection(today: string, posts: readonly BlogPostMeta[] = BLOG_POSTS): BlogPostMeta[] {
  const listed = listedPosts(posts);
  const events = sortForList(listed.filter((p) => isUpcomingOfficial(p, today)), today).slice(0, 3);
  const groups = listed
    .filter((p) => p.journey.includes("groupe") && !events.includes(p))
    .slice(0, 6 - events.length);
  return [...events, ...groups];
}

/** Les pastilles (hors `tous`) auxquelles appartient un article : attribut `data-f` de la carte. */
export function filterKeysOf(post: BlogPostMeta): Exclude<FilterKey, "tous">[] {
  return (Object.keys(FILTERS) as Exclude<FilterKey, "tous">[]).filter((k) => matchesFilter(post, k));
}

/** Date du jour à Paris (AAAA-MM-JJ), pour « passé » et « à venir ». */
export function todayInParis(now: Date = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
}

/**
 * L'article de l'événement qui chevauche un séjour (message d'arrivée) : la vraie préparation du
 * séjour pour les 13 articles d'événement, sans les étiqueter « préparer ». Édition passée ou
 * archive : rien.
 */
export function articleForStay(
  bookingId: number,
  arrival: string,
  departure: string,
  today: string,
): BlogPostMeta | undefined {
  const event = eventForStay(bookingId, arrival, departure);
  if (!event) return undefined;
  return listedPosts().find((p) => p.event === event.key && !isPastEvent(p, today));
}
