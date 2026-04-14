import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  getFullZoneConfig,
  getLockedDevices,
  setDeviceMode,
  setDeviceTemperatures,
  getDeviceStatus,
  getOccupiedMode,
} from "@/lib/heatzy";
import { getBookings } from "@/lib/beds24";
import { sendHeatingAlert } from "@/lib/email";
import { todayParis, currentHourParis } from "@/lib/time";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await getFullZoneConfig();
    const today = todayParis();
    const currentHour = currentHourParis();

    const [activeBookings, lockedDevices] = await Promise.all([
      getBookings({ arrivalTo: today, departureFrom: today }),
      getLockedDevices(),
    ]);

    // Build set of occupied device IDs
    const occupiedDeviceIds = new Set<string>();
    for (const mapping of Object.values(config.roomMapping)) {
      const isOccupied = activeBookings.some(
        (b) =>
          (b.arrival < today && b.departure > today) ||
          (b.arrival === today && b.departure > today && currentHour >= 17),
      );
      if (isOccupied) {
        for (const did of mapping.deviceIds) {
          occupiedDeviceIds.add(did);
        }
      }
    }
    const actions: string[] = [];

    // Process all devices: set mode + temperatures
    for (const zone of config.zones) {
      for (const device of zone.devices) {
        if (lockedDevices.has(device.did)) {
          actions.push(`${device.name}: ignoré (verrouillé)`);
          continue;
        }

        const isOccupied = occupiedDeviceIds.has(device.did);
        const targetMode = isOccupied
          ? getOccupiedMode(zone, currentHour)
          : device.defaultMode;

        // Set mode
        await setDeviceMode(device.did, targetMode);

        // Reset temperatures
        if (zone.cftTemp && zone.ecoTemp) {
          if (isOccupied) {
            // Only reset if guest INCREASED the temperature
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

        await sleep(100);
      }
    }

    return NextResponse.json({
      success: true,
      actions,
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
