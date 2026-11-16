import { getLockHealth, listLogSince } from "@sejour/socle/lib/nuki";
import { countsAsSold } from "@sejour/socle/lib/booking-status";
import { parisInstant } from "@sejour/socle/lib/time";
import type { AlertState } from "@sejour/socle/lib/alert-state";
import { nukiConfig } from "./access-sync";
import { alertTransition, reportAlerts } from "./alert-memory";
import { sendDoorAlert } from "./alerts";
import { trackedPeople } from "./cleaning/sessions";
import { garageArrivals } from "./cleaning/sources";
import {
  DEPARTURE_LOCK_GRACE_MINUTES,
  REOCCUPY_LOOKBACK_HOURS,
  departureDeadlineHour,
  departureLockCheck,
  departureLockDueAt,
  departureLockTitle,
  type DepartureLockInput,
  type DepartureLockResult,
} from "./departure-detection";
import { getJson, redisKey, setJson } from "./redis";
import { AGREED_RANGE, STANDARD_HOURS, withAgreedHours } from "./stay-hours-rules";
import { readStayHours } from "./stay-hours";

/** Ce que le passage lit d'une réservation, horaires convenus joints (`withStayHours`). */
export interface DepartureStay {
  id: number;
  arrival: string;
  departure: string;
  status?: string;
  departureHour?: number;
}

export const DEPARTURE_LOCK_SCOPE = "departure-lock";

/** Plafond des lectures d'un relevé (serrure, journal, garage) : le cron du chauffage n'attend pas plus. */
export const DEPARTURE_LOCK_READ_TIMEOUT_MS = 10_000;

/** État final de la journée : plus aucun relevé jusqu'au lendemain. */
type FinalState = "locked" | "reoccupied";
const finalKey = (day: string) => redisKey("departure-lock", day);
/** Réservations du jour, gardées pour le mode été (pas d'appel Beds24 à chaque passage). */
const dayStaysKey = (day: string) => redisKey("departure-lock", day, "stays");
const DAY_TTL_SECONDS = 2 * 24 * 3600;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} : délai de ${ms / 1000} s dépassé`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const noneResult = (detail: string, departureHour: number | null = null): DepartureLockResult => ({
  status: "none",
  departureHour,
  report: "skip",
  alerts: [],
  detail,
});

/**
 * Le relevé « serrure non verrouillée après le départ », lancé par `heating-automation` toutes
 * les 15 min. La règle est dans `departureLockCheck` (`lib/departure-detection.ts`, pure et
 * testée) ; ici, les lectures et l'état d'alerte (`barbusse:alert:departure-lock`, règle commune
 * de `lib/alert-memory.ts`).
 *
 * - Nuki et le garage ne sont interrogés que le jour d'un départ, une fois l'heure de départ plus
 *   le délai de grâce passée, et **plus du tout** une fois la journée close
 *   (`barbusse:departure-lock:<jour>` = `locked` ou `reoccupied`).
 * - Lectures plafonnées à 10 s ; un dépassement vaut « illisible » (rien n'est conclu).
 * - Ne lève jamais.
 */
export async function runDepartureLockCheck(
  bookings: readonly DepartureStay[],
  today: string,
  now: Date = new Date(),
): Promise<DepartureLockResult> {
  const sold = bookings.filter((b) => b.status === undefined || countsAsSold(b.status));
  const departures = sold
    .filter((b) => b.departure === today)
    .map((b) => ({ bookingId: b.id, departureHour: b.departureHour ?? STANDARD_HOURS.departure }));
  const arrivals = sold.filter((b) => b.arrival === today).map((b) => ({ bookingId: b.id }));
  const departureHour = departureDeadlineHour(departures);

  const due = departureHour !== null && now.getTime() >= departureLockDueAt(today, departureHour).getTime();
  let final: FinalState | null = null;
  if (due) {
    final = await getJson<FinalState>(finalKey(today)).catch(() => null);
    if (final === "locked" || final === "reoccupied") {
      return { ...noneResult(`journée close (${final === "locked" ? "porte verrouillée" : "maison réoccupée"})`, departureHour), status: final };
    }
  }

  let lock: DepartureLockInput["lock"] = null;
  let log: DepartureLockInput["log"] = null;
  let garage: DepartureLockInput["garage"] = null;
  const people = trackedPeople();
  if (due) {
    const since = new Date(parisInstant(today, departureHour!).getTime() - REOCCUPY_LOOKBACK_HOURS * 3600_000);
    const read = async () => {
      const cfg = nukiConfig();
      const [health, entries, garageEntries] = await Promise.all([
        getLockHealth(cfg),
        listLogSince(cfg, since).catch((e) => {
          console.error("[departure-lock] journal illisible :", e instanceof Error ? e.message : e);
          return null;
        }),
        // Garage : facultatif (sans identifiants Intratone, ou en panne, la porte suffit).
        garageArrivals(people).catch(() => null),
      ]);
      return { health, entries, garageEntries };
    };
    try {
      const r = await withTimeout(read(), DEPARTURE_LOCK_READ_TIMEOUT_MS, "relevé de la serrure");
      lock = { online: r.health.online, lockState: r.health.lockState };
      log = r.entries;
      garage = r.garageEntries?.map((g) => ({ who: g.who, at: g.at })) ?? null;
    } catch (e) {
      console.error("[departure-lock] serrure illisible :", e instanceof Error ? e.message : e);
    }
  }

  const result = departureLockCheck({
    now,
    today,
    departures,
    arrivals,
    lock,
    log,
    garage,
    people: people.map((p) => p.name),
  });

  try {
    if (result.report === "report") {
      await reportAlerts(DEPARTURE_LOCK_SCOPE, result.alerts, sendDoorAlert, {
        title: () => departureLockTitle(result.departureHour),
        recoveredTitle: "Serrure verrouillée",
        recoveredBody: "La porte d'entrée est de nouveau verrouillée.",
        confirmAfter: 2,
        now,
      });
    } else if (result.report === "close-silently") {
      // Seulement si une alerte est ouverte (ou en cours de confirmation) : sinon rien à écrire.
      const state = await getJson<AlertState>(redisKey("alert", DEPARTURE_LOCK_SCOPE)).catch(() => null);
      if (state && (state.open || Object.keys(state.failing ?? {}).length > 0)) {
        await alertTransition(DEPARTURE_LOCK_SCOPE, [], now);
      }
    }
    // Journée close : plus aucun relevé (ni Nuki, ni garage) jusqu'au lendemain.
    if (result.status === "locked" || result.status === "reoccupied") {
      await setJson(finalKey(today), result.status, DAY_TTL_SECONDS);
    }
  } catch (e) {
    console.error("[departure-lock] alerte :", e instanceof Error ? e.message : e);
  }
  return result;
}

/** Premier instant possible d'un relevé : départ standard (le plus tôt saisissable) + grâce. */
const EARLIEST_DUE_MINUTES = Math.min(STANDARD_HOURS.departure, AGREED_RANGE.departure.min) * 60 + DEPARTURE_LOCK_GRACE_MINUTES;

/**
 * Le même relevé en **mode été**, où `heating-automation` ne lit pas Beds24 : rien avant 11 h 30
 * (aucun appel), rien une fois la journée close, et les réservations du jour lues **une fois par
 * jour** (`barbusse:departure-lock:<jour>:stays`), les horaires convenus rejoints à chaque passage
 * (lecture Redis).
 */
export async function runDepartureLockCheckSummer(
  today: string,
  parisMinutes: number,
  loadBookings: () => Promise<readonly DepartureStay[]>,
  now: Date = new Date(),
): Promise<DepartureLockResult | null> {
  if (parisMinutes < EARLIEST_DUE_MINUTES) return null;
  try {
    const final = await getJson<FinalState>(finalKey(today)).catch(() => null);
    if (final === "locked" || final === "reoccupied") return { ...noneResult("journée close"), status: final };
    let stays = await getJson<DepartureStay[]>(dayStaysKey(today)).catch(() => null);
    if (!Array.isArray(stays)) {
      stays = (await loadBookings())
        .filter((b) => b.arrival === today || b.departure === today)
        .map((b) => ({ id: b.id, arrival: b.arrival, departure: b.departure, ...(b.status !== undefined ? { status: b.status } : {}) }));
      await setJson(dayStaysKey(today), stays, DAY_TTL_SECONDS).catch(() => {});
    }
    if (!stays.some((b) => b.departure === today)) return noneResult("pas de départ aujourd'hui");
    return await runDepartureLockCheck(withAgreedHours(stays, await readStayHours()), today, now);
  } catch (e) {
    console.error("[departure-lock] mode été :", e instanceof Error ? e.message : e);
    return null;
  }
}
