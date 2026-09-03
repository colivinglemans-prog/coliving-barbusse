"use client";

import { useEffect, useState } from "react";
import { addDays, formatDate } from "@/lib/calendar-utils";
import type { Locale } from "@/lib/i18n";

const PROPERTY_ID = 303771;
const DEFAULT_MIN_STAY = 2;

const DATE_LOCALE: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  it: "it-IT",
  de: "de-DE",
  es: "es-ES",
};

interface Copy {
  /** Titre du bloc quand toute la fenêtre conseillée est libre */
  availableTitle: string;
  /** Titre quand seule une partie de la fenêtre est libre */
  partialTitle: string;
  /** Titre quand plus rien n'est réservable */
  soldOutTitle: string;
  /** Ex. « Du 15 au 21 septembre · 6 nuits » */
  range: (from: string, to: string, nights: number) => string;
  pitch: string;
  soldOutBody: string;
  book: string;
  seeCalendar: string;
  loading: string;
}

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

type Status = "loading" | "full" | "partial" | "soldout" | "error" | "hidden";

interface Props {
  locale: Locale;
  /** Première nuit conseillée (YYYY-MM-DD) */
  checkIn: string;
  /** Départ conseillé, exclusif (YYYY-MM-DD) */
  checkOut: string;
}

/**
 * Plus longue plage de nuits consécutives libres dans [checkIn, checkOut[.
 * Renvoie null si aucune nuit n'est libre.
 */
function longestFreeRange(
  dates: Record<string, boolean>,
  checkIn: string,
  checkOut: string,
): { from: string; to: string; nights: number } | null {
  let best: { from: string; nights: number } | null = null;
  let runStart: string | null = null;
  let run = 0;

  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) {
    // Une date absente de la réponse est traitée comme libre : mieux vaut
    // proposer la réservation (Beds24 revalide au checkout) que de masquer
    // une nuit réellement disponible.
    if (dates[d] !== false) {
      if (runStart === null) runStart = d;
      run += 1;
      if (!best || run > best.nights) best = { from: runStart, nights: run };
    } else {
      runStart = null;
      run = 0;
    }
  }

  if (!best) return null;
  return { from: best.from, to: addDays(best.from, best.nights), nights: best.nights };
}

function nightsBetween(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86_400_000,
  );
}

/**
 * Bloc de réservation affiché en fin d'article événementiel.
 *
 * Il existe parce que le contenu seul ne convertit pas : sans lui, un lecteur
 * doit repérer un lien texte noyé dans le dernier paragraphe, revenir sur la
 * home, re-scroller jusqu'au calendrier puis ressaisir ses dates. Ici la
 * disponibilité réelle est annoncée et le bouton part sur Beds24 avec les
 * dates déjà remplies.
 *
 * Rendu côté client : les pages de blog sont statiques, la disponibilité doit
 * être lue au moment de la visite et non au build.
 */
export default function EventBookingCTA({ locale, checkIn, checkOut }: Props) {
  const t = COPY[locale] ?? COPY.fr;
  const [status, setStatus] = useState<Status>("loading");
  const [range, setRange] = useState<{ from: string; to: string; nights: number } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Le test se fait ici et non au rendu : la page est statique, un calcul
      // de « aujourd'hui » côté serveur resterait figé à la date du build (et
      // provoquerait une erreur d'hydratation une fois l'événement passé).
      const today = formatDate(new Date());
      // Événement en cours : on ne propose plus les nuits déjà écoulées.
      const windowStart = checkIn > today ? checkIn : today;
      if (windowStart >= checkOut) {
        setStatus("hidden");
        return;
      }

      try {
        // mode=map borne des jours inclus : la dernière nuit est la veille du départ.
        const res = await fetch(
          `/api/availability?mode=map&from=${windowStart}&to=${addDays(checkOut, -1)}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: {
          dates?: Record<string, boolean>;
          minStay?: Record<string, number>;
        } = await res.json();
        if (cancelled) return;

        const free = longestFreeRange(data.dates ?? {}, windowStart, checkOut);
        // Beds24 renvoie les minStay décalés d'un jour par rapport à la fenêtre
        // demandée : lire la seule clé du jour d'arrivée tombe parfois à côté et
        // fait silencieusement retomber sur le défaut. On retient donc la
        // contrainte la plus stricte de la fenêtre — quitte à être conservateur,
        // mieux vaut taire une plage que d'envoyer sur un séjour que Beds24
        // refusera au moment de payer.
        const minStayValues = Object.values(data.minStay ?? {}).filter(
          (n): n is number => Number.isFinite(n),
        );
        const minStay = minStayValues.length
          ? Math.max(...minStayValues)
          : DEFAULT_MIN_STAY;

        if (!free || free.nights < minStay) {
          setRange(null);
          setStatus("soldout");
          return;
        }

        setRange(free);
        setStatus(free.nights >= nightsBetween(windowStart, checkOut) ? "full" : "partial");
      } catch {
        // Une panne d'API ne doit pas faire disparaître le CTA : on retombe sur
        // les dates conseillées, Beds24 refusera de lui-même si c'est pris.
        if (cancelled) return;
        setRange({
          from: windowStart,
          to: checkOut,
          nights: nightsBetween(windowStart, checkOut),
        });
        setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [checkIn, checkOut]);

  function fmt(dateStr: string) {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString(DATE_LOCALE[locale], {
      day: "numeric",
      month: "long",
    });
  }

  const calendarHref = `/${locale}#disponibilite`;

  // Événement terminé : l'article reste en ligne comme archive, sans CTA.
  if (status === "hidden") return null;

  if (status === "loading") {
    return (
      <div className="mt-12 rounded-xl border border-border bg-light-bg px-6 py-8">
        <p className="text-sm text-secondary">{t.loading}</p>
      </div>
    );
  }

  if (status === "soldout") {
    return (
      <div className="mt-12 rounded-xl border border-border bg-light-bg px-6 py-8">
        <p className="text-lg font-semibold text-foreground">{t.soldOutTitle}</p>
        <p className="mt-2 text-sm text-secondary">{t.soldOutBody}</p>
        <a
          href={calendarHref}
          className="mt-5 inline-block rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-light-bg"
        >
          {t.seeCalendar}
        </a>
      </div>
    );
  }

  const bookingUrl = range
    ? `https://beds24.com/booking2.php?propid=${PROPERTY_ID}&layout=1&lang=${locale}` +
      `&checkin=${range.from}&checkout=${range.to}`
    : null;

  return (
    <div className="mt-12 rounded-xl border border-primary/30 bg-primary/5 px-6 py-8">
      <p className="text-lg font-semibold text-foreground">
        {status === "partial" ? t.partialTitle : t.availableTitle}
      </p>
      {range && (
        <p className="mt-1 text-base font-medium text-primary">
          {t.range(fmt(range.from), fmt(range.to), range.nights)}
        </p>
      )}
      <p className="mt-3 text-sm text-secondary">{t.pitch}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {bookingUrl && (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            {t.book}
          </a>
        )}
        <a
          href={calendarHref}
          className="inline-block rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-light-bg"
        >
          {t.seeCalendar}
        </a>
      </div>
    </div>
  );
}
