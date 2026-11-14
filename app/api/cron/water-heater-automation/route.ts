import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import {
  getConnectivity,
  isUnreachable,
  getWaterHeaterStatus,
  getExpectedSettings,
  heatPumpStalled,
  PAC_STALL,
  setAbsenceMode,
  setDHWMode,
  setBoostMode,
  setTargetTemperature,
} from "@/lib/cozytouch";
import { getActiveBookings, getBookingsAround, countGuests, guestsAround } from "@/lib/bookings";
import { sendWaterHeaterAlert } from "@/lib/alerts";
import { beat } from "@/lib/heartbeat";
import { reportAlerts, reportCronRun } from "@/lib/alert-memory";
import { todayParis, nowParis, tomorrowParis } from "@sejour/socle/lib/time";
import {
  absenceSince,
  appendWaterHeaterLog,
  claimHourlyLogSlot,
  entryOlderThan,
  logEntry,
  readWaterHeaterLog,
} from "@/lib/water-heater-log";

/**
 * Pilotage du ballon thermo, toutes les 15 min (cron-job.org).
 *
 * Éco 55 °C (50 °C maison vide), jamais de boost automatique ; **Absence aux heures de pic**
 * (`PEAK_WINDOWS`, `lib/cozytouch.ts` : 4 h 45-7 h et 16 h 45-22 h) quand des voyageurs sont
 * là — seul moyen mesuré de couper l'appoint de 1 800 W (coupures des 7-9/11/2026 à 9 kVA).
 *
 * Ordre des commandes : boost coupé d'abord ; mode et consigne ensuite ; **l'Absence en dernier**,
 * qu'on la pose ou qu'on la lève — on ne sait pas si un changement de mode ou de consigne la fait
 * sortir d'Absence sur l'ÉGÉO, elle doit donc être la dernière commande reçue.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const paris = nowParis();
    const today = todayParis();
    const hour = paris.getHours();

    const [bookings, status, log, connectivity] = await Promise.all([
      getActiveBookings(),
      getWaterHeaterStatus(),
      readWaterHeaterLog(24),
      getConnectivity().catch(() => null),
    ]);

    // Thermo injoignable (circuit du garage coupé le 10/11 au soir, maison vide) : alerte après
    // deux passages de suite, règle commune ; aucune commande envoyée dans le vide.
    const unreachable = connectivity !== null && isUnreachable(connectivity);
    // Voyageurs là ou arrivant d'ici demain → 5 (douches froides), sinon 3. Beds24 illisible :
    // gravité 3 (pas d'escalade pour une panne de Beds24), mais l'envoi part en 5.
    const reachGuests: boolean | null = unreachable
      ? await getBookingsAround(today, tomorrowParis())
          .then((b) => guestsAround(b, today, tomorrowParis()))
          .catch((e) => {
            console.error("[water-heater-automation] réservations illisibles:", e instanceof Error ? e.message : e);
            return null;
          })
      : false;
    await reportAlerts(
      "water-heater-reach",
      unreachable
        ? [
            {
              id: "unreachable",
              priority: reachGuests ? 5 : 3,
              line: `Le thermo ne répond plus à Cozytouch (appareil ${connectivity!.deviceAvailable === false ? "indisponible" : "?"}, passerelle ${connectivity!.gatewayStatus ?? "?"}). Les ballons sont dans le garage : circuit du garage coupé ? Il faut réarmer, sinon plus d'eau chaude.`,
            },
          ]
        : [],
      sendWaterHeaterAlert,
      {
        title: () => "Thermo injoignable — circuit du garage coupé ?",
        recoveredTitle: "Thermo de nouveau joignable",
        recoveredBody: "Cozytouch voit de nouveau le thermo.",
        priority: () => (reachGuests === false ? 3 : 5),
      },
    ).catch(() => {});
    if (unreachable) {
      await beat("water-heater-automation", "ok");
      await reportCronRun("water-heater-automation", "Automation de l'eau chaude", sendWaterHeaterAlert, null).catch(() => {});
      return NextResponse.json({ success: true, unreachable: true, connectivity, timestamp: now.toISOString() });
    }
    const guests = countGuests(bookings, today, hour);
    const { profile, peak, ...settings } = getExpectedSettings(guests, hour, paris.getMinutes());
    const earlier = entryOlderThan(log, now, PAC_STALL.afterMs);
    const stalled = heatPumpStalled(status, earlier, now, absenceSince(log, earlier?.at));

    const applied: string[] = [];
    const absenceNow = status.absenceActive ?? false;

    if (status.boostActive && !settings.boost) {
      await setBoostMode(false);
      applied.push("boost on → off");
    }
    if (status.mode !== settings.mode) {
      await setDHWMode(settings.mode);
      applied.push(`mode ${status.mode} → ${settings.mode}`);
    }
    if (status.targetTemperature !== settings.targetTemperature) {
      await setTargetTemperature(settings.targetTemperature);
      applied.push(`consigne ${status.targetTemperature}°C → ${settings.targetTemperature}°C`);
    }
    if (settings.absence && !absenceNow) {
      await setAbsenceMode(true);
      applied.push("absence off → on (heure de pic)");
    } else if (!settings.absence && absenceNow) {
      await setAbsenceMode(false);
      applied.push("absence on → off");
    }

    if (applied.length > 0 || (await claimHourlyLogSlot())) {
      await appendWaterHeaterLog(logEntry(now, guests, profile, peak, status, applied));
    }
    await beat("water-heater-automation", "ok");
    await reportCronRun("water-heater-automation", "Automation de l'eau chaude", sendWaterHeaterAlert, null).catch(() => {});
    return NextResponse.json({
      success: true,
      profile,
      guests,
      connectivity,
      peak,
      settings,
      heatPumpStalled: stalled,
      middleTemperature: status.middleTemperature,
      applied,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await beat("water-heater-automation", "error");
    await reportCronRun("water-heater-automation", "Automation de l'eau chaude", sendWaterHeaterAlert, message).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
