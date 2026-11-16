import { getLockHealth, listLogSince } from "@sejour/socle/lib/nuki";
import { countsAsSold } from "@sejour/socle/lib/booking-status";
import { parisInstant } from "@sejour/socle/lib/time";
import type { AlertState } from "@sejour/socle/lib/alert-state";
import { nukiConfig } from "./access-sync";
import { alertTransition, reportAlerts } from "./alert-memory";
import { sendDoorAlert } from "./alerts";
import { trackedPeople } from "./cleaning/sessions";
import { departureLockCheck, departureLockTitle, type DepartureLockResult } from "./departure-detection";
import { getJson, redisKey } from "./redis";
import { STANDARD_HOURS } from "./stay-hours";

/** Ce que le passage lit d'une réservation, horaires convenus joints (`withStayHours`). */
export interface DepartureStay {
  id: number;
  arrival: string;
  departure: string;
  status?: string;
  departureHour?: number;
}

export const DEPARTURE_LOCK_SCOPE = "departure-lock";

/**
 * Le relevé « serrure non verrouillée après le départ », lancé par `heating-automation` toutes
 * les 15 min (même en mode été : la porte n'a rien à voir avec les radiateurs). La règle est dans
 * `departureLockCheck` (`lib/departure-detection.ts`, pure et testée) ; ici, les lectures et
 * l'état d'alerte (`barbusse:alert:departure-lock`, règle commune de `lib/alert-memory.ts`).
 *
 * Nuki n'est interrogé que le jour d'un départ, une fois l'heure de départ passée. Ne lève
 * jamais : un échec de lecture vaut « rien à conclure » (l'état d'alerte ne bouge pas).
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

  const due =
    departures.length > 0 &&
    now.getTime() >= parisInstant(today, Math.max(...departures.map((d) => d.departureHour))).getTime();

  let lock: { online: boolean; lockState: number | null } | null = null;
  let log = null;
  if (due) {
    try {
      const cfg = nukiConfig();
      const since = parisInstant(today, Math.max(...departures.map((d) => d.departureHour)));
      const [health, entries] = await Promise.all([
        getLockHealth(cfg),
        listLogSince(cfg, since).catch((e) => {
          console.error("[departure-lock] journal illisible :", e instanceof Error ? e.message : e);
          return null;
        }),
      ]);
      lock = { online: health.online, lockState: health.lockState };
      log = entries;
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
    people: trackedPeople().map((p) => p.name),
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
  } catch (e) {
    console.error("[departure-lock] alerte :", e instanceof Error ? e.message : e);
  }
  return result;
}
