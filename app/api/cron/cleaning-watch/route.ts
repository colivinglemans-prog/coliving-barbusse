import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { sendNtfy } from "@/lib/ntfy";
import {
  advancePersonalBaseline, buildSessions, coverPersonalVenues, freshPersonalVenues, guestKeypadEntries, mergeArrivals, maxArrivalMs,
  newArrivalsSince, parsePersonalBaseline, personalGarageArrivals, trackedOpenings, trackedPeople,
  type CleaningArrival, type CleaningSession, type GuestKeypadCode, type PersonalBaseline, type PersonalVenue, type TrackedPerson,
} from "@/lib/cleaning/sessions";
import { readGarageOpenings, doorReading, cameraMotions, buttonPresses, guestArrivalDays } from "@/lib/cleaning/sources";
import type { KeypadOpening } from "@/lib/cleaning/intratone";
import { upsertSessions, pruneOldSessions } from "@/lib/cleaning/store";
import { getRedis, hasRedis, redisKey } from "@/lib/redis";
import { beat } from "@/lib/heartbeat";
import { isDryRun } from "@/lib/cron-params";
import { readLogSince, saveLogSince } from "@/lib/nuki-log-cursor";
import { reportAlerts, reportCronRun, type TrackedAlert } from "@/lib/alert-memory";
import { sendCronAlert } from "@/lib/alerts";

/**
 * Suivi des intervenants de la maison : alerte quand une personne suivie arrive (ménage,
 * dépannage…), et journal de leurs passages.
 *
 * Trois sources, chacune facultative (si l'une manque, les autres continuent) :
 *  - **Garage** : ouvertures par code clavier sur le digicode Intratone (codes libellés aux noms suivis).
 *  - **Porte**  : codes Nuki manuels (« # Prénom »…) lus dans le journal de la serrure.
 *  - **Caméra** : derniers mouvements, pour **estimer** l'heure de sortie (le garage ne trace
 *    pas les sorties) — complété par les appuis bouton poussoir.
 *
 * Au premier passage on pose seulement une ligne de base (pas d'alerte rétroactive). Ensuite,
 * chaque nouvelle arrivée (dédoublonnée par personne entre garage et porte) déclenche un ntfy et
 * s'ajoute au journal `barbusse:cleaning:sessions` (avec la fin estimée). Les heures servent à
 * **recouper une facture**, pas à pointer (cf. statut auto-entrepreneur).
 *
 * **Codes perso** (2026-11-18, demande de l'hôte) : une alerte aussi, priorité 2, à l'arrivée de
 * **tout autre code perso** — code nommé du garage, code manuel « # Nom » de la porte —, une par
 * venue, tirée des **mêmes** lectures Intratone et Nuki (`notifyPersonal`). Ligne de base par
 * source `barbusse:cleaning:last-personal` : rien au premier passage, et une source illisible ne
 * fait pas avancer la sienne. Ces venues n'entrent pas dans le journal des intervenants, et leur
 * nom ne part que dans ntfy (ni log, ni réponse, ni journal des notifications : un compteur).
 *
 * Variables : `INTRATONE_USER/PASS`, `INTRATONE_CENTRALE_ID`, `TRACKED_PEOPLE`
 * (« Alice:ménage,Bruno:dépannage »), `NUKI_API_TOKEN/SMARTLOCK_ID`, `AJCLOUD_EMAIL/PASSWORD`,
 * `NTFY_TOPIC`, `CRON_SECRET`. `CLEANING_WATCH_ENABLED=false` le coupe. `?dry=1` calcule sans
 * envoyer ni mémoriser (ni alerter). Cron-job.org, toutes les 10 minutes.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const LAST_KEY = redisKey("cleaning", "last-arrival");
/** Ligne de base des codes perso, par source (`PersonalBaseline`). */
const LAST_PERSONAL_KEY = redisKey("cleaning", "last-personal");
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
    // Une seule lecture du garage : personnes suivies d'un côté, autres codes perso de l'autre.
    let garageOk = true;
    const garageRaw = await readGarageOpenings().catch((e) => {
      garageOk = false;
      notes.garage = short(e);
      return [] as KeypadOpening[];
    });
    const garage = trackedOpenings(garageRaw, people);
    const startedAt = new Date();
    let doorOk = true;
    // Le curseur ne sert qu'à ne rien manquer : une venue doit rester lue tant que sa sortie peut
    // encore progresser (8 h, `estimateExit`), sinon sa sortie se fige trop tôt et une arrivée au
    // garage dans les 45 min devient une seconde session. D'où au moins 10 h de journal.
    const cursor = await readLogSince("cleaning", startedAt);
    const since = new Date(Math.min(cursor.getTime(), startedAt.getTime() - CLEANING_LOOKBACK_MS));
    const { arrivals: door, guestCodes, personal: personalDoor } = await doorReading(people, since).catch((e) => {
      doorOk = false;
      notes.porte = short(e);
      return { arrivals: [] as CleaningArrival[], guestCodes: [] as GuestKeypadCode[], personal: [] as CleaningArrival[] };
    });
    const personal = mergeArrivals(personalGarageArrivals(garageRaw, people), personalDoor);
    // Seuls les codes des voyageurs qui **arrivent** ce jour-là bornent la sortie : un partant qui
    // revient après l'arrivée du ménage ne la tronque plus (2026-11-20). Beds24 illisible : comme un
    // journal illisible, la sortie n'avance pas à ce passage (pas d'alerte : le suivant la précise).
    let arrivalsKnown = true;
    const arrivalDays = await guestArrivalDays(guestCodes).catch((e) => {
      arrivalsKnown = false;
      notes.voyageurs = short(e);
      return new Map<number, string>();
    });
    const guestEntries = guestKeypadEntries(guestCodes, arrivalDays);
    const arrivals = mergeArrivals(garage, door);

    const motions = await cameraMotions().catch((e) => {
      notes.camera = short(e);
      return [] as Date[];
    });
    const buttons = await buttonPresses().catch(() => [] as Date[]);

    // Garage ou porte illisibles : un passage du ménage ne serait ni signalé ni journalisé. Règle
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
    const guestsKnown = (doorOk && arrivalsKnown) || notes.porte === "no-credentials";
    const exitMotions = guestsKnown ? motions : [];
    const exitButtons = guestsKnown ? buttons : [];
    const allSessions = buildSessions(newArrivalsSince(arrivals, 0), exitMotions, exitButtons, guestEntries);
    let upserted = 0;
    if (!dry) {
      upserted = await upsertSessions(allSessions);
      await pruneOldSessions();
    }

    const redis = getRedis();
    // Codes perso : après les alertes des personnes suivies, et sans jamais les faire tomber.
    const runPersonal = () => notifyPersonal(redis, personal, { garage: garageOk, porte: doorOk }, startedAt, dry, notes);
    const stored = await redis.get<number>(LAST_KEY);
    const lastMs = typeof stored === "number" ? stored : Number(stored ?? 0);

    // Premier passage : magasin amorcé ci-dessus, mais pas d'alerte rétroactive.
    if (!stored) {
      const baseline = maxArrivalMs(arrivals, 0);
      if (!dry && baseline > 0) await redis.set(LAST_KEY, baseline);
      if (!dry && doorOk) await saveLogSince("cleaning", startedAt);
      const personalSent = await runPersonal();
      if (!dry) await succeeded();
      return NextResponse.json({ success: sourcesOk, baseline: true, garage: garage.length, porte: door.length, ...personalSent, upserted, notes });
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
    const personalSent = await runPersonal();
    if (!dry) await succeeded();
    return NextResponse.json({
      success: sourcesOk,
      dry,
      people: people.map((p) => p.name),
      garage: garage.length,
      porte: door.length,
      motions: motions.length,
      fresh: fresh.length,
      ...personalSent,
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

/**
 * Alerte d'arrivée des autres codes perso. Une par venue de moins de 3 h (`freshPersonalVenues`),
 * un seul résumé pour les plus anciennes (retour d'une panne longue : pas de rafale). La ligne de
 * base est écrite **après chaque envoi réussi** (`coverPersonalVenues`) : un échec à mi-chemin ne
 * fait rien renvoyer de ce qui est parti. Puis elle avance pour les seules sources lues
 * (`advancePersonalBaseline`). Premier passage : ligne de base posée sans rien envoyer.
 *
 * **Isolée** : une erreur (ntfy, Redis) est notée dans `notes.personal` et le cron continue ; une
 * ligne de base illisible est reposée (sans rafale). Rend des **compteurs**, jamais les noms.
 */
async function notifyPersonal(
  redis: ReturnType<typeof getRedis>,
  arrivals: CleaningArrival[],
  readable: Record<"garage" | "porte", boolean>,
  now: Date,
  dry: boolean,
  notes: Record<string, string>,
): Promise<{ personal: number; personalLate: number }> {
  let sent = 0;
  let late = 0;
  try {
    const parsed = parsePersonalBaseline(await redis.get<unknown>(LAST_PERSONAL_KEY));
    if (parsed === null) notes.personal = "ligne de base illisible, reposée";
    let baseline: PersonalBaseline = parsed ?? {};
    const { recent, stale } = freshPersonalVenues(arrivals, baseline, readable, now);
    if (dry) return { personal: recent.length, personalLate: stale.length };
    if ((recent.length > 0 || stale.length > 0) && !process.env.NTFY_TOPIC) {
      throw new Error("NTFY_TOPIC manquant");
    }
    const save = async (next: PersonalBaseline) => {
      if (JSON.stringify(next) === JSON.stringify(baseline)) return;
      baseline = next;
      await redis.set(LAST_PERSONAL_KEY, baseline);
    };
    if (stale.length > 0) {
      await sendPersonalSummary(stale);
      late = stale.length;
      await save(coverPersonalVenues(baseline, stale, recent));
    }
    for (let i = 0; i < recent.length; i++) {
      await sendPersonalArrival(recent[i][0]);
      sent++;
      await save(coverPersonalVenues(baseline, [recent[i]], recent.slice(i + 1)));
    }
    await save(advancePersonalBaseline(arrivals, baseline, readable, now));
  } catch (e) {
    notes.personal = short(e);
    console.error("[cleaning-watch] codes perso:", short(e));
  }
  return { personal: sent, personalLate: late };
}

const PERSONAL_LOG_TITLE = "Accès maison — code perso";

async function sendPersonalArrival(a: CleaningArrival): Promise<void> {
  const when = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(a.at);
  await sendNtfy(
    `Code « ${a.who} » à ${when} — ${a.source}.`,
    {
      title: `Accès maison — ${a.who}`,
      priority: 2, // une information
      tags: a.source === "garage" ? ["house", "oncoming_automobile"] : ["house", "key"],
    },
    // Le journal des notifications (page « Alertes ») ne garde pas le nom.
    { title: PERSONAL_LOG_TITLE },
  );
}

/** Les venues de plus de 3 h, vues au retour d'une panne : un seul message, sans les noms. */
async function sendPersonalSummary(stale: PersonalVenue[]): Promise<void> {
  const sources = (["garage", "porte"] as const).filter((src) => stale.some((v) => v.some((a) => a.source === src)));
  const n = stale.length;
  await sendNtfy(
    `${n} passage${n > 1 ? "s" : ""} de codes perso pendant la panne (${sources.join("/")}).`,
    { title: "Accès maison — codes perso pendant la panne", priority: 2, tags: ["house"] },
    { title: PERSONAL_LOG_TITLE },
  );
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
