import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  getZoneConfig,
  setDeviceMode,
  setDeviceTemperatures,
  getDeviceStatus,
} from "@/lib/heatzy";
import { getBookings } from "@/lib/beds24";
import { sendHeatingAlert } from "@/lib/email";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = getZoneConfig();
    const today = todayStr();

    // Fetch active bookings (overlapping today)
    const activeBookings = await getBookings({
      arrivalTo: today,
      departureFrom: today,
    });

    // Build set of occupied device IDs
    const occupiedDeviceIds = new Set<string>();
    for (const mapping of Object.values(config.roomMapping)) {
      const isOccupied = activeBookings.some(
        (b) => b.arrival <= today && b.departure > today,
      );
      if (isOccupied) {
        for (const did of mapping.deviceIds) {
          occupiedDeviceIds.add(did);
        }
      }
    }

    // 7h-20h = presence, 20h-7h = confort (for occupied rooms)
    const currentHour = new Date().getHours();
    const isDaytime = currentHour >= 7 && currentHour < 20;
    const occupiedMode = isDaytime ? "presence" : "cft";

    const actions: string[] = [];
    const failures: string[] = [];

    for (const zone of config.zones) {
      for (const device of zone.devices) {
        const targetMode = occupiedDeviceIds.has(device.did)
          ? occupiedMode
          : device.defaultMode;

        await setDeviceMode(device.did, targetMode);
        await sleep(200);

        // Reset temperatures to zone defaults
        if (zone.cftTemp && zone.ecoTemp) {
          await setDeviceTemperatures(device.did, zone.cftTemp, zone.ecoTemp);
          await sleep(200);
        }

        actions.push(`${device.name}: ${targetMode}`);
      }
    }

    // Wait for devices to apply changes, then verify
    await sleep(3000);

    for (const zone of config.zones) {
      if (!zone.cftTemp || !zone.ecoTemp) continue;
      for (const device of zone.devices) {
        try {
          const status = await getDeviceStatus(device.did);
          const actualCft = status.cft_temp as number | undefined;
          const actualEco = status.eco_temp as number | undefined;

          if (actualCft !== undefined && actualCft !== zone.cftTemp) {
            failures.push(
              `${device.name}: température confort ${actualCft / 10}°C au lieu de ${zone.cftTemp / 10}°C — commande non appliquée`,
            );
          }
          if (actualEco !== undefined && actualEco !== zone.ecoTemp) {
            failures.push(
              `${device.name}: température éco ${actualEco / 10}°C au lieu de ${zone.ecoTemp / 10}°C — commande non appliquée`,
            );
          }
        } catch {
          failures.push(`${device.name}: impossible de vérifier le statut`);
        }
      }
    }

    // Send alert if some devices didn't apply the changes
    if (failures.length > 0) {
      const lines = [
        `Le reset chauffage a détecté ${failures.length} problème(s) :`,
        "",
        ...failures.map((f) => `  - ${f}`),
        "",
        "Ces radiateurs nécessitent probablement une intervention sur place",
        "(boîtier mal configuré, éteint, ou pas en mode fil pilote).",
        "",
        `Reset effectué le ${today} à ${new Date().toLocaleTimeString("fr-FR")}`,
      ];
      await sendHeatingAlert(
        `${failures.length} radiateur(s) ne répondent pas aux commandes`,
        lines.join("\n"),
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      actions,
      failures,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await sendHeatingAlert(
      "Erreur reset chauffage",
      `Le reset périodique du chauffage a rencontré une erreur :\n\n${message}`,
    ).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
