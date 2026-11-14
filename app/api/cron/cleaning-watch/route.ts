import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { sendNtfy } from "@/lib/ntfy";
import { buildSessions, mergeArrivals, maxArrivalMs, newArrivalsSince, parsePeople, type CleaningArrival, type CleaningSession, type TrackedPerson } from "@/lib/cleaning/sessions";
import { garageArrivals, doorArrivals, cameraMotions, buttonPresses } from "@/lib/cleaning/sources";
import { upsertSessions, pruneOldSessions } from "@/lib/cleaning/store";
import { getRedis, hasRedis, redisKey } from "@/lib/redis";

/**
 * Suivi des intervenants de la maison : alerte quand une personne suivie arrive (ménage Sophie,
 * dépannage Eric…), et journal de leurs passages.
 *
 * Trois sources, chacune facultative (si l'une manque, les autres continuent) :
 *  - **Garage** : ouvertures par code clavier sur le digicode Intratone (codes libellés aux noms suivis).
 *  - **Porte**  : codes Nuki manuels (« # Sophie »…) lus dans le journal de la serrure.
 *  - **Caméra** : derniers mouvements, pour **estimer** l'heure de sortie (le garage ne trace
 *    pas les sorties) — complété par les appuis bouton poussoir.
 *
 * Au premier passage on pose seulement une ligne de base (pas d'alerte rétroactive). Ensuite,
 * chaque nouvelle arrivée (dédoublonnée par personne entre garage et porte) déclenche un ntfy et
 * s'ajoute au journal `barbusse:cleaning:sessions` (avec la fin estimée). Les heures servent à
 * **recouper une facture**, pas à pointer (cf. statut auto-entrepreneur).
 *
 * Variables : `INTRATONE_USER/PASS`, `INTRATONE_CENTRALE_ID`, `TRACKED_PEOPLE`
 * (« Sophie:ménage,Eric:dépannage »), `NUKI_API_TOKEN/SMARTLOCK_ID`, `AJCLOUD_EMAIL/PASSWORD`,
 * `NTFY_TOPIC`, `CRON_SECRET`. `CLEANING_WATCH_ENABLED=false` le coupe. `?dry=1` calcule sans
 * envoyer ni mémoriser. Cron-job.org, toutes les heures.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LAST_KEY = redisKey("cleaning", "last-arrival");
const DEFAULT_PEOPLE = "Sophie:ménage,Eric:dépannage";

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (process.env.CLEANING_WATCH_ENABLED === "false") {
    return NextResponse.json({ skipped: "disabled" });
  }
  if (!hasRedis()) {
    return NextResponse.json({ skipped: "no-redis" }, { status: 500 });
  }

  const dry = request.nextUrl.searchParams.get("dry") === "1";
  const people = parsePeople(process.env.TRACKED_PEOPLE?.trim() || DEFAULT_PEOPLE);
  const notes: Record<string, string> = {};

  const garage = await garageArrivals(people).catch((e) => {
    notes.garage = short(e);
    return [] as CleaningArrival[];
  });
  const door = await doorArrivals(people).catch((e) => {
    notes.porte = short(e);
    return [] as CleaningArrival[];
  });
  const arrivals = mergeArrivals(garage, door);

  const motions = await cameraMotions().catch((e) => {
    notes.camera = short(e);
    return [] as Date[];
  });
  const buttons = await buttonPresses().catch(() => [] as Date[]);

  // Toutes les venues (dédoublonnées par personne) → sessions avec la meilleure sortie que les
  // mouvements du moment permettent. On les PERSISTE à chaque passage : la sortie se précise et
  // se grave, elle ne se réeffacera plus (corrige la perte constatée sur « Suivi »). Amorce aussi
  // le magasin dès le 1er passage pour que la page montre tout l'historique.
  const allSessions = buildSessions(newArrivalsSince(arrivals, 0), motions, buttons);
  let upserted = 0;
  if (!dry) {
    upserted = await upsertSessions(allSessions);
    await pruneOldSessions();
  }

  const redis = getRedis();
  const stored = await redis.get<number>(LAST_KEY);
  const lastMs = typeof stored === "number" ? stored : Number(stored ?? 0);

  // Premier passage : magasin amorcé ci-dessus, mais pas d'alerte rétroactive.
  if (!stored) {
    const baseline = maxArrivalMs(arrivals, 0);
    if (!dry && baseline > 0) await redis.set(LAST_KEY, baseline);
    return NextResponse.json({ success: true, baseline: true, garage: garage.length, porte: door.length, upserted, notes });
  }

  const fresh = newArrivalsSince(arrivals, lastMs);
  const freshSessions = buildSessions(fresh, motions, buttons);

  if (fresh.length > 0 && !dry && !process.env.NTFY_TOPIC) {
    return NextResponse.json(
      { error: "NTFY_TOPIC is not set: an arrival cannot be delivered" },
      { status: 500 },
    );
  }

  for (const s of freshSessions) {
    if (!dry) await sendArrival(s, roleOf(s.who, people));
  }
  if (!dry && fresh.length > 0) {
    await redis.set(LAST_KEY, maxArrivalMs(arrivals, lastMs));
  }

  return NextResponse.json({
    success: true,
    dry,
    people: people.map((p) => p.name),
    garage: garage.length,
    porte: door.length,
    motions: motions.length,
    fresh: fresh.length,
    upserted,
    sessions: freshSessions.map(serializeSession),
    notes,
  });
}

function roleOf(who: string, people: TrackedPerson[]): string {
  return people.find((p) => p.name === who)?.role ?? "intervenant";
}

async function sendArrival(s: CleaningSession, role: string): Promise<void> {
  const when = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "2-digit",
    minute: "2-digit",
  }).format(s.arrival);
  await sendNtfy(`Passage de ${s.who} (${role}) à ${when} — ${s.arrivalSource}.`, {
    title: `Accès maison — ${s.who}`,
    priority: 2, // une information (2026-11-14)
    tags: s.arrivalSource === "garage" ? ["house", "oncoming_automobile"] : ["house", "key"],
  });
}

function serializeSession(s: CleaningSession) {
  return {
    who: s.who,
    arrival: s.arrival.toISOString(),
    exit: s.exitEstimate?.toISOString() ?? null,
    by: s.exitBy,
    source: s.arrivalSource,
    minutes: s.minutes,
  };
}

function short(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.slice(0, 80);
}
