import { addDays, daysBetween } from "@sejour/socle/lib/dates";
import type { LocalEvent } from "@sejour/socle/lib/events";
import type { EngineConfig } from "./engine-config";
import type { PricingInsight } from "./insights";
import type { PushRun } from "./push";
import type { SnapshotDiff } from "./snapshot";

/**
 * Ordre du jour du **rendez-vous hebdomadaire « évaluation des prix avec Claude »** — fonction
 * pure, envoyée chaque mardi matin (`/api/cron/pricing-review-reminder`).
 *
 * Un rappel n'a de valeur que s'il dit **quoi** regarder : la semaine écoulée, les points ouverts,
 * les échéances proches, et la phrase à copier pour lancer la séance. Une semaine sans rien à
 * décider se voit d'un coup d'œil ; l'exploitant peut alors sauter la séance.
 */

/** Échéances du pricing hors événements (les J-60 se calculent depuis le catalogue). */
export const PRICING_MILESTONES: readonly { date: string; label: string }[] = [
  { date: "2026-11-30", label: "Fin des 7 jours d'envoi à blanc (phase 2) : bilan avant la bascule" },
  { date: "2026-12-01", label: "Bascule visée : Beyond en pause, envoi réel (sous condition, sinon 08/12)" },
  { date: "2027-01-31", label: "Critères techniques au 31/01 : résilier Beyond ?" },
  { date: "2027-04-01", label: "Semaine des essais à 1 560 € : baisser si rien n'est vendu" },
  { date: "2027-04-15", label: "Albiez : décision de sortie de Beyond après la saison" },
];

/** Horizon des échéances annoncées. */
export const AGENDA_HORIZON_DAYS = 21;

/** La phrase que l'exploitant copie dans Claude pour lancer la séance. */
export const REVIEW_PROMPT = "Fais l'évaluation pricing de la semaine";

const keyPrefix = (key: string) => key.replace(/-\d{4}(-\d{2}-\d{2})?$/, "");

export interface ReviewAgenda {
  title: string;
  body: string;
  /** Nombre de points qui appellent une décision (vente, alerte, échéance). 0 = semaine calme. */
  decisions: number;
}

export function buildReviewAgenda(input: {
  today: string;
  /** Différences des 7 derniers jours (pour les ventes de la semaine). */
  weekDiffs: readonly SnapshotDiff[];
  lastRun: PushRun | null;
  insights: readonly PricingInsight[];
  events: readonly LocalEvent[];
  config: EngineConfig;
}): ReviewAgenda {
  const { today, weekDiffs, lastRun, insights, events, config } = input;
  const lines: string[] = [];
  let decisions = 0;

  /* 1. La semaine écoulée. */
  const sold = weekDiffs.flatMap((d) => d.sold);
  lines.push("SEMAINE ÉCOULÉE");
  if (sold.length) {
    const avg = Math.round(sold.reduce((a, s) => a + s.price, 0) / sold.length);
    lines.push(`• ${sold.length} nuit(s) vendue(s), prix affiché moyen ${avg} €`);
    decisions++;
  } else {
    lines.push("• Aucune nuit vendue");
  }
  if (lastRun) {
    const parts = [`issue « ${lastRun.outcome} »`, `mode ${lastRun.mode}`];
    if (lastRun.writes) parts.push(`${lastRun.writes} date(s) à écrire`);
    // `typeof` : un passage enregistré avant l'ajout du champ ne l'a pas du tout.
    if (typeof lastRun.dailyChanges === "number") parts.push(`${lastRun.dailyChanges} cible(s) changée(s) depuis la veille`);
    lines.push(`• Envoi des prix : ${parts.join(", ")}`);
    if (lastRun.quarantined.length) {
      lines.push(`• ${lastRun.quarantined.length} date(s) en quarantaine à valider`);
      decisions++;
    }
    if (lastRun.rejections.length && lastRun.mode === "live") {
      lines.push(`• Envoi rejeté par les garde-fous : grille à corriger`);
      decisions++;
    }
  }

  /* 2. Les points ouverts. */
  if (insights.length) {
    lines.push("", "POINTS OUVERTS");
    for (const i of insights.slice(0, 6)) lines.push(`• ${i.line}`);
    decisions += insights.length;
  }

  /* 3. Les échéances des 21 prochains jours. */
  const horizon = addDays(today, AGENDA_HORIZON_DAYS);
  const due: { date: string; label: string }[] = PRICING_MILESTONES.filter((m) => m.date >= today && m.date <= horizon);
  for (const e of events) {
    if (!config.majorEvents.some((r) => r.keyPrefix === keyPrefix(e.key))) continue;
    const j60 = addDays(e.start, -60);
    if (j60 >= today && j60 <= horizon) due.push({ date: j60, label: `${e.name} à J-60 : trancher le prix si invendu` });
  }
  due.sort((a, b) => a.date.localeCompare(b.date));
  if (due.length) {
    lines.push("", `ÉCHÉANCES (${AGENDA_HORIZON_DAYS} JOURS)`);
    for (const d of due) lines.push(`• ${d.date.slice(8, 10)}/${d.date.slice(5, 7)} (J-${daysBetween(today, d.date)}) : ${d.label}`);
    decisions += due.length;
  }

  /* 4. La phrase à copier. */
  lines.push("", "Pour lancer la séance, copie dans Claude :", REVIEW_PROMPT);

  const title =
    decisions === 0
      ? "Évaluation des prix : semaine calme"
      : `Évaluation des prix avec Claude : ${decisions} point(s) à voir`;
  // ntfy accepte ~4 Ko : on coupe proprement si jamais le corps déborde.
  let body = lines.join("\n");
  if (new TextEncoder().encode(body).length > 3_800) body = `${body.slice(0, 3_500)}\n…\n${REVIEW_PROMPT}`;
  return { title, body, decisions };
}
