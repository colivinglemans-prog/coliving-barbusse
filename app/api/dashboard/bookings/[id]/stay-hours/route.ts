import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { getBookingById } from "@/lib/beds24";
import { PROPERTY_ID } from "@/lib/beds24-property";
import { getBookingsWithArchive } from "@/lib/bookings";
import { runAccessSync } from "@/lib/access-sync";
import { hasRedis } from "@/lib/redis";
import {
  clearStayHours,
  readStayHours,
  rotationCheck,
  rotationNeighbours,
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
 * `/api/dashboard/stay-status`. Le contrôle est ici et pas seulement dans l'interface. En plus du
 * cookie `sameSite: lax`, même origine exigée, et du JSON pour le `POST` (comme `pricing/halt`).
 *
 * Seulement une réservation **de la maison** (303771), **non annulée ni bloquée** : 404 sinon.
 *
 * **Rotation** : un départ tardif postérieur à l'arrivée (convenue ou standard) du séjour qui
 * arrive le même jour est refusé (409), comme une arrivée anticipée antérieure au départ de celui
 * qui part ; l'égalité passe, avec un avertissement rendu à la popup (`severe` : moins de 3 h pour
 * le ménage). Voisins : `rotationNeighbours`, la même définition que la popup.
 *
 * **Synchro immédiate** : après l'écriture, un passage de la synchro des codes (même fonction et
 * même verrou que le webhook Beds24, sans les alertes du cron) pose tout de suite la nouvelle
 * fenêtre sur la serrure. S'il échoue, la saisie reste enregistrée : 200 avec `syncDeferred`, le
 * passage horaire rattrapera.
 *
 * Écriture franche : Redis absent ⇒ 503, échec ⇒ 500. Rien de personnel dans la réponse.
 */
async function parseId(params: Promise<{ id: string }>): Promise<number | null> {
  const { id: idStr } = await params;
  const id = Number(idStr);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const unavailable = () =>
  NextResponse.json({ error: "Stockage indisponible (KV_REST_API_URL / KV_REST_API_TOKEN)" }, { status: 503 });

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  try {
    return !!origin && new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

/** Contrôles communs : rôle, origine, identifiant. Rend une réponse de refus ou l'identifiant. */
async function admit(req: NextRequest, params: Promise<{ id: string }>): Promise<NextResponse | number> {
  const refus = await guard.denyNonAdmin(req);
  if (refus) return refus;
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origine refusée." }, { status: 403 });
  const id = await parseId(params);
  if (id === null) return NextResponse.json({ error: "Identifiant de réservation invalide" }, { status: 400 });
  return id;
}

/** Passage de la synchro des codes ; `true` s'il n'a pas pu poser la fenêtre tout de suite. */
async function syncNow(): Promise<boolean> {
  try {
    const report = await runAccessSync({ dryRun: false, trigger: "dashboard" });
    return report.skipped !== undefined || report.actions.some((a) => a.ok === false);
  } catch (e) {
    console.error("[stay-hours] synchro différée :", e instanceof Error ? e.message : e);
    return true;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admitted = await admit(req, params);
  if (admitted instanceof NextResponse) return admitted;
  const id = admitted;
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "JSON attendu." }, { status: 415 });
  }

  const parsed = validateAgreedHours(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  if (!hasRedis()) return unavailable();

  try {
    const booking = await getBookingById(id, { fresh: true });
    if (!booking || booking.propertyId !== PROPERTY_ID || isExcludedStatus(booking.status)) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }
    const stay: NeighbourStay = { bookingId: id, arrival: booking.arrival, departure: booking.departure };
    const [incoming, outgoing, table] = await Promise.all([
      getBookingsWithArchive({ arrivalFrom: stay.departure, arrivalTo: stay.departure }),
      getBookingsWithArchive({ departureFrom: stay.arrival, departureTo: stay.arrival }),
      readStayHours(),
    ]);
    const neighbours = rotationNeighbours(
      stay,
      [...incoming, ...outgoing].filter((b) => b.propertyId === undefined || b.propertyId === PROPERTY_ID),
    );
    const check = rotationCheck(stay, parsed.value, neighbours, table);
    if (check.error) return NextResponse.json({ error: check.error }, { status: 409 });

    await saveStayHours(id, parsed.value);
    const syncDeferred = await syncNow();
    return NextResponse.json({
      ok: true,
      bookingId: id,
      hours: parsed.value,
      ...(check.warning ? { warning: check.warning } : {}),
      ...(check.severe ? { severe: true } : {}),
      ...(syncDeferred ? { syncDeferred: true } : {}),
    });
  } catch (e) {
    console.error("[stay-hours] écriture impossible :", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admitted = await admit(req, params);
  if (admitted instanceof NextResponse) return admitted;
  const id = admitted;
  if (!hasRedis()) return unavailable();

  try {
    await clearStayHours(id);
  } catch (e) {
    console.error("[stay-hours] suppression impossible :", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Suppression impossible" }, { status: 500 });
  }
  const syncDeferred = await syncNow();
  return NextResponse.json({ ok: true, bookingId: id, hours: {}, ...(syncDeferred ? { syncDeferred: true } : {}) });
}
