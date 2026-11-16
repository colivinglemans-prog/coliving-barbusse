import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { readStayHours } from "@/lib/stay-hours";

/**
 * État des séjours pour le calendrier : en phase A, les **horaires convenus** (arrivée
 * anticipée, départ tardif) ; la phase B y ajoutera l'état du départ du jour
 * (`lib/departure-detection.ts`).
 *
 * **Ouverte au rôle restreint** (`viewer`), contrairement à l'écriture
 * (`/api/dashboard/bookings/[id]/stay-hours`) : la personne du ménage doit lire « Départ tardif
 * convenu à 16 h ». Ce qui sort : l'identifiant de réservation et des heures, rien d'autre —
 * aucun nom, aucune date, aucun montant. Lecture qui ne lève jamais (Redis injoignable ⇒ `{}`).
 */
export async function GET(request: NextRequest) {
  const refus = await guard.deny(request, ["admin", "viewer"]);
  if (refus) return refus;

  const table = await readStayHours();
  const hours: Record<string, { arrivalHour?: number; departureHour?: number }> = {};
  for (const [id, h] of Object.entries(table)) {
    // Projection explicite : jamais plus que ces deux champs, quoi que contienne la table.
    hours[id] = {
      ...(h.arrivalHour !== undefined ? { arrivalHour: h.arrivalHour } : {}),
      ...(h.departureHour !== undefined ? { departureHour: h.departureHour } : {}),
    };
  }
  return NextResponse.json({ hours });
}
