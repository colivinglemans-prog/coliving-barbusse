import { NextRequest, NextResponse } from "next/server";
import { getBookingById, findBookingByStripeIds } from "@/lib/beds24";
import { getStripePayment } from "@/lib/stripe";
import {
  beds24ToPayload,
  beds24PaymentToPayload,
  paymentToPayload,
} from "@sejour/socle/lib/invoice-payload";
import { guard } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Pré-remplissage d'une facture depuis une réservation Beds24 ou un paiement Stripe.
 *
 * **Admin uniquement, vérifié ici.** La réponse porte la réservation Beds24 **brute** —
 * `getBookingById` demande `includeInfoItems`, donc le PIN de la serrure, plus les montants
 * et les coordonnées du voyageur. Sa seule protection était le préfixe d'URL du middleware :
 * un matcher oublié ou un chemin déplacé et tout ressortait. La donnée la plus sensible du
 * dashboard ne doit pas dépendre d'un unique point de contrôle.
 */
export async function GET(request: NextRequest) {
  const refus = await guard.denyNonAdmin(request);
  if (refus) return refus;

  try {
    const bookingIdParam = request.nextUrl.searchParams.get("bookingId");
    const stripeIdParam = request.nextUrl.searchParams.get("stripeId");

    if (!bookingIdParam && !stripeIdParam) {
      return NextResponse.json(
        { error: "bookingId ou stripeId manquant" },
        { status: 400 },
      );
    }
    if (bookingIdParam && stripeIdParam) {
      return NextResponse.json(
        { error: "bookingId et stripeId sont mutuellement exclusifs" },
        { status: 400 },
      );
    }

    if (bookingIdParam) {
      const id = Number(bookingIdParam);
      if (!Number.isFinite(id) || id <= 0) {
        return NextResponse.json({ error: "bookingId invalide" }, { status: 400 });
      }
      const booking = await getBookingById(id);
      if (!booking) {
        return NextResponse.json(
          { error: `Aucune réservation/inquiry Beds24 trouvée pour l'ID ${id}` },
          { status: 404 },
        );
      }
      return NextResponse.json({
        source: "beds24",
        booking,
        payload: beds24ToPayload(booking),
      });
    }

    // stripeIdParam
    const stripeId = stripeIdParam!.trim();
    if (!/^pi_|^ch_/.test(stripeId)) {
      return NextResponse.json(
        { error: "stripeId doit être un Payment Intent (pi_…) ou une Charge (ch_…)" },
        { status: 400 },
      );
    }
    const payment = await getStripePayment(stripeId);
    if (!payment) {
      return NextResponse.json(
        { error: `Aucun paiement Stripe trouvé pour l'ID ${stripeId}` },
        { status: 404 },
      );
    }

    // Tentative de matching avec une réservation Beds24
    // Beds24 stocke le charge id (ch_…) dans infoItems[].code = "STRIPEPAYMENT"
    // On cherche sur pi_… ET ch_… car on peut arriver depuis l'un ou l'autre.
    const candidateIds = [stripeId];
    if (payment.chargeId && payment.chargeId !== stripeId) {
      candidateIds.push(payment.chargeId);
    }
    if (payment.id !== stripeId) candidateIds.push(payment.id);
    const booking = await findBookingByStripeIds(candidateIds).catch(() => null);

    return NextResponse.json({
      source: "stripe",
      payment,
      booking,
      beds24Matched: Boolean(booking),
      payload: booking
        ? beds24PaymentToPayload(booking, payment)
        : paymentToPayload(payment),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
