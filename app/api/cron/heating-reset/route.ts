import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getZoneConfig, setDeviceMode } from "@/lib/heatzy";
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

    const actions: string[] = [];

    for (const zone of config.zones) {
      for (const device of zone.devices) {
        const targetMode = occupiedDeviceIds.has(device.did)
          ? "cft" // Comfort for occupied rooms (presence detection mode when API code is confirmed)
          : device.defaultMode;

        await setDeviceMode(device.did, targetMode);
        actions.push(`${device.name}: ${targetMode}`);
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
