import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import {
  getFullZoneConfig,
  getLockedDevices,
  saveLockedDevices,
  setDeviceMode,
  getSummerMode,
} from "@/lib/heatzy";
import { expectedHeatingMode, type HeatingSituation } from "@/lib/heating-schedule";
import { getActiveBookings } from "@/lib/bookings";
import { sendHeatingAlert } from "@/lib/alerts";
import { alertTransition, failingInputs } from "@/lib/alert-memory";
import { beat } from "@/lib/heartbeat";
import { todayParis, currentHourParis } from "@sejour/socle/lib/time";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Libellé de l'action, par situation — ceux d'avant la fonction unique. */
const LABEL: Record<Exclude<HeatingSituation, "vacant">, string> = {
  "preheat-cft": "pré-chauffage confort (arrivée aujourd'hui)",
  "preheat-eco": "pré-chauffage éco (montée progressive)",
  "arrival-morning": "hors-gel (arrivée aujourd'hui, avant pré-chauffage)",
  occupied: "(occupé)",
  turnaround: "(entre deux réservations)",
  checkout: "hors-gel (départ)",
};

/**
 * Pilotage du chauffage, toutes les 15 min (cron-job.org) et à 7 h (Vercel).
 *
 * Le mode vient de `expectedHeatingMode` (`lib/heating-schedule.ts`), la seule source :
 * préchauffage éco à 12 h, confort à 15 h, occupé à partir de 17 h, rotation en éco de 10 h à
 * 17 h, hors-gel au départ, rien d'imposé sans réservation.
 *
 * Les radiateurs qui refusent leur mode (`failures`) déclenchent une alerte ntfy, une fois par
 * changement d'état (`barbusse:alert:heating-automation`).
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (await getSummerMode()) {
      await beat("heating-automation", "ok");
      return NextResponse.json({
        success: true,
        skipped: "summer-mode",
        actions: [],
        failures: [],
        timestamp: new Date().toISOString(),
      });
    }

    const config = await getFullZoneConfig();
    const today = todayParis();
    const currentHour = currentHourParis();

    const allBookings = await getActiveBookings();

    const actions: string[] = [];
    const lockedDevices = await getLockedDevices();

    const hasCheckOutToday = allBookings.some((b) => b.departure === today);
    const situation = expectedHeatingMode(allBookings, today, currentHour, {}).situation;

    // Fin de réservation : tous les radiateurs verrouillés sont rendus à l'automatisation.
    if (hasCheckOutToday && situation !== "occupied" && lockedDevices.size > 0) {
      await saveLockedDevices(new Set());
      actions.push(`Déverrouillage de ${lockedDevices.size} device(s) (fin de réservation)`);
      lockedDevices.clear();
    }

    const failures: string[] = [];
    const failedDevices: string[] = [];

    for (const zone of config.zones) {
      const { mode } = expectedHeatingMode(allBookings, today, currentHour, zone);
      for (const device of zone.devices) {
        const did = device.did;

        if (lockedDevices.has(did)) {
          actions.push(`${device.name}: ignoré (verrouillé)`);
          continue;
        }
        // Aucune réservation autour : rien d'imposé.
        if (mode === null || situation === "vacant") continue;

        try {
          await setDeviceMode(did, mode);
          const label = LABEL[situation];
          actions.push(label.startsWith("(") ? `${device.name}: ${mode} ${label}` : `${device.name}: ${label}`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          failures.push(`${device.name}: ${msg}`);
          failedDevices.push(device.name);
          console.error(`Heating automation error for ${device.name}:`, e);
        }
        await sleep(100);
      }
    }

    // Alerte sur les radiateurs qui n'ont pas pris leur mode — une fois par changement d'état.
    const transition = await alertTransition("heating-automation", failingInputs(failedDevices));
    if (transition.action === "open" || transition.action === "escalate") {
      await sendHeatingAlert(
        `${failedDevices.length} radiateur(s) n'ont pas pris leur mode`,
        [`Situation : ${situation}`, "", ...failures.map((f) => `  - ${f}`)].join("\n"),
      ).catch(() => {});
    } else if (transition.action === "recover") {
      await sendHeatingAlert("Tous les radiateurs ont repris leur mode", "Plus aucun échec de commande.", 2).catch(
        () => {},
      );
    }

    await beat("heating-automation", "ok");
    return NextResponse.json({
      success: true,
      situation,
      actions,
      failures,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await beat("heating-automation", "error");
    await sendHeatingAlert(
      "Erreur automation chauffage",
      `L'automation du chauffage a rencontré une erreur :\n\n${message}`,
    ).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
