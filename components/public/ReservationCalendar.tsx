"use client";

import { useState, useEffect, useCallback } from "react";
import {
  formatDate,
  daysInMonth,
  firstDayOfMonth,
  addMonths,
  monthKey,
  addDays,
  MONTH_NAMES_FR,
  DAY_NAMES_FR,
} from "@/lib/calendar-utils";

const PROPERTY_ID = 303771;
const DEFAULT_MIN_STAY = 2;

type AvailabilityMap = Record<string, boolean>;
type MinStayMap = Record<string, number>;
type DayCellState =
  | "past"
  | "unavailable"
  | "available"
  | "check-in"
  | "check-out"
  | "in-range"
  | "hover-range"
  | "disabled";

export default function ReservationCalendar() {
  const now = new Date();
  const todayStr = formatDate(now);

  const [baseYear, setBaseYear] = useState(now.getFullYear());
  const [baseMonth, setBaseMonth] = useState(now.getMonth());
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [availCache, setAvailCache] = useState<Record<string, AvailabilityMap>>({});
  const [minStayCache, setMinStayCache] = useState<MinStayMap>({});
  const [loading, setLoading] = useState(false);

  const month2 = addMonths(baseYear, baseMonth, 1);

  const fetchAvailability = useCallback(async () => {
    const key1 = monthKey(baseYear, baseMonth);
    const key2 = monthKey(month2.year, month2.month);
    if (availCache[key1] && availCache[key2]) return;

    setLoading(true);
    try {
      const from = `${key1}-01`;
      const lastDay = daysInMonth(month2.year, month2.month);
      const to = `${key2}-${String(lastDay).padStart(2, "0")}`;

      const res = await fetch(`/api/availability?mode=map&from=${from}&to=${to}`);
      const data = await res.json();

      if (data.dates) {
        const newAvailCache: Record<string, AvailabilityMap> = { ...availCache };
        for (const [dateStr, avail] of Object.entries(data.dates as AvailabilityMap)) {
          const mk = dateStr.substring(0, 7);
          if (!newAvailCache[mk]) newAvailCache[mk] = {};
          newAvailCache[mk][dateStr] = avail;
        }
        setAvailCache(newAvailCache);
      }

      if (data.minStay) {
        setMinStayCache((prev) => ({ ...prev, ...(data.minStay as MinStayMap) }));
      }
    } catch {
      // Silently fail — dates will show as unavailable
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseYear, baseMonth]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Navigation
  const todayKey = monthKey(now.getFullYear(), now.getMonth());
  const canGoPrev = monthKey(baseYear, baseMonth) > todayKey;

  function goNext() {
    const next = addMonths(baseYear, baseMonth, 1);
    setBaseYear(next.year);
    setBaseMonth(next.month);
  }
  function goPrev() {
    if (!canGoPrev) return;
    const prev = addMonths(baseYear, baseMonth, -1);
    setBaseYear(prev.year);
    setBaseMonth(prev.month);
  }

  // Availability helpers
  function isDateAvailable(dateStr: string): boolean {
    const mk = dateStr.substring(0, 7);
    if (!availCache[mk]) return false;
    return availCache[mk][dateStr] !== false;
  }

  function isDatePast(dateStr: string): boolean {
    return dateStr < todayStr;
  }

  function getMinStayForDate(dateStr: string): number {
    return minStayCache[dateStr] ?? DEFAULT_MIN_STAY;
  }

  /**
   * Count consecutive available nights starting from dateStr.
   * E.g. if Apr 3 is available but Apr 4 is not, returns 1.
   */
  function consecutiveAvailableNights(dateStr: string): number {
    let count = 0;
    let d = dateStr;
    while (isDateAvailable(d)) {
      count++;
      d = addDays(d, 1);
      // Safety: stop after 365 days
      if (count > 365) break;
    }
    return count;
  }

  /**
   * A date is valid as check-in only if:
   * - Not in the past
   * - Is available
   * - Has enough consecutive available nights to meet the minimum stay
   */
  function isValidCheckIn(dateStr: string): boolean {
    if (isDatePast(dateStr)) return false;
    if (!isDateAvailable(dateStr)) return false;
    const minStay = getMinStayForDate(dateStr);
    const available = consecutiveAvailableNights(dateStr);
    return available >= minStay;
  }

  /**
   * When selecting check-out: must be at least minStay nights after check-in,
   * and all intermediate dates must be available.
   */
  function isValidCheckOut(dateStr: string): boolean {
    if (!checkIn) return false;
    if (dateStr <= checkIn) return false;
    const minStay = getMinStayForDate(checkIn);
    const minCheckOut = addDays(checkIn, minStay);
    if (dateStr < minCheckOut) return false;
    // All intermediate dates must be available
    let d = addDays(checkIn, 1);
    while (d < dateStr) {
      if (!isDateAvailable(d)) return false;
      d = addDays(d, 1);
    }
    return true;
  }

  function clearSelection() {
    setCheckIn(null);
    setCheckOut(null);
    setHoverDate(null);
  }

  function handleDateClick(dateStr: string) {
    if (isDatePast(dateStr) || !isDateAvailable(dateStr)) return;

    if (!checkIn || (checkIn && checkOut)) {
      // Starting new selection: only allow valid check-in dates
      if (isValidCheckIn(dateStr)) {
        setCheckIn(dateStr);
        setCheckOut(null);
        setHoverDate(null);
      }
    } else {
      // Check-in is set, selecting check-out
      if (dateStr <= checkIn) {
        // Clicked before or on check-in: restart if valid check-in
        if (isValidCheckIn(dateStr)) {
          setCheckIn(dateStr);
          setCheckOut(null);
          setHoverDate(null);
        }
      } else if (isValidCheckOut(dateStr)) {
        setCheckOut(dateStr);
        setHoverDate(null);
      } else if (isValidCheckIn(dateStr)) {
        // Clicked a non-selectable check-out but valid check-in: restart
        setCheckIn(dateStr);
        setCheckOut(null);
        setHoverDate(null);
      }
    }
  }

  function handleDateHover(dateStr: string) {
    if (checkIn && !checkOut) {
      setHoverDate(dateStr);
    }
  }

  function getCellState(dateStr: string): DayCellState {
    if (checkIn && dateStr === checkIn) return "check-in";
    if (checkOut && dateStr === checkOut) return "check-out";
    if (checkIn && checkOut && dateStr > checkIn && dateStr < checkOut) return "in-range";
    if (
      checkIn &&
      !checkOut &&
      hoverDate &&
      hoverDate > checkIn &&
      dateStr > checkIn &&
      dateStr < hoverDate &&
      isValidCheckOut(hoverDate)
    ) {
      return "hover-range";
    }
    if (isDatePast(dateStr)) return "past";
    if (!isDateAvailable(dateStr)) return "unavailable";

    // When no check-in selected: disable dates that can't be used as check-in
    if (!checkIn && !isValidCheckIn(dateStr)) return "disabled";

    // When check-in selected, waiting for check-out:
    // disable dates that are neither valid check-out nor valid check-in (for restart)
    if (checkIn && !checkOut) {
      if (!isValidCheckOut(dateStr) && !isValidCheckIn(dateStr)) return "disabled";
    }

    return "available";
  }

  // Compute nights
  const nights =
    checkIn && checkOut
      ? Math.round(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000,
        )
      : 0;

  const bookingUrl =
    checkIn && checkOut
      ? `https://beds24.com/booking2.php?propid=${PROPERTY_ID}&layout=1&checkin=${checkIn}&checkout=${checkOut}`
      : null;

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [numAdults, setNumAdults] = useState(2);
  const [numChildren, setNumChildren] = useState(0);

  // Display min stay hint when check-in is selected
  const checkInMinStay = checkIn ? getMinStayForDate(checkIn) : null;

  const bookingUrlWithGuests =
    bookingUrl
      ? `${bookingUrl}&numadult=${numAdults}&numchild=${numChildren}`
      : null;

  return (
    <div id="disponibilite" className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">Réservation</h2>
      <p className="mt-1 text-sm text-secondary">
        Sélectionnez vos dates pour réserver la maison entière.
      </p>

      <div className="mt-6 rounded-xl border border-border p-4 sm:p-6">
        {/* Month navigation */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            className="rounded-full p-2 transition-colors hover:bg-light-bg disabled:opacity-30"
            aria-label="Mois précédent"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex gap-8 text-sm font-semibold text-foreground">
            <span>
              {MONTH_NAMES_FR[baseMonth]} {baseYear}
            </span>
            <span className="hidden md:inline">
              {MONTH_NAMES_FR[month2.month]} {month2.year}
            </span>
          </div>
          <button
            onClick={goNext}
            className="rounded-full p-2 transition-colors hover:bg-light-bg"
            aria-label="Mois suivant"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar grids */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <MonthGrid
            year={baseYear}
            month={baseMonth}
            getCellState={getCellState}
            onDateClick={handleDateClick}
            onDateHover={handleDateHover}
          />
          <div className="hidden md:block">
            <MonthGrid
              year={month2.year}
              month={month2.month}
              getCellState={getCellState}
              onDateClick={handleDateClick}
              onDateHover={handleDateHover}
            />
          </div>
        </div>

        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-secondary">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-secondary/30 border-t-secondary" />
            Chargement des disponibilités...
          </div>
        )}

        {/* Selection summary — both dates selected */}
        {checkIn && checkOut && (
          <div className="mt-6 flex flex-col items-end gap-3 rounded-lg bg-light-bg p-4">
            <div className="text-sm text-foreground">
              <span className="font-semibold">
                {nights} nuit{nights > 1 ? "s" : ""}
              </span>{" "}
              — du {checkIn} au {checkOut}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
              <GuestCounter
                label="Adultes"
                value={numAdults}
                min={1}
                max={18}
                onChange={setNumAdults}
              />
              <GuestCounter
                label="Ados (10-17 ans)"
                value={numChildren}
                min={0}
                max={17}
                onChange={setNumChildren}
              />
            </div>
            <p className="text-xs text-secondary">
              Logement non adapté aux jeunes enfants.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={clearSelection}
                className="text-sm font-medium text-primary underline underline-offset-2 hover:text-primary-dark"
              >
                Effacer
              </button>
              <button
                onClick={() => setShowBookingModal(true)}
                className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Réserver maintenant
              </button>
            </div>
          </div>
        )}

        {/* Check-in selected, waiting for check-out */}
        {checkIn && !checkOut && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <p className="text-sm text-secondary">
              Arrivée : <span className="font-medium text-foreground">{checkIn}</span>
              {checkInMinStay && checkInMinStay > 1 && (
                <span className="text-secondary"> (min. {checkInMinStay} nuits)</span>
              )}
              {" "}— Sélectionnez votre date de départ
            </p>
            <button
              onClick={clearSelection}
              className="text-sm font-medium text-primary underline underline-offset-2 hover:text-primary-dark"
            >
              Effacer
            </button>
          </div>
        )}

        {/* No selection */}
        {!checkIn && (
          <p className="mt-4 text-center text-sm text-secondary">
            Sélectionnez votre date d&apos;arrivée
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-border" />
          Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-gray-200" />
          Indisponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-primary" />
          Sélectionné
        </span>
      </div>

      {/* Booking modal with Beds24 iframe */}
      {showBookingModal && bookingUrlWithGuests && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBookingModal(false);
          }}
        >
          <div className="relative flex h-[60vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Finaliser votre réservation
                </h3>
                <p className="text-xs text-secondary">
                  {nights} nuit{nights > 1 ? "s" : ""} — du {checkIn} au {checkOut} · {numAdults} adulte{numAdults > 1 ? "s" : ""}{numChildren > 0 ? `, ${numChildren} enfant${numChildren > 1 ? "s" : ""}` : ""}
                </p>
              </div>
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-light-bg"
                aria-label="Fermer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Iframe */}
            <div className="relative flex-1">
              <iframe
                src={bookingUrlWithGuests}
                className="h-full w-full border-0"
                title="Réservation Beds24"
                allow="payment"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- GuestCounter sub-component ---- */

function GuestCounter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-foreground whitespace-nowrap">{label}</span>
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-light-bg disabled:opacity-30 disabled:cursor-default"
        aria-label={`Moins de ${label.toLowerCase()}`}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <span className="w-6 text-center text-sm font-semibold text-foreground">{value}</span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-light-bg disabled:opacity-30 disabled:cursor-default"
        aria-label={`Plus de ${label.toLowerCase()}`}
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

/* ---- MonthGrid sub-component ---- */

interface MonthGridProps {
  year: number;
  month: number;
  getCellState: (dateStr: string) => DayCellState;
  onDateClick: (dateStr: string) => void;
  onDateHover: (dateStr: string) => void;
}

const CELL_STYLES: Record<DayCellState, string> = {
  past: "text-gray-300 cursor-default",
  unavailable: "text-gray-400 line-through cursor-default bg-gray-100 font-medium",
  available: "text-foreground hover:bg-light-bg cursor-pointer font-medium",
  "check-in": "bg-primary text-white font-semibold rounded-l-full cursor-pointer",
  "check-out": "bg-primary text-white font-semibold rounded-r-full cursor-pointer",
  "in-range": "bg-primary/15 text-foreground",
  "hover-range": "bg-primary/8 text-foreground",
  disabled: "text-gray-300 cursor-default",
};

function MonthGrid({
  year,
  month,
  getCellState,
  onDateClick,
  onDateHover,
}: MonthGridProps) {
  const days = daysInMonth(year, month);
  const offset = firstDayOfMonth(year, month);

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 text-center text-xs font-medium text-secondary">
        {DAY_NAMES_FR.map((name) => (
          <div key={name} className="py-1">
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const state = getCellState(dateStr);
          const isClickable =
            state === "available" ||
            state === "check-in" ||
            state === "check-out" ||
            state === "in-range" ||
            state === "hover-range";

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onDateClick(dateStr)}
              onMouseEnter={() => onDateHover(dateStr)}
              className={`flex aspect-square items-center justify-center text-sm transition-colors ${CELL_STYLES[state]}`}
              aria-label={`${day} ${MONTH_NAMES_FR[month]} ${year}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
