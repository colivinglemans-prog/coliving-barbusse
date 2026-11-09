import { NextRequest, NextResponse } from "next/server";
import { getWaterHeaterStatus, getDeviceURLs, getRawStates } from "@/lib/cozytouch";
import { guard } from "@/lib/auth";
import { isPeak } from "@/lib/cozytouch";
import { nowParis } from "@sejour/socle/lib/time";

export async function GET(request: NextRequest) {
  const refus = await guard.deny(request, ["admin", "viewer"]);
  if (refus) return refus;

  try {
    const status = await getWaterHeaterStatus();

    // Temporary debug: include raw state names to diagnose
    let debug: unknown = undefined;
    try {
      const { deviceURL } = await getDeviceURLs();
      const rawStates = await getRawStates(deviceURL);
      debug = rawStates.map((s: { name: string; value: unknown }) => ({
        name: s.name,
        value: s.value,
      }));
    } catch { /* ignore */ }

    // Heure de pic : le thermo doit être en Absence (délestage, 2026-11-09).
    const paris = nowParis();
    const peak = isPeak(paris.getHours(), paris.getMinutes());

    return NextResponse.json({
      status,
      peak,
      debug,
      seriesNote:
        "Le ballon thermodynamique préchauffe l'eau en amont du ballon classique. La température affichée est celle du ballon thermo.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
