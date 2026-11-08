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
 * Une liste de périodes (fêtes en famille, événements à venir), chacune avec sa disponibilité
 * lue en direct et un bouton de réservation aux dates pré-remplies.
 *
 * Composant client : les pages d'article sont statiques, la disponibilité se lit à la visite.
 * « Complet » n'est jamais écrit en dur : une annulation rouvre la ligne toute seule. Les
 * périodes déjà commencées disparaissent d'elles-mêmes.
 *
 * Utilisé par `FamilyDates` (fêtes) et `EventDates` (événements de `LE_MANS_EVENTS`).
 */

/** Séjour minimum retenu quand Beds24 n'en impose aucun sur la période. */
const DEFAULT_MIN_STAY = 2;

export interface DatePeriod {
  /** Identifiant stable, pour la clé React. */
  id: string;
  name: string;
  checkIn: string;
  /** Exclu : c'est le jour du départ. */
  checkOut: string;
}

export interface AvailabilityDatesProps {
  locale: Locale;
  title: string;
  intro: string;
  periods: DatePeriod[];
  /** Phrase avant le lien vers le calendrier, en pied de bloc. */
  footer: string;
}

const BCP47: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  it: "it-IT",
  de: "de-DE",
  es: "es-ES",
};

interface Labels {
  minStay: (n: number) => string;
  available: string;
  partial: (from: string, to: string) => string;
  soldOut: string;
  book: string;
  loading: string;
  seeCalendar: string;
}

const LABELS: Record<Locale, Labels> = {
  fr: {
    minStay: (n) => `min. ${n} nuits`,
    available: "Libre",
    partial: (f, t) => `Libre du ${f} au ${t}`,
    soldOut: "Complet",
    book: "Réserver",
    loading: "Vérification des disponibilités…",
    seeCalendar: "Voir le calendrier",
  },
  en: {
    minStay: (n) => `min. ${n} nights`,
    available: "Available",
    partial: (f, t) => `Available ${f} to ${t}`,
    soldOut: "Fully booked",
    book: "Book",
    loading: "Checking availability…",
    seeCalendar: "See the calendar",
  },
  it: {
    minStay: (n) => `min. ${n} notti`,
    available: "Libero",
    partial: (f, t) => `Libero dal ${f} al ${t}`,
    soldOut: "Completo",
    book: "Prenota",
    loading: "Verifica delle disponibilità…",
    seeCalendar: "Vedi il calendario",
  },
  de: {
    minStay: (n) => `mind. ${n} Nächte`,
    available: "Frei",
    partial: (f, t) => `Frei vom ${f} bis ${t}`,
    soldOut: "Ausgebucht",
    book: "Buchen",
    loading: "Verfügbarkeit wird geprüft…",
    seeCalendar: "Zum Kalender",
  },
  es: {
    minStay: (n) => `mín. ${n} noches`,
    available: "Libre",
    partial: (f, t) => `Libre del ${f} al ${t}`,
    soldOut: "Completo",
    book: "Reservar",
    loading: "Comprobando disponibilidad…",
    seeCalendar: "Ver el calendario",
  },
};

interface Row extends DatePeriod {
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

export default function AvailabilityDates({
  locale,
  title,
  intro,
  periods,
  footer,
}: AvailabilityDatesProps) {
  const t = LABELS[locale] ?? LABELS.fr;
  const [rows, setRows] = useState<Row[] | null>(null);
  // Les périodes arrivent du serveur : la clé évite de relancer l'effet à chaque rendu.
  const periodsKey = periods.map((p) => `${p.id}:${p.checkIn}:${p.checkOut}`).join("|");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // « Aujourd'hui » se calcule ici et non au rendu : la page est statique.
      const today = formatDate(new Date());
      const upcoming = periods
        .filter((d) => d.checkIn >= today)
        .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
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
        upcoming.map((p) => {
          const minStay = minStayFor(data.minStay, p.checkIn, p.checkOut);
          // Une période plus courte que le minimum serait refusée au paiement : on
          // l'allonge jusqu'au minimum.
          const end =
            daysBetween(p.checkIn, p.checkOut) < minStay ? addDays(p.checkIn, minStay) : p.checkOut;
          const free = longestFreeRange(data.dates ?? {}, p.checkIn, end);
          if (!free || free.nights < minStay) {
            return { ...p, checkOut: end, minStay, status: "soldout", free: null };
          }
          const status = free.nights >= daysBetween(p.checkIn, end) ? "available" : "partial";
          return { ...p, checkOut: end, minStay, status, free };
        }),
      );
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodsKey]);

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
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-secondary">{intro}</p>

      {!rows ? (
        <p className="mt-4 text-sm text-secondary">{t.loading}</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {rows.map((r) => (
            <li
              key={`${r.id}-${r.checkIn}`}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{r.name}</p>
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
        {footer}{" "}
        <a href={`/${locale}#disponibilite`} className="font-medium text-primary underline">
          {t.seeCalendar}
        </a>
      </p>
    </div>
  );
}
