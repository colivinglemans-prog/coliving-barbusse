import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { listLog } from "@sejour/socle/lib/nuki";
import { sendNtfy } from "@sejour/socle/lib/ntfy";
import { nukiConfig } from "@/lib/access-sync";
import { AjCloud } from "@/lib/camera/ajcloud";
import { Intratone } from "@/lib/cleaning/intratone";
import {
  buildSessions,
  mergeArrivals,
  matchPerson,
  maxArrivalMs,
  newArrivalsSince,
  parsePeople,
  trackedOpenings,
  type CleaningArrival,
  type CleaningSession,
  type TrackedPerson,
} from "@/lib/cleaning/sessions";
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
const SESSIONS_KEY = redisKey("cleaning", "sessions");
const SESSIONS_MAX = 400;
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

  const redis = getRedis();
  const stored = await redis.get<number>(LAST_KEY);
  const lastMs = typeof stored === "number" ? stored : Number(stored ?? 0);

  // Premier passage : ligne de base sans alerte.
  if (!stored) {
    const baseline = maxArrivalMs(arrivals, 0);
    if (!dry && baseline > 0) await redis.set(LAST_KEY, baseline);
    return NextResponse.json({ success: true, baseline: true, garage: garage.length, porte: door.length, notes });
  }

  const fresh = newArrivalsSince(arrivals, lastMs);
  const sessions = buildSessions(fresh, motions, buttons);

  if (fresh.length > 0 && !dry && !process.env.NTFY_TOPIC) {
    return NextResponse.json(
      { error: "NTFY_TOPIC is not set: an arrival cannot be delivered" },
      { status: 500 },
    );
  }

  for (const s of sessions) {
    if (!dry) {
      await sendArrival(s, roleOf(s.who, people));
      await redis.lpush(SESSIONS_KEY, JSON.stringify(serializeSession(s)));
    }
  }
  if (!dry && fresh.length > 0) {
    await redis.ltrim(SESSIONS_KEY, 0, SESSIONS_MAX - 1);
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
    sessions: sessions.map(serializeSession),
    notes,
  });
}

async function garageArrivals(people: TrackedPerson[]): Promise<CleaningArrival[]> {
  const client = intratoneClient();
  if (!client) throw new Error("no-credentials");
  await client.login();
  return trackedOpenings(await client.keypadOpenings(), people);
}

async function doorArrivals(people: TrackedPerson[]): Promise<CleaningArrival[]> {
  if (!process.env.NUKI_API_TOKEN || !process.env.NUKI_SMARTLOCK_ID) throw new Error("no-credentials");
  const log = await listLog(nukiConfig(), 100);
  const out: CleaningArrival[] = [];
  for (const e of log) {
    if (e.trigger !== 255 || e.state !== 0) continue;
    const who = matchPerson(e.name ?? "", people);
    if (who) out.push({ source: "porte", at: new Date(e.date), who });
  }
  return out;
}

/** Instants des mouvements de toutes les caméras (pour estimer la sortie). */
async function cameraMotions(): Promise<Date[]> {
  const email = process.env.AJCLOUD_EMAIL;
  const password = process.env.AJCLOUD_PASSWORD;
  if (!email || !password) throw new Error("no-credentials");
  const client = new AjCloud({ email, password, region: "eu" });
  await client.login();
  const devices = await client.devices();
  const out: Date[] = [];
  for (const d of devices) {
    if (!d.emcUrl) continue;
    for (const a of await client.alarmsSurvey(d)) out.push(new Date(Number(a.cts)));
  }
  return out;
}

async function buttonPresses(): Promise<Date[]> {
  const client = intratoneClient();
  if (!client) return [];
  await client.login();
  return client.buttonPresses();
}

function intratoneClient(): Intratone | null {
  const user = process.env.INTRATONE_USER;
  const password = process.env.INTRATONE_PASS;
  const centraleId = process.env.INTRATONE_CENTRALE_ID?.trim();
  if (!user || !password || !centraleId) return null;
  return new Intratone({ user, password, centraleId });
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
    priority: 3,
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
