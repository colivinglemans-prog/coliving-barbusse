"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { Beds24Booking } from "@/lib/types";

/* ── Channel colours (same as ChannelPieChart) ────────────────────── */
const CHANNEL_COLORS: Record<string, string> = {
  Airbnb: "#FF385C",
  "Booking.com": "#003580",
  Abritel: "#F5A623",
  Direct: "#00A699",
  Autre: "#9ca3af",
};

function normalizeChannel(referer: string, channel?: string): string {
  const c = (channel ?? "").toLowerCase();
  const r = referer.toLowerCase();
  if (c === "airbnb" || r.includes("airbnb")) return "Airbnb";
  if (c.includes("booking") || r.includes("booking")) return "Booking.com";
  if (c.includes("abritel") || r.includes("abritel") || r.includes("homeaway") || r.includes("vrbo")) return "Abritel";
  if (c === "direct" || c === "app" || c === "" || r === "") return "Direct";
  return "Autre";
}

/* ── Helpers ───────────────────────────────────────────────────────── */
const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function diffDays(a: string, b: string) {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

function formatEuro(v: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
}

/* ── Types ─────────────────────────────────────────────────────────── */
interface BookingBar {
  booking: Beds24Booking;
  channel: string;
  colour: string;
  /** 0-based col start within month grid (capped to 0) */
  startCol: number;
  /** 0-based col end (exclusive, capped to totalDays) */
  endCol: number;
  label: string;
}

interface PopupData {
  booking: Beds24Booking;
  channel: string;
  colour: string;
  nights: number;
  rect: DOMRect;
}

/* ── Component ─────────────────────────────────────────────────────── */
interface BookingCalendarProps {
  bookings: Beds24Booking[];
  showPrices?: boolean;
}

export default function BookingCalendar({ bookings, showPrices = true }: BookingCalendarProps) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [popup, setPopup] = useState<PopupData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popup on click outside
  useEffect(() => {
    if (!popup) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-popup]") && !target.closest("[data-bar]")) {
        setPopup(null);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [popup]);

  const year = month.getFullYear();
  const mo = month.getMonth();
  const daysInMonth = new Date(year, mo + 1, 0).getDate();
  // Day of week for 1st: 0=Mon .. 6=Sun
  const firstDow = (new Date(year, mo, 1).getDay() + 6) % 7;

  const firstDateStr = `${year}-${String(mo + 1).padStart(2, "0")}-01`;
  const lastDateStr = `${year}-${String(mo + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  /* ── Compute bars for visible bookings ───────────────────────────── */
  const bars: BookingBar[] = useMemo(() => {
    return bookings
      .filter((b) => {
        // Booking overlaps the month if arrival < end-of-month AND departure > start-of-month
        return b.arrival <= lastDateStr && b.departure > firstDateStr;
      })
      .map((b) => {
        const channel = normalizeChannel(b.referer, b.channel);
        const guests = b.numAdult + b.numChild;
        // Col positions: day 1 = col 0
        const arrDate = new Date(b.arrival + "T00:00:00");
        const depDate = new Date(b.departure + "T00:00:00");
        const monthStart = new Date(year, mo, 1);
        const monthEnd = new Date(year, mo, daysInMonth);

        const startDay = arrDate < monthStart ? 1 : arrDate.getDate();
        const endDay = depDate > monthEnd ? daysInMonth : depDate.getDate() - 1; // departure day is checkout, not occupied

        return {
          booking: b,
          channel,
          colour: CHANNEL_COLORS[channel] ?? "#9ca3af",
          startCol: startDay - 1,
          endCol: Math.max(startDay - 1, endDay), // endCol is inclusive
          label: `${b.lastName || b.firstName} · ${guests} voy.`,
        };
      })
      .sort((a, b) => a.startCol - b.startCol);
  }, [bookings, firstDateStr, lastDateStr, year, mo, daysInMonth]);

  /* ── Build weeks (rows) with booking bar assignments ──────────── */
  const totalCells = firstDow + daysInMonth;
  const weeks = Math.ceil(totalCells / 7);

  // Assign bars to "lanes" (rows within each week) to avoid overlap
  type BarPlacement = BookingBar & { row: number; weekStart: number; weekEnd: number };
  const barPlacements: BarPlacement[] = useMemo(() => {
    const placements: BarPlacement[] = [];
    // For each week, track used lanes
    const weekLanes: Map<number, [number, number][][]> = new Map(); // week -> array of [startCol, endCol] per lane

    for (const bar of bars) {
      // Find which weeks this bar spans
      const barStartCell = firstDow + bar.startCol;
      const barEndCell = firstDow + bar.endCol;
      const startWeek = Math.floor(barStartCell / 7);
      const endWeek = Math.floor(barEndCell / 7);

      for (let w = startWeek; w <= endWeek; w++) {
        const weekCellStart = w * 7;
        const weekCellEnd = weekCellStart + 6;
        const visStart = Math.max(barStartCell, weekCellStart);
        const visEnd = Math.min(barEndCell, weekCellEnd);
        const colInWeek0 = visStart - weekCellStart;
        const colInWeek1 = visEnd - weekCellStart;

        // Find a free lane
        if (!weekLanes.has(w)) weekLanes.set(w, []);
        const lanes = weekLanes.get(w)!;
        let lane = 0;
        for (lane = 0; lane < lanes.length; lane++) {
          const occupied = lanes[lane];
          const conflict = occupied.some(
            ([s, e]) => colInWeek0 <= e && colInWeek1 >= s,
          );
          if (!conflict) break;
        }
        if (lane === lanes.length) lanes.push([]);
        lanes[lane].push([colInWeek0, colInWeek1]);

        placements.push({
          ...bar,
          row: lane,
          weekStart: colInWeek0,
          weekEnd: colInWeek1,
        });
      }
    }
    return placements;
  }, [bars, firstDow]);

  // Group placements by week
  const placementsByWeek: Map<number, BarPlacement[]> = useMemo(() => {
    const map = new Map<number, BarPlacement[]>();
    for (const p of barPlacements) {
      const barStartCell = firstDow + p.startCol;
      const barEndCell = firstDow + p.endCol;
      const startWeek = Math.floor(barStartCell / 7);
      const endWeek = Math.floor(barEndCell / 7);
      for (let w = startWeek; w <= endWeek; w++) {
        if (!map.has(w)) map.set(w, []);
        // Only add if this is the right week segment
        const weekCellStart = w * 7;
        const weekCellEnd = weekCellStart + 6;
        const visStart = Math.max(barStartCell, weekCellStart);
        const visEnd = Math.min(barEndCell, weekCellEnd);
        const colInWeek0 = visStart - weekCellStart;
        const colInWeek1 = visEnd - weekCellStart;
        // Find matching placement
        const match = barPlacements.find(
          (bp) =>
            bp.booking.id === p.booking.id &&
            bp.weekStart === colInWeek0 &&
            bp.weekEnd === colInWeek1 &&
            bp.row === p.row,
        );
        if (match && !map.get(w)!.includes(match)) {
          map.get(w)!.push(match);
        }
      }
    }
    return map;
  }, [barPlacements, firstDow]);

  function handleBarClick(bar: BookingBar, e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopup({
      booking: bar.booking,
      channel: bar.channel,
      colour: bar.colour,
      nights: diffDays(bar.booking.arrival, bar.booking.departure),
      rect,
    });
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Header: month navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setMonth((m) => addMonths(m, -1))}
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {MONTH_NAMES[mo]} {year}
        </h2>
        <button
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 border-b border-gray-200 pb-2">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-500">
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      {Array.from({ length: weeks }, (_, w) => {
        const weekBars = placementsByWeek.get(w) ?? [];
        const maxLane = weekBars.reduce((m, b) => Math.max(m, b.row), -1);
        const barRows = maxLane + 1;

        return (
          <div key={w} className="grid grid-cols-7 border-b border-gray-100">
            {/* Day number row */}
            {Array.from({ length: 7 }, (_, col) => {
              const dayIdx = w * 7 + col - firstDow;
              const day = dayIdx + 1;
              const isInMonth = day >= 1 && day <= daysInMonth;
              const today = toDateStr(new Date());
              const cellDate = isInMonth ? `${year}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
              const isToday = cellDate === today;

              return (
                <div
                  key={col}
                  className={`min-h-[2.5rem] border-r border-gray-50 px-1.5 pt-1 last:border-r-0 ${!isInMonth ? "bg-gray-50/50" : ""}`}
                >
                  {isInMonth && (
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        isToday
                          ? "bg-rose-500 font-bold text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {day}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Bar rows */}
            {barRows > 0 && (
              <div className="col-span-7 px-0.5 pb-1.5">
                {Array.from({ length: barRows }, (_, lane) => {
                  const laneBars = weekBars.filter((b) => b.row === lane);
                  return (
                    <div key={lane} className="relative mt-0.5 h-6">
                      {laneBars.map((bp) => {
                        const left = `${(bp.weekStart / 7) * 100}%`;
                        const width = `${((bp.weekEnd - bp.weekStart + 1) / 7) * 100}%`;
                        const isStart = bp.weekStart === firstDow + bp.startCol - Math.floor((firstDow + bp.startCol) / 7) * 7;

                        return (
                          <button
                            key={`${bp.booking.id}-${bp.weekStart}`}
                            data-bar
                            onClick={(e) => handleBarClick(bp, e)}
                            className="absolute top-0 h-full cursor-pointer overflow-hidden truncate rounded px-1.5 text-left text-[11px] font-medium text-white transition-opacity hover:opacity-90"
                            style={{
                              left,
                              width,
                              backgroundColor: bp.colour,
                            }}
                            title={bp.label}
                          >
                            {isStart && (
                              <span className="hidden sm:inline">{bp.label}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4">
        {Object.entries(CHANNEL_COLORS).map(([name, colour]) => (
          <div key={name} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: colour }} />
            {name}
          </div>
        ))}
      </div>

      {/* Popup */}
      {popup && (
        <div
          data-popup
          className="fixed z-50 w-72 rounded-xl bg-white p-4 shadow-xl ring-1 ring-gray-200"
          style={{
            top: Math.min(popup.rect.bottom + 8, window.innerHeight - 260),
            left: Math.min(popup.rect.left, window.innerWidth - 300),
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">
              {popup.booking.firstName} {popup.booking.lastName}
            </h4>
            <button onClick={() => setPopup(null)} className="text-gray-400 hover:text-gray-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Dates</span>
              <span className="text-gray-900">
                {new Date(popup.booking.arrival).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                {" → "}
                {new Date(popup.booking.departure).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                <span className="ml-1 text-gray-400">({popup.nights} nuit{popup.nights > 1 ? "s" : ""})</span>
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Voyageurs</span>
              <span className="text-gray-900">
                {popup.booking.numAdult} adulte{popup.booking.numAdult > 1 ? "s" : ""}
                {popup.booking.numChild > 0 && `, ${popup.booking.numChild} enfant${popup.booking.numChild > 1 ? "s" : ""}`}
              </span>
            </div>

            {showPrices && (
              <div className="flex justify-between">
                <span className="text-gray-500">Montant</span>
                <span className="font-medium text-gray-900">{formatEuro(popup.booking.price)}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Canal</span>
              <span className="flex items-center gap-1.5 text-gray-900">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: popup.colour }} />
                {popup.channel}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
