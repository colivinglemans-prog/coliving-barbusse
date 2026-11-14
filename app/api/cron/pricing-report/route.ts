import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { addDays } from "@sejour/socle/lib/dates";
import { sendNtfy } from "@/lib/ntfy";
import { todayParis } from "@sejour/socle/lib/time";
import { getStays } from "@/lib/bookings";
import { LE_MANS_EVENTS } from "@/lib/events";
import { compareEngine, formatEngineComparison } from "@/lib/pricing/engine-comparison";
import { ENGINE_CONFIG } from "@/lib/pricing/engine-config";
import { loadShadows, loadSnapshots } from "@/lib/pricing/snapshot";
import { buildWeeklyReport, formatWeeklyReport } from "@/lib/pricing/weekly-report";

/**
 * Rapport hebdomadaire d'évaluation du pricing, envoyé sur ntfy. À appeler le lundi matin,
 * **après** la photo du jour (`/api/cron/pricing-snapshot`).
 *
 * `?dry=1` rend le rapport sans l'envoyer, et accepte alors `&today=YYYY-MM-DD` pour le
 * calculer à une autre date (les photos de cette date doivent exister).
 *
 * `NTFY_TOPIC` absent vaut un 500, pas un envoi ignoré — même règle que `events-watch` : un
 * rapport qui se tait ressemble exactement à une semaine sans rien à dire.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;
  const dry = params.get("dry") === "1";
  const requested = params.get("today");
  const today =
    dry && requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : todayParis();

  try {
    const [snapshots, shadows, stays] = await Promise.all([
      loadSnapshots(today, 8),
      loadShadows(today, 8),
      // Depuis le 1er janvier de l'an dernier (CA à date comparé, rythme de remplissage),
      // jusqu'au bout de l'horizon des photos.
      getStays({
        departureFrom: `${Number(today.slice(0, 4)) - 1}-01-01`,
        arrivalTo: addDays(today, 400),
      }),
    ]);
    const report = buildWeeklyReport({ today, snapshots, stays, events: LE_MANS_EVENTS });
    const comparison = compareEngine({
      today,
      snapshots,
      shadows,
      events: LE_MANS_EVENTS,
      config: ENGINE_CONFIG,
    });
    const message = [formatWeeklyReport(report), formatEngineComparison(comparison)].join("\n");

    if (dry) return NextResponse.json({ success: true, sent: false, message, report, comparison });

    if (!process.env.NTFY_TOPIC) {
      return NextResponse.json({ error: "NTFY_TOPIC is not set", message }, { status: 500 });
    }
    await sendNtfy(message, {
      title: `Pricing — semaine du ${addDays(today, -7)}`,
      priority: 2,
      tags: ["chart_with_upwards_trend"],
      // URL nue : le sujet ntfy n'est pas authentifié, aucun jeton ni donnée en paramètre.
      click: "https://www.coliving-barbusse.fr/dashboard/pricing",
    });
    return NextResponse.json({ success: true, sent: true, message });
  } catch (err) {
    console.error("[pricing-report]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
