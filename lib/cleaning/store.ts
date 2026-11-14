import { getRedis, redisKey } from "@/lib/redis";
import type { ArrivalSource, CleaningSession } from "@/lib/cleaning/sessions";

/**
 * Magasin **persistant** des passages (ménage, dépannage), dans un hash Redis
 * `barbusse:cleaning:log` — champ = `"<who>:<arrivalEpochMs>"`, valeur = JSON.
 *
 * Pourquoi : la page « Suivi » recalculait la sortie en direct à partir des mouvements caméra, or
 * `alarms-survey` ne renvoie que le récent. Dès qu'un mouvement vieillissait, la sortie estimée
 * qu'il permettait était **perdue** (le passage du 11/11 avait sa sortie, puis ne l'avait plus).
 *
 * Principe : **une sortie estimée, une fois captée, est gravée et ne peut que s'améliorer**. Le
 * cron rafraîchit le magasin chaque heure (il ne fait que préciser la sortie, jamais la réeffacer),
 * et le dashboard **lit le magasin** au lieu de recalculer. L'arrivée est la clé stable.
 */

const LOG_KEY = redisKey("cleaning", "log");
/** Au-delà, on purge (données minuscules ; 18 mois couvrent large). */
const MAX_AGE_MS = 18 * 30 * 24 * 60 * 60 * 1000;

interface StoredSession {
  who: string;
  arrival: string; // ISO
  exit: string | null; // ISO
  by: CleaningSession["exitBy"];
  source: ArrivalSource;
}

/** Clé stable d'une session : l'arrivée (à la minute près, les sources partagent l'instant). */
export function sessionKey(who: string, arrival: Date): string {
  return `${who}:${arrival.getTime()}`;
}

function fromStored(v: StoredSession): CleaningSession {
  const arrival = new Date(v.arrival);
  const exit = v.exit ? new Date(v.exit) : null;
  return {
    who: v.who,
    arrival,
    exitEstimate: exit,
    exitBy: v.by,
    arrivalSource: v.source,
    minutes: exit ? Math.round((exit.getTime() - arrival.getTime()) / 60000) : null,
  };
}

/** Upstash désérialise parfois seul le JSON : on accepte l'objet comme la chaîne. */
function parse(value: unknown): StoredSession | null {
  if (value == null) return null;
  if (typeof value === "object") return value as StoredSession;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as StoredSession;
    } catch {
      return null;
    }
  }
  return null;
}

/** Toutes les sessions mémorisées, de la plus récente à la plus ancienne. */
export async function loadSessions(): Promise<CleaningSession[]> {
  const raw = await getRedis().hgetall<Record<string, unknown>>(LOG_KEY);
  if (!raw) return [];
  const out: CleaningSession[] = [];
  for (const value of Object.values(raw)) {
    const s = parse(value);
    if (s) out.push(fromStored(s));
  }
  return out.sort((a, b) => b.arrival.getTime() - a.arrival.getTime());
}

/**
 * Insère ou met à jour des sessions. Règle d'or : on conserve l'arrivée (clé) et on ne met la
 * sortie que si elle **progresse** — nouvelle sortie plus tardive que l'ancienne, ou première
 * sortie connue. **Jamais** on ne remplace une sortie connue par `null`. Rend le nombre de champs
 * réellement écrits.
 */
export async function upsertSessions(incoming: CleaningSession[]): Promise<number> {
  if (incoming.length === 0) return 0;
  const redis = getRedis();
  const existing = (await redis.hgetall<Record<string, unknown>>(LOG_KEY)) ?? {};
  const updates: Record<string, string> = {};

  for (const s of incoming) {
    const key = sessionKey(s.who, s.arrival);
    const prev = parse(existing[key]);
    const prevExit = prev?.exit ? new Date(prev.exit).getTime() : null;
    const newExit = s.exitEstimate ? s.exitEstimate.getTime() : null;

    // Sortie retenue : la plus tardive connue (monotone), jamais un retour à null.
    let exit = prevExit;
    let by = prev?.by ?? s.exitBy;
    if (newExit !== null && (prevExit === null || newExit > prevExit)) {
      exit = newExit;
      by = s.exitBy;
    }

    const merged: StoredSession = {
      who: s.who,
      arrival: s.arrival.toISOString(),
      exit: exit !== null ? new Date(exit).toISOString() : null,
      by,
      source: prev?.source ?? s.arrivalSource,
    };

    // N'écrit que si c'est nouveau ou si la sortie a changé.
    if (!prev || prev.exit !== merged.exit) {
      updates[key] = JSON.stringify(merged);
    }
  }

  if (Object.keys(updates).length > 0) {
    await redis.hset(LOG_KEY, updates);
  }
  return Object.keys(updates).length;
}

/** Supprime les sessions dont l'arrivée dépasse 18 mois. Rend le nombre de champs retirés. */
export async function pruneOldSessions(now = Date.now()): Promise<number> {
  const redis = getRedis();
  const raw = (await redis.hgetall<Record<string, unknown>>(LOG_KEY)) ?? {};
  const stale: string[] = [];
  for (const [key, value] of Object.entries(raw)) {
    const s = parse(value);
    if (s && now - new Date(s.arrival).getTime() > MAX_AGE_MS) stale.push(key);
  }
  if (stale.length > 0) await redis.hdel(LOG_KEY, ...stale);
  return stale.length;
}
