import { NextRequest, NextResponse } from "next/server";
import { updateBookingNotes } from "@/lib/beds24";
import { guard } from "@/lib/auth";

/**
 * Écriture d'une consigne de ménage sur une réservation.
 *
 * **Admin uniquement.** Le rôle `viewer` lit les notes — elles sont écrites pour lui — mais
 * ne les modifie pas. Le contrôle est ici et pas seulement dans l'interface : un bouton
 * masqué n'empêche personne d'appeler la route à la main.
 *
 * Le triptyque `COOKIE_NAME` / `getSecret()` / `jwtVerify` qui ouvrait ce fichier était une
 * copie octet pour octet de celui de `nuki-code`. Il vit maintenant dans le socle.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const refus = await guard.denyNonAdmin(req);
  if (refus) return refus;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as { notes?: string } | null;
  if (body === null || typeof body.notes !== "string") {
    return NextResponse.json({ error: "Missing notes" }, { status: 400 });
  }

  try {
    await updateBookingNotes(id, body.notes);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notes] update failed:", err);
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
