import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runAccessSync } from "@/lib/access-sync";
import { modes, runCron } from "@/lib/messages/engine";

/**
 * Webhook « Booking » de Beds24 : appelé à chaque réservation créée, modifiée ou annulée.
 *
 * Il déclenche un passage complet de la synchronisation des codes — c'est ce qui donne un
 * PIN à une réservation de dernière minute en quelques secondes, avant que l'auto-action
 * « Before arrival - Send Nuki PIN » ne parte (elle est conditionnée à la présence de
 * `NUKI_PIN`). **Le corps envoyé par Beds24 n'est pas lu** : on relit tout depuis l'API, si
 * bien qu'un appel forgé ne peut rien injecter, au pire déclencher un passage de plus.
 *
 * Il lance aussi un passage de la messagerie voyageur (si un modèle est en `test` ou en `live`) :
 * la confirmation part dans la minute qui suit la réservation, sans attendre le cron de 10 min.
 * Le passage est sous verrou Redis ; nos propres écritures de registre rappellent ce webhook,
 * et le passage suivant ne trouve plus rien à envoyer.
 *
 * Authentification : en-tête `x-webhook-secret`, à poser dans le champ « Custom Header » de
 * Beds24. Absence de `BEDS24_WEBHOOK_SECRET` ⇒ refus, comme pour les crons.
 */
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = process.env.BEDS24_WEBHOOK_SECRET;
  const given = request.headers.get("x-webhook-secret");
  if (!secret || !given) return false;
  const a = Buffer.from(secret);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let messages: unknown = null;
  try {
    const report = await runAccessSync({ dryRun: false });
    messages = await messagingPass();
    return NextResponse.json({ mode: report.mode, actions: report.actions.length, skipped: report.skipped, messages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de la synchronisation";
    console.error("[webhook beds24]", message);
    // 200 quand même : un 5xx ferait réessayer Beds24 en boucle, et le cron horaire
    // rattrapera. L'échec est déjà journalisé.
    return NextResponse.json({ ok: false });
  }
}

/** Passage de la messagerie, jamais fatal pour le webhook : le cron de 10 min rattrape. */
async function messagingPass(): Promise<unknown> {
  const { killSwitch, modes: m } = modes();
  if (killSwitch || !Object.values(m).some((x) => x === "live" || x === "test")) return null;
  try {
    const r = await runCron();
    if ("locked" in r) return { locked: true };
    return { sent: r.results.filter((x) => x.outcome === "sent").length, tested: r.results.filter((x) => x.outcome === "tested").length };
  } catch (e) {
    console.error(JSON.stringify({ scope: "guest-message", event: "failed", reason: "webhook", error: e instanceof Error ? e.name : typeof e }));
    return { ok: false };
  }
}
