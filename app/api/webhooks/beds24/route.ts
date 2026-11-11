import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { constantTimeEqual } from "@sejour/socle/lib/cron-auth";
import { runAccessSync } from "@/lib/access-sync";
import { sendNtfy } from "@sejour/socle/lib/ntfy";
import { modes, runCron } from "@/lib/messages/engine";
import { firstRefusalAlert, recordWebhookCall, type WebhookResult } from "@/lib/webhook-trace";

/**
 * Webhook « Booking » de Beds24 : appelé à chaque réservation créée, modifiée ou annulée.
 *
 * Il déclenche un passage complet de la synchronisation des codes — c'est ce qui donne un
 * PIN à une réservation de dernière minute en quelques secondes, avant que l'auto-action
 * « Before arrival - Send Nuki PIN » ne parte (elle est conditionnée à la présence de
 * `NUKI_PIN`). **Le corps envoyé par Beds24 n'est pas lu** : on relit tout depuis l'API, si
 * bien qu'un appel forgé ne peut rien injecter, au pire déclencher un passage de plus.
 *
 * Il lance aussi un passage de la messagerie voyageur (si la confirmation est en `test` ou en `live`) :
 * la confirmation part dans la minute qui suit la réservation, sans attendre le cron de 10 min.
 * Le passage est sous verrou Redis ; nos propres écritures de registre rappellent ce webhook,
 * et le passage suivant ne trouve plus rien à envoyer.
 *
 * Authentification : en-tête `x-webhook-secret`, à poser dans le champ « Custom Header » de
 * Beds24. Absence de `BEDS24_WEBHOOK_SECRET` ⇒ refus, comme pour les crons.
 */
export const maxDuration = 60;

/**
 * Le secret peut arriver par l'en-tête `x-webhook-secret` **ou** par le paramètre `key` de l'URL
 * (2026-11-08) : chez Barbusse, Beds24 n'envoyait pas l'en-tête saisi dans « Custom Header »
 * (appels relevés sans en-tête, ou avec une autre valeur). Le paramètre est saisi dans le même
 * champ URL que l'adresse : l'appel qui en vient est reconnu quoi qu'il arrive à l'en-tête.
 */
const fingerprint = (v: string) => ({ length: v.length, hash: createHash("sha256").update(v).digest("hex").slice(0, 6) });

function check(request: NextRequest): { result: WebhookResult; bracketed: boolean; got?: string; expected?: string } {
  // `trim()` : une valeur collée dans Vercel avec un retour à la ligne refuserait tout, l'en-tête
  // HTTP arrivant, lui, sans blancs de bord. Même comparaison que la route d'Albiez.
  const secret = process.env.BEDS24_WEBHOOK_SECRET?.trim();
  const header = request.headers.get("x-webhook-secret");
  const query = request.nextUrl.searchParams.get("key");
  // L'URL d'abord : c'est la voie qui marche quand Beds24 ignore l'en-tête.
  const given = query && secret && constantTimeEqual(query, secret) ? query : header;
  const bracketed = Boolean(given && given.startsWith("<") && given.endsWith(">"));
  if (!secret) return { result: "no-config", bracketed };
  if (!given) return { result: "no-header", bracketed };
  return constantTimeEqual(given, secret) ? { result: "accepted", bracketed } : { result: "bad-secret", bracketed, got: given, expected: secret };
}

export async function POST(request: NextRequest) {
  const { result, bracketed, got, expected } = check(request);
  // Témoin du dernier appel, lu par l'écran Messages : la preuve que Beds24 envoie le bon secret.
  await recordWebhookCall({
    at: new Date().toISOString(),
    result,
    ...(bracketed ? { bracketed } : {}),
    // Diagnostic d'un refus : longueur et empreinte courte, jamais le secret.
    ...(got && expected ? { got: fingerprint(got), expected: fingerprint(expected) } : {}),
  });
  if (result !== "accepted") {
    // Pas d'alerte sans en-tête : ce sont des robots, pas Beds24 (la trace, elle, est gardée).
    if (result !== "no-header" && (await firstRefusalAlert())) {
      await sendNtfy(
        `Webhook Beds24 refusé (${result}${bracketed ? ", valeur entre chevrons" : ""}) : vérifier le « Custom Header » dans Beds24.`,
        { title: "Barbusse — webhook Beds24", priority: 3, tags: ["warning"] },
      ).catch(() => {});
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let messages: unknown = null;
  try {
    const report = await runAccessSync({ dryRun: false, trigger: "webhook" });
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

/**
 * Passage de la messagerie, jamais fatal pour le webhook : le cron de 10 min rattrape.
 * Seule la confirmation a besoin de partir dans la minute ; les autres modèles sont à heure fixe
 * et le cron suffit. Confirmation `off` ou `shadow` ⇒ pas de passage, pas de crédits Beds24
 * dépensés à chaque webhook (dont ceux que provoquent nos propres écritures `MSG_*` et `NUKI_PIN`).
 */
async function messagingPass(): Promise<unknown> {
  const { killSwitch, modes: m } = modes();
  if (killSwitch || (m.confirmation !== "live" && m.confirmation !== "test")) return null;
  try {
    const r = await runCron();
    if ("locked" in r) return { locked: true };
    return { sent: r.results.filter((x) => x.outcome === "sent").length, tested: r.results.filter((x) => x.outcome === "tested").length };
  } catch (e) {
    console.error(JSON.stringify({ scope: "guest-message", event: "failed", reason: "webhook", error: e instanceof Error ? e.name : typeof e }));
    return { ok: false };
  }
}

/**
 * Beds24 envoie le webhook en **GET** quand « Additional Data » vaut None (doc Beds24, PROPERTIES
 * -> ACCESS) : même traitement que POST, le corps n'étant jamais lu.
 */
export const GET = POST;
