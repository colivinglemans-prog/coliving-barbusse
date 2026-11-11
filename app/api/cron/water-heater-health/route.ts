import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { getWaterHeaterStatus, getWaterHeaterProfile, heatPumpStalled, PAC_STALL } from "@/lib/cozytouch";
import { absenceSince, entryOlderThan, readWaterHeaterLog } from "@/lib/water-heater-log";
import { getActiveBookings, countGuests } from "@/lib/bookings";
import { sendWaterHeaterAlert } from "@/lib/alerts";
import { reportAlerts, reportCronRun } from "@/lib/alert-memory";
import { waterHeaterIssues } from "@/lib/water-heater-health";
import { todayParis, currentHourParis, nowParis } from "@sejour/socle/lib/time";

/**
 * Contrôle du ballon, toutes les 2 h. Les constats viennent de `waterHeaterIssues` et passent par
 * la règle commune des alertes (`reportAlerts`, état `barbusse:alert:water-heater-health`) :
 * - un constat ne part que s'il était déjà là au contrôle précédent — une bascule que
 *   l'automation, lancée à la même minute, est en train d'appliquer ne survit pas ;
 * - une seule fois tant qu'il dure (il repartait toutes les 2 h jusqu'au 2026-11-10) ;
 * - le retour à la normale part en priorité 1.
 */
const LABEL = "Contrôle du ballon";

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

    const alert = await reportAlerts(
      "water-heater-health",
      issues.map((i) => ({ id: i.id, priority: 4, line: i.message })),
      sendWaterHeaterAlert,
      {
        title: (c) => `${c.length} alerte(s) ballon thermodynamique`,
        intro: `Constaté à deux contrôles de suite, le dernier le ${today} à ${nowParis().toLocaleTimeString("fr-FR")}. Profil attendu : ${profile} (${guests} personne(s)).`,
        recoveredTitle: "Ballon thermodynamique : retour à la normale",
        recoveredBody: "Plus aucun écart constaté sur le ballon.",
      },
    );
    await reportCronRun("water-heater-health", LABEL, sendWaterHeaterAlert, null).catch(() => {});

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
      alert,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await reportCronRun("water-heater-health", LABEL, sendWaterHeaterAlert, message).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
