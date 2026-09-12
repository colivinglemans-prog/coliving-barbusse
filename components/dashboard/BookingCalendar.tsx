"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { BookingListEntry } from "@sejour/socle/lib/booking-dto";
import { LE_MANS_EVENTS, shortEventLabel } from "@/lib/events";
import { findEventForStay, type LocalEvent } from "@sejour/socle/lib/events";
import { bandesPeriodes, PERIODES, type BandePeriode } from "@sejour/socle/lib/periodes";
import { CHANNEL_COLORS, normalizeChannel } from "@sejour/socle/lib/channels";
import { provisionalKind, type Provisional } from "@sejour/socle/lib/booking-status";
import {
  PERIOD_PALETTE,
  laneCount,
  periodTooltip,
  placeSegments,
  roundedEnds,
  type LaneBar,
  type Segment,
} from "@sejour/socle/lib/calendar-lanes";
import { addMonths, daysInMonth, firstDayOfMonth, formatDate } from "@sejour/socle/lib/dates";
import { nightsBetween } from "@sejour/socle/lib/booking";
import { chartEuro } from "@sejour/socle/lib/chart-theme";
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
  // Les fêtes viennent du socle : Noël et le Jour de l'An sont la même information ici et sur
  // l'autre tableau de bord, et c'est la seule entrée de la palette que les deux partagent.
  fete: PERIOD_PALETTE.fete,
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

/*
 * ⚠️ **Cinq helpers ont disparu d'ici, et l'un d'eux était faux.**
 *
 * `periodTooltip` était identique caractère pour caractère à celui d'Albiez : il est monté
 * dans `@sejour/socle/lib/calendar-lanes` avec le moteur de placement. `addMonths`,
 * `diffDays` et `formatEuro` avaient chacun leur jumeau ailleurs dans ce dépôt.
 *
 * `toDateStr(d) { return d.toISOString().split("T")[0] }` servait à savoir quel jour
 * entourer : `toISOString()` convertit en UTC, et pour un visiteur à l'est de Greenwich la
 * date recule d'un jour tôt le matin — entre minuit et 2 h à Paris l'été, la pastille du jour
 * se posait sur la veille. `formatDate` du socle compose la chaîne depuis `getFullYear` /
 * `getMonth` / `getDate` et ne passe jamais par UTC.
 */
const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/* ── Types ─────────────────────────────────────────────────────────── */
/**
 * Les barres sont exprimées dans la forme qu'attend `placeSegments` : jours du mois, plus les
 * deux bornes qui disent si la barre s'arrête vraiment là ou si elle continue hors du mois.
 * Chacune ajoute ce que son rendu réclame — le canal et le caractère provisoire pour une
 * réservation, l'événement lui-même pour une barre de circuit.
 */
interface BookingSource {
  booking: BookingListEntry;
  channel: string;
  /** Réservation pas encore acquise : ardoise rayée, et absente de la vue viewer. */
  provisional: Provisional | null;
}

type BookingBar = LaneBar<BookingSource>;
type EventBar = LaneBar<LocalEvent>;

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
  // Un couple {année, mois} plutôt qu'une `Date` : le calendrier public du site le fait déjà,
  // et `addMonths` du socle travaille sur ce couple — plus aucun objet `Date` à promener.
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
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

  const year = month.year;
  const mo = month.month;
  const dayCount = daysInMonth(year, mo);
  // Jour de la semaine du 1er, lundi = 0.
  const firstDow = firstDayOfMonth(year, mo);

  const firstDateStr = `${year}-${String(mo + 1).padStart(2, "0")}-01`;
  const lastDateStr = `${year}-${String(mo + 1).padStart(2, "0")}-${String(dayCount).padStart(2, "0")}`;

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
        // Comparaisons de chaînes ISO, plus d'objets `Date` : le jour de départ est inclus
        // dans la barre, où il n'occupe que la moitié gauche de sa case.
        const startsHere = b.arrival >= firstDateStr;
        const endsHere = b.departure <= lastDateStr;
        const startDay = startsHere ? Number(b.arrival.slice(8, 10)) : 1;
        const endDay = endsHere ? Number(b.departure.slice(8, 10)) : dayCount;

        return {
          source: { booking: b, channel, provisional },
          colour: provisional
            ? UNCONFIRMED_COLOUR
            : showChannels
              ? (CHANNEL_COLORS[channel] ?? "#9ca3af")
              : "#FF385C",
          startDay,
          endDay: Math.max(startDay, endDay),
          startsHere,
          endsHere,
          label: label(b, guests),
        };
      })
      .sort((a, b) => a.startDay - b.startDay);
    // `isAdmin` et `showChannels` sont bien des dépendances : ils décident quelles
    // réservations entrent dans la liste et de quelle couleur. Sans eux, basculer en
    // « Vue viewer » gardait les barres du rendu précédent — les couleurs de canal
    // restaient affichées, et les réservations à confirmer avec.
  }, [bookings, firstDateStr, lastDateStr, dayCount, isAdmin, showChannels]);

  /* ── Build weeks (rows) with booking bar assignments ──────────── */
  const totalCells = firstDow + dayCount;
  const weeks = Math.ceil(totalCells / 7);

  /*
   * Le placement en lanes vient du socle. Il était écrit ici **deux fois en ligne** — une
   * fois pour les réservations, une fois pour les événements — puis regroupé par semaine par
   * un second `useMemo` qui recalculait les mêmes bornes pour retrouver, par recherche
   * linéaire, le segment qu'il venait de produire. `placeSegments` rend directement la carte
   * par semaine : les deux `useMemo` et leur recherche disparaissent.
   */
  const placementsByWeek = useMemo(
    () => placeSegments(bars, firstDow, "half-day"),
    [bars, firstDow],
  );

  /* ── Compute event bars (Le Mans events, indigo) ─────────────────── */
  const eventBars: EventBar[] = useMemo(() => {
    return LE_MANS_EVENTS
      .filter((ev) => ev.start <= lastDateStr && ev.end >= firstDateStr)
      .map((ev) => {
        const startsHere = ev.start >= firstDateStr;
        const endsHere = ev.end <= lastDateStr;
        const startDay = startsHere ? Number(ev.start.slice(8, 10)) : 1;
        const endDay = endsHere ? Number(ev.end.slice(8, 10)) : dayCount;
        return {
          source: ev,
          colour: EVENT_LINE,
          startDay,
          endDay: Math.max(startDay, endDay),
          startsHere,
          endsHere,
          label: shortEventLabel(ev),
        };
      })
      .sort((a, b) => a.startDay - b.startDay);
  }, [firstDateStr, lastDateStr, dayCount]);

  /* ── Compute school-holiday bands (vacances scolaires + fêtes) ───── */
  /*
   * Une seule ligne suffit, et `placeSegments` la rend : `bandesPeriodes` a déjà fusionné les
   * zones d'une même période (« Noël A+B+C ») et découpé aux jours où la composition change
   * (« Hiver A » → « Hiver A+B »), donc deux bandes ne se chevauchent jamais et toutes
   * retombent sur la ligne 0 — contrairement aux événements du circuit, qui peuvent être
   * simultanés et réclament de vraies lanes.
   *
   * Les bandes se relaient en demi-journées, comme deux séjours dont l'un part le jour où
   * l'autre arrive : une composition prend effet à la moitié de son premier jour et cesse à
   * la moitié du jour où elle change. D'où une fin portée au *lendemain* du dernier jour de
   * la composition, et la granularité `half-day`.
   */
  const periodSegmentsByWeek = useMemo(() => {
    const bars = bandesPeriodes(PERIODES, firstDateStr, lastDateStr).map((band) => {
      // Hors du mois, le jour de transition n'est pas dessinable : la bande court alors
      // jusqu'au bord droit, où elle vaut pour toute la dernière journée.
      const transitionInMonth = band.fin < lastDateStr;
      const palette = palettePeriode(band);
      return {
        source: band,
        colour: palette.line,
        label: band.libelle,
        startDay: Number(band.debut.slice(8, 10)),
        endDay: transitionInMonth ? Number(band.fin.slice(8, 10)) + 1 : dayCount,
        startsHere: band.debutReel,
        endsHere: transitionInMonth,
      };
    });
    return placeSegments(bars, firstDow, "half-day");
  }, [firstDateStr, lastDateStr, dayCount, firstDow]);

  /*
   * Les événements, eux, tiennent sur des cases pleines : ils occupent des journées
   * entières, là où une réservation libère la maison le matin de son départ. Un événement
   * d'un seul jour — « Marathon », une réunion hippique — se réduirait d'ailleurs à rien si
   * on lui retirait une demi-case de chaque côté.
   */
  const eventPlacementsByWeek = useMemo(
    () => placeSegments(eventBars, firstDow, "full-day"),
    [eventBars, firstDow],
  );

  function handleBarClick(seg: Segment<BookingSource>, e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopup({
      booking: seg.source.booking,
      channel: seg.source.channel,
      colour: seg.colour,
      nights: nightsBetween(seg.source.booking.arrival, seg.source.booking.departure),
      rect,
    });
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Header: month navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => setMonth((m) => addMonths(m.year, m.month, -1))}
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
          onClick={() => setMonth((m) => addMonths(m.year, m.month, 1))}
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
        const barRows = laneCount(weekBars);
        const weekPeriods = periodSegmentsByWeek.get(w) ?? [];
        const weekEvents = eventPlacementsByWeek.get(w) ?? [];
        const eventRows = laneCount(weekEvents);

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
              const isInMonth = day >= 1 && day <= dayCount;
              const today = formatDate(new Date());
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
                          ? "bg-primary font-bold text-white"
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
                    return (
                      <div
                        key={`${ps.source.debut}-${ps.startCol}`}
                        className="absolute top-0 h-full"
                        style={{
                          left: `${ps.startCol * cellW + insetStart}%`,
                          width: `${(ps.endCol - ps.startCol + 1) * cellW - insetStart - insetEnd}%`,
                        }}
                        title={periodTooltip(ps.source)}
                      >
                        <div
                          className="truncate px-1 text-left text-[10px] font-semibold uppercase leading-[0.85rem] tracking-wide"
                          style={{ color: palettePeriode(ps.source).text }}
                        >
                          {ps.isFirstSegment && ps.label}
                        </div>
                        {/* Les 3 px de retrait s'ajoutent à la demi-cellule : sans eux les
                            deux filets se toucheraient pile au milieu du samedi de bascule
                            et n'en feraient qu'un. */}
                        <div
                          className="h-[3px] rounded-full"
                          style={{
                            backgroundColor: ps.colour,
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
                        const left = `${ep.startCol * cellW}%`;
                        const width = `${(ep.endCol - ep.startCol + 1) * cellW}%`;
                        return (
                          <div
                            key={`${ep.source.name}-${ep.source.start}-${ep.startCol}`}
                            className="absolute top-0 h-full"
                            style={{ left, width }}
                            title={ep.source.name}
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
                                backgroundColor: ep.colour,
                                marginLeft: ep.startsHere ? 3 : 0,
                                marginRight: ep.endsHere ? 3 : 0,
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
                      {laneBars.map((seg) => {
                        const bp = seg.source;
                        const cellW = 100 / 7; // width of one cell in %
                        const halfCell = cellW / 2;
                        // Half-cell inset on arrival day, half-cell trim on departure day
                        const insetStart = seg.startsHere ? halfCell : 0;
                        const insetEnd = seg.endsHere ? halfCell : 0;
                        const left = `${seg.startCol * cellW + insetStart}%`;
                        const width = `${(seg.endCol - seg.startCol + 1) * cellW - insetStart - insetEnd}%`;

                        return (
                          <button
                            key={`${bp.booking.id}-${seg.startCol}`}
                            data-bar
                            onClick={(e) => handleBarClick(seg, e)}
                            className={`absolute top-0 h-full cursor-pointer overflow-hidden truncate px-1.5 text-left text-[11px] font-medium text-white transition-opacity hover:opacity-90 ${roundedEnds(
                              seg.startsHere,
                              seg.endsHere,
                            )}`}
                            style={{
                              left,
                              width,
                              backgroundColor: seg.colour,
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
                              seg.label,
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
                            {seg.isFirstSegment && (
                              <span className="hidden sm:inline">
                                {bp.provisional || bp.booking.notes ? " " : ""}
                                {seg.label}
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
                  <p className="mt-0.5 font-medium text-gray-900">{chartEuro(popup.booking.price)}</p>
                </div>
              )}

              {showChannels && (
                <div>
                  <p className="text-xs text-gray-400">Canal</p>
                  <p className="mt-0.5 font-medium text-gray-900">{popup.channel}</p>
                </div>
              )}

              {(() => {
                const event = findEventForStay(
                  LE_MANS_EVENTS,
                  popup.booking.arrival,
                  popup.booking.departure,
                );
                if (!event) return null;
                return (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Événement</p>
                    <span className="mt-0.5 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      {event.name}
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
