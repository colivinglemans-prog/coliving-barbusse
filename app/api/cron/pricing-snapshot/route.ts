import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { addDays } from "@sejour/socle/lib/dates";
import { todayParis } from "@sejour/socle/lib/time";
import {
  diffSnapshots,
  loadSnapshot,
  saveSnapshot,
  takeSnapshot,
} from "@/lib/pricing/snapshot";

/**
 * Photo quotidienne du calendrier tarifaire Beds24 (prix, séjour minimum, dispo sur 540 j).
 * Voir `lib/pricing/snapshot.ts` pour le pourquoi : Beds24 ne garde aucun historique des prix
 * que Beyond y pousse.
 *
 * À appeler une fois par jour, de préférence tôt le matin (Beyond pousse la nuit). Deux
 * appels le même jour écrasent la photo du jour : c'est voulu, la dernière fait foi.
 *
 * `?dry=1` relève et compare sans rien écrire.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dry = request.nextUrl.searchParams.get("dry") === "1";
  const today = todayParis();

  try {
    const snapshot = await takeSnapshot(today);
    const yesterday = await loadSnapshot(addDays(today, -1));
    if (!dry) await saveSnapshot(snapshot);

    const diff = yesterday ? diffSnapshots(yesterday, snapshot) : null;
    return NextResponse.json({
      success: true,
      dry,
      date: today,
      days: Object.keys(snapshot.days).length,
      vsYesterday: diff && {
        priceChanges: diff.priceChanges.length,
        minStayChanges: diff.minStayChanges.length,
        sold: diff.sold,
        released: diff.released,
      },
    });
  } catch (err) {
    console.error("[pricing-snapshot]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
