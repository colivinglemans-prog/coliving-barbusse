import { NextRequest, NextResponse } from "next/server";
import { getWaterHeaterStatus } from "@/lib/cozytouch";
import { guard } from "@/lib/auth";
import { isPeak } from "@/lib/cozytouch";
import { nowParis } from "@sejour/socle/lib/time";

export async function GET(request: NextRequest) {
  const refus = await guard.deny(request, ["admin", "viewer"]);
  if (refus) return refus;

  try {
    const status = await getWaterHeaterStatus();

    // Plus d'états bruts Cozytouch dans la réponse (2026-11-20) : le bloc de diagnostic
    // temporaire les servait au viewer, alors que la page n'en lisait rien.
    // Heure de pic : le thermo doit être en Absence (délestage, 2026-11-09).
    const paris = nowParis();
    const peak = isPeak(paris.getHours(), paris.getMinutes());

    return NextResponse.json({
      status,
      peak,
      seriesNote:
        "Le ballon thermodynamique préchauffe l'eau en amont du ballon classique. La température affichée est celle du ballon thermo.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
