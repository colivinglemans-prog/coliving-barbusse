import { NextRequest, NextResponse } from "next/server";
import { addDays, daysBetween } from "@sejour/socle/lib/dates";
import { todayParis } from "@sejour/socle/lib/time";
import { guard } from "@/lib/auth";
import { loadShadowsOn, loadSnapshotsOn } from "@/lib/pricing/snapshot";

/**
 * Évolution du prix affiché sur une plage de nuits, photo après photo — **administrateur
 * seulement**, lecture seule.
 *
 * `?from=YYYY-MM-DD&to=YYYY-MM-DD` : nuits de `from` à `to` incluses, 14 au plus (un
 * événement tient dedans). Pour chaque photo depuis le premier relevé (120 au plus), la route
 * rend le prix moyen Beyond et moteur sur ces nuits, et si toutes étaient encore vendables.
 * La réduction se fait ici : le client ne reçoit jamais les photos entières.
 */
const FIRST_SNAPSHOT = "2026-11-07";
const MAX_NIGHTS = 14;
const MAX_PHOTOS = 120;
const NO_STORE = { "Cache-Control": "private, no-store" };
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest) {
  const refus = await guard.denyNonAdmin(request);
  if (refus) return refus;

  const params = request.nextUrl.searchParams;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  if (!DATE.test(from) || !DATE.test(to) || to < from || daysBetween(from, to) >= MAX_NIGHTS) {
    return NextResponse.json(
      { error: `Plage de nuits invalide (${MAX_NIGHTS} nuits au plus).` },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const today = todayParis();
    const start = daysBetween(FIRST_SNAPSHOT, today) >= MAX_PHOTOS
      ? addDays(today, -(MAX_PHOTOS - 1))
      : FIRST_SNAPSHOT;
    const photos: string[] = [];
    for (let d = start; d <= today; d = addDays(d, 1)) photos.push(d);
    const nights: string[] = [];
    for (let d = from; d <= to; d = addDays(d, 1)) nights.push(d);

    const [snaps, shadows] = await Promise.all([loadSnapshotsOn(photos), loadShadowsOn(photos)]);
    const points = photos.flatMap((photo, i) => {
      const snap = snaps[i].snapshot;
      if (!snap) return [];
      const present = nights.filter((n) => snap.days[n]);
      if (present.length === 0) return [];
      const shadow = shadows[i].shadow;
      const engine = present.flatMap((n) => (shadow?.days[n] ? [shadow.days[n][0]] : []));
      return [
        {
          photo,
          beyond: Math.round(present.reduce((s, n) => s + snap.days[n][0], 0) / present.length),
          engine: engine.length ? Math.round(engine.reduce((s, p) => s + p, 0) / engine.length) : null,
          available: present.every((n) => snap.days[n][2] === 1),
        },
      ];
    });
    return NextResponse.json({ from, to, points }, { headers: NO_STORE });
  } catch (err) {
    console.error("[dashboard/pricing/history]", err);
    return NextResponse.json(
      { error: "L'historique des prix est indisponible pour le moment." },
      { status: 500, headers: NO_STORE },
    );
  }
}
