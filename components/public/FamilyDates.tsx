"use client";

import { useEffect, useState } from "react";
import { addDays, daysBetween, formatDate } from "@sejour/socle/lib/dates";
import {
  longestFreeRange,
  type AvailabilityResponse,
} from "@sejour/socle/lib/availability";
import { bookingUrl } from "@sejour/socle/lib/booking-url";
import { PROPERTY_ID } from "@/lib/beds24-property";
import type { Locale } from "@/lib/i18n";

/**
 * Les prochaines dates de fêtes en famille, avec la disponibilité lue en direct.
 *
 * Même principe que `EventBookingCTA` (composant client, une page statique ne peut pas
 * savoir au build ce qui est réservé), mais pour une liste de dates et non un événement :
 * ces dates n'ont rien à faire dans `LE_MANS_EVENTS`, qui alimente aussi le rattachement
 * des réservations aux événements du circuit dans le dashboard.
 *
 * « Complet » n'est jamais écrit en dur : une annulation rouvre la ligne toute seule.
 *
 * ⚠️ Liste à prolonger chaque année (Pâques, Ascension et Pentecôte sont mobiles). Les
 * lignes passées disparaissent d'elles-mêmes.
 */

/** Séjour minimum retenu quand Beds24 n'en impose aucun sur la période. */
const DEFAULT_MIN_STAY = 2;

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

const BCP47: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  it: "it-IT",
  de: "de-DE",
  es: "es-ES",
};

interface Copy {
  title: string;
  intro: string;
  names: Record<DateKey, string>;
  minStay: (n: number) => string;
  available: string;
  partial: (from: string, to: string) => string;
  soldOut: string;
  book: string;
  loading: string;
  weddings: string;
  seeCalendar: string;
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
    minStay: (n) => `min. ${n} nuits`,
    available: "Libre",
    partial: (f, t) => `Libre du ${f} au ${t}`,
    soldOut: "Complet",
    book: "Réserver",
    loading: "Vérification des disponibilités…",
    weddings: "Un mariage, un baptême, un anniversaire à une autre date ?",
    seeCalendar: "Voir le calendrier",
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
    minStay: (n) => `min. ${n} nights`,
    available: "Available",
    partial: (f, t) => `Available ${f} to ${t}`,
    soldOut: "Fully booked",
    book: "Book",
    loading: "Checking availability…",
    weddings: "A wedding, a christening or a birthday on another date?",
    seeCalendar: "See the calendar",
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
    minStay: (n) => `min. ${n} notti`,
    available: "Libero",
    partial: (f, t) => `Libero dal ${f} al ${t}`,
    soldOut: "Completo",
    book: "Prenota",
    loading: "Verifica delle disponibilità…",
    weddings: "Un matrimonio, un battesimo, un compleanno in un'altra data?",
    seeCalendar: "Vedi il calendario",
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
    minStay: (n) => `mind. ${n} Nächte`,
    available: "Frei",
    partial: (f, t) => `Frei vom ${f} bis ${t}`,
    soldOut: "Ausgebucht",
    book: "Buchen",
    loading: "Verfügbarkeit wird geprüft…",
    weddings: "Eine Hochzeit, eine Taufe, ein Geburtstag an einem anderen Datum?",
    seeCalendar: "Zum Kalender",
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
    minStay: (n) => `mín. ${n} noches`,
    available: "Libre",
    partial: (f, t) => `Libre del ${f} al ${t}`,
    soldOut: "Completo",
    book: "Reservar",
    loading: "Comprobando disponibilidad…",
    weddings: "¿Una boda, un bautizo, un cumpleaños en otra fecha?",
    seeCalendar: "Ver el calendario",
  },
};

interface Row {
  key: DateKey;
  checkIn: string;
  checkOut: string;
  minStay: number;
  status: "available" | "partial" | "soldout";
  free: { from: string; to: string } | null;
}

/** Le séjour minimum le plus strict demandé par Beds24 sur les nuits de la période. */
function minStayFor(minStay: Record<string, number> | undefined, from: string, to: string) {
  let strictest = 0;
  for (let d = from; d < to; d = addDays(d, 1)) {
    const n = minStay?.[d];
    if (n !== undefined && Number.isFinite(n) && n > strictest) strictest = n;
  }
  return strictest || DEFAULT_MIN_STAY;
}

export default function FamilyDates({ locale }: { locale: Locale }) {
  const t = COPY[locale] ?? COPY.fr;
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // « Aujourd'hui » se calcule ici et non au rendu : la page est statique.
      const today = formatDate(new Date());
      const upcoming = FAMILY_DATES.filter((d) => d.checkIn >= today);
      if (upcoming.length === 0) {
        setRows([]);
        return;
      }

      let data: Partial<AvailabilityResponse> = {};
      try {
        const from = upcoming[0].checkIn;
        // Marge de quelques nuits : une période plus courte que le séjour minimum est
        // allongée plus bas, il faut connaître la disponibilité des nuits ajoutées.
        const to = addDays(upcoming[upcoming.length - 1].checkOut, 5);
        const res = await fetch(`/api/availability?mode=map&from=${from}&to=${to}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      } catch {
        // Panne d'API : on affiche les dates comme libres, Beds24 revalide au paiement.
      }
      if (cancelled) return;

      setRows(
        upcoming.map(({ key, checkIn, checkOut }) => {
          const minStay = minStayFor(data.minStay, checkIn, checkOut);
          // Une période plus courte que le minimum (Pâques sur 2 nuits quand Beds24 en
          // exige 3) serait refusée au paiement : on l'allonge jusqu'au minimum.
          const end =
            daysBetween(checkIn, checkOut) < minStay ? addDays(checkIn, minStay) : checkOut;
          const free = longestFreeRange(data.dates ?? {}, checkIn, end);
          if (!free || free.nights < minStay) {
            return { key, checkIn, checkOut: end, minStay, status: "soldout", free: null };
          }
          const status = free.nights >= daysBetween(checkIn, end) ? "available" : "partial";
          return { key, checkIn, checkOut: end, minStay, status, free };
        }),
      );
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // En UTC : sans `timeZone`, un visiteur à l'ouest de Greenwich lirait la veille.
  const fmt = (d: string, withYear = false) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString(BCP47[locale], {
      day: "numeric",
      month: "short",
      ...(withYear ? { year: "numeric" } : {}),
      timeZone: "UTC",
    });

  if (rows && rows.length === 0) return null;

  return (
    <div className="mt-12 rounded-xl border border-border bg-light-bg px-5 py-6 sm:px-6">
      <p className="text-lg font-semibold text-foreground">{t.title}</p>
      <p className="mt-1 text-sm text-secondary">{t.intro}</p>

      {!rows ? (
        <p className="mt-4 text-sm text-secondary">{t.loading}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {rows.map((r) => (
            <li
              key={`${r.key}-${r.checkIn}`}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{t.names[r.key]}</p>
                <p className="text-sm text-secondary">
                  {fmt(r.checkIn)} → {fmt(r.checkOut, true)} · {t.minStay(r.minStay)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {r.status === "soldout" ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary">
                    <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
                    {t.soldOut}
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden />
                      {r.status === "partial" && r.free
                        ? t.partial(fmt(r.free.from), fmt(r.free.to))
                        : t.available}
                    </span>
                    <a
                      href={bookingUrl({
                        propertyId: PROPERTY_ID,
                        lang: locale,
                        checkIn: r.free?.from ?? r.checkIn,
                        checkOut: r.free?.to ?? r.checkOut,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                    >
                      {t.book}
                    </a>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-sm text-secondary">
        {t.weddings}{" "}
        <a href={`/${locale}#disponibilite`} className="font-medium text-primary underline">
          {t.seeCalendar}
        </a>
      </p>
    </div>
  );
}
