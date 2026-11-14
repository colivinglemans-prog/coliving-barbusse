import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { addDays } from "@sejour/socle/lib/dates";
import { sendNtfy } from "@sejour/socle/lib/ntfy";
import { todayParis } from "@sejour/socle/lib/time";
import { LE_MANS_EVENTS } from "@/lib/events";
import { ENGINE_CONFIG } from "@/lib/pricing/engine-config";
import { lastSaleDate, pricingInsights } from "@/lib/pricing/insights";
import { lastPushRun } from "@/lib/pricing/push";
import { buildReviewAgenda } from "@/lib/pricing/review-agenda";
import { diffSnapshots, loadSnapshots, type SnapshotDiff } from "@/lib/pricing/snapshot";

/**
 * Rappel hebdomadaire « évaluation des prix avec Claude » — chaque mardi vers 8 h (Paris, hiver),
 * par le cron Vercel `0 7 * * 2`. Choix de l'exploitant (2026-11-14) : le mardi, chaque semaine.
 *
 * **Un rappel, pas une alerte** : il part chaque semaine, sans passer par `reportAlerts`, en
 * priorité 3, avec l'ordre du jour et la phrase à copier dans Claude. Un tap ouvre la page Pricing.
 *
 * `?dry=1` rend le texte sans l'envoyer.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dry = request.nextUrl.searchParams.get("dry") === "1";
  const today = todayParis();

  try {
    // 15 photos : la semaine (7 différences) et la recherche de la dernière vente (14 jours).
    const recent = await loadSnapshots(today, 15);
    const present = recent.filter((s) => s.snapshot);
    const diffs: SnapshotDiff[] = [];
    for (let i = 1; i < present.length; i++) diffs.push(diffSnapshots(present[i - 1].snapshot!, present[i].snapshot!));
    const weekStart = addDays(today, -7);
    const weekDiffs = diffs.filter((d) => d.to > weekStart);

    const snapshot = recent.find((s) => s.date === today)?.snapshot ?? present.at(-1)?.snapshot ?? null;
    const todayDiff = diffs.find((d) => d.to === today) ?? null;
    const insights = snapshot
      ? pricingInsights({
          today,
          snapshot,
          diff: todayDiff,
          lastSaleSeen: lastSaleDate(today, todayDiff, recent.slice(0, -1)),
          events: LE_MANS_EVENTS,
          config: ENGINE_CONFIG,
        })
      : [];

    const agenda = buildReviewAgenda({
      today,
      weekDiffs,
      lastRun: await lastPushRun(),
      insights,
      events: LE_MANS_EVENTS,
      config: ENGINE_CONFIG,
    });

    if (dry) return NextResponse.json({ success: true, sent: false, ...agenda });

    if (!process.env.NTFY_TOPIC) {
      return NextResponse.json({ error: "NTFY_TOPIC is not set", ...agenda }, { status: 500 });
    }
    await sendNtfy(agenda.body, {
      title: agenda.title,
      priority: 3,
      tags: ["spiral_calendar"],
      click: "https://www.coliving-barbusse.fr/dashboard/pricing",
    });
    return NextResponse.json({ success: true, sent: true, decisions: agenda.decisions });
  } catch (err) {
    console.error("[pricing-review-reminder]", err);
    return NextResponse.json({ error: "Le rappel n'a pas pu être préparé." }, { status: 500 });
  }
}
