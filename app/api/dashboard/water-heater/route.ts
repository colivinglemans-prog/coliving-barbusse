import { NextRequest, NextResponse } from "next/server";
import { getWaterHeaterStatus, getDeviceURLs, getRawStates } from "@/lib/cozytouch";
import { guard } from "@/lib/auth";
import { readBoosterMemo } from "@/lib/water-heater-log";
import { BOOSTER_REASON_LABEL, type BoosterReason } from "@/lib/cozytouch";

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

    // Décision d'appoint du dernier passage de l'automation (délestage, 2026-11-09).
    const memo = await readBoosterMemo();
    const booster = memo
      ? {
          allowed: memo.allowed,
          reason: BOOSTER_REASON_LABEL[memo.reason as BoosterReason] ?? memo.reason,
          radiatorLoadW: memo.radiatorLoadW,
          budgetW: memo.budgetW,
          at: memo.at,
        }
      : null;

    return NextResponse.json({
      status,
      booster,
      debug,
      seriesNote:
        "Le ballon thermodynamique préchauffe l'eau en amont du ballon classique. La température affichée est celle du ballon thermo.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
