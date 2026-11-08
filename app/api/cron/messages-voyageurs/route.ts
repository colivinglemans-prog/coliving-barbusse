import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { sendNtfy } from "@sejour/socle/lib/ntfy";
import { modes, runCron } from "@/lib/messages/engine";
import { getRedis, hasRedis, redisKey } from "@/lib/redis";

/**
 * Une alerte par réservation, modèle et motif toutes les 6 h au plus (chef-de-stand) : un code pas
 * encore sur la serrure resterait sinon « bloqué » à chaque passage, de J-5 16h au soir de l'arrivée.
 */
async function firstTime(key: string): Promise<boolean> {
  if (!hasRedis()) return true;
  return Boolean(await getRedis().set(redisKey("messages", "alert", key), 1, { nx: true, ex: 6 * 3600 }));
}

/**
 * Messages automatiques aux voyageurs — appelé par cron-job.org **toutes les 10 minutes**
 * (Bearer `CRON_SECRET`). Le plan est recalculé à chaque passage ; seuls les modèles en mode
 * `live` (`MESSAGES_MODES`) envoient, et `MESSAGES_KILL_SWITCH=1` coupe tout.
 *
 * Verrou Redis par passage (`barbusse:messages:cron:lock`), en plus du départage du moteur.
 * Plafond de 5 envois par passage : au-delà, rien ne part et une alerte prévient — un pic est le
 * signe d'un bug, pas d'une journée chargée.
 *
 * ntfy ne reçoit que des identifiants et des issues : jamais un prénom, un e-mail, un texte ni un
 * code.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// cron-job.org coupe à 30 s.
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { killSwitch, modes: m } = modes();
  if (killSwitch) return NextResponse.json({ ok: true, disabled: true });
  if (!Object.values(m).some((x) => x === "live" || x === "test")) {
    // Rien en réel : inutile de dépenser des crédits Beds24, l'écran de suivi calcule le plan lui-même.
    return NextResponse.json({ ok: true, live: 0 });
  }

  try {
    const result = await runCron();
    // Un autre passage tient le verrou Redis : rien à faire, ce n'est pas une erreur.
    if ("locked" in result) return NextResponse.json({ ok: true, locked: true });
    const failed = result.results.filter((r) => r.outcome === "failed");
    const blocked = result.results.filter((r) => r.outcome === "blocked");
    if (result.aborted) {
      await sendNtfy(`${result.aborted.due} messages dus pour un plafond de ${result.aborted.cap} : rien n'est parti. À vérifier dans le dashboard.`, {
        title: "Barbusse — messages voyageurs bloqués",
        priority: 4,
        tags: ["warning"],
      });
    } else if (failed.length || blocked.length || result.orphans.length) {
      const candidates = [
        ...[...failed, ...blocked].map((r) => ({ key: `${r.bookingId}:${r.templateId}:${r.reason ?? "?"}`, line: `#${r.bookingId} ${r.templateId} : ${r.outcome} (${r.reason ?? "?"})` })),
        // Un envoi commencé et jamais confirmé : à vérifier dans le fil, il ne sera pas renvoyé.
        ...result.orphans.map((o) => ({ key: `${o.bookingId}:${o.templateId}:orphan`, line: `#${o.bookingId} ${o.templateId} : envoi à vérifier (jamais confirmé)` })),
      ];
      const lines: string[] = [];
      for (const c of candidates) if (await firstTime(c.key)) lines.push(c.line);
      if (lines.length) await sendNtfy(lines.join("\n"), { title: "Barbusse — message voyageur non envoyé", priority: 4, tags: ["warning"] });
    }
    return NextResponse.json({
      ok: !result.aborted && failed.length === 0,
      planned: result.planned,
      sent: result.results.filter((r) => r.outcome === "sent").length,
      tested: result.results.filter((r) => r.outcome === "tested").length,
      blocked: blocked.length,
      failed: failed.length,
      aborted: result.aborted ?? null,
    });
  } catch (e) {
    console.error(JSON.stringify({ scope: "guest-message", event: "failed", reason: "cron", error: e instanceof Error ? e.name : typeof e }));
    return NextResponse.json({ ok: false, error: "indisponible" }, { status: 502 });
  }
}
