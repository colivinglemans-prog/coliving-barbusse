import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import {
  getWaterHeaterStatus,
  getWaterHeaterProfile,
  getProfileSettings,
} from "@/lib/cozytouch";
import { getActiveBookings, countGuests } from "@/lib/bookings";
import { sendWaterHeaterAlert } from "@/lib/email";
import { todayParis, currentHourParis, nowParis } from "@/lib/time";

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = todayParis();
    const currentHour = currentHourParis();

    const [bookings, status] = await Promise.all([
      getActiveBookings(),
      getWaterHeaterStatus(),
    ]);

    const guests = countGuests(bookings, today, currentHour);
    const profile = getWaterHeaterProfile(guests);
    const expected = getProfileSettings(profile, currentHour);

    const issues: string[] = [];

    if (!status.isAvailable) {
      issues.push("Ballon thermodynamique hors ligne (aucun état remonté).");
    }

    if (status.mode !== expected.mode) {
      issues.push(
        `Mode divergent : attendu ${expected.mode}, constaté ${status.mode}.`,
      );
    }

    if (status.targetTemperature !== expected.targetTemperature) {
      issues.push(
        `Consigne divergente : attendue ${expected.targetTemperature}°C, constatée ${status.targetTemperature}°C.`,
      );
    }

    if (status.boostActive !== expected.boost) {
      issues.push(
        `Boost divergent : attendu ${expected.boost ? "on" : "off"}, constaté ${status.boostActive ? "on" : "off"}.`,
      );
    }

    // Under-heating check: only meaningful when occupied
    if (
      guests > 0 &&
      status.isAvailable &&
      status.bottomTemperature > 0 &&
      status.bottomTemperature < status.targetTemperature - 8
    ) {
      issues.push(
        `Ballon en sous-chauffe : ${status.bottomTemperature}°C (consigne ${status.targetTemperature}°C) avec ${guests} personne(s) présente(s).`,
      );
    }

    if (issues.length > 0) {
      const lines = [
        ...issues,
        "",
        `Profil attendu : ${profile} (${guests} personne(s))`,
        `Vérification : ${today} à ${nowParis().toLocaleTimeString("fr-FR")}`,
      ];
      await sendWaterHeaterAlert(
        `${issues.length} alerte(s) ballon thermodynamique`,
        lines.join("\n"),
      );
    }

    return NextResponse.json({
      success: true,
      profile,
      guests,
      expected,
      status: {
        mode: status.mode,
        targetTemperature: status.targetTemperature,
        boostActive: status.boostActive,
        bottomTemperature: status.bottomTemperature,
        isAvailable: status.isAvailable,
      },
      issues,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await sendWaterHeaterAlert(
      "Erreur health check eau chaude",
      `Le health check du ballon thermodynamique a rencontré une erreur :\n\n${message}`,
    ).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
