import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { getUnlinkedEvents } from "@/lib/event-links";

/**
 * Les rattachements d'événement déliés à la main — la liste, pour le calendrier.
 *
 * **Ouverte au rôle restreint**, contrairement à la route d'écriture : l'étiquette
 * d'événement s'affiche sans condition de rôle dans la popup, et servir la liste au seul
 * administrateur ferait réapparaître chez le `viewer` les rattachements qu'on vient de
 * démentir. Ce qui sort est une liste de couples `<id>:<clé>` — aucune donnée de voyageur.
 */
export async function GET(request: NextRequest) {
  const refus = await guard.deny(request, ["admin", "viewer"]);
  if (refus) return refus;

  return NextResponse.json(await getUnlinkedEvents());
}
