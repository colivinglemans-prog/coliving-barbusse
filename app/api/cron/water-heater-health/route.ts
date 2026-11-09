import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { getWaterHeaterStatus, getWaterHeaterProfile, heatPumpStalled, PAC_STALL } from "@/lib/cozytouch";
import { absenceSince, entryOlderThan, readWaterHeaterLog } from "@/lib/water-heater-log";
import { getActiveBookings, countGuests } from "@/lib/bookings";
import { sendWaterHeaterAlert } from "@/lib/alerts";
import { getJson, redisKey, setJson } from "@/lib/redis";
import { confirmedIssues, waterHeaterIssues } from "@/lib/water-heater-health";
import { todayParis, currentHourParis, nowParis } from "@sejour/socle/lib/time";

/**
 * Contrôle du ballon. Les constats viennent de `waterHeaterIssues` ; seuls ceux déjà présents
 * au passage précédent partent en alerte (`confirmedIssues`), pour ne pas signaler une bascule
 * que l'automation, lancée à la même minute, est en train d'appliquer.
 *
 * Redis injoignable : le passage précédent est lu comme vide, rien ne part ce tour-ci, et le
 * suivant alerte normalement si Redis est revenu.
 */
const PENDING_KEY = redisKey("water-heater", "health-pending");
// Deux passages de contrôle d'écart au plus (cron toutes les 2 h), plus une marge.
const PENDING_TTL_SECONDS = 5 * 3600;

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = todayParis();
    const currentHour = currentHourParis();

    const now = new Date();
    const [bookings, status, log] = await Promise.all([
      getActiveBookings(),
      getWaterHeaterStatus(),
      readWaterHeaterLog(24),
    ]);

    const guests = countGuests(bookings, today, currentHour);
    const profile = getWaterHeaterProfile(guests);
    const earlier = entryOlderThan(log, now, PAC_STALL.afterMs);
    const stalled = heatPumpStalled(status, earlier, now, absenceSince(log, earlier?.at));
    const issues = waterHeaterIssues(guests, currentHour, nowParis().getMinutes(), status, stalled);

    let previousIds: string[] = [];
    try {
      previousIds = (await getJson<string[]>(PENDING_KEY)) ?? [];
      await setJson(PENDING_KEY, issues.map((i) => i.id), PENDING_TTL_SECONDS);
    } catch (e) {
      console.error("[water-heater-health] Redis:", e instanceof Error ? e.message : e);
    }
    const confirmed = confirmedIssues(issues, previousIds);

    if (confirmed.length > 0) {
      const lines = [
        ...confirmed.map((i) => i.message),
        "",
        `Profil attendu : ${profile} (${guests} personne(s))`,
        `Constaté à deux contrôles de suite, le dernier le ${today} à ${nowParis().toLocaleTimeString("fr-FR")}`,
      ];
      await sendWaterHeaterAlert(
        `${confirmed.length} alerte(s) ballon thermodynamique`,
        lines.join("\n"),
      );
    }

    return NextResponse.json({
      success: true,
      profile,
      guests,
      status: {
        middleTemperature: status.middleTemperature,
        mode: status.mode,
        targetTemperature: status.targetTemperature,
        boostActive: status.boostActive,
        bottomTemperature: status.bottomTemperature,
        isAvailable: status.isAvailable,
      },
      issues: issues.map((i) => i.id),
      alerted: confirmed.map((i) => i.id),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await sendWaterHeaterAlert(
      "Erreur health check eau chaude",
      `Le health check du ballon thermodynamique a rencontré une erreur :\n\n${message}`,
    ).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
