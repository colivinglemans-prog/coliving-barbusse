"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { BookingListEntry } from "@sejour/socle/lib/booking-dto";
import { findEventForStay, LE_MANS_EVENTS, shortEventLabel, type LeMansEvent } from "@/lib/events";
import { bandesPeriodes, PERIODES, type BandePeriode } from "@sejour/socle/lib/periodes";
import { CHANNEL_COLORS, normalizeChannel } from "@sejour/socle/lib/channels";
import { provisionalKind, type Provisional } from "@sejour/socle/lib/booking-status";
import GuestShareBlock from "@/components/dashboard/GuestShareBlock";

/*
 * Un événement du circuit n'est pas une réservation, et ne doit pas se lire comme elle.
 *
 * Les deux familles partageaient la même grammaire — pilule pleine, fond saturé, texte
 * blanc, hauteurs voisines (20 px contre 24) — et l'indigo des événements pesait autant
 * que le #003580 de Booking juste en dessous. Un événement devient donc un libellé coloré
 * souligné d'un filet de 3 px, sans aplat : pas d'aplat, texte coloré, trait fin. Trois
 * différences cumulées valent mieux qu'un écart de teinte, la lecture tenant alors aussi
 * en niveaux de gris et pour un daltonien.
 */
const EVENT_LINE = "#818cf8";
const EVENT_TEXT = "#4338ca";

/*
 * Vacances scolaires et semaines de fêtes, en filet comme les événements.
 *
 * L'indigo reste aux événements du circuit : c'est déjà la couleur du badge « Événement »
 * dans les stats et dans la popup, la changer ici casserait une convention qui dépasse le
 * calendrier. Les vacances prennent donc l'émeraude — divergence assumée avec Albiez, où
 * elles sont en indigo faute d'événements à qui le disputer. Les fêtes gardent le rose des
 * deux tableaux de bord : Noël et le Jour de l'An sont la même information ici et là-bas.
 */
const PALETTE_PERIODE = {
  vacances: { line: "#34d399", text: "#047857" },
  vacancesLeMans: { line: "#fbbf24", text: "#b45309" },
  fete: { line: "#fb7185", text: "#be123c" },
} as const;

/**
 * Demandes et options : `UNCONFIRMED_STATUSES`, `HELD_STATUSES` et `provisionalKind` vivent
 * dans `@sejour/socle/lib/booking-status`.
 *
 * Ils ont quitté ce fichier pour une raison de fond : enfouis dans un composant client, ils
 * étaient inutilisables côté serveur — donc le filtre ci-dessous était le **seul** contrôle,
 * et le navigateur d'un `viewer` recevait les demandes et les options quand même. La route
 * les retire désormais de la réponse ; ce qui reste ici est une seconde ceinture.
 *
 * - `unconfirmed` (`new`, `request`, `inquiry`) : étiquette « ? », une demande qui peut se
 *   conclure.
 * - `held` (`black`) : étiquette « OPTION », des dates délibérément tenues.
 *
 * Les deux se ressemblent — même ardoise rayée, même absence en vue viewer — et ne se
 * distinguent que par leur étiquette.
 */

/**
 * Libellé d'une barre : le nom du client, puis le nombre de voyageurs.
 *
 * `title` n'est qu'un dernier recours : Beds24 y met la civilité aussi souvent que le nom
 * de société (voir le type `Beds24Booking`). Sur une option saisie à la main, c'est
 * pourtant la seule trace du client — « Spartner Travel » vaut mieux que « · 1 voy. », qui
 * est ce que l'ancien libellé affichait quand prénom et nom étaient vides.
 */
function label(b: BookingListEntry, guests: number): string {
  const nom = b.firstName || b.lastName || b.company || b.title || "";
  return nom ? `${nom} · ${guests} voy.` : `${guests} voy.`;
}

/** Étiquette portée en tête de barre, à la façon du 📝 des notes internes. */
const PROVISIONAL_MARK: Record<Provisional, string> = {
  unconfirmed: "?",
  held: "OPTION",
};

/**
 * Ardoise pour une réservation à confirmer, plus des rayures.
 *
 * La couleur seule ne suffit pas : « Autre » est déjà en gris `#9ca3af` et la vue viewer
 * peint tout en `#FF385C`. Les rayures, elles, ne ressemblent à aucune autre barre de la
 * grille et disent « provisoire » sans qu'on ait à consulter la légende.
 */
const UNCONFIRMED_COLOUR = "#94a3b8";
const UNCONFIRMED_STRIPES =
  "repeating-linear-gradient(45deg, rgba(255,255,255,0.38) 0 3px, transparent 3px 7px)";

/** Zone scolaire du Mans — académie de Nantes. */
const ZONE_LOCALE = "B";

/**
 * Les vacances de la zone B se distinguent des deux autres.
 *
 * C'est l'information utile au ménage : quand les écoles du Mans sont fermées, la personne
 * qui vient nettoyer a ses propres enfants à la maison. Les vacances des zones A et C
 * remplissent le logement sans rien changer à sa disponibilité ; celles de la zone B, si.
 * D'où l'ambre, qui tranche sur l'émeraude des autres zones.
 *
 * On lit `zones` et **jamais** `sources` : après l'absorption d'un week-end de bascule,
 * `sources` peut contenir une zone qui n'est plus dans le libellé — y compris la B.
 *
 * Les fêtes gardent le rose sans se poser la question : Noël et le Jour de l'An concernent
 * les trois zones, la distinction n'y voudrait rien dire.
 */
function palettePeriode(band: BandePeriode) {
  if (band.type === "fete") return PALETTE_PERIODE.fete;
  return band.zones.includes(ZONE_LOCALE)
    ? PALETTE_PERIODE.vacancesLeMans
    : PALETTE_PERIODE.vacances;
}

/**
 * Infobulle d'une bande : le libellé compact ne dit pas de quelles périodes il est fait,
 * donc le détail — nom complet, zone, dates réelles — se lit au survol, une ligne par
 * période. C'est aussi là que réapparaît la zone sortante d'un week-end de bascule absorbé :
 * le libellé simplifie, l'infobulle dit toute la vérité.
 */
function periodTooltip(band: BandePeriode): string {
  return band.sources
    .map((p) => `${p.nom}${p.zone === "Toutes" ? "" : ` — ${p.zone}`} · ${p.debut} → ${p.fin}`)
    .join("\n");
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
  booking: BookingListEntry;
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
  /** Réservation pas encore acquise : ardoise rayée, et absente de la vue viewer. */
  provisional: Provisional | null;
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
  booking: BookingListEntry;
  channel: string;
  colour: string;
  nights: number;
  rect: DOMRect;
}

/* ── Component ─────────────────────────────────────────────────────── */
interface BookingCalendarProps {
  bookings: BookingListEntry[];
  showPrices?: boolean;
  showChannels?: boolean;
  /** Débloque le bloc de partage voyageur (lien du guide + code de la serrure). */
  isAdmin?: boolean;
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

export default function BookingCalendar({ bookings, showPrices = true, showChannels = true, isAdmin = true, onNotesUpdated }: BookingCalendarProps) {
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
      // Ni une demande ni une option n'existent pour le rôle viewer. Le vrai filtre est
      // côté serveur, dans /api/dashboard/bookings : la réponse ne les porte déjà plus.
      // Celui-ci reste comme seconde ceinture, et sert la « vue viewer » de l'admin, qui
      // prévisualise avec des données complètes.
      .filter((b) => isAdmin || provisionalKind(b.status) === null)
      .map((b) => {
        const channel = normalizeChannel(b.referer, b.channel);
        const provisional = provisionalKind(b.status);
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
          colour: provisional
            ? UNCONFIRMED_COLOUR
            : showChannels
              ? (CHANNEL_COLORS[channel] ?? "#9ca3af")
              : "#FF385C",
          provisional,
          startCol: startDay - 1,
          endCol: Math.max(startDay - 1, endDay - 1),
          startsInMonth,
          endsInMonth,
          label: label(b, guests),
        };
      })
      .sort((a, b) => a.startCol - b.startCol);
    // `isAdmin` et `showChannels` sont bien des dépendances : ils décident quelles
    // réservations entrent dans la liste et de quelle couleur. Sans eux, basculer en
    // « Vue viewer » gardait les barres du rendu précédent — les couleurs de canal
    // restaient affichées, et les réservations à confirmer avec.
  }, [bookings, firstDateStr, lastDateStr, year, mo, daysInMonth, isAdmin, showChannels]);

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

  /* ── Compute school-holiday bands (vacances scolaires + fêtes) ───── */
  type PeriodSegment = {
    band: BandePeriode;
    weekStart: number;
    weekEnd: number;
    /** Le libellé ne s'écrit que sur le premier segment de la bande. */
    isFirstSegment: boolean;
    /** La composition prend effet à la moitié de ce jour, elle ne vient pas d'avant. */
    startsHere: boolean;
    /** Elle cesse à la moitié de ce jour, elle ne continue pas après. */
    endsHere: boolean;
  };

  /*
   * Une seule ligne suffit, sans placement en lanes : `bandesPeriodes` a déjà fusionné les
   * zones d'une même période (« Noël A+B+C ») et découpé aux jours où la composition change
   * (« Hiver A » → « Hiver A+B »). Deux bandes ne se chevauchent donc jamais — contrairement
   * aux événements du circuit, qui peuvent être simultanés et réclament des lanes.
   *
   * Les bandes se relaient en demi-journées, comme deux séjours dont l'un part le jour où
   * l'autre arrive : une composition prend effet à la moitié de son premier jour et cesse à
   * la moitié du jour où elle change. D'où une fin portée au *lendemain* du dernier jour de
   * la composition. C'est propre aux vacances : un événement du circuit, lui, occupe des
   * journées entières.
   */
  const periodSegmentsByWeek: Map<number, PeriodSegment[]> = useMemo(() => {
    const map = new Map<number, PeriodSegment[]>();

    for (const band of bandesPeriodes(PERIODES, firstDateStr, lastDateStr)) {
      // Hors du mois, le jour de transition n'est pas dessinable : la bande court alors
      // jusqu'au bord droit, où elle vaut pour toute la dernière journée.
      const transitionInMonth = band.fin < lastDateStr;
      const startDay = Number(band.debut.slice(8, 10));
      const endDay = transitionInMonth ? Number(band.fin.slice(8, 10)) + 1 : daysInMonth;

      const startCell = firstDow + startDay - 1;
      const endCell = firstDow + endDay - 1;
      const startWeek = Math.floor(startCell / 7);
      const endWeek = Math.floor(endCell / 7);

      for (let w = startWeek; w <= endWeek; w++) {
        const weekCellStart = w * 7;
        const visStart = Math.max(startCell, weekCellStart);
        const visEnd = Math.min(endCell, weekCellStart + 6);

        if (!map.has(w)) map.set(w, []);
        map.get(w)!.push({
          band,
          weekStart: visStart - weekCellStart,
          weekEnd: visEnd - weekCellStart,
          isFirstSegment: w === startWeek,
          startsHere: w === startWeek && band.debutReel,
          endsHere: w === endWeek && transitionInMonth,
        });
      }
    }
    return map;
  }, [firstDateStr, lastDateStr, daysInMonth, firstDow]);

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
      <div className="grid grid-cols-7 border-b border-gray-300 pb-2">
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
        const weekPeriods = periodSegmentsByWeek.get(w) ?? [];
        const weekEvents = eventPlacementsByWeek.get(w) ?? [];
        const maxEventLane = weekEvents.reduce((m, b) => Math.max(m, b.row), -1);
        const eventRows = maxEventLane + 1;

        return (
          <div key={w} className="relative grid grid-cols-7 border-b border-gray-200">
            {/*
             * Filets de colonnes, en position absolue et non sur les cases : une case ne
             * couvre que la ligne des numéros, et le trait s'arrêtait donc avant les barres
             * — impossible d'aligner à l'œil la fin d'un séjour sur son jour. Hors flux, la
             * couche traverse toute la hauteur de la semaine. Elle ne peut pas être faite
             * d'éléments de grille étendus sur `grid-row: 1 / -1` : le placement automatique
             * refuse les cellules déjà occupées et repousserait les sept cases en deuxième
             * ligne. Placée *avant* les barres dans le DOM, elle passe au-dessus des fonds
             * de cases et en dessous des séjours : les filets ne coupent aucune pilule.
             */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-7" aria-hidden>
              {Array.from({ length: 7 }, (_, col) => (
                <div key={col} className={col < 6 ? "border-r border-gray-200" : ""} />
              ))}
            </div>

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
                  className={`relative min-h-[2.5rem] px-1.5 pt-1 ${!isInMonth ? "bg-gray-50/50" : ""}`}
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

            {/* Vacances scolaires et fêtes — au-dessus des événements : les bandes durent
                des semaines, les événements des jours, les séjours des nuits. Du plus large
                au plus précis en descendant vers les réservations. */}
            {weekPeriods.length > 0 && (
              <div className="col-span-7 px-0.5 pt-0.5">
                <div className="relative mt-0.5 h-[1.15rem]">
                  {weekPeriods.map((ps) => {
                    const cellW = 100 / 7;
                    const halfCell = cellW / 2;
                    // Mêmes demi-cellules que les séjours : une composition qui cesse
                    // n'occupe que la moitié gauche de son jour de bascule, celle qui prend
                    // le relais que la moitié droite.
                    const insetStart = ps.startsHere ? halfCell : 0;
                    const insetEnd = ps.endsHere ? halfCell : 0;
                    const palette = palettePeriode(ps.band);
                    return (
                      <div
                        key={`${ps.band.debut}-${ps.weekStart}`}
                        className="absolute top-0 h-full"
                        style={{
                          left: `${ps.weekStart * cellW + insetStart}%`,
                          width: `${(ps.weekEnd - ps.weekStart + 1) * cellW - insetStart - insetEnd}%`,
                        }}
                        title={periodTooltip(ps.band)}
                      >
                        <div
                          className="truncate px-1 text-left text-[10px] font-semibold uppercase leading-[0.85rem] tracking-wide"
                          style={{ color: palette.text }}
                        >
                          {ps.isFirstSegment && ps.band.libelle}
                        </div>
                        {/* Les 3 px de retrait s'ajoutent à la demi-cellule : sans eux les
                            deux filets se toucheraient pile au milieu du samedi de bascule
                            et n'en feraient qu'un. */}
                        <div
                          className="h-[3px] rounded-full"
                          style={{
                            backgroundColor: palette.line,
                            marginLeft: ps.startsHere ? 3 : 0,
                            marginRight: ps.endsHere ? 3 : 0,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Event bars (indigo) */}
            {eventRows > 0 && (
              <div className="col-span-7 px-0.5 pt-0.5">
                {Array.from({ length: eventRows }, (_, lane) => {
                  const laneEvents = weekEvents.filter((e) => e.row === lane);
                  return (
                    <div key={lane} className="relative mt-0.5 h-[1.15rem]">
                      {laneEvents.map((ep) => {
                        const cellW = 100 / 7;
                        const left = `${ep.weekStart * cellW}%`;
                        const width = `${(ep.weekEnd - ep.weekStart + 1) * cellW}%`;
                        // L'événement tient sur des cases pleines, sans demi-cellule : il
                        // occupe des journées entières, là où une réservation libère la
                        // maison le matin de son départ. Un événement d'un seul jour —
                        // « Marathon », une réunion hippique — se réduirait d'ailleurs à
                        // rien si on lui retirait une demi-case de chaque côté.
                        const startsHere = ep.isFirstSegment && ep.startsInMonth;
                        const endsHere = ep.isLastSegment && ep.endsInMonth;
                        return (
                          <div
                            key={`${ep.event.name}-${ep.event.start}-${ep.weekStart}`}
                            className="absolute top-0 h-full"
                            style={{ left, width }}
                            title={ep.event.name}
                          >
                            {/* Le libellé n'apparaît que sur le premier segment ; les
                                semaines suivantes ne portent que le filet, à la même
                                hauteur. */}
                            <div
                              className="truncate px-1 text-left text-[10px] font-semibold uppercase leading-[0.85rem] tracking-wide"
                              style={{ color: EVENT_TEXT }}
                            >
                              {ep.isFirstSegment && ep.label}
                            </div>
                            {/* Le filet se retire de 3 px du côté où l'événement s'arrête
                                vraiment, et file jusqu'au bord de la semaine quand il
                                continue : c'est ce qui remplace l'arrondi des pilules, et
                                ce qui empêche deux événements qui se suivent — « Classic »
                                puis « 24h Rollers » début juillet — de n'en faire qu'un. */}
                            <div
                              className="h-[3px] rounded-full"
                              style={{
                                backgroundColor: EVENT_LINE,
                                marginLeft: startsHere ? 3 : 0,
                                marginRight: endsHere ? 3 : 0,
                              }}
                            />
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
                              // Les rayures se superposent à l'aplat : la couleur seule ne
                              // suffit pas à dire « provisoire » dans une grille qui a déjà
                              // un canal « Autre » en gris.
                              backgroundImage: bp.provisional ? UNCONFIRMED_STRIPES : undefined,
                            }}
                            title={[
                              bp.provisional === "held"
                                ? `Option — dates tenues (${bp.booking.status})`
                                : bp.provisional === "unconfirmed"
                                  ? `À confirmer (${bp.booking.status})`
                                  : null,
                              bp.label,
                              bp.booking.notes ? `📝 ${bp.booking.notes}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          >
                            {bp.provisional && (
                              <span
                                className="inline font-bold"
                                aria-label={bp.provisional === "held" ? "Option" : "À confirmer"}
                              >
                                {PROVISIONAL_MARK[bp.provisional]}
                              </span>
                            )}
                            {bp.booking.notes && (
                              <span className="inline" aria-label="Note interne">📝</span>
                            )}
                            {isStart && (
                              <span className="hidden sm:inline">
                                {bp.provisional || bp.booking.notes ? " " : ""}
                                {bp.label}
                              </span>
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

      {/* Legend — l'événement y figure quel que soit le rôle : les filets sont apparus
          dans la grille, ils doivent être nommés même quand les canaux sont masqués. */}
      <div className="mt-4 flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className="inline-block h-[3px] w-6 rounded-full"
            style={{ backgroundColor: EVENT_LINE }}
          />
          Événement circuit
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className="inline-block h-[3px] w-6 rounded-full"
            style={{ backgroundColor: PALETTE_PERIODE.vacancesLeMans.line }}
          />
          Vacances Le Mans (zone B)
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className="inline-block h-[3px] w-6 rounded-full"
            style={{ backgroundColor: PALETTE_PERIODE.vacances.line }}
          />
          Vacances zones A / C
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className="inline-block h-[3px] w-6 rounded-full"
            style={{ backgroundColor: PALETTE_PERIODE.fete.line }}
          />
          Fêtes
        </div>
        {isAdmin &&
          (
            [
              ["unconfirmed", "À confirmer (?)"],
              ["held", "Option, dates tenues (OPTION)"],
            ] as const
          ).map(([kind, libelle]) => (
            <div key={kind} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span
                className="inline-block h-3 w-3 rounded"
                style={{
                  backgroundColor: UNCONFIRMED_COLOUR,
                  backgroundImage: UNCONFIRMED_STRIPES,
                }}
              />
              {libelle}
            </div>
          ))}
        {showChannels &&
          Object.entries(CHANNEL_COLORS).map(([name, colour]) => (
            <div key={name} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: colour }} />
              {name}
            </div>
          ))}
      </div>

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

            {/* Le statut ne s'affiche que s'il vaut la peine d'être dit : une réservation
                confirmée est le cas normal, l'annoncer noierait celle qui ne l'est pas. */}
            {provisionalKind(popup.booking.status) && (
              <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
                {provisionalKind(popup.booking.status) === "held"
                  ? "Option — les dates sont tenues, l'affaire n'est pas faite."
                  : "À confirmer — rien n'est vendu à ce stade."}{" "}
                Statut Beds24 « {popup.booking.status} ». Elle n&apos;apparaît ni dans les
                revenus, ni dans la taxe de séjour, ni sur le planning du rôle viewer, et
                n&apos;y entrera qu&apos;en passant en « confirmed ».
              </p>
            )}

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

              {/* `price` est absent du DTO servi au rôle restreint : le `?? 0` n'est pas une
                  valeur de repli mais la trace que ce bloc ne s'affiche jamais sans lui. */}
              {showPrices && popup.booking.price !== undefined && (
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

              {isAdmin && (
                <GuestShareBlock
                  bookingId={popup.booking.id}
                  firstName={popup.booking.firstName}
                  country={popup.booking.country}
                />
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
