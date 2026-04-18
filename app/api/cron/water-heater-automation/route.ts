import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  getWaterHeaterStatus,
  getWaterHeaterProfile,
  getProfileSettings,
  setDHWMode,
  setBoostMode,
  setTargetTemperature,
} from "@/lib/cozytouch";
import { getActiveBookings, countGuests } from "@/lib/bookings";
import { sendWaterHeaterAlert } from "@/lib/email";
import { todayParis, currentHourParis } from "@/lib/time";

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = todayParis();
    const currentHour = currentHourParis();

    const bookings = await getActiveBookings();
    const guests = countGuests(bookings, today, currentHour);
    const profile = getWaterHeaterProfile(guests);
    const settings = getProfileSettings(profile, currentHour);

    const status = await getWaterHeaterStatus();

    const applied: string[] = [];

    if (status.mode !== settings.mode) {
      await setDHWMode(settings.mode);
      applied.push(`mode ${status.mode} → ${settings.mode}`);
    }

    if (status.targetTemperature !== settings.targetTemperature) {
      await setTargetTemperature(settings.targetTemperature);
      applied.push(
        `consigne ${status.targetTemperature}°C → ${settings.targetTemperature}°C`,
      );
    }

    if (status.boostActive !== settings.boost) {
      await setBoostMode(settings.boost);
      applied.push(`boost ${status.boostActive ? "on" : "off"} → ${settings.boost ? "on" : "off"}`);
    }

    return NextResponse.json({
      success: true,
      profile,
      guests,
      settings,
      applied,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await sendWaterHeaterAlert(
      "Erreur automation eau chaude",
      `L'automation du ballon thermodynamique a rencontré une erreur :\n\n${message}`,
    ).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
