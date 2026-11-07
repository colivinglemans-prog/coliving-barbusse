import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { runAccessSync } from "@/lib/access-sync";
import { beat } from "@/lib/heartbeat";

/**
 * Synchronisation horaire des codes de la serrure (cron-job.org, `Authorization: Bearer
 * $CRON_SECRET`). Filet de sécurité du webhook Beds24 : rattrape un webhook perdu, retire les
 * codes des séjours terminés, relance les alertes.
 *
 * `?dry=1` rend le plan sans rien écrire ni notifier, quel que soit `NUKI_SYNC_MODE`.
 *
 * Battement de cœur (`barbusse:heartbeat:nuki-sync`) à chaque passage réel, `ok` ou `error` ;
 * un passage `?dry=1` n'en écrit pas.
 */
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = request.nextUrl.searchParams.get("dry") === "1";
  try {
    const report = await runAccessSync({ dryRun });
    if (!dryRun) await beat("nuki-sync", "ok");
    return NextResponse.json(report);
  } catch (err) {
    if (!dryRun) await beat("nuki-sync", "error");
    // Message seul : les erreurs Nuki sont expurgées dans le socle, et aucune autre ne
    // transporte de PIN.
    const message = err instanceof Error ? err.message : "Échec de la synchronisation";
    console.error("[nuki-sync]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
