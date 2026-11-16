import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { runAccessSync } from "@/lib/access-sync";
import { beat } from "@/lib/heartbeat";
import { isDryRun } from "@/lib/cron-params";
import { reportCronRun } from "@/lib/alert-memory";
import { sendCronAlert } from "@/lib/alerts";

/**
 * Synchronisation horaire des codes de la serrure (cron-job.org, `Authorization: Bearer
 * $CRON_SECRET`). Filet de sécurité du webhook Beds24 : rattrape un webhook perdu, retire les
 * codes des séjours terminés, relance les alertes.
 *
 * `?dry=1` (ou `?dryRun=1`) rend le plan sans rien écrire ni notifier, quel que soit `NUKI_SYNC_MODE`.
 *
 * Battement de cœur (`barbusse:heartbeat:nuki-sync`) à chaque passage réel, `ok` ou `error` ;
 * un passage `?dry=1` n'en écrit pas. Une erreur du passage (Beds24 ou Nuki illisibles) alerte
 * après deux passages de suite (`reportCronRun`, `barbusse:alert:error:nuki-sync`), quel que
 * soit `NUKI_SYNC_MODE`.
 */
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = isDryRun(request.nextUrl.searchParams);
  try {
    const report = await runAccessSync({ dryRun, trigger: "cron" });
    if (!dryRun) {
      await beat("nuki-sync", "ok");
      await reportCronRun("nuki-sync", "Synchro de la serrure", sendCronAlert, null).catch(() => {});
    }
    return NextResponse.json(report);
  } catch (err) {
    // Message seul : les erreurs Nuki sont expurgées dans le socle, et aucune autre ne
    // transporte de PIN.
    const message = err instanceof Error ? err.message : "Échec de la synchronisation";
    if (!dryRun) {
      await beat("nuki-sync", "error");
      await reportCronRun("nuki-sync", "Synchro de la serrure", sendCronAlert, message).catch(() => {});
    }
    console.error("[nuki-sync]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
