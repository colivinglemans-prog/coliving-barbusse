import { normalizeChannel } from "@sejour/socle/lib/channels";
import { commissionOf } from "@sejour/socle/lib/commissions";
import { touristTaxFromInvoiceItems } from "@sejour/socle/lib/taxe-sejour";
import { nightsBetween, type Booking, type BookingSource } from "@sejour/socle/lib/booking";
import {
  createBeds24Client,
  expandSpans,
  type Beds24TokenExchange,
} from "@sejour/socle/lib/beds24-client";
import type {
  Beds24AvailabilityRoom,
  Beds24Booking,
  Beds24CalendarRoom,
  Beds24Property,
} from "@sejour/socle/lib/beds24-types";

/**
 * Client Beds24 v2 pour Coliving Barbusse.
 *
 * Le transport — échange des jetons, cache d'access tokens, repli, écriture de note,
 * réexpansion des tranches de calendrier — vient de `@sejour/socle/lib/beds24-client`. Ne
 * restent ici que les noms des variables d'environnement, la traduction vers `Booking`, et
 * les lectures propres à ce bien : sold-out du blog, rapprochement Stripe, liste des
 * propriétés.
 *
 * Trois jetons, trois privilèges — un par chemin, pas par verbe :
 *
 * | Variable | deviceName | Scopes | Chemin servi |
 * |---|---|---|---|
 * | `BEDS24_PUBLIC_REFRESH_TOKEN` | `coliving-barbusse-public-2026-09` | `read:inventory`, `read:properties` | `/api/availability`, vitrine |
 * | `BEDS24_READ_REFRESH_TOKEN` | `coliving-barbusse-lecture-2026-09b` | + `read:bookings`, `-personal`, `-financial` | dashboard, factures |
 * | `BEDS24_REFRESH_TOKEN` | `coliving-barbusse-ecriture-2026-09` | `read:bookings`, `write:bookings` | consignes de ménage |
 *
 * Les trois vérifiés contre l'API le 2026-09-11, pas supposés : le public reçoit `401` sur
 * `/bookings`, la lecture ne peut pas écrire, l'écriture ne voit ni `price` ni `invoiceItems`.
 *
 * `read:bookings-personal` n'est porté **que par ce site** : les factures et le partage du
 * guide voyageur lisent `firstName`, `email` et `phone`. Albiez ne l'a pas, et les champs
 * correspondants de `Booking` sont optionnels pour cette raison précise.
 *
 * **Les trois sont des refresh tokens, plus aucun long life.** Les lectures du dashboard
 * passaient par `BEDS24_API_TOKEN`, un long life dont la durée de vie ne se laisse pas
 * établir : celui d'avant, créé le 24/04, affichait encore 90 jours restants 140 jours plus
 * tard. Un refresh token meurt après 30 jours sans usage, mais l'échéance glisse à chaque
 * échange — et le cron keepalive les entretient tous les trois plutôt que de parier sur le
 * trafic. Un long life aurait de toute façon forcé un jeton séparé pour l'écriture, faute de
 * pouvoir porter un scope `write`.
 */
const client = createBeds24Client({
  defaultRoute: "lecture",
  routes: {
    /**
     * Le jeton qui ne sait rien des réservations. Servir la vitrine avec celui du dashboard
     * revenait à poser `read:bookings-personal` et `read:bookings-financial` dans
     * l'environnement du point d'entrée le plus exposé du site — celui qu'un visiteur anonyme
     * atteint, et le premier qu'on sonde.
     *
     * Repli assumé vers la **lecture** — jamais l'écriture, qui n'a d'ailleurs pas les scopes
     * d'inventaire. On perd la séparation des privilèges le temps de réagir, ce qui vaut
     * mieux qu'un tunnel de réservation éteint sans prévenir. Cette dégradation étant
     * silencieuse par nature, c'est le cron keepalive qui la rend visible.
     */
    public: {
      env: "BEDS24_PUBLIC_REFRESH_TOKEN",
      whenMissing: "lecture",
      whenRefused: "lecture",
      hint: "Régénérer BEDS24_PUBLIC_REFRESH_TOKEN (scopes read:inventory, read:properties).",
    },
    /** Dashboard, factures, fiscal, taxe de séjour. Aucun repli : sans lui, il n'y a rien. */
    lecture: { env: "BEDS24_READ_REFRESH_TOKEN" },
    /** Consignes de ménage, et rien d'autre. */
    ecriture: { env: "BEDS24_REFRESH_TOKEN" },
  },
});

/** Échange forcé du jeton de lecture — exporté pour le cron keepalive. */
export function refreshBeds24ReadToken(): Promise<Beds24TokenExchange> {
  return client.refresh("lecture");
}

/** Échange forcé du jeton public — exporté pour le cron keepalive, il lève en cas d'échec. */
export function refreshBeds24PublicToken(): Promise<Beds24TokenExchange> {
  return client.refresh("public");
}

/**
 * Échange forcé du jeton d'écriture — exporté pour le cron keepalive : l'écriture est bien
 * trop rare pour entretenir le jeton seule, et sans le cron il meurt au bout de 30 jours.
 */
export function refreshBeds24WriteToken(): Promise<Beds24TokenExchange> {
  return client.refresh("ecriture");
}

export function updateBookingNotes(id: number, notes: string): Promise<void> {
  return client.updateNotes(id, notes, "ecriture");
}

export async function getProperties(): Promise<Beds24Property[]> {
  const data = await client.get<{ data: Beds24Property[] }>("/properties");
  return data.data ?? [];
}

export interface BookingQuery {
  arrivalFrom?: string;
  arrivalTo?: string;
  departureFrom?: string;
  departureTo?: string;
  statuses?: string[];
  includeInvoiceItems?: boolean;
  includeInfoItems?: boolean;
}

/**
 * Réservations **vivantes**, telles que l'API les rend — rien de plus.
 *
 * ⚠️ **Ne fusionne plus l'archive.** Elle l'était ici jusqu'au Lot 2, en douce : un client
 * d'API qui réinjecte des lignes que l'API n'a pas renvoyées rend fausse d'avance toute
 * mesure de ce qu'il produit, et c'est exactement ce qui avait masqué 37 `NUKI_PIN` d'origine
 * archivée derrière une route qu'on croyait ne servir que du live. Les appelants qui veulent
 * l'historique passent par `getBookingsWithArchive` (`lib/bookings.ts`), qui le dit dans son
 * nom.
 */
export async function getBookings(params?: BookingQuery): Promise<Beds24Booking[]> {
  const queryParams: Record<string, string> = {};
  if (params?.arrivalFrom) queryParams.arrivalFrom = params.arrivalFrom;
  if (params?.arrivalTo) queryParams.arrivalTo = params.arrivalTo;
  if (params?.departureFrom) queryParams.departureFrom = params.departureFrom;
  if (params?.departureTo) queryParams.departureTo = params.departureTo;
  if (params?.statuses && params.statuses.length > 0) {
    queryParams.status = params.statuses.join(",");
  }
  if (params?.includeInvoiceItems) queryParams.includeInvoiceItems = "true";
  if (params?.includeInfoItems) queryParams.includeInfoItems = "true";

  const data = await client.get<{ data: Beds24Booking[] }>("/bookings", { params: queryParams });
  return data.data ?? [];
}

/**
 * Traduction du format de transport vers le type canonique du domaine.
 *
 * La clé de dédoublonnage est l'`id` numérique, que l'archive de ce site a conservé — chez
 * Albiez ce serait impossible, ses lignes archivées n'en ont pas. `bookedAt` garde
 * l'horodatage complet de Beds24 : le tri des réservations récentes s'en sert, et un
 * consommateur qui veut le jour tronque à dix caractères.
 *
 * **C'est ici, et nulle part ailleurs, que le brut est défini.** `price` fait foi — il est le
 * brut sur les quatre canaux, prouvé au centime le 2026-09-13 : Airbnb `price = versement
 * hôte + commission` (39/41), Booking.com `price = hébergement + ménage + City tax` (3/3),
 * direct `price = Σ charges taxe comprise` (12/14), Abritel 1/1. On en retire la seule chose
 * qui n'est pas un revenu, la taxe de séjour lue dans les lignes de facture ; la commission
 * vient de `commissionOf` (le champ d'abord, les lignes en repli). La page fiscale lit ces
 * champs : elle reconstituait un CA depuis les lignes, et rendait un net pour Airbnb — la
 * commission n'y figure jamais — contre un brut pour les autres.
 *
 * Deux réservations modifiées (`82274645`, `80467451`) gardent l'ancienne ligne à côté de la
 * nouvelle, une (`81056833`) une remise manuelle non répercutée dans `price` : `price` fait
 * foi quand même, +22,00 € d'erreur documentée valent mieux qu'une heuristique de
 * dédoublonnage. Rien de `invoiceItems` ni `infoItems` n'est recopié dans le `Booking`.
 *
 * `units` : **l'unité du dashboard est la nuit de maison.** Une nuit de maison entière vaut 1,
 * une nuit de chambre de l'époque à la chambre vaut un neuvième. L'arbitre avait d'abord posé
 * l'inverse — la maison à 9, la chambre à 1 — pour rendre l'historique à la chambre exact ; le
 * résultat montrait un prix moyen de 58 € et un RevPAR de 25 €, des chiffres de chambre pour une
 * activité qui ne se loue plus qu'en maison entière. L'exploitant a tranché le 2026-09-13 : les
 * indicateurs se lisent à la nuit de maison, et l'époque chambre pèse ce qu'elle vaut, un
 * neuvième de maison par nuit. L'occupation ne change pas ; le prix par nuit et le RevPAR sont
 * ceux d'une maison.
 */
const WHOLE_HOUSE_PROPERTY_ID = 303771;
const ROOMS_IN_HOUSE = 9;

export function toBooking(b: Beds24Booking, source: BookingSource = "live"): Booking {
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const touristTax = touristTaxFromInvoiceItems(b.invoiceItems);
  const gross = round2(Number(b.price ?? 0) - touristTax);
  const commission = round2(commissionOf(b));
  return {
    ref: String(b.id),
    channel: normalizeChannel(b.referer, b.channel),
    arrival: b.arrival,
    departure: b.departure,
    nights: nightsBetween(b.arrival, b.departure),
    gross,
    net: round2(gross - commission),
    commission,
    touristTax,
    units: b.propertyId === WHOLE_HOUSE_PROPERTY_ID ? 1 : 1 / ROOMS_IN_HOUSE,
    source,
    id: b.id,
    propertyId: b.propertyId,
    roomId: b.roomId,
    status: b.status,
    bookedAt: b.bookingTime ?? null,
    notes: b.notes,
    guests:
      b.numAdult == null && b.numChild == null ? null : (b.numAdult ?? 0) + (b.numChild ?? 0),
    numAdult: b.numAdult,
    numChild: b.numChild,
    firstName: b.firstName,
    lastName: b.lastName,
    company: b.company,
    title: b.title,
    email: b.email,
    phone: b.phone,
    mobile: b.mobile,
    country: b.country,
    comments: b.comments,
    arrivalTime: b.arrivalTime,
  };
}

export async function getBookingById(id: number): Promise<Beds24Booking | null> {
  const data = await client.get<{ data: Beds24Booking[] }>("/bookings", {
    params: {
      id: String(id),
      includeInvoiceItems: "true",
      includeGuests: "true",
      includeInfoItems: "true",
    },
  });
  return data.data?.[0] ?? null;
}

/**
 * Cherche une réservation Beds24 qui contient un des IDs Stripe dans ses infoItems.
 * Beds24 stocke typiquement le charge id (ch_…) sous le code "STRIPEPAYMENT"
 * avec un texte du genre "Payment 123.45 EUR, ch_3M…".
 */
export async function findBookingByStripeIds(
  stripeIds: string[],
): Promise<Beds24Booking | null> {
  const targets = stripeIds
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s));
  if (targets.length === 0) return null;

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  const to = new Date(now.getFullYear() + 2, now.getMonth(), 0);
  const arrivalFrom = from.toISOString().split("T")[0];
  const arrivalTo = to.toISOString().split("T")[0];

  const data = await client.get<{ data: Beds24Booking[] }>("/bookings", {
    params: {
      arrivalFrom,
      arrivalTo,
      includeInfoItems: "true",
      includeGuests: "true",
    },
  });

  const bookings = data.data ?? [];
  const match = bookings.find((b) =>
    b.infoItems?.some(
      (i) =>
        (i.code ?? "").toUpperCase() === "STRIPEPAYMENT" &&
        targets.some((t) => (i.text ?? "").includes(t)),
    ),
  );
  return match ?? null;
}

export async function getAvailability(
  propertyId: number,
  from: string,
  to: string,
): Promise<Record<string, boolean>> {
  const data = await client.get<{ data: Beds24AvailabilityRoom[] }>(
    "/inventory/rooms/availability",
    { params: { startDate: from, endDate: to, propertyId: String(propertyId) }, route: "public" },
  );
  // Merge availability across all rooms: a date is occupied if ANY room is unavailable
  const merged: Record<string, boolean> = {};
  for (const room of data.data ?? []) {
    for (const [date, available] of Object.entries(room.availability)) {
      if (merged[date] === undefined) merged[date] = available;
      // If any room is unavailable, mark the date as unavailable
      if (!available) merged[date] = false;
    }
  }
  return merged;
}

/**
 * Returns dates where the WHOLE house is booked (all rooms unavailable).
 * Used for sold-out detection on blog articles.
 */
export async function getFullyBookedDates(
  propertyId: number,
  from: string,
  to: string,
): Promise<Set<string>> {
  const data = await client.get<{ data: Beds24AvailabilityRoom[] }>(
    "/inventory/rooms/availability",
    { params: { startDate: from, endDate: to, propertyId: String(propertyId) }, route: "public" },
  );
  const rooms = data.data ?? [];
  if (rooms.length === 0) return new Set();

  // Count for each date how many rooms are unavailable
  const unavailableCount: Record<string, number> = {};
  const totalRooms = rooms.length;
  for (const room of rooms) {
    for (const [date, available] of Object.entries(room.availability)) {
      if (!available) {
        unavailableCount[date] = (unavailableCount[date] ?? 0) + 1;
      }
    }
  }
  // Fully booked = all rooms unavailable that day
  const fullyBooked = new Set<string>();
  for (const [date, count] of Object.entries(unavailableCount)) {
    if (count === totalRooms) fullyBooked.add(date);
  }
  return fullyBooked;
}

/**
 * Prix au calendrier (`price1`) **sommés sur toutes les rooms** de la propriété.
 *
 * La somme est ce qui distingue ce bien d'Albiez, qui n'a qu'une chambre et prend donc la
 * dernière valeur. Sert à la projection de revenu par pricing dynamique.
 */
export async function getDailyPrices(
  propertyId: number,
  from: string,
  to: string,
): Promise<Record<string, number>> {
  const data = await client.get<{ data: Beds24CalendarRoom[] }>("/inventory/rooms/calendar", {
    params: {
      propertyId: String(propertyId),
      startDate: from,
      endDate: to,
      includePrices: "true",
    },
    route: "public",
  });

  const sumByDate: Record<string, number> = {};
  for (const room of data.data ?? []) {
    expandSpans(room.calendar, (e) => e.price1, (avant, apres) => (avant ?? 0) + apres, sumByDate);
  }
  return sumByDate;
}

export async function getMinStay(
  propertyId: number,
  from: string,
  to: string,
): Promise<Record<string, number>> {
  const data = await client.get<{ data: Beds24CalendarRoom[] }>("/inventory/rooms/calendar", {
    params: {
      propertyId: String(propertyId),
      startDate: from,
      endDate: to,
      includeMinStay: "true",
    },
    route: "public",
  });

  const result: Record<string, number> = {};
  for (const room of data.data ?? []) {
    expandSpans(room.calendar, (e) => e.minStay, undefined, result);
  }
  return result;
}
