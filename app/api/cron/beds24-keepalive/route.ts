import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { refreshBeds24WriteToken } from "@/lib/beds24";
import { sendBeds24Alert } from "@/lib/email";

/**
 * Maintient le refresh token Beds24 en vie.
 *
 * Beds24 invalide un refresh token qui n'a pas servi depuis 30 jours. Il n'est
 * utilisé que par les écritures (ajout de note sur une réservation), trop rares
 * pour l'entretenir : sans ce cron il meurt et l'écriture renvoie
 * `401 Token not valid`. Un appel hebdomadaire suffit largement.
 *
 * En cas d'échec, il faut régénérer un invite code dans Beds24
 * (SETTINGS > ACCOUNT > ACCESS, scopes write:bookings + write:bookings-personal),
 * l'échanger via GET /authentication/setup, et remettre le refreshToken obtenu
 * dans la variable d'env BEDS24_REFRESH_TOKEN (local + Vercel).
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { expiresIn } = await refreshBeds24WriteToken();
    return NextResponse.json({ ok: true, expiresIn });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[beds24-keepalive] échec:", message);

    await sendBeds24Alert(
      "Refresh token invalide",
      [
        "Le refresh token Beds24 ne peut plus être échangé contre un access token.",
        "L'ajout de notes sur les réservations est donc cassé.",
        "",
        `Erreur : ${message}`,
        "",
        "Pour réparer :",
        "1. Beds24 > SETTINGS > ACCOUNT > ACCESS > générer un invite code",
        "   avec les scopes read:bookings, read:bookings-personal,",
        "   write:bookings, write:bookings-personal",
        "2. curl -H \"code: <INVITE>\" -H \"deviceName: coliving-dashboard\" \\",
        "     https://api.beds24.com/v2/authentication/setup",
        "3. Copier le champ refreshToken dans BEDS24_REFRESH_TOKEN (.env.local + Vercel)",
        "4. Redéployer : npx vercel --prod",
      ].join("\n"),
    ).catch((e) => console.error("[beds24-keepalive] alerte email échouée:", e));

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
