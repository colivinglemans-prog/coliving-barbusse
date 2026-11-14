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
  type CleaningSession,
} from "@/lib/cleaning/sessions";
import { loadSessions, upsertSessions } from "@/lib/cleaning/store";

/**
 * Charge utile de la page « Suivi » (admin) : les passages des intervenants suivis (ménage
 * Sophie, dépannage Eric…), **lus dans le magasin persistant** (`lib/cleaning/store.ts`), avec
 * des totaux par personne (heures, coût au taux) et un découpage mensuel pour le graphe.
 *
 * On lit le magasin — et non plus un recalcul en direct — pour que la sortie estimée d'un passage
 * **ne se perde plus** quand son mouvement caméra quitte le cloud (c'est le cron qui l'affine et
 * la grave chaque heure). Amorçage unique par une collecte live si le magasin est encore vide.
 *
 * Admin seulement, revérifié ici (le proxy refuse déjà le viewer par liste blanche). Aucune
 * donnée sensible (identifiants, codes) ne sort : seuls le prénom du libellé, les horodatages et
 * les durées.
 *
 * Variables : `TRACKED_PEOPLE` (« Sophie:ménage,Eric:dépannage »), `CLEANING_RATES`
 * (« Sophie:21 » en €/h), plus les accès des sources (Intratone, Nuki, AJCloud) pour l'amorçage.
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

  // Lecture du magasin persistant : les sorties déjà captées sont conservées.
  let sessions: CleaningSession[] = await loadSessions();

  // Amorçage unique si le magasin est encore vide (avant le 1er passage du cron nouvelle version).
  if (sessions.length === 0) {
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
    const built = buildSessions(newArrivalsSince(mergeArrivals(garage, door), 0), motions, buttons);
    await upsertSessions(built).catch(() => {});
    sessions = built.sort((a, b) => b.arrival.getTime() - a.arrival.getTime());
  }

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
