import { NextResponse } from "next/server";
import { heartbeatResponse, overdueCrons } from "@sejour/socle/lib/heartbeat";
import { EXPECTED_CRONS, HEARTBEAT_PREFIX } from "@/lib/heartbeat";
import { stringStore } from "@/lib/redis";
import { alertTransition, failingInputs } from "@/lib/alert-memory";
import { sendCronAlert } from "@/lib/alerts";

/**
 * Les crons surveillés sont-ils passés à temps ? **Publique**, sans authentification : la
 * surveillance GitHub (`surveillance.yml`) l'appelle. Hors du `matcher` de `proxy.ts`.
 *
 * La réponse ne porte **qu'un booléen et un compte** (`heartbeatResponse`) : ni le nom des
 * crons, ni l'heure de leur dernier passage — un inventaire des tâches, ou un « logement vide »
 * à déduire, n'a rien à faire sur une URL publique. Les noms partent par ntfy, une fois par
 * changement d'état (`barbusse:alert:heartbeat`) : un appel répété ne renvoie rien de plus.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  let result: { overdue: number; names: string[] };
  try {
    result = await overdueCrons(stringStore(), HEARTBEAT_PREFIX, EXPECTED_CRONS, now);
  } catch (e) {
    console.error("[heartbeat]", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const transition = await alertTransition("heartbeat", failingInputs(result.names), now);
    if (transition.action === "open" || transition.action === "escalate") {
      await sendCronAlert(
        `${result.overdue} cron(s) en retard`,
        `Dernier passage réussi trop ancien :\n${result.names.map((n) => `  - ${n}`).join("\n")}\n\nVérifier cron-job.org et les journaux Vercel.`,
      );
    } else if (transition.action === "recover") {
      await sendCronAlert("Crons rétablis", "Tous les crons surveillés sont de nouveau à l'heure.", 1);
    }
  } catch (e) {
    // L'alerte privée ne doit pas changer la réponse publique.
    console.error("[heartbeat] alerte:", e instanceof Error ? e.message : e);
  }

  const { status, body } = heartbeatResponse(result);
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
