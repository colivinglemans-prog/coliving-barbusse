import { NextRequest, NextResponse } from "next/server";
import { getLockedDevices, getLockUntil, saveLockedDevices, setDeviceMode, setLockUntil } from "@/lib/heatzy";
import { getBookingsWithArchive } from "@/lib/bookings";
import { lockUntilFor } from "@/lib/heating-locks";
import { isExcludedStatus } from "@sejour/socle/lib/booking-status";
import { todayParis } from "@sejour/socle/lib/time";
import { guard } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const refus = await guard.deny(request, ["admin", "viewer"]);
  if (refus) return refus;

  const [locked, until] = await Promise.all([getLockedDevices(), getLockUntil()]);
  return NextResponse.json({ lockedDevices: [...locked], lockedUntil: until });
}

/** Le prochain séjour peut être loin : on regarde six mois devant. */
const LOOKAHEAD_DAYS = 183;

function addDays(day: string, days: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Date de fin du verrou posé maintenant (`lib/heating-locks.ts`). Beds24 illisible → `null` :
 * le verrou est posé quand même, il suivra la règle des verrous sans date.
 */
async function untilForNewLock(): Promise<string | null> {
  const today = todayParis();
  try {
    const bookings = await getBookingsWithArchive({
      departureFrom: today,
      arrivalTo: addDays(today, LOOKAHEAD_DAYS),
    });
    return lockUntilFor(bookings.filter((b) => !isExcludedStatus(b.status)), today);
  } catch (e) {
    console.error("Lock: bookings unreadable, lock without end date:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const refus = await guard.deny(request, ["admin", "viewer"]);
  if (refus) return refus;

  try {
    const body = await request.json();
    const { deviceId, lock } = body as { deviceId: string; lock: boolean };

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    // Date de fin d'abord (hachage écrit avant la liste) : un cron qui passerait entre les deux
    // ne doit jamais voir le nouveau verrou sans date et le lever par l'ancienne règle.
    let until: string | null = null;
    try {
      until = lock ? await untilForNewLock() : null;
      if (lock) await setLockUntil(deviceId, until);
    } catch (e) {
      console.error("Lock: end date not saved for", deviceId, e);
    }

    // Sans le cache mémoire : la liste est réécrite juste après.
    const current = await getLockedDevices({ fresh: true });

    if (lock) {
      current.add(deviceId);
    } else {
      current.delete(deviceId);
    }

    // Save lock state (most important — persists even if Heatzy API fails)
    await saveLockedDevices(current);
    if (!lock) await setLockUntil(deviceId, null).catch((e) => console.error("Lock: end date not cleared for", deviceId, e));

    // Then try to set device mode (best effort)
    let modeSet = false;
    if (lock) {
      try {
        await setDeviceMode(deviceId, "fro");
        modeSet = true;
      } catch (e) {
        console.error("Lock: failed to set fro mode on", deviceId, e);
      }
    }

    return NextResponse.json({
      success: true,
      lockedDevices: [...current],
      until,
      modeSet,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Lock route error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
