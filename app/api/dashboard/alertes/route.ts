import { NextResponse, type NextRequest } from "next/server";
import { guard } from "@/lib/auth";
import { hasRedis } from "@/lib/redis";
import { NOTIFY_LOG_DAYS, readNotifications, summarizeNotifications } from "@/lib/notify-log";

/**
 * Charge utile de la page « Alertes » (admin) : les notifications ntfy des 30 derniers jours,
 * lues dans le journal `barbusse:ntfy:log` (`lib/notify-log.ts`), et leur résumé.
 *
 * Admin seulement, revérifié ici (le chemin n'est pas dans la liste blanche viewer de
 * `proxy.ts`). Le journal ne contient jamais le corps des notifications.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const refus = await guard.denyNonAdmin(request);
  if (refus) return refus;
  if (!hasRedis()) {
    return NextResponse.json({ error: "Journal indisponible (Redis non configuré)" }, { status: 503 });
  }
  try {
    const { records, capped } = await readNotifications();
    return NextResponse.json(
      { days: NOTIFY_LOG_DAYS, capped, summary: summarizeNotifications(records), recent: records.slice(0, 200) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("[alertes]", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Journal illisible" }, { status: 503 });
  }
}
