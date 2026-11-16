import { NextResponse } from "next/server";
import { heartbeatResponse } from "@sejour/socle/lib/heartbeat";
import { overdueWithGrace } from "@/lib/heartbeat";
import { stringStore } from "@/lib/redis";
import { reportAlerts } from "@/lib/alert-memory";
import { sendCronAlert } from "@/lib/alerts";

/**
 * Les crons surveillés sont-ils passés à temps ? **Publique**, sans authentification : la
 * surveillance GitHub (`surveillance.yml`) l'appelle. Hors du `matcher` de `proxy.ts`.
 *
 * La réponse ne porte **qu'un booléen et un compte** (`heartbeatResponse`) : ni le nom des
 * crons, ni l'heure de leur dernier passage — un inventaire des tâches, ou un « logement vide »
 * à déduire, n'a rien à faire sur une URL publique. Les noms partent par ntfy, une fois par
 * changement d'état (`barbusse:alert:heartbeat`) : un appel répété ne renvoie rien de plus.
 *
 * L'alerte passe par `reportAlerts` (sans confirmation : le retard est déjà une durée) : un envoi
 * raté remet l'état tel qu'avant, l'alerte repart à l'appel suivant (2026-11-16 ; elle était
 * notée partie même quand ntfy échouait). Un cron qui n'a encore jamais battu a un délai de
 * grâce au démarrage (`overdueWithGrace`).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  let result: { overdue: number; names: string[] };
  try {
    result = await overdueWithGrace(stringStore(), now);
  } catch (e) {
    console.error("[heartbeat]", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }

  try {
    await reportAlerts(
      "heartbeat",
      result.names.map((n) => ({ id: n, priority: 4, line: `  - ${n}` })),
      sendCronAlert,
      {
        title: (c) => `${c.length} cron(s) en retard`,
        intro: "Dernier passage réussi trop ancien (vérifier cron-job.org et les journaux Vercel) :",
        recoveredTitle: "Crons rétablis",
        recoveredBody: "Tous les crons surveillés sont de nouveau à l'heure.",
        confirmAfter: 1,
        now,
      },
    );
  } catch (e) {
    // L'alerte privée ne doit pas changer la réponse publique.
    console.error("[heartbeat] alerte:", e instanceof Error ? e.message : e);
  }

  const { status, body } = heartbeatResponse(result);
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
