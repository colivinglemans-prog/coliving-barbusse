import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  getFullZoneConfig,
  getLockedDevices,
  saveLockedDevices,
  setDeviceMode,
  getOccupiedMode,
  getBetweenReservationsMode,
} from "@/lib/heatzy";
import { getActiveBookings } from "@/lib/bookings";
import { sendHeatingAlert } from "@/lib/email";
import { todayParis, tomorrowParis, currentHourParis } from "@/lib/time";

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
    const tomorrow = tomorrowParis();
    const currentHour = currentHourParis();

    const allBookings = await getActiveBookings();

    const actions: string[] = [];
    const lockedDevices = await getLockedDevices();

    const hasCheckInToday = allBookings.some((b) => b.arrival === today);
    const hasCheckOutToday = allBookings.some((b) => b.departure === today);
    const hasCheckInTomorrow = allBookings.some((b) => b.arrival === tomorrow);
    const isCurrentlyOccupied = allBookings.some(
      (b) =>
        (b.arrival < today && b.departure > today) ||
        (b.arrival === today && b.departure > today && currentHour >= 17),
    );
    // Same-day turnaround: checkout AND checkin on the same day
    const hasSameDayTurnaround = hasCheckOutToday && hasCheckInToday;

    // Unlock all devices at checkout (end of reservation)
    if (hasCheckOutToday && !isCurrentlyOccupied && lockedDevices.size > 0) {
      await saveLockedDevices(new Set());
      actions.push(`Déverrouillage de ${lockedDevices.size} device(s) (fin de réservation)`);
      lockedDevices.clear();
    }

    for (const zone of config.zones) {
      for (const device of zone.devices) {
        const did = device.did;

        // Skip locked devices
        if (lockedDevices.has(did)) {
          actions.push(`${device.name}: ignoré (verrouillé)`);
          continue;
        }

        // Pre-heating: check-in today (guests arrive at 17h)
        // 12h-15h: éco (progressive warm-up, avoids tripping breakers)
        // 15h+: confort (final warm-up before arrival)
        if (hasCheckInToday && currentHour >= 15 && !isCurrentlyOccupied && !hasSameDayTurnaround) {
          await setDeviceMode(did, "cft");
          actions.push(`${device.name}: pré-chauffage confort (arrivée aujourd'hui)`);
          await sleep(100);
          continue;
        }
        if (hasCheckInToday && currentHour >= 12 && currentHour < 15 && !isCurrentlyOccupied && !hasSameDayTurnaround) {
          await setDeviceMode(did, "eco");
          actions.push(`${device.name}: pré-chauffage éco (montée progressive)`);
          await sleep(100);
          continue;
        }
        // Check-in today but before pre-heating window -> frost protection
        if (hasCheckInToday && currentHour < 12 && !isCurrentlyOccupied && !hasSameDayTurnaround) {
          await setDeviceMode(did, "fro");
          actions.push(`${device.name}: hors-gel (arrivée aujourd'hui, avant pré-chauffage)`);
          await sleep(100);
          continue;
        }

        // Currently occupied -> zone-aware mode (nightMode for RDC 0h-5h)
        if (isCurrentlyOccupied) {
          const mode = getOccupiedMode(zone, currentHour);
          await setDeviceMode(did, mode);
          actions.push(`${device.name}: ${mode} (occupé)`);
          await sleep(100);
          continue;
        }

        // Same-day turnaround: éco during 9h-17h, fro otherwise
        if (hasSameDayTurnaround) {
          const mode = getBetweenReservationsMode(currentHour);
          await setDeviceMode(did, mode);
          actions.push(`${device.name}: ${mode} (entre deux réservations)`);
          await sleep(100);
          continue;
        }

        // Check-out today, no following check-in -> frost protection
        if (hasCheckOutToday) {
          await setDeviceMode(did, "fro");
          actions.push(`${device.name}: hors-gel (départ)`);
          await sleep(100);
          continue;
        }
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
      "Erreur automation chauffage",
      `L'automation du chauffage a rencontré une erreur :\n\n${message}`,
    ).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
