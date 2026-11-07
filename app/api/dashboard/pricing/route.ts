import { NextRequest, NextResponse } from "next/server";
import { addDays } from "@sejour/socle/lib/dates";
import { todayParis } from "@sejour/socle/lib/time";
import { guard } from "@/lib/auth";
import { getStays } from "@/lib/bookings";
import { LE_MANS_EVENTS } from "@/lib/events";
import {
  buildPricingPayload,
  mondaysUntil,
} from "@/lib/pricing/dashboard-payload";
import { computeEnginePrices } from "@/lib/pricing/engine";
import { compareEngine } from "@/lib/pricing/engine-comparison";
import { ENGINE_CONFIG } from "@/lib/pricing/engine-config";
import {
  loadShadows,
  loadShadowsOn,
  loadSnapshots,
  loadSnapshotsOn,
} from "@/lib/pricing/snapshot";
import { buildWeeklyReport } from "@/lib/pricing/weekly-report";

/**
 * Données de la page `/dashboard/pricing` — **administrateur seulement**, lecture seule.
 *
 * Trois portes, comme les autres routes financières : le proxy (la route n'est **pas** dans
 * `allowedPaths`, et ne doit jamais y être), `denyNonAdmin` ici, et une projection en liste
 * blanche des réservations (`PricingBookingItem`).
 *
 * Si la photo du jour manque (page ouverte avant le cron, ou cron en échec), on retombe sur la
 * dernière présente dans les 8 derniers jours ; la réponse dit laquelle (`snapshotDate`).
 *
 * `?today=YYYY-MM-DD` permet de relire la page à une date passée.
 */
const NO_STORE = { "Cache-Control": "private, no-store" };

export async function GET(request: NextRequest) {
  const refus = await guard.denyNonAdmin(request);
  if (refus) return refus;

  const requested = request.nextUrl.searchParams.get("today");
  const today = requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : todayParis();

  try {
    const mondays = mondaysUntil(today);
    const [snapshots, shadows, stays, mondaySnaps, mondayShadows] = await Promise.all([
      loadSnapshots(today, 8),
      loadShadows(today, 8),
      getStays({
        departureFrom: `${Number(today.slice(0, 4)) - 1}-01-01`,
        arrivalTo: addDays(today, 400),
      }),
      loadSnapshotsOn(mondays),
      loadShadowsOn(mondays),
    ]);

    const latest = [...snapshots].reverse().find((s) => s.snapshot);
    if (!latest?.snapshot) {
      return NextResponse.json(
        { error: "Aucune photo des prix sur les 8 derniers jours." },
        { status: 404, headers: NO_STORE },
      );
    }
    const snapDate = latest.date;
    const shadow = shadows.find((s) => s.date === snapDate)?.shadow ?? null;

    const report = buildWeeklyReport({ today: snapDate, snapshots, stays, events: LE_MANS_EVENTS });
    const comparison = compareEngine({
      today: snapDate,
      snapshots,
      shadows,
      events: LE_MANS_EVENTS,
      config: ENGINE_CONFIG,
    });

    const engine = computeEnginePrices({
      today: snapDate,
      nights: Object.fromEntries(
        Object.entries(latest.snapshot.days).map(([d, v]) => [d, v[2] === 1]),
      ),
      events: LE_MANS_EVENTS,
      config: ENGINE_CONFIG,
    });
    const reasons = Object.fromEntries(Object.entries(engine).map(([d, n]) => [d, n.reasons]));

    const trend = mondays.map((date, i) => ({
      date,
      within10Pct:
        compareEngine({
          today: date,
          snapshots: [mondaySnaps[i]],
          shadows: [mondayShadows[i]],
          events: LE_MANS_EVENTS,
          config: ENGINE_CONFIG,
        })?.within10Pct ?? null,
    }));

    const payload = buildPricingPayload({
      today,
      snapshot: latest.snapshot,
      shadow,
      stays,
      events: LE_MANS_EVENTS,
      config: ENGINE_CONFIG,
      report,
      comparison,
      reasons,
      trend,
    });
    return NextResponse.json(payload, { headers: NO_STORE });
  } catch (err) {
    console.error("[dashboard/pricing]", err);
    return NextResponse.json(
      { error: "Les données de pricing sont indisponibles pour le moment." },
      { status: 500, headers: NO_STORE },
    );
  }
}
