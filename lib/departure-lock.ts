import { getLockHealth, listLogSince } from "@sejour/socle/lib/nuki";
import { countsAsSold } from "@sejour/socle/lib/booking-status";
import { parisInstant } from "@sejour/socle/lib/time";
import type { AlertState } from "@sejour/socle/lib/alert-state";
import { ACCESS_POLICY, isNightParis, nukiConfig } from "./access-sync";
import { alertTransition, reportAlerts } from "./alert-memory";
import { sendDoorAlert } from "./alerts";
import { trackedPeople } from "./cleaning/sessions";
import { garageOpenings } from "./cleaning/sources";
import {
  DEPARTURE_LOCK_GRACE_MINUTES,
  REOCCUPY_LOOKBACK_HOURS,
  LOCK_STATE_LOCKED,
  departureDeadlineHour,
  departureLockCheck,
  departureLockDueAt,
  departureLockTitle,
  parisHourOf,
  readDepartureLog,
  type DepartureLockInput,
  type DepartureLockResult,
} from "./departure-detection";
import { getJson, redisKey, setJson } from "./redis";
import {
  AGREED_RANGE,
  STANDARD_HOURS,
  accessStatus,
  departingCodesEnd,
  withAgreedHours,
  type AgreedHours,
} from "./stay-hours-rules";
import { readStayHours } from "./stay-hours";

/** Ce que le passage lit d'une réservation, horaires convenus joints (`withStayHours`). */
export interface DepartureStay {
  id: number;
  arrival: string;
  departure: string;
  status?: string;
  arrivalHour?: number;
  departureHour?: number;
}

export const DEPARTURE_LOCK_SCOPE = "departure-lock";

/**
 * Plafond des lectures Nuki d'un relevé (état de la serrure, puis journal) : le cron du chauffage
 * n'attend pas plus. Un dépassement vaut « illisible ».
 */
export const DEPARTURE_LOCK_READ_TIMEOUT_MS = 10_000;

/**
 * Plafond **propre** à la lecture du garage (Intratone) : un portail lent ou en panne vaut « non
 * lu », jamais « serrure illisible ».
 */
export const DEPARTURE_LOCK_GARAGE_TIMEOUT_MS = 8_000;

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
 * E, la fin de validité réelle du code des partants du jour, calculée sur les réservations lues
 * avec **la** formule de la synchro (`departingCodesEnd` → `lockWindows`, `lib/stay-hours-rules.ts`).
 * Les horaires convenus sont ceux joints aux réservations (`withStayHours`). Exporté pour les tests.
 */
export function departureCodeEnd(bookings: readonly DepartureStay[], departingIds: readonly number[]): Date | null {
  const table: Record<number, AgreedHours> = {};
  for (const b of bookings) {
    if (b.arrivalHour === undefined && b.departureHour === undefined) continue;
    table[b.id] = {
      ...(b.arrivalHour !== undefined ? { arrivalHour: b.arrivalHour } : {}),
      ...(b.departureHour !== undefined ? { departureHour: b.departureHour } : {}),
    };
  }
  const stays = bookings.map((b) => ({ bookingId: b.id, arrival: b.arrival, departure: b.departure, status: accessStatus(b.status ?? "confirmed") }));
  return departingCodesEnd(stays, departingIds, table, ACCESS_POLICY);
}

/**
 * Le relevé « serrure non verrouillée après le départ », lancé par `heating-automation` toutes
 * les 15 min. La règle est dans `departureLockCheck` (`lib/departure-detection.ts`, pure et
 * testée) ; ici, les lectures et l'état d'alerte (`barbusse:alert:departure-lock`, règle commune
 * de `lib/alert-memory.ts`).
 *
 * - Rien n'est lu avant D + 30 min, ni une fois la journée close (`barbusse:departure-lock:<jour>`
 *   = `locked`, porte verrouillée une fois E passé, ou `reoccupied`, maison reprise en main).
 * - Ordre des lectures, pour le coût et pour que le garage ne masque jamais la serrure : l'état de
 *   la serrure seul ; porte verrouillée → rien de plus ; sinon le journal ; puis, seulement si le
 *   journal ne conclut pas à une prise en main, le garage, avec son propre délai.
 * - Lectures Nuki plafonnées à 10 s en tout ; un dépassement vaut « illisible » (rien n'est conclu).
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
  if (due) {
    const final = await getJson<FinalState>(finalKey(today)).catch(() => null);
    if (final === "locked" || final === "reoccupied") {
      return {
        ...noneResult(`journée close (${final === "locked" ? "porte verrouillée" : "maison reprise en main"})`, departureHour),
        status: final,
        closesDay: true,
      };
    }
  }

  const people = trackedPeople().map((p) => p.name);
  const codeEnd = departureHour === null ? null : departureCodeEnd(sold, departures.map((d) => d.bookingId));
  const input: DepartureLockInput = { now, today, departures, arrivals, codeEnd, lock: null, log: null, garage: null, people };
  if (due) await readDoor(input, departureHour!);

  const result = departureLockCheck(input);

  try {
    if (result.report === "report") {
      await reportAlerts(DEPARTURE_LOCK_SCOPE, result.alerts, sendDoorAlert, {
        title: () => departureLockTitle(result.departureHour, result.guestReturned === true),
        recoveredTitle: "Serrure verrouillée",
        recoveredBody: "La porte d'entrée est de nouveau verrouillée.",
        confirmAfter: 2,
        // La nuit (départ convenu tard), priorité 3 ; la gravité stockée reste 4.
        priority: () => (isNightParis(parisHourOf(now)) ? 3 : 4),
        now,
      });
    } else if (result.report === "close-silently") {
      // Seulement si une alerte est ouverte (ou en cours de confirmation) : sinon rien à écrire.
      const state = await getJson<AlertState>(redisKey("alert", DEPARTURE_LOCK_SCOPE)).catch(() => null);
      if (state && (state.open || Object.keys(state.failing ?? {}).length > 0)) {
        await alertTransition(DEPARTURE_LOCK_SCOPE, [], now);
      }
    }
    // Journée close : plus aucun relevé (ni Nuki, ni garage) jusqu'au lendemain. « Verrouillée »
    // ne clôt qu'une fois E passé ; une prise en main clôt tout de suite.
    if (result.closesDay && (result.status === "locked" || result.status === "reoccupied")) {
      await setJson(finalKey(today), result.status, DAY_TTL_SECONDS);
    }
  } catch (e) {
    console.error("[departure-lock] alerte :", e instanceof Error ? e.message : e);
  }
  return result;
}

/**
 * Les lectures d'un relevé, dans l'ordre (voir `runDepartureLockCheck`), écrites dans `input`.
 * Ne lève jamais : une lecture ratée laisse `null` (serrure ou journal illisible, garage non lu).
 */
async function readDoor(input: DepartureLockInput, departureHour: number): Promise<void> {
  const deadline = Date.now() + DEPARTURE_LOCK_READ_TIMEOUT_MS;
  const left = () => Math.max(0, deadline - Date.now());
  let cfg: ReturnType<typeof nukiConfig> | null = null;
  try {
    cfg = nukiConfig();
    const health = await withTimeout(getLockHealth(cfg), left(), "état de la serrure");
    input.lock = { online: health.online, lockState: health.lockState };
  } catch (e) {
    console.error("[departure-lock] serrure illisible :", e instanceof Error ? e.message : e);
    return;
  }
  if (!input.lock.online || input.lock.lockState === LOCK_STATE_LOCKED || cfg === null) {
    input.log = undefined;
    return;
  }

  const since = new Date(parisInstant(input.today, departureHour).getTime() - REOCCUPY_LOOKBACK_HOURS * 3600_000);
  try {
    input.log = await withTimeout(listLogSince(cfg, since), left(), "journal de la serrure");
  } catch (e) {
    console.error("[departure-lock] journal illisible :", e instanceof Error ? e.message : e);
    input.log = null;
    return;
  }
  if (readDepartureLog(input, departureHour).takeover) return;

  // Garage : facultatif. Sans identifiants Intratone, en panne ou lent : non lu, la porte suffit.
  input.garage = await withTimeout(garageOpenings(), DEPARTURE_LOCK_GARAGE_TIMEOUT_MS, "garage").catch((e) => {
    console.error("[departure-lock] garage non lu :", e instanceof Error ? e.message : e);
    return null;
  });
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
    if (final === "locked" || final === "reoccupied") return { ...noneResult("journée close"), status: final, closesDay: true };
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
