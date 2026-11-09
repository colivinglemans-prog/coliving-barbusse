import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import {
  getWaterHeaterStatus,
  getExpectedSettings,
  heatPumpStalled,
  PAC_STALL,
  setAbsenceMode,
  setDHWMode,
  setBoostMode,
  setTargetTemperature,
} from "@/lib/cozytouch";
import { getActiveBookings, countGuests } from "@/lib/bookings";
import { sendWaterHeaterAlert } from "@/lib/alerts";
import { beat } from "@/lib/heartbeat";
import { todayParis, nowParis } from "@sejour/socle/lib/time";
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
 * Ordre des commandes : ce qui **coupe** d'abord (boost off, Absence on), ce qui **rallume** en
 * dernier (Absence off) — un échec en route ne laisse pas l'appoint tourner au pic.
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

    const [bookings, status, log] = await Promise.all([
      getActiveBookings(),
      getWaterHeaterStatus(),
      readWaterHeaterLog(24),
    ]);
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
    if (settings.absence && !absenceNow) {
      await setAbsenceMode(true);
      applied.push("absence off → on (heure de pic)");
    }
    if (status.mode !== settings.mode) {
      await setDHWMode(settings.mode);
      applied.push(`mode ${status.mode} → ${settings.mode}`);
    }
    if (status.targetTemperature !== settings.targetTemperature) {
      await setTargetTemperature(settings.targetTemperature);
      applied.push(`consigne ${status.targetTemperature}°C → ${settings.targetTemperature}°C`);
    }
    if (!settings.absence && absenceNow) {
      await setAbsenceMode(false);
      applied.push("absence on → off");
    }

    if (applied.length > 0 || (await claimHourlyLogSlot())) {
      await appendWaterHeaterLog(logEntry(now, guests, profile, peak, status, applied));
    }
    await beat("water-heater-automation", "ok");
    return NextResponse.json({
      success: true,
      profile,
      guests,
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
    await sendWaterHeaterAlert(
      "Erreur automation eau chaude",
      `L'automation du ballon thermodynamique a rencontré une erreur :\n\n${message}`,
    ).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
