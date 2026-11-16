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
import { withStayHours } from "@/lib/stay-hours";
import { sendWaterHeaterAlert } from "@/lib/alerts";
import { beat } from "@/lib/heartbeat";
import { applyWaterHeaterCommands } from "@/lib/water-heater-commands";
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
 * sortir d'Absence sur l'ÉGÉO, elle doit donc être la dernière commande reçue. Chaque commande a
 * son `try` : un refus du mode n'empêche plus l'Absence (`lib/water-heater-commands.ts`). Une
 * commande refusée : alerte `water-heater-commands` (deux passages) et réponse 502.
 */
// Lectures en parallèle puis jusqu'à quatre commandes Overkiz, 10 s chacune au pire
// (`AbortSignal.timeout`). L'Absence de pic est la **dernière** : 30 s pouvaient la couper
// derrière trois commandes lentes. 60 s, le plafond du plan Hobby.
export const maxDuration = 60;
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
      withStayHours(getActiveBookings()),
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

    // Ordre voulu, une commande par `try`, Absence toujours tentée en dernier
    // (`lib/water-heater-commands.ts`).
    const { applied, failures } = await applyWaterHeaterCommands(status, settings, {
      setBoostMode,
      setDHWMode,
      setTargetTemperature,
      setAbsenceMode,
    });
    const journal = [...applied, ...failures.map((f) => `ÉCHEC ${f.label}`)];

    if (journal.length > 0 || (await claimHourlyLogSlot())) {
      await appendWaterHeaterLog(logEntry(now, guests, profile, peak, status, journal));
    }

    // Commandes refusées : règle commune (deux passages de suite, soit 15 min). Priorité 4 si
    // c'est l'Absence au pic (l'appoint reste actif : risque de coupure à 9 kVA), 3 sinon.
    await reportAlerts(
      "water-heater-commands",
      failures.map((f) => ({
        id: f.command,
        priority: f.command === "absence" && settings.absence ? 4 : 3,
        line: `  - ${f.label} : ${f.error.slice(0, 160)}`,
      })),
      sendWaterHeaterAlert,
      {
        title: (c) => (c.some((a) => a.id === "absence") ? "Ballon : Absence non posée" : "Ballon : commande refusée"),
        intro: `Refusé par Cozytouch à deux passages de suite (${guests} personne(s), ${peak ? "heure de pic" : "hors pic"}) :`,
        recoveredTitle: "Ballon : commandes de nouveau acceptées",
        recoveredBody: "Cozytouch accepte de nouveau les commandes de l'automation.",
      },
    ).catch((e) => console.error("[water-heater-automation] alerte commandes:", e instanceof Error ? e.message : e));

    // Le passage a tourné (battement `ok`, l'erreur de route n'est pas en cause) ; mais une commande
    // refusée n'est plus un « succès » : 502, que cron-job.org voit.
    await beat("water-heater-automation", "ok");
    if (failures.length === 0) {
      await reportCronRun("water-heater-automation", "Automation de l'eau chaude", sendWaterHeaterAlert, null).catch(() => {});
    }
    return NextResponse.json({
      success: failures.length === 0,
      failures: failures.map((f) => ({ command: f.command, error: f.error })),
      profile,
      guests,
      connectivity,
      peak,
      settings,
      heatPumpStalled: stalled,
      middleTemperature: status.middleTemperature,
      applied,
      timestamp: now.toISOString(),
    }, { status: failures.length === 0 ? 200 : 502 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await beat("water-heater-automation", "error");
    await reportCronRun("water-heater-automation", "Automation de l'eau chaude", sendWaterHeaterAlert, message).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
