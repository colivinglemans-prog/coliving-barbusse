import { normalizeChannel } from "@sejour/socle/lib/channels";
import { commissionOf } from "@sejour/socle/lib/commissions";
import { touristTaxFromInvoiceItems } from "@sejour/socle/lib/taxe-sejour";
import { nightsBetween, type Booking, type BookingSource } from "@sejour/socle/lib/booking";
import {
  Beds24Error,
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
import { PROPERTY_ID } from "@/lib/beds24-property";

export { PROPERTY_ID, ROOM_ID } from "@/lib/beds24-property";

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
 * | `BEDS24_MESSAGES_REFRESH_TOKEN` | `coliving-barbusse-messagerie-2026-09` | `read:bookings`, `read/write:bookings-personal` | messages voyageur |
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
    /**
     * Consignes de ménage, et le PIN de serrure (`NUKI_PIN`) depuis que la synchronisation
     * Nuki est faite ici (2026-11-07). `write:bookings` suffit pour les `infoItems` —
     * vérifié par un ajout puis une suppression sur une réservation réelle.
     */
    ecriture: { env: "BEDS24_REFRESH_TOKEN" },
    /**
     * Fil de messagerie du voyageur — lecture de l'état des boutons et envoi.
     *
     * Quatrième voie plutôt qu'un élargissement de l'écriture : `/bookings/messages` exige
     * la variante `-personal` des scopes (vérifié le 2026-09-22 — le jeton d'écriture, qui
     * ne l'a pas, reçoit `401 Token not valid` en lecture **comme** en écriture sur cet
     * endpoint). Poser `write:bookings-personal` sur le jeton des consignes de ménage lui
     * aurait donné le droit d'écrire au voyageur pour rien.
     *
     * **Aucun repli.** Un envoi qui dégrade silencieusement vers une autre voie écrirait
     * sous un autre privilège, ou échouerait en laissant croire que le message est parti.
     */
    messagerie: { env: "BEDS24_MESSAGES_REFRESH_TOKEN" },
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

/**
 * Échange forcé du jeton de messagerie — exporté pour le cron keepalive. Deux boutons
 * cliqués de loin en loin n'entretiennent rien : sans le cron il meurt en 30 jours.
 */
export function refreshBeds24MessagesToken(): Promise<Beds24TokenExchange> {
  return client.refresh("messagerie");
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
  /**
   * Hors du cache de 60 s du client. Obligatoire pour la synchronisation de la serrure :
   * relire un PIN qu'elle vient d'écrire comme absent lui en ferait attribuer un second.
   */
  fresh?: boolean;
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
  if (params?.includeInvoiceItems) queryParams.includeInvoiceItems = "true";
  if (params?.includeInfoItems) queryParams.includeInfoItems = "true";

  // Beds24 refuse une liste à virgules (`400 … is not a valid option for the status
  // parameter`, mesuré le 2026-11-07) et le client du socle ne répète pas une clé : une
  // requête par statut, fusionnées. Sans `statuses`, l'API **omet les annulées**.
  const statuses = params?.statuses?.length ? params.statuses : [null];
  const pages = await Promise.all(
    statuses.map((status) =>
      client.get<{ data: Beds24Booking[] }>("/bookings", {
        params: status ? { ...queryParams, status } : queryParams,
        fresh: params?.fresh,
      }),
    ),
  );
  const byId = new Map<number, Beds24Booking>();
  for (const page of pages) for (const b of page.data ?? []) byId.set(b.id, b);
  return [...byId.values()];
}

/**
 * **Tout le compte**, brut, pour la sauvegarde (`/api/cron/beds24-backup`) : toutes
 * propriétés, toutes pages, avec lignes de facture, infoItems et voyageurs — ce que
 * `scripts/beds24-backup.mjs` aspirait à la main. Données personnelles : ne sort d'ici que
 * vers un stockage privé, jamais vers une réponse HTTP ni un log.
 *
 * Voie `lecture` (la seule à porter `read:bookings-personal`), sans cache : 60 s de retard
 * sur une sauvegarde ne coûteraient rien, mais les pages paginées ne doivent pas se mélanger.
 */
export async function getAllBookingsRaw(): Promise<Beds24Booking[]> {
  const params = {
    arrivalFrom: "2020-01-01",
    arrivalTo: `${new Date().getFullYear() + 2}-12-31`,
    includeInvoiceItems: "true",
    includeInfoItems: "true",
    includeGuests: "true",
  };
  const all: Beds24Booking[] = [];
  for (let page = 1; page <= 100; page++) {
    const res = await client.get<{ data?: Beds24Booking[]; pages?: { nextPageExists?: boolean } }>(
      "/bookings",
      { params: { ...params, page: String(page) }, route: "lecture", fresh: true },
    );
    const data = res.data ?? [];
    all.push(...data);
    if (!res.pages?.nextPageExists || data.length === 0) return all;
  }
  throw new Error("Beds24 : plus de 100 pages de réservations, pagination suspecte");
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
const WHOLE_HOUSE_PROPERTY_ID = PROPERTY_ID;
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

/**
 * Code de la serrure Nuki, déposé par Beds24 dans les `infoItems` de la réservation. Il
 * n'apparaît qu'environ 6 jours avant l'arrivée — avant cela, `null`.
 *
 * Lu par deux routes (le bloc de partage et l'envoi du message d'arrivée) : le nom du code
 * vit ici plutôt qu'en double dans chacune.
 */
const NUKI_INFO_CODE = "NUKI_PIN";

export function nukiCodeOf(booking: Beds24Booking): string | null {
  const item = booking.infoItems?.find((i) => (i.code ?? "").toUpperCase() === NUKI_INFO_CODE);
  return item?.text?.trim() || null;
}

/**
 * Dépose le PIN de serrure dans la réservation, là où le gabarit du message d'arrivée le
 * lit (`[BOOKINGINFOCODETEXT:NUKI_PIN]`). Ajout seulement : l'appelant ne l'utilise que
 * pour une réservation qui n'en a pas — `nukiCodeOf` lit le premier trouvé, un second
 * serait ignoré.
 *
 * ⚠️ **Jamais le corps de la réponse dans une erreur** : Beds24 y renvoie la note créée,
 * donc le PIN, et les erreurs finissent dans les journaux et dans ntfy.
 */
export async function addNukiPin(bookingId: number, pin: string): Promise<void> {
  const t = await client.token("ecriture");
  const res = await fetch(`${BEDS24_BASE_URL}/bookings`, {
    method: "POST",
    headers: { token: t, "Content-Type": "application/json" },
    body: JSON.stringify([{ id: bookingId, infoItems: [{ code: NUKI_INFO_CODE, text: pin }] }]),
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 401) client.invalidate("ecriture");
    throw new Error(`Beds24 a refusé l'écriture du PIN (HTTP ${res.status})`);
  }
  const parsed = (await res.json().catch(() => null)) as { success?: boolean }[] | null;
  if (!Array.isArray(parsed) || parsed[0]?.success !== true) {
    throw new Error("Beds24 n'a pas confirmé l'écriture du PIN");
  }
}

/**
 * Passe une réservation « new » en « confirmed ». Appelé par la synchronisation de la
 * serrure une fois le PIN écrit et le code posé : l'exploitant le faisait à la main, et
 * voulait que le code existe avant la confirmation (2026-11-07).
 */
export async function confirmBooking(bookingId: number): Promise<void> {
  const t = await client.token("ecriture");
  const res = await fetch(`${BEDS24_BASE_URL}/bookings`, {
    method: "POST",
    headers: { token: t, "Content-Type": "application/json" },
    body: JSON.stringify([{ id: bookingId, status: "confirmed" }]),
    cache: "no-store",
  });
  if (!res.ok) {
    if (res.status === 401) client.invalidate("ecriture");
    throw new Error(`Beds24 a refusé la confirmation (HTTP ${res.status})`);
  }
  const parsed = (await res.json().catch(() => null)) as { success?: boolean }[] | null;
  if (!Array.isArray(parsed) || parsed[0]?.success !== true) {
    throw new Error("Beds24 n'a pas confirmé le changement de statut");
  }
}

export async function getBookingById(
  id: number,
  { fresh }: { fresh?: boolean } = {},
): Promise<Beds24Booking | null> {
  const data = await client.get<{ data: Beds24Booking[] }>("/bookings", {
    fresh,
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
      // Les lignes de facture portent la taxe de séjour, ventilée sur la facture.
      includeInvoiceItems: "true",
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

/** Une journée du calendrier telle que le pricing la voit : prix, séjour minimum, dispo. */
export interface CalendarDay {
  price: number;
  minStay: number;
  /** `true` si la maison est encore vendable ce jour-là (`numAvail > 0`). */
  available: boolean;
}

/**
 * Prix, séjour minimum et disponibilité en **un seul appel**, pour la photo quotidienne du
 * pricing (`lib/pricing/snapshot.ts`). C'est la valeur que Beyond pousse dans Beds24 : la
 * relever chaque jour est le seul moyen d'en garder l'historique, Beds24 n'en conserve aucun.
 *
 * Une seule room (`633259`) depuis la fin de la location à la chambre ; s'il y en avait
 * plusieurs, les prix seraient sommés comme dans `getDailyPrices`, le séjour minimum pris au
 * plus haut, et la maison vendable seulement si toutes les rooms le sont.
 */
export async function getCalendarDays(
  propertyId: number,
  from: string,
  to: string,
): Promise<Record<string, CalendarDay>> {
  const data = await client.get<{ data: Beds24CalendarRoom[] }>("/inventory/rooms/calendar", {
    params: {
      propertyId: String(propertyId),
      startDate: from,
      endDate: to,
      includePrices: "true",
      includeMinStay: "true",
      includeNumAvail: "true",
    },
    route: "public",
  });

  const price: Record<string, number> = {};
  const minStay: Record<string, number> = {};
  const numAvail: Record<string, number> = {};
  for (const room of data.data ?? []) {
    expandSpans(room.calendar, (e) => e.price1, (a, b) => (a ?? 0) + b, price);
    expandSpans(room.calendar, (e) => e.minStay, (a, b) => Math.max(a ?? 0, b), minStay);
    expandSpans(
      room.calendar,
      (e) => (e as { numAvail?: number }).numAvail,
      (a, b) => Math.min(a ?? Infinity, b),
      numAvail,
    );
  }

  const days: Record<string, CalendarDay> = {};
  for (const date of Object.keys(price).sort()) {
    days[date] = {
      price: price[date],
      minStay: minStay[date] ?? 1,
      available: (numAvail[date] ?? 0) > 0,
    };
  }
  return days;
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

/* ────────────────────────────────────────────────────────────────────────────
 * Messagerie voyageur
 *
 * `/bookings/messages` écrit dans le fil de la réservation côté canal : le voyageur reçoit
 * le message dans Airbnb ou Booking.com, et Beds24 l'horodate. C'est ce qui permet au
 * dashboard de n'avoir aucun registre local à tenir — l'état des boutons se relit dans le
 * fil, y compris pour les messages partis par auto-action.
 *
 * **Réservations directes** : pas de canal, donc pas de fil. L'API accepte le POST mais
 * personne ne le reçoit. L'appelant filtre en amont (voir la route API).
 * ────────────────────────────────────────────────────────────────────────── */

/** Le socle garde son URL de base privée ; on la redit ici pour l'unique appel en POST. */
const BEDS24_BASE_URL = "https://api.beds24.com/v2";

export interface Beds24Message {
  id: number;
  bookingId: number;
  /** ISO 8601 UTC, tel que Beds24 le rend. */
  time: string;
  source: "host" | "guest" | "internalNote" | "system";
  message: string;
}

/**
 * Fil d'une réservation, du plus récent au plus ancien.
 *
 * Pas de pagination : Beds24 rend 100 messages par page et les sert dans cet ordre, or on ne
 * cherche que les deux messages types, forcément récents. Une réservation à plus de
 * 100 échanges verrait ses plus anciens tomber — sans conséquence ici.
 */
export async function getBookingMessages(bookingId: number): Promise<Beds24Message[]> {
  const data = await client.get<{ data: Beds24Message[] }>("/bookings/messages", {
    params: { bookingId: String(bookingId) },
    route: "messagerie",
    fresh: true,
  });
  return data.data ?? [];
}

/**
 * Envoie un message au voyageur. Beds24 l'ajoute au fil et le pousse vers le canal.
 *
 * Même prudence que `updateNotes` dans le socle : l'API répond parfois **200 avec
 * `success: false`**, un refus qu'il faut lire dans le corps sous peine d'afficher
 * « envoyé » alors que rien n'est parti — ce qui, ici, ferait griser un bouton à tort.
 */
export async function sendBookingMessage(bookingId: number, message: string): Promise<void> {
  const t = await client.token("messagerie");
  const res = await fetch(`${BEDS24_BASE_URL}/bookings/messages`, {
    method: "POST",
    headers: { token: t, "Content-Type": "application/json" },
    body: JSON.stringify([{ bookingId, message }]),
    cache: "no-store",
  });
  const body = await res.text();

  if (!res.ok) {
    if (res.status === 401) client.invalidate("messagerie");
    throw new Beds24Error(res.status, "/bookings/messages (POST)", body);
  }

  let refus: string | null = null;
  try {
    const parsed = JSON.parse(body) as { success?: boolean; errors?: unknown; error?: unknown }[];
    const first = Array.isArray(parsed) ? parsed[0] : null;
    if (first && first.success === false) {
      refus = JSON.stringify(first.errors ?? first.error ?? first).slice(0, 300);
    }
  } catch {
    // Corps illisible mais statut 2xx : format inattendu, pas un refus d'envoi.
  }
  if (refus) throw new Error(`Beds24 a refusé l'envoi : ${refus}`);
}
