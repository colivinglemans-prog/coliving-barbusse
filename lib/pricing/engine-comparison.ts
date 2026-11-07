import type { LocalEvent } from "@sejour/socle/lib/events";
import { nightCategories } from "./engine";
import type { EngineConfig } from "./engine-config";
import { diffSnapshots, type PriceSnapshot, type ShadowPrices } from "./snapshot";

/**
 * Comparaison hebdomadaire **moteur maison contre Beyond**, pour la décision du 2027-01-15.
 *
 * Seuils fixés à l'avance (débat du 2026-11-07, position « prudente ») :
 * - on coupe Beyond si le moteur est à ±10 % de lui sur au moins 80 % des nuits ordinaires
 *   (le moteur fait aussi bien sans coûter 1 %) **et** que Beyond exige encore ≥ 3 corrections
 *   manuelles par mois — ce second critère ne se mesure pas ici, l'exploitant le tient ;
 * - on garde Beyond corrigé sinon.
 *
 * Le signal le plus parlant reste les **nuits vendues** : si elles partent régulièrement à un
 * prix Beyond nettement sous celui du moteur, c'est de l'argent laissé sur la table ; si elles
 * partent au-dessus, le moteur aurait sans doute fait fuir le voyageur.
 */

export interface EngineComparison {
  /** Nuits vendables ordinaires (hors événements majeurs et fêtes) comparées. */
  ordinaryNights: number;
  /** Part de ces nuits où le moteur est à ±10 % de Beyond. */
  within10Pct: number | null;
  /** Écart médian moteur / Beyond, en %, signé (positif = moteur plus cher). */
  medianGapPct: number | null;
  engineHigher: number;
  engineLower: number;
  minStayDiffers: number;
  /** Par grand événement ou période de fêtes : prix moyens sur les nuits du relevé. */
  categories: { name: string; beyond: number; engine: number; nights: number }[];
  /** Nuits vendues dans la semaine : prix Beyond affiché la veille contre prix moteur la veille. */
  sold: { nights: number; beyondAvg: number | null; engineAvg: number | null };
}

const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);
function median(v: number[]): number | null {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function compareEngine(input: {
  today: string;
  snapshots: { date: string; snapshot: PriceSnapshot | null }[];
  shadows: { date: string; shadow: ShadowPrices | null }[];
  events: LocalEvent[];
  config: EngineConfig;
}): EngineComparison | null {
  const { today, snapshots, shadows, events, config } = input;
  const snap = snapshots.find((s) => s.date === today)?.snapshot;
  const shadow = shadows.find((s) => s.date === today)?.shadow;
  if (!snap || !shadow) return null;

  const dates = Object.keys(snap.days).filter((d) => shadow.days[d]).sort();
  const categories = nightCategories(dates, events, config);

  const gaps: number[] = [];
  let minStayDiffers = 0;
  const byCategory = new Map<string, { beyond: number[]; engine: number[] }>();
  for (const d of dates) {
    const [bPrice, bMin, avail] = snap.days[d];
    const [ePrice, eMin] = shadow.days[d];
    if (avail === 1 && bMin !== eMin) minStayDiffers++;
    const cat = categories.get(d);
    if (cat) {
      const c = byCategory.get(cat) ?? { beyond: [], engine: [] };
      c.beyond.push(bPrice);
      c.engine.push(ePrice);
      byCategory.set(cat, c);
    } else if (avail === 1 && bPrice > 0) {
      gaps.push(((ePrice - bPrice) / bPrice) * 100);
    }
  }

  /* Nuits vendues : la photo et le calcul moteur de la veille de la vente. */
  const soldBeyond: number[] = [];
  const soldEngine: number[] = [];
  const present = snapshots.filter((s) => s.snapshot);
  for (let i = 1; i < present.length; i++) {
    const before = present[i - 1];
    const shadowBefore = shadows.find((s) => s.date === before.date)?.shadow;
    for (const night of diffSnapshots(before.snapshot!, present[i].snapshot!).sold) {
      soldBeyond.push(night.price);
      const e = shadowBefore?.days[night.date];
      if (e) soldEngine.push(e[0]);
    }
  }

  return {
    ordinaryNights: gaps.length,
    within10Pct: gaps.length ? gaps.filter((g) => Math.abs(g) <= 10).length / gaps.length : null,
    medianGapPct: median(gaps),
    engineHigher: gaps.filter((g) => g > 10).length,
    engineLower: gaps.filter((g) => g < -10).length,
    minStayDiffers,
    categories: [...byCategory.entries()]
      .map(([name, c]) => ({
        name,
        beyond: Math.round(mean(c.beyond)!),
        engine: Math.round(mean(c.engine)!),
        nights: c.beyond.length,
      }))
      .slice(0, 8),
    sold: { nights: soldBeyond.length, beyondAvg: mean(soldBeyond), engineAvg: mean(soldEngine) },
  };
}

export function formatEngineComparison(c: EngineComparison | null): string {
  if (!c) return "MOTEUR vs BEYOND : pas de calcul moteur du jour.";
  const pct = (n: number | null) => (n == null ? "—" : `${n > 0 ? "+" : ""}${Math.round(n)} %`);
  const lines = [
    `MOTEUR vs BEYOND (nuits ordinaires vendables : ${c.ordinaryNights}) :`,
    `  à ±10 % : ${c.within10Pct == null ? "—" : Math.round(c.within10Pct * 100) + " %"} (seuil de bascule : 80 %)` +
      ` · écart médian ${pct(c.medianGapPct)} · moteur +cher ${c.engineHigher} / −cher ${c.engineLower}`,
    `  séjours min. différents : ${c.minStayDiffers} nuit(s)`,
  ];
  if (c.sold.nights) {
    lines.push(
      `  nuits vendues : ${c.sold.nights}, Beyond ${c.sold.beyondAvg == null ? "—" : Math.round(c.sold.beyondAvg) + " €"}` +
        ` / moteur ${c.sold.engineAvg == null ? "—" : Math.round(c.sold.engineAvg) + " €"}`,
    );
  }
  for (const cat of c.categories) {
    lines.push(`  ${cat.name} : Beyond ${cat.beyond} € / moteur ${cat.engine} € (${cat.nights} n)`);
  }
  return lines.join("\n");
}

