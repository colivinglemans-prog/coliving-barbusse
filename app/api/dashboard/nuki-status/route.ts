import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { lockStatus } from "@/lib/access-sync";

/**
 * État du code de chaque réservation sur la serrure, pour la pastille du calendrier.
 *
 * **Admin uniquement**, comme le code lui-même : `viewer` n'est pas dans la liste blanche du
 * proxy, et la route le revérifie. La réponse ne porte **aucun PIN** — des états et des
 * phrases seulement. Calcul à blanc : rien n'est écrit, ni sur la serrure ni dans Beds24.
 */
export async function GET(req: NextRequest) {
  const refus = await guard.denyNonAdmin(req);
  if (refus) return refus;
  try {
    return NextResponse.json(await lockStatus(), { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "État de la serrure indisponible";
    console.error("[nuki-status]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
