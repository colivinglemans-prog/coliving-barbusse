import AvailabilityDates from "@/components/public/AvailabilityDates";
import { stayWindow } from "@sejour/socle/lib/events";
import { LE_MANS_EVENTS } from "@/lib/events";
import type { Locale } from "@/lib/i18n";

/**
 * Plusieurs événements de `LE_MANS_EVENTS` avec la disponibilité de la maison pour chacun
 * (`AvailabilityDates`), pour un article qui en couvre plusieurs (`BlogPostMeta.events`).
 *
 * Un article qui ne couvre qu'**un** événement prend `BlogPostMeta.event` : bloc de
 * réservation unique (`EventBookingCTA`) et nœud JSON-LD `Event`. Ici, pas de JSON-LD :
 * l'article n'est pas la page de ces événements.
 *
 * Seuls les événements aux dates **officielles** (`confirmed`) apparaissent : une date
 * supposée affichée avec « Libre » et un bouton de réservation passerait pour un fait.
 * Fenêtre de séjour : celle de `stayWindow` (veille de l'événement → lendemain).
 */

interface Copy {
  title: string;
  intro: string;
  footer: string;
}

const COPY: Record<Locale, Copy> = {
  fr: {
    title: "Les prochaines dates du circuit",
    intro: "Disponibilités en temps réel, de la veille au lendemain de chaque événement.",
    footer: "Montage plus tôt ou démontage plus tard ?",
  },
  en: {
    title: "Upcoming circuit dates",
    intro: "Real-time availability, from the day before to the day after each event.",
    footer: "Earlier set-up or later take-down?",
  },
  it: {
    title: "Le prossime date del circuito",
    intro: "Disponibilità in tempo reale, dal giorno prima al giorno dopo ogni evento.",
    footer: "Allestimento prima o smontaggio dopo?",
  },
  de: {
    title: "Die nächsten Termine an der Rennstrecke",
    intro: "Verfügbarkeit in Echtzeit, vom Vortag bis zum Tag nach jeder Veranstaltung.",
    footer: "Früher aufbauen oder später abbauen?",
  },
  es: {
    title: "Las próximas fechas del circuito",
    intro: "Disponibilidad en tiempo real, desde la víspera hasta el día siguiente de cada evento.",
    footer: "¿Montaje antes o desmontaje después?",
  },
};

export default function EventDates({ locale, eventKeys }: { locale: Locale; eventKeys: string[] }) {
  const t = COPY[locale] ?? COPY.fr;
  const periods = eventKeys
    .map((key) => LE_MANS_EVENTS.find((e) => e.key === key))
    .filter((e): e is (typeof LE_MANS_EVENTS)[number] => !!e && e.confirmed)
    .map((e) => ({ id: e.key, name: e.name, ...stayWindow(e) }));
  if (periods.length === 0) return null;
  return (
    <AvailabilityDates locale={locale} title={t.title} intro={t.intro} footer={t.footer} periods={periods} />
  );
}
