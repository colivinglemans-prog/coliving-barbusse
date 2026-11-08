import { NextResponse, type NextRequest } from "next/server";
import { localeFromAcceptLanguage } from "@sejour/socle/lib/locales";

/**
 * Raccourcis imprimés sur les fiches de la maison (QR codes) : une adresse courte et **sans
 * langue**, qui redirige vers la bonne page dans la langue du téléphone (même négociation que `/`).
 * La destination peut changer sans réimprimer les fiches.
 *
 * - `/bienvenue` → le guide d'arrivée, partie « Sur place » (lien envoyé aux voyageurs ; noindex).
 * - `/autour` → les articles « Pendant votre séjour » du blog.
 *
 * 307 et `Vary: Accept-Language`, jamais mis en cache public : la réponse dépend du téléphone.
 * Ces routes ne passent pas par le proxy (`proxy.ts`, frontière d'autorisation).
 */
export function shortLinkRedirect(req: NextRequest, path: (locale: string) => string): NextResponse {
  const locale = localeFromAcceptLanguage(req.headers.get("accept-language"));
  const res = NextResponse.redirect(new URL(path(locale), req.url), 307);
  res.headers.set("Vary", "Accept-Language");
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
