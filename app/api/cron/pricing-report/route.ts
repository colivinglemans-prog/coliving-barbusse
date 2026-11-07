import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { addDays } from "@sejour/socle/lib/dates";
import { sendNtfy } from "@sejour/socle/lib/ntfy";
import { todayParis } from "@sejour/socle/lib/time";
import { getStays } from "@/lib/bookings";
import { LE_MANS_EVENTS } from "@/lib/events";
import { loadSnapshots } from "@/lib/pricing/snapshot";
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
    const [snapshots, stays] = await Promise.all([
      loadSnapshots(today, 8),
      // Depuis le 1er janvier de l'an dernier (CA à date comparé, rythme de remplissage),
      // jusqu'au bout de l'horizon des photos.
      getStays({
        departureFrom: `${Number(today.slice(0, 4)) - 1}-01-01`,
        arrivalTo: addDays(today, 400),
      }),
    ]);
    const report = buildWeeklyReport({ today, snapshots, stays, events: LE_MANS_EVENTS });
    const message = formatWeeklyReport(report);

    if (dry) return NextResponse.json({ success: true, sent: false, message, report });

    if (!process.env.NTFY_TOPIC) {
      return NextResponse.json({ error: "NTFY_TOPIC is not set", message }, { status: 500 });
    }
    await sendNtfy(message, {
      title: `Pricing — semaine du ${addDays(today, -7)}`,
      priority: 2,
      tags: ["chart_with_upwards_trend"],
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
