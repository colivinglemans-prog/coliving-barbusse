import { NextRequest, NextResponse } from "next/server";
import { normalizeChannel } from "@sejour/socle/lib/channels";
import {
  getBookingById,
  getBookingMessages,
  nukiCodeOf,
  sendBookingMessage,
} from "@/lib/beds24";
import { guard } from "@/lib/auth";
import { GUIDE_LOCALES, guestLocaleFromCountry, guideUrl, type GuideLocale } from "@/lib/site";
import {
  buildDepartureMessage,
  buildGuestMessage,
  detectGuestMessageKind,
  GUEST_MESSAGE_KINDS,
  type GuestMessageKind,
} from "@/lib/guest-messages";

/**
 * Messages voyageur déclenchables depuis le calendrier — arrivée (avec le PIN) et départ.
 *
 * **Admin uniquement**, comme les notes et le PIN : écrire au voyageur n'est pas une lecture.
 *
 * **Le texte est construit ici, pas envoyé par le client.** Un `message` libre posté depuis
 * le navigateur ferait de cette route un relais d'écriture arbitraire vers Airbnb et
 * Booking.com sous notre identité d'hôte. Le client ne choisit que la famille et la langue.
 *
 * **L'état vient du fil Beds24, jamais d'un registre local.** C'est la seule source qui voie
 * aussi les envois des auto-actions « Before arrival - Send Nuki PIN » et « Before checkout »,
 * restées actives. Un registre maison laisserait le bouton cliquable après un envoi
 * automatique, et le voyageur recevrait deux fois le même message.
 */

type Etat = Record<GuestMessageKind, string | null>;

function etatDepuisFil(
  messages: { source: string; message: string; time: string }[],
): Etat {
  const etat: Etat = { arrivee: null, depart: null };
  /*
   * Seuls les messages de l'hôte comptent. Un voyageur qui cite notre texte dans sa réponse
   * ferait sinon griser un bouton sans que rien n'ait été envoyé.
   */
  for (const m of messages) {
    if (m.source !== "host") continue;
    const kind = detectGuestMessageKind(m.message);
    if (!kind) continue;
    // Le fil arrive du plus récent au plus ancien : on garde le premier vu, donc le dernier
    // envoi — c'est celui que la personne veut lire sous le bouton.
    if (etat[kind] === null) etat[kind] = m.time;
  }
  return etat;
}

function parseLocale(value: unknown, fallback: GuideLocale): GuideLocale {
  return GUIDE_LOCALES.includes(value as GuideLocale) ? (value as GuideLocale) : fallback;
}

function parseId(idStr: string): number | null {
  const id = Number(idStr);
  return Number.isFinite(id) ? id : null;
}

/** État des deux boutons pour une réservation. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const refus = await guard.denyNonAdmin(req);
  if (refus) return refus;

  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id === null) return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });

  try {
    const [booking, messages] = await Promise.all([
      getBookingById(id),
      getBookingMessages(id),
    ]);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const channel = normalizeChannel(booking.referer, booking.channel);

    return NextResponse.json({
      channel,
      /*
       * Une réservation directe n'a pas de fil de messagerie : Beds24 accepterait le POST,
       * mais aucun canal ne le relaierait et personne ne le lirait. On le dit plutôt que
       * d'offrir un bouton qui ne fait rien.
       */
      sendable: channel !== "Direct",
      locale: guestLocaleFromCountry(booking.country),
      /* Le PIN lui-même ne sort pas d'ici : cette route n'a pas à le divulguer une fois de
       * plus, `nuki-code` est déjà là pour ça. Seule sa présence compte pour le bouton. */
      codeAvailable: nukiCodeOf(booking) !== null,
      etat: etatDepuisFil(messages),
    });
  } catch (err) {
    console.error("[messages] lecture échouée pour la réservation", id, err);
    const message = err instanceof Error ? err.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Envoi d'un des deux messages. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const refus = await guard.denyNonAdmin(req);
  if (refus) return refus;

  const { id: idStr } = await params;
  const id = parseId(idStr);
  if (id === null) return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });

  const body = (await req.json().catch(() => null)) as {
    kind?: string;
    locale?: string;
  } | null;
  const kind = body?.kind as GuestMessageKind | undefined;
  if (!kind || !GUEST_MESSAGE_KINDS.includes(kind)) {
    return NextResponse.json({ error: "Missing or unknown kind" }, { status: 400 });
  }

  try {
    const [booking, avant] = await Promise.all([getBookingById(id), getBookingMessages(id)]);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const channel = normalizeChannel(booking.referer, booking.channel);
    if (channel === "Direct") {
      return NextResponse.json(
        { error: "Réservation directe : aucun fil de messagerie à alimenter." },
        { status: 409 },
      );
    }

    /*
     * Garde-fou côté serveur, et pas seulement grisage du bouton : deux onglets ouverts, une
     * auto-action partie entre le chargement et le clic, et le voyageur reçoit deux fois le
     * même message. On relit le fil juste avant d'écrire.
     */
    const etatAvant = etatDepuisFil(avant);
    if (etatAvant[kind]) {
      return NextResponse.json(
        { error: "Message déjà envoyé", etat: etatAvant, sentAt: etatAvant[kind] },
        { status: 409 },
      );
    }

    const locale = parseLocale(body?.locale, guestLocaleFromCountry(booking.country));

    let message: string;
    if (kind === "arrivee") {
      const code = nukiCodeOf(booking);
      /*
       * Sans le PIN, ce message n'est plus que le lien du guide — et il grillerait le bouton
       * pour l'envoi qui compte. Beds24 ne dépose le code qu'environ 6 jours avant l'arrivée ;
       * d'ici là, les boutons de copie du bloc de partage restent disponibles.
       */
      if (!code) {
        return NextResponse.json(
          { error: "Le PIN Nuki n'est pas encore généré par Beds24 (~6 jours avant l'arrivée)." },
          { status: 409 },
        );
      }
      message = buildGuestMessage(locale, {
        firstName: booking.firstName,
        url: guideUrl(locale),
        code,
      });
    } else {
      message = buildDepartureMessage(locale, { firstName: booking.firstName });
    }

    await sendBookingMessage(id, message);

    // On relit plutôt que de fabriquer un horodatage : celui qui fait foi est celui de Beds24.
    const etat = etatDepuisFil(await getBookingMessages(id));
    return NextResponse.json({ ok: true, locale, etat });
  } catch (err) {
    // Jamais le corps du message dans les logs : il porte le PIN, et le dépôt est public.
    console.error("[messages] envoi échoué pour la réservation", id, kind, err);
    const message = err instanceof Error ? err.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
