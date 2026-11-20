import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { runAccessSync, syncIsLive } from "@/lib/access-sync";
import { beat } from "@/lib/heartbeat";
import { isDryRun } from "@/lib/cron-params";
import { reportAlerts, reportCronRun, type TrackedAlert } from "@/lib/alert-memory";
import { sendCronAlert, sendDoorAlert } from "@/lib/alerts";

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
 *
 * **Synchro à blanc** : `NUKI_SYNC_MODE` autre que `live`, plus aucun code n'est posé ni retiré,
 * et rien ne le disait (audit du 15/11). Alerte `barbusse:alert:nuki-sync-mode`, priorité 4,
 * règle commune : deux passages horaires de suite, jamais répétée, « rétabli » en priorité 1
 * au retour en `live`. Évaluée avant la synchro, pour partir même si celle-ci échoue.
 */
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dryRun = isDryRun(request.nextUrl.searchParams);
  if (!dryRun) {
    await reportAlerts("nuki-sync-mode", modeAlerts(), sendDoorAlert, {
      title: () => "Synchro des codes à blanc",
      recoveredTitle: "Synchro des codes de nouveau active",
      recoveredBody: "NUKI_SYNC_MODE vaut de nouveau « live » : les codes sont posés et retirés.",
    }).catch((e) => console.error("[nuki-sync] alerte mode:", e instanceof Error ? e.message : e));
  }
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

/** Le mode de la synchro, en constat pour `reportAlerts` : vide en `live`. */
function modeAlerts(): TrackedAlert[] {
  if (syncIsLive()) return [];
  const value = process.env.NUKI_SYNC_MODE?.trim();
  return [
    {
      id: "mode",
      priority: 4,
      line:
        `NUKI_SYNC_MODE ${value ? `vaut « ${value.slice(0, 20)} »` : "est absente"} au lieu de « live » : ` +
        "la synchro calcule sans rien écrire, aucun code n'est posé ni retiré sur la serrure. " +
        "Remettre « live » sur Vercel puis redéployer.",
    },
  ];
}
