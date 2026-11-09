import { NextRequest, NextResponse } from "next/server";
import {
  setAbsenceMode,
  setDHWMode,
  setBoostMode,
  setTargetTemperature,
  refreshState,
} from "@/lib/cozytouch";
import type { CozytouchDHWMode } from "@/lib/types";
import { auth, guard } from "@/lib/auth";
import { isPeak } from "@/lib/cozytouch";
import { nowParis } from "@sejour/socle/lib/time";

/** Modes qui laissent tourner l'appoint électrique de 1 800 W. */
const BOOSTER_MODES: ReadonlySet<CozytouchDHWMode> = new Set(["autoMode", "manualEcoInactive"]);

/**
 * Commande manuelle qui rallumerait l'appoint (boost, Éco+, Performance) : refusée aux heures
 * de pic (`PEAK_WINDOWS`), où le thermo doit être en Absence (coupures des 7-9/11/2026 à 9 kVA).
 * L'admin peut passer outre avec `force: true` ; l'automation reprend la main à son passage suivant.
 */
async function boosterRefusal(request: NextRequest, force: boolean): Promise<NextResponse | null> {
  const paris = nowParis();
  if (!isPeak(paris.getHours(), paris.getMinutes())) return null;
  if (force && (await guard.role(request)) === auth.adminRole) return null;
  return NextResponse.json(
    {
      error:
        "Heure de pic (4 h 45-7 h, 16 h 45-22 h) : le thermo est en Absence pour ne pas dépasser la puissance souscrite. Le ballon classique fournit l'eau chaude.",
      refused: "booster",
    },
    { status: 409 },
  );
}

const VALID_MODES: CozytouchDHWMode[] = ["autoMode", "manualEcoActive", "manualEcoInactive"];

export async function POST(request: NextRequest) {
  const refus = await guard.deny(request, ["admin", "viewer"]);
  if (refus) return refus;

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "setMode": {
        const { mode } = body;
        if (!VALID_MODES.includes(mode)) {
          return NextResponse.json({ error: `Invalid mode: ${mode}` }, { status: 400 });
        }
        if (BOOSTER_MODES.has(mode)) {
          const refusal = await boosterRefusal(request, body.force === true);
          if (refusal) return refusal;
        }
        await setDHWMode(mode);
        return NextResponse.json({ success: true, action: "setMode", mode });
      }

      case "setBoost": {
        const on = body.on !== false && body.on !== 0;
        if (on) {
          const refusal = await boosterRefusal(request, body.force === true);
          if (refusal) return refusal;
        }
        await setBoostMode(on);
        return NextResponse.json({ success: true, action: "setBoost", on });
      }

      case "setTemperature": {
        const temp = Number(body.temperature);
        if (isNaN(temp) || temp < 40 || temp > 62) {
          return NextResponse.json({ error: "Temperature must be 40-62°C" }, { status: 400 });
        }
        await setTargetTemperature(temp);
        return NextResponse.json({ success: true, action: "setTemperature", temp });
      }

      case "setAbsence": {
        // Lever l'Absence au pic rallume la chauffe (et l'appoint) : même règle que le boost.
        const on = body.on !== false && body.on !== 0;
        if (!on) {
          const refusal = await boosterRefusal(request, body.force === true);
          if (refusal) return refusal;
        }
        await setAbsenceMode(on);
        return NextResponse.json({ success: true, action: "setAbsence", on });
      }

      case "refresh": {
        await refreshState();
        return NextResponse.json({ success: true, action: "refresh" });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
