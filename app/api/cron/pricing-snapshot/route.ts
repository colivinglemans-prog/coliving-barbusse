import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { addDays } from "@sejour/socle/lib/dates";
import { todayParis } from "@sejour/socle/lib/time";
import { LE_MANS_EVENTS } from "@/lib/events";
import { computeEnginePrices } from "@/lib/pricing/engine";
import { ENGINE_CONFIG } from "@/lib/pricing/engine-config";
import {
  diffSnapshots,
  loadSnapshot,
  saveShadow,
  saveSnapshot,
  takeSnapshot,
  type ShadowPrices,
} from "@/lib/pricing/snapshot";

/**
 * Photo quotidienne du calendrier tarifaire Beds24 (prix, séjour minimum, dispo sur 365 j),
 * et prix que le moteur maison aurait affichés le même jour (simulation, rien n'est envoyé).
 * Voir `lib/pricing/snapshot.ts` et `lib/pricing/engine.ts`.
 *
 * À appeler une fois par jour, de préférence tôt le matin (Beyond pousse la nuit). Deux
 * appels le même jour écrasent la photo du jour : c'est voulu, la dernière fait foi.
 *
 * `?dry=1` relève, calcule et compare sans rien écrire.
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

    const engine = computeEnginePrices({
      today,
      nights: Object.fromEntries(Object.entries(snapshot.days).map(([d, v]) => [d, v[2] === 1])),
      events: LE_MANS_EVENTS,
      config: ENGINE_CONFIG,
    });
    const shadow: ShadowPrices = {
      date: today,
      days: Object.fromEntries(Object.entries(engine).map(([d, n]) => [d, [n.price, n.minStay]])),
    };

    if (!dry) await Promise.all([saveSnapshot(snapshot), saveShadow(shadow)]);

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
      ...(dry && { engine }),
    });
  } catch (err) {
    console.error("[pricing-snapshot]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
