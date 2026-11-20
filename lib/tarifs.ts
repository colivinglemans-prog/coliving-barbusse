/**
 * La grille de la page « Tarifs » (`/xx/tarifs`) : le prix exact des week-ends, des fêtes et des
 * grands événements, en HTML, pour les assistants IA qui ne lisent ni le calendrier (JavaScript)
 * ni l'API de devis — Copilot, le 19/11/2026, recommandait la maison mais « les pages n'affichent
 * pas de calendrier ni d'état de disponibilité ».
 *
 * **Architecture** : la grille est calculée par le cron `/api/cron/price-grid` (cron-job.org,
 * toutes les heures) et rangée dans Upstash (`barbusse:price-grid`) ; la page ne fait que la lire.
 * Jamais un appel Beds24 sur le chemin d'un visiteur. Logique de rangement et d'alerte :
 * `@sejour/socle/lib/price-grid-job` ; calcul : `@sejour/socle/lib/price-grid`.
 *
 * - **Quels séjours** : les week-ends du vendredi au dimanche des 4 prochains mois ; les fêtes
 *   (périodes du moteur de prix, `ENGINE_CONFIG.fixedPeriods`) des 6 prochains mois ; les grands
 *   événements **confirmés** (`LE_MANS_EVENTS` dont la clé a une règle `majorEvents`, plus les
 *   24 Heures Vélo), au séjour minimum Beds24 qui finit le lendemain de la course — **seulement si
 *   `TARIFS_EVENEMENTS=on`** (voir `eventsEnabled`). Les options (GP Moto) ne sont pas codées :
 *   la grille suit Beds24.
 * - **Quels groupes** : 10, 15 et 20 adultes. **Prix des événements publiés** (décision de l'hôte,
 *   19/11/2026).
 * - **Composition** (`PRICE_GRID_COMPOSITION`) : à changer dès que les séjours ou les groupes
 *   changent — la page ne sert jamais une grille d'une autre composition.
 * - **Interrupteur** : `PRIX_PUBLICS=off` (ou `0`, `false`) coupe tous les prix au prochain calcul.
 */
import { addDays } from "@sejour/socle/lib/dates";
import {
  buildPriceGrid,
  eventStays,
  fixedStays,
  weekendStays,
  type PriceGrid,
  type StayWindow,
  type WindowSource,
} from "@sejour/socle/lib/price-grid";
import { readPriceGrid, type ReadPriceGrid } from "@sejour/socle/lib/price-grid-job";
import { fetchRoomPrice } from "@sejour/socle/lib/stay-price";
import { todayParis } from "@sejour/socle/lib/time";
import { STAY_QUOTE } from "@/lib/agent";
import { getAvailability, getMinStay } from "@/lib/beds24";
import { PROPERTY_ID } from "@/lib/beds24-property";
import { LE_MANS_EVENTS, type LocalEvent } from "@/lib/events";
import { ENGINE_CONFIG } from "@/lib/pricing/engine-config";
import { hasRedis, redisKey, stringStore } from "@/lib/redis";

/** Les groupes chiffrés : une colonne chacun. */
export const PRICE_PARTIES = [10, 15, 20].map((adults) => ({ adults, children: 0 }));

/**
 * Ce que la grille contient. **À changer** dès que les séjours ou les groupes changent : une grille
 * rangée sous une autre composition n'est jamais servie (la page affiche le renvoi au calendrier
 * jusqu'au calcul suivant).
 */
export const PRICE_GRID_COMPOSITION = `barbusse-v1:weekends-4m,fetes-6m${eventsEnabled() ? ",events-min" : ""};adults-10-15-20`;

/** Clé Upstash de la grille (l'état du cron sous `…:job`, l'alerte sous `…:alert`). */
export const PRICE_GRID_KEY = redisKey("price-grid");

/** Week-ends affichés : les quatre prochains mois. */
const WEEKEND_DAYS = 122;
/** Fêtes affichées : les six prochains mois (au-delà, Beds24 ne vend pas encore). */
const HOLIDAY_DAYS = 183;
/** Durée d'un prix en cache, en secondes : le cron passe toutes les heures, pas les prix. */
const PRICE_TTL = 12 * 3600;
/** Événements chiffrés en plus des grands événements du moteur de prix. */
const EXTRA_EVENT_PREFIXES = ["24h-velo"];

/**
 * Interrupteur des lignes d'événements (24 Heures, MotoGP, Classic…) : **éteint par défaut**,
 * allumé par `TARIFS_EVENEMENTS=on`. Décision de l'hôte du 20/11/2026 : tant que le moteur de prix
 * maison n'a pas remplacé Beyond (bascule prévue le 1/12, sous condition), les prix d'événements
 * de Beds24 sont ceux de Beyond, plus hauts que les prix décidés — on ne les publie pas. Les
 * week-ends et les fêtes restent affichés. La composition de la grille en dépend : allumer ou
 * éteindre ne sert jamais une grille de l'autre forme.
 */
export function eventsEnabled(): boolean {
  return (process.env.TARIFS_EVENEMENTS ?? "").trim().toLowerCase() === "on";
}

export function publicPricesEnabled(): boolean {
  return !["off", "0", "false"].includes((process.env.PRIX_PUBLICS ?? "").trim().toLowerCase());
}

const prefixOf = (e: LocalEvent) => e.key.replace(/-\d{4}(-.*)?$/, "");
const ruleOf = (e: LocalEvent) => ENGINE_CONFIG.majorEvents.find((r) => r.keyPrefix === prefixOf(e));

/** Les fêtes à venir (`MM-DD` du moteur de prix → dates), nuits incluses. */
function holidayStays(today: string): StayWindow[] {
  const year = Number(today.slice(0, 4));
  const until = addDays(today, HOLIDAY_DAYS);
  return ENGINE_CONFIG.fixedPeriods
    .flatMap((p) =>
      [year, year + 1].map((y) => {
        const checkIn = `${y}-${p.from}`;
        // Une période qui passe le Nouvel An (12-30 → 01-01) se termine l'année suivante.
        const lastNight = p.to < p.from ? `${y + 1}-${p.to}` : `${y}-${p.to}`;
        // Intitulé : l'année de la dernière nuit (« Nouvel An 2027 ») ; traduit par la page (`key`).
        const year4 = lastNight.slice(0, 4);
        return { checkIn, checkOut: addDays(lastNight, 1), key: `fete:${p.label}:${year4}`, label: `${p.label} ${year4}` };
      }),
    )
    .filter((w) => w.checkIn <= until);
}

function sources(today: string): WindowSource[] {
  const events = eventsEnabled()
    ? LE_MANS_EVENTS.filter((e) => ruleOf(e) || EXTRA_EVENT_PREFIXES.includes(prefixOf(e)))
    : [];
  return [
    weekendStays({ from: today, to: addDays(today, WEEKEND_DAYS) }, { startWeekday: 5, nights: 2 }),
    fixedStays(holidayStays(today)),
    // Fenêtre lue : la veille du premier jour plus les nuits d'approche du moteur ; la ligne est
    // le séjour minimum Beds24 qui finit le lendemain de la course.
    eventStays(events, { before: (e) => 1 + (ruleOf(e)?.extendBefore ?? 0), after: 1 }),
  ];
}

/**
 * Le calcul, appelé par le cron seulement. La disponibilité est lue **en une plage par période**
 * (deux appels v2 : disponibilité et séjours minimum), pas mois par mois en parallèle : le quota de
 * l'API v2 est partagé avec la serrure, la messagerie et le calendrier du site.
 */
export async function computePriceGrid(counter?: { availability: number; price: number }): Promise<PriceGrid> {
  const today = todayParis();
  return buildPriceGrid(
    STAY_QUOTE,
    {
      today,
      availability: async (from, to) => {
        if (counter) counter.availability += 2;
        const dates = await getAvailability(PROPERTY_ID, from, to);
        const minStay = await getMinStay(PROPERTY_ID, from, to);
        return { dates, minStay };
      },
      price: (req) => {
        if (counter) counter.price++;
        return fetchRoomPrice(req, { revalidate: PRICE_TTL });
      },
    },
    {
      sources: sources(today),
      parties: PRICE_PARTIES,
      enabled: publicPricesEnabled(),
      // getroomprice répond 403 à des appels trop rapprochés (mesuré le 19/11/2026).
      pauseMs: 700,
      // La route a 60 s (plan Hobby) : on s'arrête avant, les prix déjà demandés restent en cache.
      timeBudgetMs: 45_000,
    },
  );
}

/** La grille rangée par le cron, ou `null` (Upstash absent ou vide, autre composition). */
export async function getPriceGrid(): Promise<ReadPriceGrid | null> {
  if (!hasRedis()) return null;
  try {
    return await readPriceGrid(stringStore(), PRICE_GRID_KEY, PRICE_GRID_COMPOSITION, { today: todayParis() });
  } catch {
    return null;
  }
}
