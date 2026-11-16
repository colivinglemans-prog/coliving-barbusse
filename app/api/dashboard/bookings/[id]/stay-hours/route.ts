import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { getBookingById } from "@/lib/beds24";
import { getBookingsWithArchive } from "@/lib/bookings";
import { hasRedis } from "@/lib/redis";
import {
  clearStayHours,
  readStayHours,
  rotationCheck,
  saveStayHours,
  validateAgreedHours,
  type NeighbourStay,
} from "@/lib/stay-hours";
import { isExcludedStatus } from "@sejour/socle/lib/booking-status";

/**
 * Horaires convenus d'une réservation (`lib/stay-hours.ts`) : enregistrer (`POST`, corps
 * `{ arrivalHour?: number | null, departureHour?: number | null }`, l'accord est **remplacé**) ou
 * retirer (`DELETE`).
 *
 * **Admin uniquement** (`guard.denyNonAdmin`), comme `event-link` : l'accord change le chauffage,
 * le ballon et la fenêtre du code de la serrure. Le rôle restreint le **lit** par
 * `/api/dashboard/stay-status`. Le contrôle est ici et pas seulement dans l'interface.
 *
 * **Rotation** : un départ tardif postérieur à l'arrivée (convenue ou standard) du séjour qui
 * arrive le même jour est refusé (409), comme une arrivée anticipée antérieure au départ de celui
 * qui part ; l'égalité passe, avec un avertissement rendu à la popup.
 *
 * Écriture franche : Redis absent ⇒ 503, échec ⇒ 500. L'hôte doit savoir que rien n'est
 * enregistré. Rien de personnel dans la réponse : l'identifiant et les heures.
 */
async function parseId(params: Promise<{ id: string }>): Promise<number | null> {
  const { id: idStr } = await params;
  const id = Number(idStr);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const unavailable = () =>
  NextResponse.json({ error: "Stockage indisponible (KV_REST_API_URL / KV_REST_API_TOKEN)" }, { status: 503 });

/** Les séjours qui partent le jour de l'arrivée, ou arrivent le jour du départ. */
async function neighboursOf(stay: NeighbourStay): Promise<NeighbourStay[]> {
  const [incoming, outgoing] = await Promise.all([
    getBookingsWithArchive({ arrivalFrom: stay.departure, arrivalTo: stay.departure }),
    getBookingsWithArchive({ departureFrom: stay.arrival, departureTo: stay.arrival }),
  ]);
  return [...incoming, ...outgoing]
    .filter((b) => !isExcludedStatus(b.status) && b.id !== stay.bookingId)
    .map((b) => ({ bookingId: b.id, arrival: b.arrival, departure: b.departure }));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const refus = await guard.denyNonAdmin(req);
  if (refus) return refus;

  const id = await parseId(params);
  if (id === null) return NextResponse.json({ error: "Identifiant de réservation invalide" }, { status: 400 });

  const parsed = validateAgreedHours(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!hasRedis()) return unavailable();

  try {
    const booking = await getBookingById(id, { fresh: true });
    if (!booking) return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    const stay = { bookingId: id, arrival: booking.arrival, departure: booking.departure };
    const [neighbours, table] = await Promise.all([neighboursOf(stay), readStayHours()]);
    const check = rotationCheck(stay, parsed.value, neighbours, table);
    if (check.error) return NextResponse.json({ error: check.error }, { status: 409 });

    await saveStayHours(id, parsed.value);
    return NextResponse.json({ ok: true, bookingId: id, hours: parsed.value, ...(check.warning ? { warning: check.warning } : {}) });
  } catch (e) {
    console.error("[stay-hours] écriture impossible :", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const refus = await guard.denyNonAdmin(req);
  if (refus) return refus;

  const id = await parseId(params);
  if (id === null) return NextResponse.json({ error: "Identifiant de réservation invalide" }, { status: 400 });
  if (!hasRedis()) return unavailable();

  try {
    await clearStayHours(id);
    return NextResponse.json({ ok: true, bookingId: id, hours: {} });
  } catch (e) {
    console.error("[stay-hours] suppression impossible :", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
}
