import { NextRequest, NextResponse } from "next/server";
import { addDays } from "@sejour/socle/lib/dates";
import { countsAsSold, isExcludedStatus } from "@sejour/socle/lib/booking-status";
import { todayParis } from "@sejour/socle/lib/time";
import { auth, guard } from "@/lib/auth";
import { getBookings } from "@/lib/beds24";
import { PROPERTY_ID } from "@/lib/beds24-property";
import { readStayHours } from "@/lib/stay-hours";

/** Fenêtre lue dans Beds24 : celle du calendrier (six mois en arrière), plus une marge. */
const PAST_DAYS = 200;

/**
 * État des séjours pour le calendrier : en phase A, les **horaires convenus** (arrivée
 * anticipée, départ tardif) ; la phase B y ajoutera l'état du départ du jour
 * (`lib/departure-detection.ts`).
 *
 * **Ouverte au rôle restreint** (`viewer`), contrairement à l'écriture
 * (`/api/dashboard/bookings/[id]/stay-hours`) : la personne du ménage doit lire « Départ tardif
 * convenu à 16 h ». Ce qui sort : l'identifiant de réservation et des heures, rien d'autre —
 * aucun nom, aucune date, aucun montant — et **seulement pour les réservations de la maison
 * (303771) non annulées ni bloquées** (cerbere, 2026-11-16) : une entrée restée dans Redis pour
 * une réservation annulée ou étrangère n'est pas servie. Le **viewer** ne reçoit en plus que les
 * séjours **vendus** (`countsAsSold` : ni demandes, ni options), comme `/api/dashboard/bookings`
 * qui les lui cache (cerbere B1, 2026-11-16) ; l'admin garde tout ce qui n'est pas exclu. Beds24 illisible ⇒ `{}` (rien plutôt
 * que trop) ; table vide ⇒ aucun appel à Beds24.
 */
export async function GET(request: NextRequest) {
  const refus = await guard.deny(request, ["admin", "viewer"]);
  if (refus) return refus;

  const isAdmin = (await guard.role(request)) === auth.adminRole;
  const visible = (status: string | undefined | null) => (isAdmin ? !isExcludedStatus(status) : countsAsSold(status));

  const table = await readStayHours();
  if (Object.keys(table).length === 0) return NextResponse.json({ hours: {} });

  let house: Set<number>;
  try {
    const bookings = await getBookings({ departureFrom: addDays(todayParis(), -PAST_DAYS) });
    house = new Set(bookings.filter((b) => b.propertyId === PROPERTY_ID && visible(b.status)).map((b) => b.id));
  } catch (e) {
    console.error("[stay-status] réservations illisibles :", e instanceof Error ? e.message : e);
    return NextResponse.json({ hours: {} });
  }

  const hours: Record<string, { arrivalHour?: number; departureHour?: number }> = {};
  for (const [id, h] of Object.entries(table)) {
    if (!house.has(Number(id))) continue;
    // Projection explicite : jamais plus que ces deux champs, quoi que contienne la table.
    hours[id] = {
      ...(h.arrivalHour !== undefined ? { arrivalHour: h.arrivalHour } : {}),
      ...(h.departureHour !== undefined ? { departureHour: h.departureHour } : {}),
    };
  }
  return NextResponse.json({ hours });
}
