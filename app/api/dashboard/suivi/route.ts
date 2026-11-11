import { NextResponse, type NextRequest } from "next/server";
import { guard } from "@/lib/auth";
import { garageArrivals, doorArrivals, cameraMotions, buttonPresses } from "@/lib/cleaning/sources";
import {
  buildSessions,
  mergeArrivals,
  monthlyBuckets,
  newArrivalsSince,
  parsePeople,
  parseRates,
  summarizePeople,
  type CleaningArrival,
} from "@/lib/cleaning/sessions";

/**
 * Charge utile de la page « Suivi » (admin) : les passages des intervenants suivis (ménage
 * Sophie, dépannage Eric…) reconstitués en direct depuis le garage (Intratone) et la porte
 * (Nuki), avec une fin de visite **estimée** par la caméra, des totaux par personne (heures,
 * coût au taux) et un découpage mensuel pour le graphe.
 *
 * Admin seulement, revérifié ici (le proxy refuse déjà le viewer par liste blanche). Chaque
 * source est facultative : si l'une échoue, les autres s'affichent et l'échec est signalé en
 * `notes`, jamais un tableau vide silencieux. Aucune donnée sensible (identifiants, codes) ne
 * sort : seuls le prénom du libellé, les horodatages et les durées.
 *
 * Variables : `TRACKED_PEOPLE` (« Sophie:ménage,Eric:dépannage »), `CLEANING_RATES`
 * (« Sophie:21 » en €/h), plus les accès des sources (Intratone, Nuki, AJCloud).
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DEFAULT_PEOPLE = "Sophie:ménage,Eric:dépannage";
const DEFAULT_RATES = "Sophie:21";

export async function GET(request: NextRequest) {
  const refus = await guard.denyNonAdmin(request);
  if (refus) return refus;

  const people = parsePeople(process.env.TRACKED_PEOPLE?.trim() || DEFAULT_PEOPLE);
  const rates = parseRates(process.env.CLEANING_RATES?.trim() || DEFAULT_RATES);
  const notes: Record<string, string> = {};

  const garage = await garageArrivals(people).catch((e) => {
    notes.garage = short(e);
    return [] as CleaningArrival[];
  });
  const door = await doorArrivals(people).catch((e) => {
    notes.porte = short(e);
    return [] as CleaningArrival[];
  });
  const motions = await cameraMotions().catch((e) => {
    notes.camera = short(e);
    return [] as Date[];
  });
  const buttons = await buttonPresses().catch(() => [] as Date[]);

  // Dédoublonnage par personne (garage + porte d'une même venue, ou passages rapprochés).
  const deduped = newArrivalsSince(mergeArrivals(garage, door), 0);
  const sessions = buildSessions(deduped, motions, buttons);
  sessions.sort((a, b) => b.arrival.getTime() - a.arrival.getTime());

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    people,
    rates,
    summaries: summarizePeople(sessions, people, rates),
    monthly: monthlyBuckets(sessions),
    sessions: sessions.map((s) => ({
      who: s.who,
      arrival: s.arrival.toISOString(),
      exit: s.exitEstimate?.toISOString() ?? null,
      by: s.exitBy,
      source: s.arrivalSource,
      minutes: s.minutes,
    })),
    notes,
  });
}

function short(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.slice(0, 80);
}
