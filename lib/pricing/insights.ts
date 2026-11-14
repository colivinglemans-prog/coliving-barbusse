import { addDays, daysBetween } from "@sejour/socle/lib/dates";
import type { LocalEvent } from "@sejour/socle/lib/events";
import { eventNights } from "./engine";
import type { EngineConfig } from "./engine-config";
import type { PriceSnapshot, SnapshotDiff } from "./snapshot";

/**
 * Alertes pour **affiner le pricing** — fonction pure, calculée chaque matin à partir de la photo
 * du jour et de la différence avec la veille (`pricing-snapshot`). Elles ne disent pas « il y a
 * une panne », elles disent « il y a une décision de prix à prendre » :
 *
 * - **vente précoce** : une nuit vendue très en avance, souvent signe d'un prix trop bas (leçon
 *   des 24 Heures 2027, vendues à J-208 trois jours après une baisse de 13 %) ;
 * - **nuits orphelines** : un trou plus court que le séjour minimum, invendable en l'état (leçon
 *   des 7-8/06/2027) ;
 * - **grand événement à J-60 invendu** : la date où l'on tranche (plan du 2026-11-14) ;
 * - **creux à venir** : peu de nuits réservées sur les 30 prochains jours et aucune vente récente.
 *
 * Chaque constat a un identifiant stable : `reportAlerts` ne le renvoie pas tant qu'il dure.
 */

export interface PricingInsight {
  id: string;
  kind: "early-sale" | "orphan" | "event-j60" | "slow-pace";
  priority: 2 | 3;
  line: string;
}

export const INSIGHT_THRESHOLDS = {
  /** Une nuit ordinaire vendue à plus de 120 jours. */
  earlySaleDays: 120,
  /** Une nuit de grand événement vendue à plus de 90 jours. */
  earlyEventSaleDays: 90,
  /** Fenêtre du « creux à venir » et taux de nuits réservées en dessous duquel on alerte. */
  slowWindowDays: 30,
  slowBookedShare: 0.2,
  /** Jours sans aucune nouvelle vente avant de parler de creux. */
  slowNoSaleDays: 14,
  /** Les J-60 restent signalés une semaine. */
  j60WindowDays: 7,
} as const;

const keyPrefix = (key: string) => key.replace(/-\d{4}(-\d{2}-\d{2})?$/, "");

export function pricingInsights(input: {
  today: string;
  snapshot: PriceSnapshot;
  /** Différence avec la photo de la veille (`null` le premier jour). */
  diff: SnapshotDiff | null;
  /** Date de la dernière nuit vendue repérée dans les photos des 14 derniers jours (`null` si aucune). */
  lastSaleSeen: string | null;
  events: LocalEvent[];
  config: EngineConfig;
}): PricingInsight[] {
  const { today, snapshot, diff, lastSaleSeen, events, config } = input;
  const out: PricingInsight[] = [];
  const t = INSIGHT_THRESHOLDS;

  /* Grands événements : nuits couvertes, pour la vente précoce et les J-60. */
  const majorNight = new Map<string, string>();
  const majors: { e: LocalEvent; nights: string[] }[] = [];
  for (const e of events) {
    const rule = config.majorEvents.find((r) => r.keyPrefix === keyPrefix(e.key));
    if (!rule || e.end < today) continue;
    const nights = eventNights(e, rule.extendBefore).filter((n) => snapshot.days[n]);
    for (const n of nights) majorNight.set(n, e.name);
    majors.push({ e, nights });
  }

  /* 1. Ventes précoces (dans la différence avec la veille). */
  if (diff) {
    const early = diff.sold.filter((s) =>
      majorNight.has(s.date) ? s.leadDays >= t.earlyEventSaleDays : s.leadDays >= t.earlySaleDays,
    );
    if (early.length) {
      const first = early[0];
      const label = majorNight.get(first.date) ?? "nuits ordinaires";
      out.push({
        id: `early:${first.date}`,
        kind: "early-sale",
        priority: 3,
        line:
          `Vente précoce (${label}) : ${early.length} nuit(s) dès le ${first.date}, à J-${first.leadDays}, ` +
          `au prix affiché de ${Math.round(early.reduce((a, s) => a + s.price, 0) / early.length)} €. ` +
          `Prix sans doute bas : regarder les nuits voisines et l'édition suivante.`,
      });
    }
  }

  /* 2. Nuits orphelines : une suite de nuits vendables, bornée par deux nuits fermées, plus
        courte que le séjour minimum affiché. */
  const dates = Object.keys(snapshot.days).sort();
  for (let i = 1; i < dates.length - 1; i++) {
    const d = dates[i];
    if (snapshot.days[d][2] !== 1 || snapshot.days[dates[i - 1]][2] !== 0) continue;
    let j = i;
    while (j + 1 < dates.length && snapshot.days[dates[j + 1]][2] === 1) j++;
    if (j + 1 >= dates.length) break;
    const run = j - i + 1;
    const minStay = Math.max(...dates.slice(i, j + 1).map((x) => snapshot.days[x][1]));
    if (run < minStay && daysBetween(today, d) >= 0) {
      out.push({
        id: `orphan:${d}:${run}`,
        kind: "orphan",
        priority: 3,
        line:
          `Nuits orphelines : ${run} nuit(s) à partir du ${d} entre deux séjours, séjour minimum ${minStay} : ` +
          `invendables en l'état (baisser le séjour minimum, et vérifier le prix).`,
      });
    }
    i = j;
  }

  /* 3. Grand événement à J-60 (pendant une semaine) avec des nuits encore libres. */
  for (const { e, nights } of majors) {
    const decideBy = addDays(e.start, -60);
    if (today < decideBy || today > addDays(decideBy, t.j60WindowDays)) continue;
    const free = nights.filter((n) => snapshot.days[n][2] === 1);
    if (free.length === 0) continue;
    const avg = Math.round(free.reduce((a, n) => a + snapshot.days[n][0], 0) / free.length);
    out.push({
      id: `j60:${e.key}`,
      kind: "event-j60",
      priority: 3,
      line:
        `${e.name} à J-60 : ${free.length}/${nights.length} nuit(s) encore libres à ${avg} € en moyenne. ` +
        `Décision prévue : baisser si le prix dépasse 1,5 × le réalisé de l'édition précédente.`,
    });
  }

  /* 4. Creux à venir : peu de nuits réservées sur 30 jours et aucune vente depuis 14 jours. */
  const window = Array.from({ length: t.slowWindowDays }, (_, k) => addDays(today, k)).filter((n) => snapshot.days[n]);
  const booked = window.filter((n) => snapshot.days[n][2] === 0).length;
  const noRecentSale = !lastSaleSeen || daysBetween(lastSaleSeen, today) >= t.slowNoSaleDays;
  if (window.length && booked / window.length < t.slowBookedShare && noRecentSale) {
    // Une alerte par semaine au plus : l'identifiant change chaque lundi.
    const monday = addDays(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7));
    out.push({
      id: `slow:${monday}`,
      kind: "slow-pace",
      priority: 2,
      line:
        `Creux à venir : ${booked}/${window.length} nuits réservées sur les ${t.slowWindowDays} prochains jours, ` +
        `aucune nouvelle vente depuis ${lastSaleSeen ? daysBetween(lastSaleSeen, today) + " jours" : "le début des relevés"}. ` +
        `Regarder la comparaison d'occupation avec le voisinage (Beyond) avant de baisser.`,
    });
  }

  return out;
}
