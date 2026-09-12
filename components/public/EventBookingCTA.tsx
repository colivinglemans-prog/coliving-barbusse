"use client";

import EventBookingCTA, {
  type EventBookingLabels,
} from "@sejour/socle/components/EventBookingCTA";
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

const PROPERTY_ID = 303771;
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
      "9 suites privatives avec salle de bain, jusqu'à 20 personnes, 215 m². Réservation en direct, sans commission de plateforme.",
    soldOutBody:
      "Ces dates sont déjà réservées. Consultez le calendrier pour trouver d'autres disponibilités.",
    book: "Voir le prix et réserver",
    seeCalendar: "Voir le calendrier",
    loading: "Vérification des disponibilités…",
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
  },
  it: {
    availableTitle: "La nostra casa è disponibile per questo evento",
    partialTitle: "Restano alcune notti per questo evento",
    soldOutTitle: "Tutto esaurito per questo evento",
    range: (f, t, n) => `Dal ${f} al ${t} · ${n} nott${n > 1 ? "i" : "e"}`,
    pitch:
      "9 suite private con bagno, fino a 20 persone, 215 m². Prenotazione diretta, senza commissioni di piattaforma.",
    soldOutBody:
      "Queste date sono già prenotate. Consultate il calendario per altre disponibilità.",
    book: "Vedi il prezzo e prenota",
    seeCalendar: "Vedi il calendario",
    loading: "Verifica delle disponibilità…",
  },
  de: {
    availableTitle: "Unser Haus ist für diese Veranstaltung verfügbar",
    partialTitle: "Für diese Veranstaltung sind noch Nächte frei",
    soldOutTitle: "Für diese Veranstaltung ausgebucht",
    range: (f, t, n) => `Vom ${f} bis ${t} · ${n} Nacht${n > 1 ? "e" : ""}`,
    pitch:
      "9 private Suiten mit eigenem Bad, bis zu 20 Personen, 215 m². Direktbuchung, ohne Plattformprovision.",
    soldOutBody:
      "Diese Daten sind bereits gebucht. Im Kalender finden Sie weitere freie Termine.",
    book: "Preis ansehen und buchen",
    seeCalendar: "Kalender ansehen",
    loading: "Verfügbarkeit wird geprüft…",
  },
  es: {
    availableTitle: "Nuestra casa está disponible para este evento",
    partialTitle: "Quedan noches disponibles para este evento",
    soldOutTitle: "Completo para este evento",
    range: (f, t, n) => `Del ${f} al ${t} · ${n} noche${n > 1 ? "s" : ""}`,
    pitch:
      "9 suites privadas con baño, hasta 20 personas, 215 m². Reserva directa, sin comisión de plataforma.",
    soldOutBody:
      "Estas fechas ya están reservadas. Consulte el calendario para ver otras disponibilidades.",
    book: "Ver el precio y reservar",
    seeCalendar: "Ver el calendario",
    loading: "Comprobando disponibilidad…",
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
      labels={COPY[locale] ?? COPY.fr}
    />
  );
}
