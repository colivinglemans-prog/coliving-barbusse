import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import {
  getFullZoneConfig,
  getLockedDevices,
  setDeviceMode,
  setDeviceTemperatures,
  getDeviceStatus,
  getSummerMode,
} from "@/lib/heatzy";
import { resetTarget } from "@/lib/heating-schedule";
import { getActiveBookings } from "@/lib/bookings";
import { sendHeatingAlert } from "@/lib/alerts";
import { reportCronRun } from "@/lib/alert-memory";
import { todayParis, nowParis } from "@sejour/socle/lib/time";
import { readShedState } from "@/lib/heating-state";
import { activeShedZones } from "@/lib/load-shedding";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (await getSummerMode()) {
      await reportCronRun("heating-reset", "Reset du chauffage", sendHeatingAlert, null).catch(() => {});
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
    const paris = nowParis();
    const currentHour = paris.getHours();
    const minute = paris.getMinutes();

    const [activeBookings, lockedDevices, shedState] = await Promise.all([
      getActiveBookings(),
      getLockedDevices(),
      readShedState(),
    ]);
    // Zones délestées par `heating-automation` ce quart d'heure : le reset ne les rallume pas.
    const shedZones = new Set(activeShedZones(shedState, new Date()));

    // Le mode et le statut « occupé » de chaque radiateur viennent de `resetTarget` : un jour
    // d'arrivée compte comme occupé dès 12 h, pour ne plus couper le préchauffage aux passages
    // de 12 h et 16 h. (L'ancienne boucle sur `roomMapping` testait la même condition pour
    // toutes les entrées : l'occupation était déjà globale à la maison.)
    const actions: string[] = [];

    const failures: string[] = [];

    // Process all devices: set mode + temperatures
    for (const zone of config.zones) {
      for (const device of zone.devices) {
        if (lockedDevices.has(device.did)) {
          actions.push(`${device.name}: ignoré (verrouillé)`);
          continue;
        }

        try {
          const target = resetTarget(activeBookings, today, currentHour, zone, device, minute);
          const isOccupied = target.occupied;
          const targetMode =
            shedZones.has(zone.id) && (target.mode === "cft" || target.mode === "presence") ? "eco" : target.mode;

          // Set mode
          await setDeviceMode(device.did, targetMode);

          // Reset temperatures
          if (zone.cftTemp && zone.ecoTemp) {
            if (isOccupied) {
              // Occupé, ou jour d'arrivée après 12 h : on ne remet les consignes que si
              // elles ont été montées.
              try {
                const status = await getDeviceStatus(device.did);
                const actualCft = status.cft_temp as number | undefined;
                const actualEco = status.eco_temp as number | undefined;
                if (
                  (actualCft !== undefined && actualCft > zone.cftTemp) ||
                  (actualEco !== undefined && actualEco > zone.ecoTemp)
                ) {
                  await setDeviceTemperatures(device.did, zone.cftTemp, zone.ecoTemp);
                  actions.push(`${device.name}: ${targetMode} (temp reset)`);
                } else {
                  actions.push(`${device.name}: ${targetMode}`);
                }
              } catch {
                actions.push(`${device.name}: ${targetMode}`);
              }
            } else {
              // Not occupied: always reset
              await setDeviceTemperatures(device.did, zone.cftTemp, zone.ecoTemp);
              actions.push(`${device.name}: ${targetMode} (temp reset)`);
            }
          } else {
            actions.push(`${device.name}: ${targetMode}`);
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          failures.push(`${device.name}: ${msg}`);
          console.error(`Heating reset error for ${device.name}:`, e);
        }

        await sleep(100);
      }
    }

    await reportCronRun("heating-reset", "Reset du chauffage", sendHeatingAlert, null).catch(() => {});
    return NextResponse.json({
      success: true,
      actions,
      failures,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await reportCronRun("heating-reset", "Reset du chauffage", sendHeatingAlert, message).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
