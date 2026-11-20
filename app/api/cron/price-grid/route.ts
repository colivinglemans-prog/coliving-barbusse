import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { runPriceGridJob } from "@sejour/socle/lib/price-grid-job";
import { isDryRun } from "@/lib/cron-params";
import { beat } from "@/lib/heartbeat";
import { sendNtfy } from "@/lib/ntfy";
import { hasRedis, stringStore } from "@/lib/redis";
import { computePriceGrid, PRICE_GRID_COMPOSITION, PRICE_GRID_KEY } from "@/lib/tarifs";

/**
 * Calcul de la grille de la page « Tarifs », **toutes les heures** par cron-job.org (le plan Hobby
 * de Vercel n'autorise que des crons quotidiens), avec l'en-tête `Authorization: Bearer
 * $CRON_SECRET`. La grille est rangée dans Upstash (`barbusse:price-grid`) ; la page ne fait que la
 * lire. Un échec garde la grille précédente, suspend les essais 15 min et alerte au 2e relevé KO
 * (`@sejour/socle/lib/price-grid-job`).
 *
 * `?dry=1` : calcule et rend la grille et le nombre d'appels Beds24, sans rien écrire ni alerter.
 * Après chaque déploiement qui change la composition, appeler la route une fois à la main.
 */
export const dynamic = "force-dynamic";
// Plafond du plan Hobby. Le calcul s'arrête à ~22 s (`timeBudgetMs`, cron-job.org coupe à 30 s) :
// à cache de prix vide, la grille n'est rangée qu'au 2e ou 3e passage, qui reprend les prix en cache.
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasRedis()) {
    return NextResponse.json({ error: "Upstash non configuré (KV_REST_API_URL / KV_REST_API_TOKEN)." }, { status: 503 });
  }
  const dry = isDryRun(request.nextUrl.searchParams);
  const calls = { availability: 0, price: 0 };
  try {
    const report = await runPriceGridJob(
      { key: PRICE_GRID_KEY, composition: PRICE_GRID_COMPOSITION },
      {
        store: stringStore(),
        build: () => computePriceGrid(calls),
        dry,
        notify: (n) => sendNtfy(n.body, { title: `[Tarifs] ${n.title}`, priority: n.priority, tags: ["moneybag", "warning"] }),
      },
    );
    // « skipped » ou un « incomplete » passager : planificateur vivant, `ok`. Un échec ou un
    // « incomplete » qui dure (`stalled`) : `error`.
    if (!dry) await beat("price-grid", report.outcome === "failed" || report.stalled ? "error" : "ok");
    const grid = report.grid;
    return NextResponse.json({
      success: report.outcome !== "failed",
      outcome: report.outcome,
      stalled: report.stalled,
      reason: report.reason,
      alert: report.alert,
      calls,
      ...(grid ? { rows: grid.rows.length, columns: grid.columns.length, pricesShown: grid.pricesShown } : {}),
      ...(dry && grid ? { grid } : {}),
    });
  } catch (e) {
    console.error("[price-grid]", e instanceof Error ? e.message : String(e));
    if (!dry) await beat("price-grid", "error");
    return NextResponse.json({ success: false, error: "Calcul de la grille momentanément impossible." }, { status: 500 });
  }
}
