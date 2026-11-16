import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { runIndexing, type IndexingConfig } from "@sejour/socle/lib/indexing";
import { sendNtfy } from "@/lib/ntfy";
import { hasRedis, redisKey, stringStore } from "@/lib/redis";
import { beat } from "@/lib/heartbeat";
import { isDryRun } from "@/lib/cron-params";

/**
 * Indexation automatique, une fois par jour (`vercel.json`, 05:30 UTC = 06:30 à Paris l'hiver) :
 * les pages **nouvelles**, ou **modifiées selon le `lastmod`** du sitemap (une page sans
 * `lastmod` n'est soumise qu'une fois : seuls les articles et `/llms.txt` sont vraiment suivis), et `/llms.txt` quand son contenu change, vont à
 * IndexNow (Bing, Yandex…) et à l'API Bing (`SubmitUrlBatch`, ~100 URL/jour), puis le reliquat
 * jamais soumis à Bing dans le quota restant. Jamais une page inchangée. Toute la logique est dans
 * `@sejour/socle/lib/indexing` (v3.24.0) ; ne restent ici que les réglages du site.
 *
 * État dans Upstash sous `barbusse:indexing:state` (et l'alerte sous `…:alert`). Amorçage : les
 * 96 URL soumises à la main le 14/11/2026 sont réputées déjà soumises à Bing.
 *
 * `?dry=1` rend le plan sans rien envoyer ni écrire (seule la lecture du quota Bing est faite).
 * Remplace le `npm run indexnow` manuel après déploiement (le script reste pour l'usage manuel).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CONFIG: IndexingConfig = {
  siteUrl: "https://www.coliving-barbusse.fr",
  bingSiteUrl: "https://coliving-barbusse.fr/",
  indexNowKey: "c910319d235f0e2c0586086f4d17d2d9",
  extraPaths: ["/llms.txt"],
  primaryLocale: "fr",
  bingAlreadySubmitted: 96,
  stateKey: redisKey("indexing", "state"),
};

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasRedis()) {
    return NextResponse.json({ error: "Upstash non configuré (KV_REST_API_URL / KV_REST_API_TOKEN)." }, { status: 503 });
  }
  const dry = isDryRun(request.nextUrl.searchParams);
  try {
    const report = await runIndexing(CONFIG, {
      store: stringStore(),
      bingApiKey: process.env.BING_WEBMASTER_API_KEY?.trim() || undefined,
      dry,
      notify: (n) =>
        sendNtfy(n.body, { title: `[Indexation] ${n.title}`, priority: n.priority, tags: ["mag", "warning"] }),
    });
    if (!dry) await beat("indexing", "ok");
    return NextResponse.json({ success: true, ...report });
  } catch (e) {
    // Le détail ne va qu'au journal (les erreurs du socle ne portent jamais la clé Bing) ; le
    // client reçoit un message générique.
    console.error("[indexing]", e instanceof Error ? e.message : String(e));
    if (!dry) await beat("indexing", "error");
    return NextResponse.json({ success: false, error: "Indexation momentanément impossible." }, { status: 500 });
  }
}
