import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import {
  getWaterHeaterStatus,
  getExpectedSettings,
  decideBooster,
  heatPumpStalled,
  BOOSTER_RULE,
  BOOSTER_REASON_LABEL,
  setDHWMode,
  setBoostMode,
  setTargetTemperature,
} from "@/lib/cozytouch";
import { getActiveBookings, countGuests } from "@/lib/bookings";
import { sendWaterHeaterAlert } from "@/lib/alerts";
import { beat } from "@/lib/heartbeat";
import { todayParis, currentHourParis } from "@sejour/socle/lib/time";
import {
  appendWaterHeaterLog,
  claimHourlyLogSlot,
  entryOlderThan,
  logEntry,
  readBoosterMemo,
  readWaterHeaterLog,
  saveBoosterMemo,
} from "@/lib/water-heater-log";
import { freshLoad, readHeatingLoad } from "@/lib/heating-state";
import { readRadiators } from "@/lib/heatzy";
import { estimateRadiatorLoad } from "@/lib/radiator-load";
import { ELECTRICAL_BUDGET } from "@/lib/electrical-budget";

/**
 * Charge des radiateurs : celle que `heating-automation` vient de mémoriser (même quart
 * d'heure), sinon une lecture directe. `null` si rien n'est lisible : l'appoint est alors refusé.
 */
async function radiatorLoadW(now: Date): Promise<number | null> {
  const memo = freshLoad(await readHeatingLoad(), now);
  if (memo) return memo.totalW;
  try {
    return estimateRadiatorLoad(await readRadiators()).totalW;
  } catch (e) {
    console.error("[water-heater-automation] lecture des radiateurs:", e instanceof Error ? e.message : e);
    return null;
  }
}

/**
 * Pilotage du ballon thermo, toutes les 15 min (cron-job.org).
 *
 * PAC seule par défaut ; appoint électrique (1 800 W) seulement de 10 h à 16 h, si la charge
 * estimée des radiateurs le permet et si la PAC ne suffit pas (`decideBooster`,
 * `lib/cozytouch.ts`). Quand l'appoint est retiré, le boost est coupé **en premier** : un échec
 * des commandes suivantes ne le laisse pas tourner un quart d'heure de plus.
 *
 * La décision est mémorisée (`barbusse:water-heater:booster`) pour le contrôle et le dashboard.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const today = todayParis();
    const currentHour = currentHourParis();

    const [bookings, status, log, loadW, previous] = await Promise.all([
      getActiveBookings(),
      getWaterHeaterStatus(),
      readWaterHeaterLog(24),
      radiatorLoadW(now),
      readBoosterMemo(now),
    ]);
    const guests = countGuests(bookings, today, currentHour);
    const stalled = heatPumpStalled(status, entryOlderThan(log, now, BOOSTER_RULE.stalledAfterMs), now);
    const decision = decideBooster({
      guests,
      hour: currentHour,
      radiatorLoadW: loadW,
      budgetW: ELECTRICAL_BUDGET.boosterRadiatorBudgetW,
      status,
      stalled,
      wasAllowed: previous?.allowed ?? false,
    });
    const { profile, ...settings } = getExpectedSettings(guests, decision.allowed);

    const applied: string[] = [];

    // Boost coupé d'abord : c'est lui qui tire l'appoint.
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

    if (!status.boostActive && settings.boost) {
      await setBoostMode(true);
      applied.push("boost off → on");
    }

    const booster = { ...decision, radiatorLoadW: loadW };
    await saveBoosterMemo({
      allowed: decision.allowed,
      reason: decision.reason,
      radiatorLoadW: loadW,
      budgetW: ELECTRICAL_BUDGET.boosterRadiatorBudgetW,
      at: now.toISOString(),
    });
    if (applied.length > 0 || (await claimHourlyLogSlot())) {
      await appendWaterHeaterLog(logEntry(now, guests, profile, booster, status, applied));
    }
    await beat("water-heater-automation", "ok");
    return NextResponse.json({
      success: true,
      profile,
      guests,
      settings,
      booster: {
        allowed: decision.allowed,
        reason: BOOSTER_REASON_LABEL[decision.reason],
        radiatorLoadW: loadW,
        budgetW: ELECTRICAL_BUDGET.boosterRadiatorBudgetW,
        heatPumpStalled: stalled,
      },
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
