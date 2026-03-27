import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getZoneConfig, setDeviceMode } from "@/lib/heatzy";
import { getBookings } from "@/lib/beds24";
import { sendHeatingAlert } from "@/lib/email";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
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
    const tomorrow = tomorrowStr();
    const currentHour = new Date().getHours();

    // Fetch bookings for today and tomorrow
    const bookings = await getBookings({
      arrivalFrom: today,
      arrivalTo: tomorrow,
      departureFrom: today,
      departureTo: tomorrow,
    });

    // Also fetch active bookings (started before today, ending today or later)
    const activeBookings = await getBookings({
      arrivalTo: today,
      departureFrom: today,
    });

    const allBookings = [...bookings, ...activeBookings].filter(
      (b, i, arr) => arr.findIndex((x) => x.id === b.id) === i,
    );

    const actions: string[] = [];

    for (const [roomKey, mapping] of Object.entries(config.roomMapping)) {
      const hasCheckInToday = allBookings.some((b) => b.arrival === today);
      const hasCheckOutToday = allBookings.some((b) => b.departure === today);
      const hasCheckInTomorrow = allBookings.some((b) => b.arrival === tomorrow);
      const isCurrentlyOccupied = allBookings.some(
        (b) => b.arrival <= today && b.departure > today,
      );
      const hasFollowingCheckIn = allBookings.some(
        (b) => b.arrival === today && hasCheckOutToday,
      );

      // 7h-20h = presence, 20h-7h = confort (for occupied rooms)
      const isDaytime = currentHour >= 7 && currentHour < 20;
      const occupiedMode = isDaytime ? "presence" : "cft";

      for (const did of mapping.deviceIds) {
        // Pre-heating: check-in tomorrow and it's after 15h -> always confort (warm up)
        if (hasCheckInTomorrow && currentHour >= 15 && !isCurrentlyOccupied) {
          await setDeviceMode(did, "cft");
          actions.push(`${roomKey}/${did}: pré-chauffage confort (arrivée demain)`);
          await sleep(100);
          continue;
        }

        // Check-in today or occupied -> presence (day) or confort (night)
        if (hasCheckInToday || isCurrentlyOccupied) {
          await setDeviceMode(did, occupiedMode);
          actions.push(`${roomKey}/${did}: ${occupiedMode} (occupé)`);
          await sleep(100);
          continue;
        }

        // Check-out today with no following check-in -> frost protection
        if (hasCheckOutToday && !hasFollowingCheckIn) {
          await setDeviceMode(did, "fro");
          actions.push(`${roomKey}/${did}: hors-gel (départ sans arrivée suivante)`);
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
