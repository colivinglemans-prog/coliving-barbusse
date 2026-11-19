/**
 * La grille de la page « Tarifs » (`/xx/tarifs`) : le prix exact des week-ends, des fêtes et des
 * grands événements, en HTML, pour les assistants IA qui ne lisent ni le calendrier (JavaScript)
 * ni l'API de devis — Copilot, le 19/11/2026, recommandait la maison mais « les pages n'affichent
 * pas de calendrier ni d'état de disponibilité ». Le calcul est celui du socle
 * (`@sejour/socle/lib/price-grid`) ; ce fichier ne garde que ce qui est propre à Barbusse.
 *
 * - **Quels séjours** : tous les week-ends du vendredi au dimanche des 4 prochains mois ; les
 *   fêtes (périodes du moteur de prix, `ENGINE_CONFIG.fixedPeriods`) ; les grands événements
 *   **confirmés** (`LE_MANS_EVENTS` dont la clé a une règle `ENGINE_CONFIG.majorEvents`, plus les
 *   24 Heures Vélo), avec leurs nuits d'approche (`extendBefore`). Les séjours minimum viennent de
 *   Beds24 : un week-end de 2 nuits en période de 3 est allongé, jamais refusé à tort.
 * - **Quels groupes** : 10, 15 et 20 adultes (le prix suit le nombre de voyageurs).
 * - **Prix des événements publiés tels quels** (décision de l'hôte du 19/11/2026).
 * - **Cache** : une seule grille pour les cinq langues, recalculée au plus une fois par heure ;
 *   chaque prix est gardé 12 h. Une grille dégradée n'est pas mise en cache.
 * - **Interrupteur** : `PRIX_PUBLICS=off` coupe tous les prix ; la disponibilité reste affichée.
 */
import { unstable_cache } from "next/cache";
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
import { fetchRoomPrice } from "@sejour/socle/lib/stay-price";
import { STAY_QUOTE, stayAgentDeps } from "@/lib/agent";
import { LE_MANS_EVENTS, type LocalEvent } from "@/lib/events";
import { ENGINE_CONFIG } from "@/lib/pricing/engine-config";

/** Les groupes chiffrés : une colonne chacun. */
export const PRICE_PARTIES = [10, 15, 20].map((adults) => ({ adults, children: 0 }));

/** Week-ends affichés : les quatre prochains mois. */
const WEEKEND_DAYS = 122;
/** Durée d'un prix en cache, en secondes. */
const PRICE_TTL = 12 * 3600;
/** Événements chiffrés en plus des grands événements du moteur de prix. */
const EXTRA_EVENT_PREFIXES = ["24h-velo"];

export function publicPricesEnabled(): boolean {
  return (process.env.PRIX_PUBLICS ?? "").trim().toLowerCase() !== "off";
}

const prefixOf = (e: LocalEvent) => e.key.replace(/-\d{4}(-.*)?$/, "");
const ruleOf = (e: LocalEvent) => ENGINE_CONFIG.majorEvents.find((r) => r.keyPrefix === prefixOf(e));

/**
 * Les fêtes de l'hiver à venir (`MM-DD` du moteur de prix → dates), nuits incluses — celles des six
 * prochains mois seulement : au-delà de l'horizon de vente de Beds24 (fin août), un jour non ouvert
 * à la vente s'afficherait « réservé ».
 */
function holidayStays(today: string): StayWindow[] {
  const year = Number(today.slice(0, 4));
  const until = addDays(today, 183);
  return ENGINE_CONFIG.fixedPeriods.flatMap((p) =>
    [year, year + 1].map((y) => {
      const checkIn = `${y}-${p.from}`;
      // Une période qui passe le Nouvel An (12-30 → 01-01) se termine l'année suivante.
      const lastNight = p.to < p.from ? `${y + 1}-${p.to}` : `${y}-${p.to}`;
      // Intitulé : l'année de la dernière nuit (« Nouvel An 2027 ») ; traduit par la page (`key`).
      return { checkIn, checkOut: addDays(lastNight, 1), key: `fete:${p.label}:${lastNight.slice(0, 4)}`, label: `${p.label} ${lastNight.slice(0, 4)}` };
    }),
  ).filter((w) => w.checkIn <= until);
}

function sources(today: string): WindowSource[] {
  const events = LE_MANS_EVENTS.filter((e) => ruleOf(e) || EXTRA_EVENT_PREFIXES.includes(prefixOf(e)));
  return [
    weekendStays({ from: today, to: addDays(today, WEEKEND_DAYS) }, { startWeekday: 5, nights: 2 }),
    fixedStays(holidayStays(today)),
    // Arrivée la veille du premier jour, plus les nuits d'approche du moteur ; départ le
    // lendemain du dernier jour.
    eventStays(events, { before: (e) => 1 + (ruleOf(e)?.extendBefore ?? 0), after: 1 }),
  ];
}

async function compute(enabled: boolean): Promise<PriceGrid> {
  const deps = stayAgentDeps();
  return buildPriceGrid(
    STAY_QUOTE,
    { ...deps, price: (req) => fetchRoomPrice(req, { revalidate: PRICE_TTL }) },
    {
      sources: sources(deps.today),
      parties: PRICE_PARTIES,
      enabled,
      // getroomprice répond 403 à des appels trop rapprochés (mesuré le 19/11/2026).
      pauseMs: 700,
    },
  );
}

/** La grille, ou `null` si Beds24 ne répond pas (aucun prix inventé, renvoi au calendrier). */
export async function getPriceGrid(): Promise<PriceGrid | null> {
  // L'état de l'interrupteur entre dans la clé : le cache de données survit aux déploiements.
  const enabled = publicPricesEnabled();
  const cached = unstable_cache(() => compute(enabled), ["barbusse-price-grid-v1", enabled ? "on" : "off"], {
    revalidate: 3600,
    tags: ["price-grid"],
  });
  try {
    return await cached();
  } catch (e) {
    console.error("Grille de prix :", e instanceof Error ? e.message : e);
    return null;
  }
}
