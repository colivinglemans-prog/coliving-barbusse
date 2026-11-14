import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { todayParis } from "@sejour/socle/lib/time";
import { reportAlerts, reportCronRun } from "@/lib/alert-memory";
import { sendPricingAlert } from "@/lib/alerts";
import { beat } from "@/lib/heartbeat";
import { haltState, runPricingPush, type PushRun } from "@/lib/pricing/push";

/**
 * Envoi quotidien des prix du moteur vers Beds24 — le seul appelant de `lib/pricing/push.ts`.
 * À appeler une fois par jour à 05:10 UTC (cron-job.org), **après** le relevé de 05:00.
 *
 * Tant que `PRICING_PUSH_MODE` n'est pas posé, la route ne fait rien (`off`). En `dry`, elle
 * calcule et journalise sans écrire. `?dry=1` force ce mode ponctuellement — il ne rend jamais
 * l'envoi plus permissif.
 *
 * Alertes (règle maison : jamais répétées, rétablissement en priorité 1) :
 * - envoi rejeté par les garde-fous : dès le premier passage (c'est déterministe) ;
 * - dates en quarantaine (variation > seuil) : dès le premier passage, une ligne par date ;
 * - écart à la relecture : immédiat, le coupe-circuit est déjà posé ;
 * - erreur de la route : après deux passages en erreur (`reportCronRun`).
 */
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const forceDry = request.nextUrl.searchParams.get("dry") === "1";

  let run: PushRun;
  try {
    run = await runPricingPush({ today: todayParis(), forceDry });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[pricing-push]", message);
    await beat("pricing-push", "error");
    await reportCronRun("pricing-push", "Envoi des prix", sendPricingAlert, message).catch(() => undefined);
    return NextResponse.json({ error: "L'envoi des prix a échoué." }, { status: 500 });
  }

  await beat("pricing-push", "ok");
  await reportCronRun("pricing-push", "Envoi des prix", sendPricingAlert, null).catch(() => undefined);

  // `locked` : un autre envoi tournait, ce passage n'a rien constaté — ne pas « rétablir ».
  if (run.mode !== "off" && !forceDry && run.outcome !== "locked") {
    await reportAlerts(
      "pricing-rejected",
      run.outcome === "rejected"
        ? [{ id: "rejected", priority: 4, line: run.rejections.slice(0, 10).join("\n") }]
        : [],
      sendPricingAlert,
      {
        title: () => "Envoi des prix rejeté par les garde-fous",
        intro: "Rien n'a été envoyé. Corriger la grille ou un prix forcé, jamais le garde-fou :",
        recoveredTitle: "Envoi des prix : de nouveau accepté",
        confirmAfter: 1,
      },
    ).catch((e) => console.error("[pricing-push] alerte rejet:", e));

    await reportAlerts(
      "pricing-quarantine",
      run.quarantined.map((q) => ({
        id: q.date,
        priority: 3 as const,
        line: `${q.date} : ${q.from} € → ${q.to} € (${q.changePct > 0 ? "+" : ""}${q.changePct} %)`,
      })),
      sendPricingAlert,
      {
        title: (c) => `${c.length} date(s) en quarantaine`,
        intro: "Variation trop forte : ces dates gardent leur prix actuel. À valider ou corriger :",
        recoveredTitle: "Plus aucune date en quarantaine",
        confirmAfter: 1,
      },
    ).catch((e) => console.error("[pricing-push] alerte quarantaine:", e));

    if (run.outcome === "mismatch") {
      await sendPricingAlert(
        "Écart après l'envoi des prix — envois suspendus",
        [
          "Le calendrier relu ne correspond pas à ce qui a été envoyé. Le coupe-circuit est posé :",
          "plus aucun envoi tant qu'il n'est pas levé depuis le dashboard (page Pricing).",
          "Un autre outil (Beyond ?) écrit-il encore ?",
          "",
          ...run.mismatches.slice(0, 10),
          ...run.warnings.slice(0, 5).map((w) => `Avertissement Beds24 : ${w}`),
        ].join("\n"),
        4,
      ).catch((e) => console.error("[pricing-push] alerte écart:", e));
    }
  }

  // Coupe-circuit oublié : un rappel (une seule fois) au-delà de 48 h, sinon le cron reste « ok ».
  if (!forceDry) {
    const halt = await haltState().catch(() => null);
    const longHalt = halt && Date.now() - Date.parse(halt.since) > 48 * 3600_000;
    await reportAlerts(
      "pricing-halt-long",
      longHalt ? [{ id: "halt", priority: 3, line: `Posé le ${halt.since.slice(0, 10)} : ${halt.reason}` }] : [],
      sendPricingAlert,
      {
        title: () => "Envoi des prix coupé depuis plus de 48 h",
        intro: "Les prix ne bougent plus. Lever le coupe-circuit depuis la page Pricing une fois la cause comprise :",
        recoveredTitle: "Coupe-circuit des prix levé",
        confirmAfter: 1,
      },
    ).catch((e) => console.error("[pricing-push] rappel coupe-circuit:", e));
  }

  return NextResponse.json({
    mode: run.mode,
    dailyChanges: run.dailyChanges,
    outcome: run.outcome,
    writes: run.writes,
    unchanged: run.unchanged,
    quarantined: run.quarantined.length,
    rejections: run.rejections.length,
    mismatches: run.mismatches.length,
    ...(forceDry && { sample: run.sample, rejectionsDetail: run.rejections, quarantinedDetail: run.quarantined }),
  });
}
