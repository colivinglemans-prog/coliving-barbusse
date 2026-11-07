import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runAccessSync } from "@/lib/access-sync";

/**
 * Webhook « Booking » de Beds24 : appelé à chaque réservation créée, modifiée ou annulée.
 *
 * Il déclenche un passage complet de la synchronisation des codes — c'est ce qui donne un
 * PIN à une réservation de dernière minute en quelques secondes, avant que l'auto-action
 * « Before arrival - Send Nuki PIN » ne parte (elle est conditionnée à la présence de
 * `NUKI_PIN`). **Le corps envoyé par Beds24 n'est pas lu** : on relit tout depuis l'API, si
 * bien qu'un appel forgé ne peut rien injecter, au pire déclencher un passage de plus.
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
  try {
    const report = await runAccessSync({ dryRun: false });
    return NextResponse.json({ mode: report.mode, actions: report.actions.length, skipped: report.skipped });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de la synchronisation";
    console.error("[webhook beds24]", message);
    // 200 quand même : un 5xx ferait réessayer Beds24 en boucle, et le cron horaire
    // rattrapera. L'échec est déjà journalisé.
    return NextResponse.json({ ok: false });
  }
}
