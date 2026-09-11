import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { refreshBeds24WriteToken, refreshBeds24PublicToken } from "@/lib/beds24";
import { sendBeds24Alert } from "@/lib/email";

/**
 * Maintient les refresh tokens Beds24 en vie.
 *
 * Beds24 invalide un refresh token qui n'a pas servi depuis 30 jours. Le site en a deux, et
 * aucun des deux ne s'entretient de façon fiable tout seul :
 *
 * - **écriture** (`BEDS24_REFRESH_TOKEN`) : ne sert qu'à poser une note sur une réservation,
 *   bien trop rare. Sans ce cron il meurt et l'écriture renvoie `401 Token not valid`.
 * - **lecture publique** (`BEDS24_PUBLIC_REFRESH_TOKEN`) : on pourrait le croire entretenu par
 *   le trafic de la page de réservation, mais le cache de 60 s des réponses fait qu'une visite
 *   ne déclenche pas forcément un échange, et une saison creuse ne prévient pas. Surtout, sa
 *   mort est **silencieuse** : le repli vers le jeton principal prend le relais et le tunnel
 *   continue de fonctionner, en ayant reperdu la séparation des privilèges sans que personne
 *   ne le voie.
 *
 * Un appel hebdomadaire suffit largement pour les deux. Les deux sont tentés même si le
 * premier échoue : un jeton mort ne doit pas en entraîner un second.
 */

type Resultat = { ok: true; expiresIn: number } | { ok: false; error: string };

const REPARATION: Record<"ecriture" | "publique", string[]> = {
  ecriture: [
    "1. Beds24 > SETTINGS > ACCOUNT > ACCESS > générer un invite code",
    "   avec les scopes read:bookings, write:bookings",
    '2. curl -H "code: <INVITE>" -H "deviceName: coliving-barbusse-ecriture-AAAA-MM" \\',
    "     https://api.beds24.com/v2/authentication/setup",
    "3. Copier le champ refreshToken dans BEDS24_REFRESH_TOKEN (.env.local + Vercel)",
  ],
  publique: [
    "1. Beds24 > SETTINGS > ACCOUNT > ACCESS > générer un invite code",
    "   avec les scopes read:inventory, read:properties — et RIEN d'autre :",
    "   ce jeton sert la page publique, il ne doit pas savoir lire une réservation",
    '2. curl -H "code: <INVITE>" -H "deviceName: coliving-barbusse-public-AAAA-MM" \\',
    "     https://api.beds24.com/v2/authentication/setup",
    "3. Copier le champ refreshToken dans BEDS24_PUBLIC_REFRESH_TOKEN (.env.local + Vercel)",
  ],
};

const CONSEQUENCE: Record<"ecriture" | "publique", string> = {
  ecriture: "L'ajout de consignes de ménage sur les réservations est cassé.",
  publique:
    "La page publique est retombée sur le jeton du dashboard : elle fonctionne, mais elle " +
    "tourne désormais avec read:bookings-personal et read:bookings-financial.",
};

async function entretenir(
  quoi: "ecriture" | "publique",
  refresh: () => Promise<{ expiresIn: number }>,
): Promise<Resultat> {
  try {
    const { expiresIn } = await refresh();
    return { ok: true, expiresIn };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[beds24-keepalive] ${quoi} : échec`, message);

    await sendBeds24Alert(
      `Refresh token ${quoi} invalide`,
      [
        `Le refresh token Beds24 « ${quoi} » ne peut plus être échangé contre un access token.`,
        CONSEQUENCE[quoi],
        "",
        `Erreur : ${message}`,
        "",
        "Pour réparer :",
        ...REPARATION[quoi],
        "4. Redéployer : npx vercel --prod",
      ].join("\n"),
    ).catch((e) => console.error("[beds24-keepalive] alerte email échouée:", e));

    return { ok: false, error: message };
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ecriture = await entretenir("ecriture", refreshBeds24WriteToken);
  const publique = await entretenir("publique", refreshBeds24PublicToken);

  const ok = ecriture.ok && publique.ok;
  return NextResponse.json({ ok, ecriture, publique }, { status: ok ? 200 : 500 });
}
