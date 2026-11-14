import { NextResponse, type NextRequest } from "next/server";
import { guard } from "@/lib/auth";
import { bingWebmasterErrorResponse, getBingWebmasterReport } from "@sejour/socle/lib/bing-webmaster";

/**
 * La section Bing de la page « Référencement » : le rapport Bing Webmaster, calculé par le socle
 * (`lib/bing-webmaster.ts`, v3.23.0) — **la même route que chez Albiez**, au chemin près.
 *
 * - `BING_WEBMASTER_API_KEY` (Vercel, sensitive ; une clé par compte Bing, la même qu'Albiez) —
 *   jamais dans le dépôt, jamais dans une réponse ni un log : Bing la veut dans l'URL, d'où les
 *   erreurs du socle qui ne citent jamais l'URL d'appel.
 * - La propriété n'est pas un secret : c'est le domaine nu, tel que Bing l'a enregistré.
 *
 * Admin seulement, revérifié ici : le proxy refuse déjà le viewer (liste blanche), mais une route
 * ne compte jamais sur le seul matcher. Un échec rend un message lisible et un code d'erreur,
 * jamais un rapport à zéro.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BING_SITE_URL = "https://coliving-barbusse.fr/";

export async function GET(request: NextRequest) {
  const refus = await guard.denyNonAdmin(request);
  if (refus) return refus;

  // `trim` : une valeur collée dans Vercel garde parfois son retour à la ligne final.
  const apiKey = process.env.BING_WEBMASTER_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "Clé Bing Webmaster non configurée (BING_WEBMASTER_API_KEY)." }, { status: 503 });
  }
  try {
    return NextResponse.json(await getBingWebmasterReport({ apiKey, siteUrl: BING_SITE_URL }));
  } catch (e) {
    const { status, error } = bingWebmasterErrorResponse(e);
    console.error("Bing Webmaster :", error);
    return NextResponse.json({ error }, { status });
  }
}
