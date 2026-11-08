import AvailabilityDates from "@/components/public/AvailabilityDates";
import type { Locale } from "@/lib/i18n";

/**
 * Les prochaines dates de fêtes en famille, avec la disponibilité lue en direct
 * (`AvailabilityDates`).
 *
 * Ces dates n'ont rien à faire dans `LE_MANS_EVENTS`, qui alimente aussi le rattachement des
 * réservations aux événements du circuit dans le dashboard.
 *
 * ⚠️ Liste à prolonger chaque année (Pâques, Ascension et Pentecôte sont mobiles). Les
 * lignes passées disparaissent d'elles-mêmes.
 */

type DateKey =
  | "christmas"
  | "betweenHolidays"
  | "newYear"
  | "easter"
  | "mayDay"
  | "ascension"
  | "pentecost";

/** `checkOut` exclu : c'est le jour du départ. */
const FAMILY_DATES: { key: DateKey; checkIn: string; checkOut: string }[] = [
  { key: "christmas", checkIn: "2026-12-24", checkOut: "2026-12-27" },
  { key: "betweenHolidays", checkIn: "2026-12-27", checkOut: "2026-12-31" },
  { key: "newYear", checkIn: "2026-12-31", checkOut: "2027-01-03" },
  { key: "easter", checkIn: "2027-03-27", checkOut: "2027-03-29" },
  { key: "mayDay", checkIn: "2027-04-30", checkOut: "2027-05-02" },
  { key: "ascension", checkIn: "2027-05-06", checkOut: "2027-05-09" },
  { key: "pentecost", checkIn: "2027-05-15", checkOut: "2027-05-17" },
  // ⚠️ N'ajouter une date qu'une fois le calendrier Beds24 ouvert jusque-là : au-delà de
  // l'horizon de réservation, `/api/availability` répond « pris », et la ligne
  // s'afficherait « Complet » à tort. Horizon au 2026-11-04 : 31 août 2027.
];

interface Copy {
  title: string;
  intro: string;
  names: Record<DateKey, string>;
  weddings: string;
}

const COPY: Record<Locale, Copy> = {
  fr: {
    title: "Les prochaines dates en famille",
    intro: "Disponibilités en temps réel. Les fêtes se réservent longtemps à l'avance.",
    names: {
      christmas: "Noël",
      betweenHolidays: "Entre Noël et le Nouvel An",
      newYear: "Nouvel An",
      easter: "Week-end de Pâques",
      mayDay: "Week-end du 1er mai",
      ascension: "Pont de l'Ascension",
      pentecost: "Week-end de Pentecôte",
    },
    weddings: "Un mariage, un baptême, un anniversaire à une autre date ?",
  },
  en: {
    title: "Upcoming family dates",
    intro: "Real-time availability. Holidays get booked well in advance.",
    names: {
      christmas: "Christmas",
      betweenHolidays: "Between Christmas and New Year",
      newYear: "New Year",
      easter: "Easter weekend",
      mayDay: "May Day weekend",
      ascension: "Ascension long weekend",
      pentecost: "Whitsun weekend",
    },
    weddings: "A wedding, a christening or a birthday on another date?",
  },
  it: {
    title: "Le prossime date in famiglia",
    intro: "Disponibilità in tempo reale. Le feste si prenotano con largo anticipo.",
    names: {
      christmas: "Natale",
      betweenHolidays: "Tra Natale e Capodanno",
      newYear: "Capodanno",
      easter: "Weekend di Pasqua",
      mayDay: "Weekend del 1° maggio",
      ascension: "Ponte dell'Ascensione",
      pentecost: "Weekend di Pentecoste",
    },
    weddings: "Un matrimonio, un battesimo, un compleanno in un'altra data?",
  },
  de: {
    title: "Die nächsten Familientermine",
    intro: "Verfügbarkeit in Echtzeit. Feiertage sind früh ausgebucht.",
    names: {
      christmas: "Weihnachten",
      betweenHolidays: "Zwischen den Jahren",
      newYear: "Silvester und Neujahr",
      easter: "Osterwochenende",
      mayDay: "Wochenende zum 1. Mai",
      ascension: "Brückentag Christi Himmelfahrt",
      pentecost: "Pfingstwochenende",
    },
    weddings: "Eine Hochzeit, eine Taufe, ein Geburtstag an einem anderen Datum?",
  },
  es: {
    title: "Las próximas fechas en familia",
    intro: "Disponibilidad en tiempo real. Las fiestas se reservan con mucha antelación.",
    names: {
      christmas: "Navidad",
      betweenHolidays: "Entre Navidad y Año Nuevo",
      newYear: "Año Nuevo",
      easter: "Fin de semana de Pascua",
      mayDay: "Puente del 1 de mayo",
      ascension: "Puente de la Ascensión",
      pentecost: "Fin de semana de Pentecostés",
    },
    weddings: "¿Una boda, un bautizo, un cumpleaños en otra fecha?",
  },
};

export default function FamilyDates({ locale }: { locale: Locale }) {
  const t = COPY[locale] ?? COPY.fr;
  return (
    <AvailabilityDates
      locale={locale}
      title={t.title}
      intro={t.intro}
      footer={t.weddings}
      periods={FAMILY_DATES.map((d) => ({
        id: d.key,
        name: t.names[d.key],
        checkIn: d.checkIn,
        checkOut: d.checkOut,
      }))}
    />
  );
}
