import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { addDays } from "@sejour/socle/lib/dates";
import { todayParis } from "@sejour/socle/lib/time";
import { LE_MANS_EVENTS } from "@/lib/events";
import { computeEnginePrices } from "@/lib/pricing/engine";
import { ENGINE_CONFIG } from "@/lib/pricing/engine-config";
import { beyondHigherInsights, lastSaleDate, pricingInsights } from "@/lib/pricing/insights";
import { getBeyondCalendarFromWitness, takeBeyondWitness, type WitnessOutcome } from "@/lib/pricing/beyond-witness";
import { CUTOVER } from "@/lib/pricing/cutover";
import { PRICE_OVERRIDES } from "@/lib/pricing/overrides";
import { reportAlerts, reportCronRun } from "@/lib/alert-memory";
import { beat } from "@/lib/heartbeat";
import { isDryRun } from "@/lib/cron-params";
import { sendPricingAlert } from "@/lib/alerts";
import {
  diffSnapshots,
  loadSnapshots,
  loadSnapshot,
  saveShadow,
  saveSnapshot,
  takeSnapshot,
  type ShadowPrices,
} from "@/lib/pricing/snapshot";

/**
 * Photo quotidienne du calendrier tarifaire Beds24 (prix, séjour minimum, dispo sur 365 j),
 * et prix que le moteur maison aurait affichés le même jour (simulation, rien n'est envoyé).
 * Voir `lib/pricing/snapshot.ts` et `lib/pricing/engine.ts`.
 *
 * À appeler une fois par jour, de préférence tôt le matin (Beyond pousse la nuit). Deux
 * appels le même jour écrasent la photo du jour : c'est voulu, la dernière fait foi.
 *
 * `?dry=1` relève, calcule et compare sans rien écrire.
 *
 * Battement `pricing-snapshot` et erreur suivie (`reportCronRun`, deux passages en erreur de suite,
 * soit deux jours) à chaque passage réel : il échouait sans rien dire jusqu'au 2026-11-16, et
 * l'envoi des prix comme le rapport du lundi lisent ses photos.
 */
// Relevé de 365 jours de calendrier Beds24, moteur, deux écritures Redis.
export const maxDuration = 60;

const LABEL = "Relevé quotidien des prix";

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dry = isDryRun(request.nextUrl.searchParams);
  const today = todayParis();

  try {
    const snapshot = await takeSnapshot(today);
    const yesterday = await loadSnapshot(addDays(today, -1));

    const engine = computeEnginePrices({
      today,
      nights: Object.fromEntries(Object.entries(snapshot.days).map(([d, v]) => [d, v[2] === 1])),
      events: LE_MANS_EVENTS,
      config: ENGINE_CONFIG,
    });
    const shadow: ShadowPrices = {
      date: today,
      days: Object.fromEntries(Object.entries(engine).map(([d, n]) => [d, [n.price, n.minStay]])),
    };

    if (!dry) await Promise.all([saveSnapshot(snapshot), saveShadow(shadow)]);

    // Témoin Beyond (API en lecture) : **après** la photo, dans son propre `try`. Sa panne ne
    // touche jamais la photo ; elle n'alerte qu'au deuxième relevé raté, jamais répétée.
    let witness: WitnessOutcome = { status: "not-configured" };
    try {
      witness = await takeBeyondWitness(today, { dry });
      if (!dry && witness.status !== "not-configured") {
        await reportAlerts(
          "pricing-beyond-witness",
          witness.status === "error" ? [{ id: "witness", priority: 3, line: witness.message }] : [],
          sendPricingAlert,
          {
            title: () => "Témoin Beyond : relevé impossible",
            intro: "Le prix suggéré par Beyond n'a pas pu être relevé (l'envoi des prix n'est pas concerné) :",
            recoveredTitle: "Témoin Beyond : relevé rétabli",
            confirmAfter: 2,
          },
        );
      }
    } catch (e) {
      console.error("[pricing-snapshot] témoin Beyond:", e);
    }

    const diff = yesterday ? diffSnapshots(yesterday, snapshot) : null;

    // Alertes pour affiner le pricing (vente précoce, nuits orphelines, J-60, creux à venir).
    // Dernière vente repérée dans les photos des 14 derniers jours, pour le « creux à venir ».
    const lastSaleSeen = lastSaleDate(today, diff, await loadSnapshots(addDays(today, -1), 14));
    const insights = pricingInsights({
      today,
      snapshot,
      diff,
      lastSaleSeen,
      events: LE_MANS_EVENTS,
      config: ENGINE_CONFIG,
    });
    // Après la bascule : Beyond suggère-t-il nettement plus haut sur un grand événement libre ?
    if (today >= CUTOVER.startedOn && witness.status === "stored") {
      const suggested = await getBeyondCalendarFromWitness(today).catch(() => ({}));
      insights.push(
        ...beyondHigherInsights({ snapshot, suggested, blocks: PRICE_OVERRIDES.filter((o) => o.markdown) }),
      );
    }
    if (!dry) {
      await reportAlerts(
        "pricing-insights",
        insights.map((i) => ({ id: i.id, priority: i.priority, line: i.line })),
        sendPricingAlert,
        {
          title: (c) => (c.length === 1 ? "Un point de prix à regarder" : `${c.length} points de prix à regarder`),
          intro: "Décisions de prix suggérées par le relevé du jour :",
          recoveredTitle: "Plus aucun point de prix en attente",
          confirmAfter: 1,
        },
      ).catch((e) => console.error("[pricing-snapshot] alertes de prix:", e));
    }

    if (!dry) {
      await beat("pricing-snapshot", "ok");
      await reportCronRun("pricing-snapshot", LABEL, sendPricingAlert, null).catch(() => undefined);
    }
    return NextResponse.json({
      insights,
      witness,
      success: true,
      dry,
      date: today,
      days: Object.keys(snapshot.days).length,
      vsYesterday: diff && {
        priceChanges: diff.priceChanges.length,
        minStayChanges: diff.minStayChanges.length,
        sold: diff.sold,
        released: diff.released,
      },
      ...(dry && { engine }),
    });
  } catch (err) {
    console.error("[pricing-snapshot]", err);
    if (!dry) {
      const message = err instanceof Error ? err.message : String(err);
      await beat("pricing-snapshot", "error");
      await reportCronRun("pricing-snapshot", LABEL, sendPricingAlert, message.slice(0, 200)).catch(() => undefined);
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
