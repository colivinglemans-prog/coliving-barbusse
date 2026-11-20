import { getLockHealth, listLogSince } from "@sejour/socle/lib/nuki";
import { countsAsSold } from "@sejour/socle/lib/booking-status";
import { addDays } from "@sejour/socle/lib/dates";
import { parisInstant } from "@sejour/socle/lib/time";
import { nukiConfig } from "./access-sync";
import { sendDoorAlert, sendHeatingAlert } from "./alerts";
import { getBookingMessages } from "./beds24";
import { trackedPeople } from "./cleaning/sessions";
import {
  EMPTY_PASSES,
  LOCK_STATE_LOCKED,
  LOCK_STATES_TRANSIENT,
  departureDeadlineHour,
  departureLockDueAt,
  departureMessage,
  departureTransition,
  frenchClock,
  housePresence,
  initialDepartureState,
  lockFacts,
  presenceFromReading,
  type DepartureLockResult,
  type DepartureState,
  type LockEvent,
  type LockFacts,
  type RadiatorPresence,
} from "./departure-detection";
import type { DepartureStay } from "./departure-lock";
import type { RadiatorReading } from "./radiator-load";
import { getJson, getRedis, redisKey, setJson } from "./redis";
import { STANDARD_HOURS } from "./stay-hours-rules";

/**
 * Détection du départ, **phase B : observation** (2026-11-20). La règle est pure, dans
 * `lib/departure-detection.ts` ; ici, les lectures, l'état par réservation, le journal et les
 * notifications. Appelé par `heating-automation` à chaque passage, **après** que les modes ont été
 * posés : rien de ce qui est calculé ici ne remonte vers le chauffage.
 *
 * - **Quand** : le jour d'un départ (séjour vendu), de 5 h jusqu'à l'heure de départ + 30 min. Ensuite
 *   le relevé de la porte (`lib/departure-lock.ts`) prend le relais, et son résultat est reporté sur
 *   l'état (`recordDoorCheck`) **sans nouvelle lecture** : les deux fenêtres ne se chevauchent pas,
 *   la serrure n'est jamais lue deux fois au même passage.
 * - **Lectures par passage** : les radiateurs déjà lus par le passage (aucune lecture Heatzy de
 *   plus) ; l'état de la serrure (1 appel Nuki) ; le journal (1 appel Nuki) seulement si la porte est
 *   verrouillée ou qu'un départ est déjà constaté (pour voir un retour) ; le fil de messages
 *   Beds24 (1 appel par réservation qui part) **un passage sur deux au plus**, jamais une fois le
 *   départ constaté ni le message reçu.
 * - **État** : `barbusse:departure:<id>` (7 jours), lu par `/api/dashboard/stay-status`.
 * - **Journal** : `barbusse:departure-journal:<jour>` (liste, 14 jours), une entrée par passage :
 *   présence par radiateur avec son palier, serrure, événements (catégorie du code, jamais son
 *   nom), message reçu (heure seulement, jamais le texte). Relu par
 *   `node scripts/departure-journal.mjs <jour>`.
 * - **Notifications** (ntfy, priorité 2, une seule fois par réservation, `SET NX`) : « Départ
 *   estimé à 8 h 42 (observation : chauffage non modifié) » ; « message de départ reçu, porte non
 *   verrouillée ». Serrure ou radiateurs illisibles : rien.
 * - **Interrupteur** `DEPARTURE_DETECTION=observe|live|off` (défaut `observe`).
 * - Ne lève jamais.
 */

export type DepartureDetectionMode = "observe" | "live" | "off";

/** `DEPARTURE_DETECTION` : `off` coupe tout, `live` n'est pas encore codé (vaut `observe`). */
export function departureDetectionMode(raw: string | undefined = process.env.DEPARTURE_DETECTION): DepartureDetectionMode {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "off" || v === "live" ? v : "observe";
}

/** Début de l'observation le jour du départ (heure de Paris). */
export const OBSERVE_FROM_HOUR = 5;
/** Le fil de messages n'est relu qu'au bout de ce délai : un passage sur deux au plus. */
export const MESSAGE_RECHECK_MINUTES = 25;
const READ_TIMEOUT_MS = 10_000;
const MESSAGE_TIMEOUT_MS = 8_000;
const STATE_TTL_SECONDS = 7 * 24 * 3600;
const JOURNAL_TTL_SECONDS = 14 * 24 * 3600;
/** Le journal remonte à la veille au soir : un départ de 6 h, ou un verrouillage de 23 h 30. */
const LOG_FROM_PREVIOUS_DAY_HOUR = 18;
const JOURNAL_EVENTS_MAX = 20;

export const departureStateKey = (bookingId: number) => redisKey("departure", bookingId);
export const departureJournalKey = (day: string) => redisKey("departure-journal", day);
const notifiedKey = (bookingId: number, kind: string) => redisKey("departure-notified", bookingId, kind);

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} : délai de ${ms / 1000} s dépassé`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export interface DepartureObservationInput {
  /** Réservations du passage, horaires convenus joints (`withStayHours`). */
  bookings: readonly DepartureStay[];
  today: string;
  now: Date;
  /** Lectures des radiateurs déjà faites par le passage ; `null` si illisibles. */
  readings: readonly RadiatorReading[] | null;
  /** Radiateurs verrouillés (hors automatisation) et tenus hors des alertes (Véranda D). */
  lockedDids: ReadonlySet<string>;
  ignoredDids: ReadonlySet<string>;
}

export interface JournalEntry {
  at: string;
  mode: DepartureDetectionMode;
  bookings: Array<{ id: number; status: DepartureState["status"]; absentPasses: number; by?: string; departedAt?: string }>;
  presence: { readable: boolean; present: boolean; radiators: RadiatorPresence[] } | null;
  lock: { online: boolean; lockState: number | null } | null;
  /** `null` : journal non lu (porte non verrouillée) ou illisible. */
  events: LockEvent[] | null;
  /** Par réservation : « reçu à 9 h 05 », « aucun », « non relu », « illisible ». */
  messages: Record<string, string>;
  notified: string[];
}

export interface DepartureObservationResult {
  mode: DepartureDetectionMode;
  detail: string;
  bookings: Array<{ id: number; status: DepartureState["status"] }>;
}

/** Séjours vendus qui partent aujourd'hui, avec leur heure de départ (11 h ou convenue). */
function departuresOf(bookings: readonly DepartureStay[], today: string) {
  return bookings
    .filter((b) => (b.status === undefined || countsAsSold(b.status)) && b.departure === today)
    .map((b) => ({ bookingId: b.id, departureHour: b.departureHour ?? STANDARD_HOURS.departure }));
}

/** Pose la marque « déjà notifié » ; `false` si elle l'était (ou Redis illisible : on se tait). */
async function claim(bookingId: number, kind: string): Promise<boolean> {
  try {
    return (await getRedis().set(notifiedKey(bookingId, kind), "1", { nx: true, ex: STATE_TTL_SECONDS })) === "OK";
  } catch {
    return false;
  }
}

async function release(bookingId: number, kind: string): Promise<void> {
  await getRedis()
    .del(notifiedKey(bookingId, kind))
    .catch(() => {});
}

/**
 * Un passage d'observation. Rend `null` hors de la fenêtre (pas de départ, avant 5 h, ou relevé
 * de la porte déjà en charge) ou interrupteur sur `off`.
 */
export async function runDepartureObservation(input: DepartureObservationInput): Promise<DepartureObservationResult | null> {
  const mode = departureDetectionMode();
  if (mode === "off") return null;
  try {
    return await observe(input, mode);
  } catch (e) {
    console.error("[departure-observation]", errorText(e));
    return { mode, detail: `erreur : ${errorText(e)}`, bookings: [] };
  }
}

async function observe(input: DepartureObservationInput, mode: DepartureDetectionMode): Promise<DepartureObservationResult | null> {
  const { today, now } = input;
  const departures = departuresOf(input.bookings, today);
  const departureHour = departureDeadlineHour(departures);
  if (departureHour === null) return null;
  if (now.getTime() < parisInstant(today, OBSERVE_FROM_HOUR).getTime()) return null;
  if (now.getTime() >= departureLockDueAt(today, departureHour).getTime()) return null;
  if (mode === "live") {
    // TODO phase C : en `live`, garder la maison « occupée » (mode présence) jusqu'au départ
    // constaté ou à la butoir (heure de départ − 15 min), et le faire lire par `heating-reset`,
    // le dashboard et `heating-probe`. Tant que ce n'est pas codé, `live` se comporte comme
    // `observe` : le chauffage ne change pas.
    console.warn("[departure-observation] DEPARTURE_DETECTION=live pas encore codé : observation seule");
  }

  const ids = departures.map((d) => d.bookingId);
  let previous: Array<DepartureState | null>;
  try {
    previous = await Promise.all(ids.map((id) => getJson<DepartureState>(departureStateKey(id))));
  } catch (e) {
    return { mode, detail: `état Redis illisible (${errorText(e)}) : passage sauté`, bookings: [] };
  }

  // ─── Présence : les lectures déjà faites par le passage ───
  const presence = input.readings
    ? housePresence(
        input.readings.map((r) =>
          presenceFromReading(r, { locked: input.lockedDids.has(r.did), ignored: input.ignoredDids.has(r.did) }),
        ),
      )
    : null;

  // ─── Serrure : l'état, puis le journal si la porte est verrouillée ou un départ déjà constaté ───
  let lock: JournalEntry["lock"] = null;
  let facts: LockFacts | null = null;
  try {
    const cfg = nukiConfig();
    const health = await withTimeout(getLockHealth(cfg), READ_TIMEOUT_MS, "état de la serrure");
    lock = { online: health.online, lockState: health.lockState };
    const state = health.lockState;
    const constated = previous.some((p) => p?.day === today && p.status === "empty");
    if (health.online && state !== null && !LOCK_STATES_TRANSIENT.has(state) && (state === LOCK_STATE_LOCKED || constated)) {
      const since = parisInstant(addDays(today, -1), LOG_FROM_PREVIOUS_DAY_HOUR);
      try {
        const log = await withTimeout(listLogSince(cfg, since), READ_TIMEOUT_MS, "journal de la serrure");
        facts = lockFacts(log, since, {
          departingIds: ids,
          arrivingIds: input.bookings.filter((b) => b.arrival === today).map((b) => b.id),
          people: trackedPeople().map((p) => p.name),
        });
      } catch (e) {
        console.error("[departure-observation] journal illisible :", errorText(e));
      }
    }
  } catch (e) {
    console.error("[departure-observation] serrure illisible :", errorText(e));
  }
  const lockState = lock && lock.online ? lock.lockState : null;

  // ─── Message de départ : un passage sur deux, jamais une fois constaté ou reçu ───
  const messages: Record<string, string> = {};
  const found = new Map<number, { at: string }>();
  const checked = new Set<number>();
  await Promise.all(
    ids.map(async (id, i) => {
      const p = previous[i]?.day === today ? previous[i] : null;
      if (p?.messageAt) {
        messages[id] = `reçu à ${frenchClock(p.messageAt)}`;
        return;
      }
      if (p?.status === "empty") {
        messages[id] = "non relu (départ constaté)";
        return;
      }
      if (p?.messageCheckedAt && now.getTime() - Date.parse(p.messageCheckedAt) < MESSAGE_RECHECK_MINUTES * 60_000) {
        messages[id] = "non relu (un passage sur deux)";
        return;
      }
      try {
        const thread = await withTimeout(getBookingMessages(id), MESSAGE_TIMEOUT_MS, "messages Beds24");
        checked.add(id);
        const m = departureMessage(thread, parisInstant(today, 0));
        if (m) found.set(id, m);
        messages[id] = m ? `reçu à ${frenchClock(m.at)}` : "aucun";
      } catch (e) {
        messages[id] = "illisible";
        console.error("[departure-observation] messages illisibles :", errorText(e));
      }
    }),
  );

  // ─── Transitions, état, notifications ───
  const notified: string[] = [];
  const summary: DepartureObservationResult["bookings"] = [];
  const journalBookings: JournalEntry["bookings"] = [];
  for (const [i, id] of ids.entries()) {
    const t = departureTransition(
      previous[i],
      {
        presence: presence ? { readable: presence.readable, present: presence.present } : null,
        lockState,
        lock: facts,
        message: found.get(id) ?? null,
      },
      now,
      today,
    );
    if (checked.has(id)) t.state.messageCheckedAt = now.toISOString();
    try {
      await setJson(departureStateKey(id), t.state, STATE_TTL_SECONDS);
    } catch (e) {
      // Sans état écrit, pas de notification : elle repartirait au passage suivant.
      console.error("[departure-observation] état non écrit :", errorText(e));
      t.notify.length = 0;
    }
    for (const kind of t.notify) {
      if (!(await claim(id, kind))) continue;
      try {
        if (kind === "departed") {
          const proof =
            t.state.by === "message" && t.state.messageAt
              ? `message de départ du voyageur reçu à ${frenchClock(t.state.messageAt)}, porte verrouillée`
              : `porte verrouillée, plus de présence sur ${EMPTY_PASSES} relevés`;
          await sendHeatingAlert(
            "Départ estimé",
            `Départ estimé à ${frenchClock(t.state.departedAt!)} (observation : chauffage non modifié).\nConstat : ${proof}.`,
            2,
          );
        } else {
          await sendDoorAlert(
            "Message de départ, porte non verrouillée",
            `Le voyageur a écrit à ${frenchClock(t.state.messageAt!)} qu'il est parti, mais la porte d'entrée n'est pas verrouillée.`,
            2,
          );
        }
        notified.push(kind);
      } catch (e) {
        console.error("[departure-observation] notification :", errorText(e));
        await release(id, kind);
      }
    }
    summary.push({ id, status: t.state.status });
    journalBookings.push({
      id,
      status: t.state.status,
      absentPasses: t.state.absentPasses,
      ...(t.state.by ? { by: t.state.by } : {}),
      ...(t.state.departedAt ? { departedAt: t.state.departedAt } : {}),
    });
  }

  const entry: JournalEntry = {
    at: now.toISOString(),
    mode,
    bookings: journalBookings,
    presence,
    lock,
    events: facts ? facts.events.slice(-JOURNAL_EVENTS_MAX) : null,
    messages,
    notified,
  };
  try {
    const key = departureJournalKey(today);
    await getRedis().rpush(key, JSON.stringify(entry));
    await getRedis().expire(key, JOURNAL_TTL_SECONDS);
  } catch (e) {
    console.error("[departure-observation] journal non écrit :", errorText(e));
  }

  const lockText = lock === null ? "serrure illisible" : !lock.online ? "serrure hors ligne" : `serrure ${lock.lockState === LOCK_STATE_LOCKED ? "verrouillée" : `état ${lock.lockState}`}`;
  const presenceText = presence === null ? "radiateurs illisibles" : !presence.readable ? "présence illisible" : presence.present ? "présence" : "aucune présence";
  return {
    mode,
    detail: `${summary.map((s) => s.status).join(", ")} — ${lockText}, ${presenceText}`,
    bookings: summary,
  };
}

/**
 * Reporte sur l'état des départs du jour le relevé de la porte d'après l'heure de départ
 * (`runDepartureLockCheck`), **sans nouvelle lecture** : verrouillée, non verrouillée, ou maison
 * reprise en main. C'est ce qui allume l'icône rouge « partis sans verrouiller ». Ne lève jamais.
 */
export async function recordDoorCheck(
  bookings: readonly DepartureStay[],
  today: string,
  result: Pick<DepartureLockResult, "status">,
  now: Date = new Date(),
): Promise<void> {
  if (departureDetectionMode() === "off") return;
  const door = result.status;
  if (door !== "locked" && door !== "unlocked" && door !== "reoccupied") return;
  try {
    for (const { bookingId } of departuresOf(bookings, today)) {
      const key = departureStateKey(bookingId);
      const previous = await getJson<DepartureState>(key);
      const base = previous?.day === today ? previous : initialDepartureState(today, now);
      if (base.door === door) continue;
      await setJson(key, { ...base, door, updatedAt: now.toISOString() }, STATE_TTL_SECONDS);
    }
  } catch (e) {
    console.error("[departure-observation] relevé de porte non reporté :", errorText(e));
  }
}

/** Les états de départ gardés (≤ 7 jours), par réservation — pour `/api/dashboard/stay-status`. */
export async function readDepartureStates(): Promise<Record<number, DepartureState>> {
  const out: Record<number, DepartureState> = {};
  const redis = getRedis();
  const keys: string[] = [];
  let cursor: string | number = 0;
  do {
    const [next, batch] = (await redis.scan(cursor, { match: `${redisKey("departure")}:*`, count: 200 })) as [string | number, string[]];
    keys.push(...batch);
    cursor = next;
  } while (String(cursor) !== "0");
  const ids = keys.map((k) => Number(k.split(":").pop())).filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) return out;
  const values = await redis.mget<unknown[]>(...ids.map((id) => departureStateKey(id)));
  ids.forEach((id, i) => {
    let v = values[i];
    if (typeof v === "string") {
      try {
        v = JSON.parse(v);
      } catch {
        return;
      }
    }
    if (v && typeof v === "object" && typeof (v as DepartureState).day === "string" && typeof (v as DepartureState).status === "string") {
      out[id] = v as DepartureState;
    }
  });
  return out;
}
