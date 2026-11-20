import { revalidateTag } from "next/cache";
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
// à froid, la grille de travail est rangée à chaque passage (`…:work`) et la grille servie est
// remplacée par la première grille complète, vers le 3e ou 4e passage (socle v3.37.0).
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
      { key: PRICE_GRID_KEY, composition: PRICE_GRID_COMPOSITION, incremental: true },
      {
        store: stringStore(),
        build: (previous) => computePriceGrid(calls, previous),
        dry,
        notify: (n) => sendNtfy(n.body, { title: `[Tarifs] ${n.title}`, priority: n.priority, tags: ["moneybag", "warning"] }),
      },
    );
    // « skipped » ou un « incomplete » passager : planificateur vivant, `ok`. Un échec ou un
    // « incomplete » qui dure (`stalled`) : `error`.
    if (!dry) await beat("price-grid", report.outcome === "failed" || report.stalled ? "error" : "ok");
    // La page lit la grille via `unstable_cache` (tag `price-grid`) : la nouvelle grille est servie
    // tout de suite, et sa date (« prix relevés entre le … et le … ») n'est pas figée dans le HTML.
    // Grille servie remplacée : rangée complète (`stored`, ou `failed` sur pannes en série avec une
    // grille quand même complète).
    if (!dry && report.grid && report.grid.complete !== false && report.outcome !== "dry") {
      revalidateTag("price-grid", { expire: 0 });
    }
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
