import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { sendNtfy } from "@/lib/ntfy";
import { buildSessions, mergeArrivals, maxArrivalMs, newArrivalsSince, trackedPeople, type CleaningArrival, type CleaningSession, type TrackedPerson } from "@/lib/cleaning/sessions";
import { garageArrivals, doorReading, cameraMotions, buttonPresses } from "@/lib/cleaning/sources";
import { upsertSessions, pruneOldSessions } from "@/lib/cleaning/store";
import { getRedis, hasRedis, redisKey } from "@/lib/redis";
import { beat } from "@/lib/heartbeat";
import { isDryRun } from "@/lib/cron-params";
import { readLogSince, saveLogSince } from "@/lib/nuki-log-cursor";
import { reportAlerts, reportCronRun, type TrackedAlert } from "@/lib/alert-memory";
import { sendCronAlert } from "@/lib/alerts";

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
 * envoyer ni mémoriser (ni alerter). Cron-job.org, toutes les 10 minutes.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LAST_KEY = redisKey("cleaning", "last-arrival");
/** Journal de la porte relu sur 10 h au moins : la fenêtre de sortie (8 h) plus deux passages de marge. */
const CLEANING_LOOKBACK_MS = 10 * 3600_000;

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dry = isDryRun(request.nextUrl.searchParams);
  if (process.env.CLEANING_WATCH_ENABLED === "false") {
    if (!dry) await beat("cleaning-watch", "ok");
    return NextResponse.json({ skipped: "disabled" });
  }
  if (!hasRedis()) {
    return NextResponse.json({ skipped: "no-redis" }, { status: 500 });
  }

  const people = trackedPeople();
  const notes: Record<string, string> = {};

  try {
    const garage = await garageArrivals(people).catch((e) => {
      notes.garage = short(e);
      return [] as CleaningArrival[];
    });
    const startedAt = new Date();
    let doorOk = true;
    // Le curseur ne sert qu'à ne rien manquer : une venue doit rester lue tant que sa sortie peut
    // encore progresser (8 h, `estimateExit`), sinon sa sortie se fige trop tôt et une arrivée au
    // garage dans les 45 min devient une seconde session. D'où au moins 10 h de journal.
    const cursor = await readLogSince("cleaning", startedAt);
    const since = new Date(Math.min(cursor.getTime(), startedAt.getTime() - CLEANING_LOOKBACK_MS));
    const { arrivals: door, guestEntries } = await doorReading(people, since).catch((e) => {
      doorOk = false;
      notes.porte = short(e);
      return { arrivals: [] as CleaningArrival[], guestEntries: [] as Date[] };
    });
    const arrivals = mergeArrivals(garage, door);

    const motions = await cameraMotions().catch((e) => {
      notes.camera = short(e);
      return [] as Date[];
    });
    const buttons = await buttonPresses().catch(() => [] as Date[]);

    // Garage ou porte illisibles : un passage de Sophie ne serait ni signalé ni journalisé. Règle
    // commune (deux passages de suite, jamais répétée, rétabli en 1). Une source sans identifiants
    // (`no-credentials`) est facultative par construction : pas une panne.
    // Garage ou porte en panne : le passage n'a pas vu ce qu'il devait voir, la réponse ne dit pas
    // « succès » (audit du 15/11). HTTP 200 quand même : l'alerte suit la règle commune, un 5xx
    // ferait écrire cron-job.org à l'hôte à chaque passage.
    const sourcesOk = sourceAlerts(notes).length === 0;
    if (!dry) {
      await reportAlerts("cleaning-sources", sourceAlerts(notes), sendCronAlert, {
        title: (c) => (c.length === 1 ? "Suivi ménage : une source illisible" : "Suivi ménage : sources illisibles"),
        intro: "Les passages ne sont plus vus par :",
        recoveredTitle: "Suivi ménage : sources de nouveau lisibles",
        recoveredBody: "Garage et porte répondent de nouveau.",
      }).catch((e) => console.error("[cleaning-watch] alerte sources:", e instanceof Error ? e.message : e));
    }

    // Toutes les venues (dédoublonnées par personne) → sessions avec la meilleure sortie que les
    // mouvements du moment permettent. On les PERSISTE à chaque passage : la sortie se précise et
    // se grave, elle ne se réeffacera plus (corrige la perte constatée sur « Suivi »). Amorce aussi
    // le magasin dès le 1er passage pour que la page montre tout l'historique.
    // Journal de la porte illisible : les entrées des voyageurs manquent, la sortie ne serait plus
    // bornée par leur arrivée et se graverait trop tard. Ce passage enregistre les venues sans
    // faire avancer leur sortie ; le suivant, journal lu, la précise.
    // Sans identifiants Nuki, la porte n'est pas suivie du tout : rien à attendre, sortie libre.
    const guestsKnown = doorOk || notes.porte === "no-credentials";
    const exitMotions = guestsKnown ? motions : [];
    const exitButtons = guestsKnown ? buttons : [];
    const allSessions = buildSessions(newArrivalsSince(arrivals, 0), exitMotions, exitButtons, guestEntries);
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
      if (!dry && doorOk) await saveLogSince("cleaning", startedAt);
      if (!dry) await succeeded();
      return NextResponse.json({ success: sourcesOk, baseline: true, garage: garage.length, porte: door.length, upserted, notes });
    }

    const fresh = newArrivalsSince(arrivals, lastMs);
    const freshSessions = buildSessions(fresh, exitMotions, exitButtons, guestEntries);

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

    if (!dry && doorOk) await saveLogSince("cleaning", startedAt);
    if (!dry) await succeeded();
    return NextResponse.json({
      success: sourcesOk,
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
  } catch (error) {
    // Redis (magasin, ligne de base) ou ntfy en panne : plus d'exception non rattrapée. Erreur
    // suivie par la règle commune ; un passage raté ne perd rien (la ligne de base n'a pas bougé).
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[cleaning-watch]", message);
    if (!dry) {
      await beat("cleaning-watch", "error");
      await reportCronRun("cleaning-watch", LABEL, sendCronAlert, message.slice(0, 160)).catch(() => {});
    }
    return NextResponse.json({ error: "Suivi ménage momentanément impossible." }, { status: 500 });
  }
}

const LABEL = "Suivi ménage";

async function succeeded(): Promise<void> {
  await beat("cleaning-watch", "ok");
  await reportCronRun("cleaning-watch", LABEL, sendCronAlert, null).catch(() => {});
}

/** Les sources en panne (hors `no-credentials`), en constats stables pour `reportAlerts`. */
function sourceAlerts(notes: Record<string, string>): TrackedAlert[] {
  const out: TrackedAlert[] = [];
  for (const [id, label] of [["garage", "le digicode du garage (Intratone)"], ["porte", "le journal de la serrure (Nuki)"]] as const) {
    const note = notes[id];
    if (note && note !== "no-credentials") out.push({ id, priority: 3, line: `  - ${label} : ${note}` });
  }
  return out;
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
