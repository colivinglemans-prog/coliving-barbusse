import { NextResponse, type NextRequest } from "next/server";
import { guard } from "@/lib/auth";
import { parseServiceAccount, type ServiceAccountCredentials } from "@sejour/socle/lib/google-auth";
import {
  getSearchConsoleReport,
  listSearchConsoleSites,
  parseSearchConsolePeriod,
} from "@sejour/socle/lib/search-console";
import { todayParis } from "@sejour/socle/lib/time";

/**
 * La charge utile de la page « Référencement » : le rapport Google Search Console, calculé par
 * le socle (`lib/search-console.ts`, v3.16.0) — **la même route que chez
 * Albiez**, au chemin près (`/api/dashboard/referencement` là-bas).
 *
 * Deux variables d'environnement, jamais dans le dépôt (public) :
 * - `GOOGLE_SERVICE_ACCOUNT_JSON` — le fichier de clé du compte de service, collé tel quel ;
 * - `GSC_SITE_URL` — `sc-domain:coliving-barbusse.fr` si la propriété Domaine apparaît dans la
 *   liste du compte de service, sinon `https://www.coliving-barbusse.fr/` (les balises de `app/[locale]/layout.tsx`
 *   prouvent un préfixe d’URL).
 *
 * Admin seulement, revérifié ici : le proxy refuse déjà le viewer (liste blanche), mais une
 * route ne doit jamais compter sur le seul matcher. Un échec rend un message lisible et un code
 * d'erreur, jamais un rapport à zéro — la page l'affiche en bandeau.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const refus = await guard.denyNonAdmin(request);
  if (refus) return refus;

  const siteUrl = process.env.GSC_SITE_URL;
  let credentials: ServiceAccountCredentials;
  try {
    credentials = parseServiceAccount(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }
  if (!siteUrl) {
    return NextResponse.json({ error: "Propriété Search Console non configurée (GSC_SITE_URL)." }, { status: 503 });
  }

  try {
    const report = await getSearchConsoleReport({
      credentials,
      siteUrl,
      days: parseSearchConsolePeriod(request.nextUrl.searchParams.get("days")),
      today: todayParis(),
    });
    return NextResponse.json(report);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("Search Console :", detail);
    if (detail.startsWith("Google a refusé le jeton")) {
      return NextResponse.json({ error: "Google refuse la clé du compte de service." }, { status: 502 });
    }
    // La cause la plus fréquente est une propriété mal nommée ou un compte non invité : on dit
    // lesquelles le compte voit, c'est la bonne valeur de GSC_SITE_URL.
    let hint = "";
    try {
      const sites = await listSearchConsoleSites(credentials);
      hint = sites.length
        ? ` Propriétés accessibles au compte de service : ${sites.join(", ")}.`
        : " Le compte de service n'a accès à aucune propriété : ajoutez-le dans Search Console (Paramètres → Utilisateurs).";
    } catch {
      /* le diagnostic est un bonus : son échec ne change pas la réponse */
    }
    return NextResponse.json({ error: `Search Console refuse la propriété ${siteUrl}.${hint}` }, { status: 502 });
  }
}
