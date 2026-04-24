"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { Beds24Booking } from "@/lib/types";
import { findEventForStay, LE_MANS_EVENTS, shortEventLabel, type LeMansEvent } from "@/lib/events";

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
  /** 0-based col start within month grid */
  startCol: number;
  /** 0-based col end (inclusive) */
  endCol: number;
  /** true if the actual arrival day is visible (not clamped to month start) */
  startsInMonth: boolean;
  /** true if the actual departure day is visible (not clamped to month end) */
  endsInMonth: boolean;
  label: string;
}

interface EventBar {
  event: LeMansEvent;
  startCol: number;
  endCol: number;
  startsInMonth: boolean;
  endsInMonth: boolean;
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
  showChannels?: boolean;
  onNotesUpdated?: (bookingId: number, notes: string) => void;
}

/* ── Notes editor (admin editable, viewer read-only) ────────────── */
function NotesEditor({
  bookingId,
  initialNotes,
  editable,
  onSaved,
}: {
  bookingId: number;
  initialNotes: string;
  editable: boolean;
  onSaved: (notes: string) => void;
}) {
  const [value, setValue] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const prevBookingIdRef = useRef(bookingId);

  // Reset only when opening a *different* booking — not when our own onSaved
  // bubbles up and changes initialNotes (otherwise the ✓ vert flashes off)
  useEffect(() => {
    if (prevBookingIdRef.current !== bookingId) {
      prevBookingIdRef.current = bookingId;
      setValue(initialNotes);
      setStatus("idle");
      setErrorMsg("");
    }
  }, [bookingId, initialNotes]);

  if (!editable) {
    // Viewer mode: read-only display
    if (!initialNotes.trim()) return null;
    return (
      <div className="col-span-2">
        <p className="text-xs text-gray-400">Note interne</p>
        <p className="mt-0.5 whitespace-pre-wrap rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {initialNotes}
        </p>
      </div>
    );
  }

  async function handleSave() {
    setSaving(true);
    setStatus("idle");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/dashboard/bookings/${bookingId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      onSaved(value);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  const dirty = value !== initialNotes;

  return (
    <div className="col-span-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Note interne (ménage, infos…)</p>
        {status === "saved" && <span className="text-[10px] text-emerald-600">✓ enregistré</span>}
        {status === "error" && <span className="text-[10px] text-red-600">✗ erreur</span>}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        className="mt-1 w-full resize-y rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 placeholder-amber-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        onClick={(e) => e.stopPropagation()}
      />
      {status === "error" && errorMsg && (
        <p className="mt-1 text-[10px] text-red-600">{errorMsg}</p>
      )}
      {dirty && (
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setValue(initialNotes);
            }}
            disabled={saving}
            className="rounded-md px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSave();
            }}
            disabled={saving}
            className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "…" : "Enregistrer"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function BookingCalendar({ bookings, showPrices = true, showChannels = true, onNotesUpdated }: BookingCalendarProps) {
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
        const arrDate = new Date(b.arrival + "T00:00:00");
        const depDate = new Date(b.departure + "T00:00:00");
        const monthStart = new Date(year, mo, 1);
        const monthEnd = new Date(year, mo, daysInMonth);

        // Include departure day in the bar (half-cell)
        const startsInMonth = arrDate >= monthStart;
        const endsInMonth = depDate <= new Date(year, mo, daysInMonth + 1);
        const startDay = startsInMonth ? arrDate.getDate() : 1;
        const endDay = endsInMonth ? depDate.getDate() : daysInMonth;

        return {
          booking: b,
          channel,
          colour: showChannels ? (CHANNEL_COLORS[channel] ?? "#9ca3af") : "#FF385C",
          startCol: startDay - 1,
          endCol: Math.max(startDay - 1, endDay - 1),
          startsInMonth,
          endsInMonth,
          label: `${b.firstName || b.lastName} · ${guests} voy.`,
        };
      })
      .sort((a, b) => a.startCol - b.startCol);
  }, [bookings, firstDateStr, lastDateStr, year, mo, daysInMonth]);

  /* ── Build weeks (rows) with booking bar assignments ──────────── */
  const totalCells = firstDow + daysInMonth;
  const weeks = Math.ceil(totalCells / 7);

  // Assign bars to "lanes" (rows within each week) to avoid overlap.
  // Uses half-cell precision so a checkout bar (left half of day N) and a check-in
  // bar (right half of day N) can share the same lane.
  type BarPlacement = BookingBar & { row: number; weekStart: number; weekEnd: number; isFirstSegment: boolean; isLastSegment: boolean };
  const barPlacements: BarPlacement[] = useMemo(() => {
    const placements: BarPlacement[] = [];
    // Each lane stores [leftHalf, rightHalf] ranges (in half-cell units: col*2 + 0 left, +1 right)
    const weekLanes: Map<number, [number, number][][]> = new Map();

    for (const bar of bars) {
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

        // Compute visual half-cell boundaries for this segment
        const showsArrival = w === startWeek && bar.startsInMonth;
        const showsDeparture = w === endWeek && bar.endsInMonth;
        const leftHalf = colInWeek0 * 2 + (showsArrival ? 1 : 0);
        const rightHalf = colInWeek1 * 2 + 1 - (showsDeparture ? 1 : 0);

        // Find a free lane (no half-cell overlap)
        if (!weekLanes.has(w)) weekLanes.set(w, []);
        const lanes = weekLanes.get(w)!;
        let lane = 0;
        for (lane = 0; lane < lanes.length; lane++) {
          const occupied = lanes[lane];
          const conflict = occupied.some(
            ([s, e]) => leftHalf <= e && rightHalf >= s,
          );
          if (!conflict) break;
        }
        if (lane === lanes.length) lanes.push([]);
        lanes[lane].push([leftHalf, rightHalf]);

        placements.push({
          ...bar,
          row: lane,
          weekStart: colInWeek0,
          weekEnd: colInWeek1,
          isFirstSegment: w === startWeek,
          isLastSegment: w === endWeek,
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

  /* ── Compute event bars (Le Mans events, indigo) ─────────────────── */
  const eventBars: EventBar[] = useMemo(() => {
    return LE_MANS_EVENTS
      .filter((ev) => ev.start <= lastDateStr && ev.end >= firstDateStr)
      .map((ev) => {
        const startsInMonth = ev.start >= firstDateStr;
        const endsInMonth = ev.end <= lastDateStr;
        const startDay = startsInMonth ? Number(ev.start.slice(8, 10)) : 1;
        const endDay = endsInMonth ? Number(ev.end.slice(8, 10)) : daysInMonth;
        return {
          event: ev,
          startCol: startDay - 1,
          endCol: Math.max(startDay - 1, endDay - 1),
          startsInMonth,
          endsInMonth,
          label: shortEventLabel(ev.name),
        };
      })
      .sort((a, b) => a.startCol - b.startCol);
  }, [firstDateStr, lastDateStr, daysInMonth]);

  type EventPlacement = EventBar & { row: number; weekStart: number; weekEnd: number; isFirstSegment: boolean; isLastSegment: boolean };
  const eventPlacementsByWeek: Map<number, EventPlacement[]> = useMemo(() => {
    const map = new Map<number, EventPlacement[]>();
    // Each lane stores occupied [col0, col1] ranges (full-cell precision)
    const weekLanes: Map<number, [number, number][][]> = new Map();

    for (const bar of eventBars) {
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

        if (!weekLanes.has(w)) weekLanes.set(w, []);
        const lanes = weekLanes.get(w)!;
        let lane = 0;
        for (lane = 0; lane < lanes.length; lane++) {
          const conflict = lanes[lane].some(
            ([s, e]) => colInWeek0 <= e && colInWeek1 >= s,
          );
          if (!conflict) break;
        }
        if (lane === lanes.length) lanes.push([]);
        lanes[lane].push([colInWeek0, colInWeek1]);

        if (!map.has(w)) map.set(w, []);
        map.get(w)!.push({
          ...bar,
          row: lane,
          weekStart: colInWeek0,
          weekEnd: colInWeek1,
          isFirstSegment: w === startWeek,
          isLastSegment: w === endWeek,
        });
      }
    }
    return map;
  }, [eventBars, firstDow]);

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
        const weekEvents = eventPlacementsByWeek.get(w) ?? [];
        const maxEventLane = weekEvents.reduce((m, b) => Math.max(m, b.row), -1);
        const eventRows = maxEventLane + 1;

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
                  className={`relative min-h-[2.5rem] border-r border-gray-50 px-1.5 pt-1 last:border-r-0 ${!isInMonth ? "bg-gray-50/50" : ""}`}
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

            {/* Event bars (indigo) */}
            {eventRows > 0 && (
              <div className="col-span-7 px-0.5 pt-0.5">
                {Array.from({ length: eventRows }, (_, lane) => {
                  const laneEvents = weekEvents.filter((e) => e.row === lane);
                  return (
                    <div key={lane} className="relative mt-0.5 h-5">
                      {laneEvents.map((ep) => {
                        const cellW = 100 / 7;
                        const left = `${ep.weekStart * cellW}%`;
                        const width = `${(ep.weekEnd - ep.weekStart + 1) * cellW}%`;
                        const roundLeft = ep.isFirstSegment && ep.startsInMonth;
                        const roundRight = ep.isLastSegment && ep.endsInMonth;
                        return (
                          <div
                            key={`${ep.event.name}-${ep.event.start}-${ep.weekStart}`}
                            className={`absolute top-0 h-full overflow-hidden truncate px-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-white bg-indigo-500 ${
                              roundLeft && roundRight ? "rounded-full" :
                              roundLeft ? "rounded-l-full" :
                              roundRight ? "rounded-r-full" : ""
                            }`}
                            style={{ left, width }}
                            title={ep.event.name}
                          >
                            {ep.isFirstSegment && ep.label}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Booking bar rows */}
            {barRows > 0 && (
              <div className="col-span-7 px-0.5 pb-1.5">
                {Array.from({ length: barRows }, (_, lane) => {
                  const laneBars = weekBars.filter((b) => b.row === lane);
                  return (
                    <div key={lane} className="relative mt-0.5 h-6">
                      {laneBars.map((bp) => {
                        const cellW = 100 / 7; // width of one cell in %
                        const halfCell = cellW / 2;
                        // Half-cell inset on arrival day, half-cell trim on departure day
                        const insetStart = bp.isFirstSegment && bp.startsInMonth ? halfCell : 0;
                        const insetEnd = bp.isLastSegment && bp.endsInMonth ? halfCell : 0;
                        const left = `${bp.weekStart * cellW + insetStart}%`;
                        const width = `${(bp.weekEnd - bp.weekStart + 1) * cellW - insetStart - insetEnd}%`;
                        const isStart = bp.isFirstSegment;
                        // Rounded ends: round-left on arrival, round-right on departure
                        const roundLeft = bp.isFirstSegment && bp.startsInMonth;
                        const roundRight = bp.isLastSegment && bp.endsInMonth;

                        return (
                          <button
                            key={`${bp.booking.id}-${bp.weekStart}`}
                            data-bar
                            onClick={(e) => handleBarClick(bp, e)}
                            className={`absolute top-0 h-full cursor-pointer overflow-hidden truncate px-1.5 text-left text-[11px] font-medium text-white transition-opacity hover:opacity-90 ${
                              roundLeft && roundRight ? "rounded-full" :
                              roundLeft ? "rounded-l-full" :
                              roundRight ? "rounded-r-full" : ""
                            }`}
                            style={{
                              left,
                              width,
                              backgroundColor: bp.colour,
                            }}
                            title={bp.booking.notes ? `${bp.label} · 📝 ${bp.booking.notes}` : bp.label}
                          >
                            {isStart && (
                              <span className="hidden sm:inline">
                                {bp.booking.notes ? "📝 " : ""}
                                {bp.label}
                              </span>
                            )}
                            {!isStart && bp.booking.notes && (
                              <span className="hidden sm:inline">📝</span>
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
      {showChannels && (
        <div className="mt-4 flex flex-wrap gap-4">
          {Object.entries(CHANNEL_COLORS).map(([name, colour]) => (
            <div key={name} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: colour }} />
              {name}
            </div>
          ))}
        </div>
      )}

      {/* Popup — bottom-sheet on mobile, floating card on desktop */}
      {popup && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setPopup(null)}
          />
          <div
            data-popup
            className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl lg:inset-auto lg:absolute lg:left-auto lg:top-auto lg:w-72 lg:translate-x-0 lg:translate-y-0 lg:overflow-visible lg:rounded-xl lg:p-4 lg:ring-1 lg:ring-gray-200"
            style={
              typeof window !== "undefined" && window.innerWidth >= 1024 && containerRef.current
                ? (() => {
                    const cr = containerRef.current!.getBoundingClientRect();
                    const relTop = popup.rect.bottom - cr.top + 8;
                    const relLeft = popup.rect.left - cr.left;
                    return {
                      top: Math.min(relTop, containerRef.current!.clientHeight - 40),
                      left: Math.max(0, Math.min(relLeft, containerRef.current!.clientWidth - 288)),
                    };
                  })()
                : undefined
            }
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                {showChannels && <span className="mt-1.5 inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: popup.colour }} />}
                <div>
                  {showPrices && popup.booking.title && (
                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                      {popup.booking.title}
                    </p>
                  )}
                  <h4 className="text-base font-semibold text-gray-900">
                    {popup.booking.firstName} {popup.booking.lastName}
                  </h4>
                  {showPrices && (popup.booking.email || popup.booking.mobile || popup.booking.phone) && (
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      {popup.booking.email && (
                        <a
                          href={`mailto:${popup.booking.email}`}
                          className="hover:text-indigo-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ✉ {popup.booking.email}
                        </a>
                      )}
                      {(popup.booking.mobile || popup.booking.phone) && (
                        <a
                          href={`tel:${popup.booking.mobile || popup.booking.phone}`}
                          className="hover:text-indigo-600"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ☏ {popup.booking.mobile || popup.booking.phone}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setPopup(null)} className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Dates</p>
                <p className="mt-0.5 font-medium text-gray-900">
                  {new Date(popup.booking.arrival).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  {" → "}
                  {new Date(popup.booking.departure).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </p>
                <p className="text-xs text-gray-400">
                  {popup.nights} nuit{popup.nights > 1 ? "s" : ""}
                  {popup.booking.arrivalTime && ` · arr. ${popup.booking.arrivalTime}`}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Voyageurs</p>
                <p className="mt-0.5 font-medium text-gray-900">
                  {popup.booking.numAdult} adulte{popup.booking.numAdult > 1 ? "s" : ""}
                </p>
                {popup.booking.numChild > 0 && (
                  <p className="text-xs text-gray-400">{popup.booking.numChild} enfant{popup.booking.numChild > 1 ? "s" : ""}</p>
                )}
              </div>

              {showPrices && (
                <div>
                  <p className="text-xs text-gray-400">Montant</p>
                  <p className="mt-0.5 font-medium text-gray-900">{formatEuro(popup.booking.price)}</p>
                </div>
              )}

              {showChannels && (
                <div>
                  <p className="text-xs text-gray-400">Canal</p>
                  <p className="mt-0.5 font-medium text-gray-900">{popup.channel}</p>
                </div>
              )}

              {(() => {
                const event = findEventForStay(popup.booking.arrival, popup.booking.departure);
                if (!event) return null;
                return (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Événement</p>
                    <span className="mt-0.5 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {event}
                    </span>
                  </div>
                );
              })()}

              {popup.channel === "Direct" && popup.booking.comments && popup.booking.comments.trim() && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Remarque voyageur</p>
                  <p className="mt-0.5 whitespace-pre-wrap rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-900">
                    {popup.booking.comments}
                  </p>
                </div>
              )}

              <NotesEditor
                bookingId={popup.booking.id}
                initialNotes={popup.booking.notes ?? ""}
                editable={showPrices}
                onSaved={(newNotes) => {
                  setPopup((p) => (p ? { ...p, booking: { ...p.booking, notes: newNotes } } : p));
                  onNotesUpdated?.(popup.booking.id, newNotes);
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
