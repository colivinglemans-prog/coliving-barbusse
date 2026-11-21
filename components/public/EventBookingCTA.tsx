"use client";

import EventBookingCTA, {
  type EventBookingLabels,
} from "@sejour/socle/components/EventBookingCTA";
import { PROPERTY_ID } from "@/lib/beds24-property";
import type { LocalEvent } from "@/lib/events";
import type { Locale } from "@/lib/i18n";

/**
 * Bloc de réservation de fin d'article — l'enveloppe locale du composant du socle.
 *
 * Tout le comportement (sondage de `/api/availability`, plus longue plage libre, séjour
 * minimum le plus strict, trois états, repli en cas de panne) est monté dans
 * `@sejour/socle/components/EventBookingCTA`. Ne restent ici que les quatre paramètres qui
 * ne peuvent pas monter : l'identifiant Beds24 de la maison, la route de disponibilité et
 * ses noms de paramètres, le séjour minimum par défaut, et les libellés dans cinq langues.
 *
 * ⚠️ Ce n'est **pas** l'encart « prochaine édition ». Celui-ci est client et demande « la
 * maison est-elle libre » ; l'autre est serveur et répond « quand est la prochaine
 * édition ». Ils coexistent sur une même page.
 */

const DEFAULT_MIN_STAY = 2;

/** Étiquettes BCP 47 pour le formatage des dates affichées. */
const DATE_LOCALE: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  it: "it-IT",
  de: "de-DE",
  es: "es-ES",
};

type Copy = EventBookingLabels;

const COPY: Record<Locale, Copy> = {
  fr: {
    availableTitle: "Notre maison est disponible pour cet événement",
    partialTitle: "Il reste des nuits pour cet événement",
    soldOutTitle: "Complet pour cet événement",
    range: (f, t, n) => `Du ${f} au ${t} · ${n} nuit${n > 1 ? "s" : ""}`,
    pitch:
      "9 suites privatives avec salle de douche, jusqu'à 20 personnes, 215 m². Réservation en direct, sans commission de plateforme.",
    soldOutBody:
      "Ces dates sont déjà réservées. Consultez le calendrier pour trouver d'autres disponibilités.",
    book: "Voir le prix et réserver",
    seeCalendar: "Voir le calendrier",
    loading: "Vérification des disponibilités…",
    provisionalDates:
      "Dates prévisionnelles : l'organisateur n'a pas encore publié le calendrier, les nuits proposées suivent l'édition précédente. Nous mettrons cette page à jour dès l'annonce.",
    nearbyTitle: "Réservée pendant l'événement, libre juste avant ou après",
    nearbyBefore: (_from, t) => `Libre juste avant : jusqu'au ${t}`,
    nearbyAfter: (f) => `Libre juste après : à partir du ${f}`,
    nearbyBody:
      "Pratique pour les essais, le montage, ou pour arriver plus tôt. Mêmes 9 suites avec salle de douche, jusqu'à 20 personnes.",
    nearbyStay: (n, side) =>
      `À partir de ${n} nuits, ${side === "before" ? "arrivée" : "départ"} au choix. Dates modifiables sur la page de réservation.`,
  },
  en: {
    availableTitle: "Our house is available for this event",
    partialTitle: "Some nights are still available for this event",
    soldOutTitle: "Fully booked for this event",
    range: (f, t, n) => `From ${f} to ${t} · ${n} night${n > 1 ? "s" : ""}`,
    pitch:
      "9 private en-suite bedrooms, up to 20 guests, 215 m². Book direct, with no platform commission.",
    soldOutBody:
      "These dates are already booked. Check the calendar for other availability.",
    book: "See price and book",
    seeCalendar: "View calendar",
    loading: "Checking availability…",
    provisionalDates:
      "Provisional dates: the organiser has not yet published the calendar; the suggested nights follow the previous edition. We will update this page as soon as the dates are announced.",
    nearbyTitle: "Booked for the event, free just before or after",
    nearbyBefore: (_from, t) => `Free just before: until ${t}`,
    nearbyAfter: (f) => `Free just after: from ${f}`,
    nearbyBody:
      "Handy for test days, set-up, or arriving early. The same 9 en-suite bedrooms, up to 20 guests.",
    nearbyStay: (n, side) =>
      `${n} nights minimum, choose your ${side === "before" ? "arrival" : "departure"} date. You can change the dates on the booking page.`,
  },
  it: {
    availableTitle: "La nostra casa è disponibile per questo evento",
    partialTitle: "Restano alcune notti per questo evento",
    soldOutTitle: "Tutto esaurito per questo evento",
    range: (f, t, n) => `Dal ${f} al ${t} · ${n} nott${n > 1 ? "i" : "e"}`,
    pitch:
      "9 suite private con doccia privata, fino a 20 persone, 215 m². Prenotazione diretta, senza commissioni di piattaforma.",
    soldOutBody:
      "Queste date sono già prenotate. Consultate il calendario per altre disponibilità.",
    book: "Vedi il prezzo e prenota",
    seeCalendar: "Vedi il calendario",
    loading: "Verifica delle disponibilità…",
    provisionalDates:
      "Date provvisorie: l'organizzatore non ha ancora pubblicato il calendario, le notti proposte seguono l'edizione precedente. Aggiorneremo questa pagina appena saranno annunciate.",
    nearbyTitle: "Prenotata durante l'evento, libera subito prima o dopo",
    nearbyBefore: (_from, t) => `Libera subito prima: fino al ${t}`,
    nearbyAfter: (f) => `Libera subito dopo: dal ${f}`,
    nearbyBody:
      "Comoda per i test, l'allestimento o per arrivare prima. Le stesse 9 suite con doccia privata, fino a 20 persone.",
    nearbyStay: (n, side) =>
      `Da ${n} notti, ${side === "before" ? "arrivo" : "partenza"} a scelta. Date modificabili nella pagina di prenotazione.`,
  },
  de: {
    availableTitle: "Unser Haus ist für diese Veranstaltung verfügbar",
    partialTitle: "Für diese Veranstaltung sind noch Nächte frei",
    soldOutTitle: "Für diese Veranstaltung ausgebucht",
    range: (f, t, n) => `Vom ${f} bis ${t} · ${n} N${n > 1 ? "ächte" : "acht"}`,
    pitch:
      "9 private Suiten mit eigenem Duschbad, bis zu 20 Personen, 215 m². Direktbuchung, ohne Plattformprovision.",
    soldOutBody:
      "Diese Daten sind bereits gebucht. Im Kalender finden Sie weitere freie Termine.",
    book: "Preis ansehen und buchen",
    seeCalendar: "Kalender ansehen",
    loading: "Verfügbarkeit wird geprüft…",
    provisionalDates:
      "Vorläufige Termine: Der Veranstalter hat den Kalender noch nicht veröffentlicht, die vorgeschlagenen Nächte folgen der vorigen Ausgabe. Wir aktualisieren diese Seite, sobald sie bekannt sind.",
    nearbyTitle: "Während der Veranstaltung belegt, direkt davor oder danach frei",
    nearbyBefore: (_from, t) => `Frei direkt davor: bis ${t}`,
    nearbyAfter: (f) => `Frei direkt danach: ab ${f}`,
    nearbyBody:
      "Praktisch für Testtage, den Aufbau oder eine frühere Anreise. Dieselben 9 Suiten mit eigenem Duschbad, bis zu 20 Personen.",
    nearbyStay: (n, side) =>
      `Ab ${n} Nächten, ${side === "before" ? "Anreise" : "Abreise"} nach Wahl. Die Reisedaten lassen sich auf der Buchungsseite ändern.`,
  },
  es: {
    availableTitle: "Nuestra casa está disponible para este evento",
    partialTitle: "Quedan noches disponibles para este evento",
    soldOutTitle: "Completo para este evento",
    range: (f, t, n) => `Del ${f} al ${t} · ${n} noche${n > 1 ? "s" : ""}`,
    pitch:
      "9 suites privadas con baño con ducha, hasta 20 personas, 215 m². Reserva directa, sin comisión de plataforma.",
    soldOutBody:
      "Estas fechas ya están reservadas. Consulte el calendario para ver otras disponibilidades.",
    book: "Ver el precio y reservar",
    seeCalendar: "Ver el calendario",
    loading: "Comprobando disponibilidad…",
    provisionalDates:
      "Fechas provisionales: el organizador aún no ha publicado el calendario, las noches propuestas siguen la edición anterior. Actualizaremos esta página en cuanto se anuncien.",
    nearbyTitle: "Reservada durante el evento, libre justo antes o después",
    nearbyBefore: (_from, t) => `Libre justo antes: hasta el ${t}`,
    nearbyAfter: (f) => `Libre justo después: desde el ${f}`,
    nearbyBody:
      "Práctico para los entrenamientos, el montaje o para llegar antes. Las mismas 9 suites con baño con ducha, hasta 20 personas.",
    nearbyStay: (n, side) =>
      `A partir de ${n} noches, ${side === "before" ? "llegada" : "salida"} a elegir. Fechas modificables en la página de reserva.`,
  },
};

export default function EventBookingCTALocal({
  locale,
  event,
}: {
  locale: Locale;
  event: LocalEvent;
}) {
  return (
    <EventBookingCTA
      event={event}
      propertyId={PROPERTY_ID}
      lang={locale}
      bcp47={DATE_LOCALE[locale]}
      // `mode=map` borne des jours inclus : la dernière nuit est la veille du départ.
      availabilityUrl={(from, to) => `/api/availability?mode=map&from=${from}&to=${to}`}
      calendarHref={`/${locale}#disponibilite`}
      defaultMinStay={DEFAULT_MIN_STAY}
      // Fenêtre prise (ex. 24H 2027 réservées) : proposer les nuits libres collées à elle —
      // Journée Test, pesage, arrivée en avance. 10 jours avant, 5 après (socle v3.39.0).
      nearby={{ before: 10, after: 5 }}
      labels={COPY[locale] ?? COPY.fr}
    />
  );
}
