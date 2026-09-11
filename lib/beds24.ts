import type { Beds24Booking, Beds24Property } from "./types";
import { getArchivedBookings } from "./bookings-archive";

const BEDS24_API_URL = "https://api.beds24.com/v2";

function beds24Url(path: string, params?: Record<string, string>): string {
  const url = new URL(`${BEDS24_API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}

/*
 * Trois jetons, trois privilèges — un par chemin, pas par verbe.
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
 * **Les trois sont des refresh tokens, plus aucun long life.** Les lectures du dashboard
 * passaient par `BEDS24_API_TOKEN`, un long life dont la durée de vie ne se laisse pas
 * établir : celui d'avant, créé le 24/04, affichait encore 90 jours restants 140 jours plus
 * tard. Un refresh token meurt après 30 jours sans usage, mais l'échéance glisse à chaque
 * échange — et le cron keepalive les entretient tous les trois plutôt que de parier sur le
 * trafic. Un long life aurait de toute façon forcé un jeton séparé pour l'écriture, faute de
 * pouvoir porter un scope `write`.
 */

/** Access tokens de 24 h, en cache par refresh token — les trois voies partagent le mécanisme. */
const accessTokenCache = new Map<string, { token: string; expiresAt: number }>();

/** Échange forcé, hors cache. C'est lui qui repousse l'échéance du refresh token. */
async function exchangeRefreshToken(
  refreshToken: string,
  usage: string,
): Promise<{ token: string; expiresIn: number }> {
  accessTokenCache.delete(refreshToken);

  const res = await fetch(`${BEDS24_API_URL}/authentication/token`, {
    headers: { refreshToken },
    cache: "no-store",
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Beds24 auth ${usage} ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = JSON.parse(body) as { token?: string; expiresIn?: number };
  if (!data.token) throw new Error(`Beds24 auth ${usage} : token manquant dans la réponse`);

  const expiresIn = data.expiresIn ?? 86_400;
  accessTokenCache.set(refreshToken, {
    token: data.token,
    expiresAt: Date.now() + expiresIn * 1000,
  });
  return { token: data.token, expiresIn };
}

async function getAccessToken(refreshToken: string, usage: string): Promise<string> {
  // Marge d'une minute : un token qui expire pendant la requête coûte un 401 inexplicable.
  const cached = accessTokenCache.get(refreshToken);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const { token } = await exchangeRefreshToken(refreshToken, usage);
  return token;
}

/** Échange forcé du jeton de lecture — exporté pour le cron keepalive. */
export async function refreshBeds24ReadToken(): Promise<{ token: string; expiresIn: number }> {
  const rt = process.env.BEDS24_READ_REFRESH_TOKEN;
  if (!rt) throw new Error("BEDS24_READ_REFRESH_TOKEN non défini");
  return exchangeRefreshToken(rt, "lecture");
}

/**
 * Lectures du dashboard : réservations, montants, coordonnées voyageur.
 *
 * `read:bookings-personal` est nécessaire ici, contrairement à Albiez : les factures et le
 * partage du guide voyageur lisent `firstName`, `email` et `phone`.
 */
async function beds24Fetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const rt = process.env.BEDS24_READ_REFRESH_TOKEN;
  if (!rt) throw new Error("BEDS24_READ_REFRESH_TOKEN non défini");
  const token = await getAccessToken(rt, "lecture");

  const res = await fetch(beds24Url(path, params), {
    headers: { token },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Beds24 API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/*
 * Lecture publique : le jeton qui ne sait rien des réservations.
 *
 * `/api/availability` et les pages vitrine ne consultent que l'inventaire. Les servir avec le
 * jeton du dashboard revenait à poser `read:bookings-personal` et `read:bookings-financial`
 * dans l'environnement du point d'entrée le plus exposé du site — celui qu'un visiteur
 * anonyme atteint, et le premier qu'on sonde.
 *
 * `BEDS24_PUBLIC_REFRESH_TOKEN` ne porte que `read:inventory` et `read:properties`. Présenté
 * à `/bookings`, Beds24 répond 401 : vérifié, pas supposé. S'il fuite, l'attaquant apprend
 * quelles dates sont libres, information que la page affiche déjà.
 *
 * Repli assumé : jeton absent, refusé ou révoqué, on refait l'appel avec le jeton de
 * **lecture** — jamais celui d'écriture, qui n'a d'ailleurs pas les scopes d'inventaire. On
 * perd la séparation des privilèges le temps de réagir, ce qui vaut mieux qu'un tunnel de
 * réservation éteint sans prévenir. Cette dégradation étant silencieuse par nature, c'est le
 * cron keepalive qui la rend visible.
 */
const REGENERER_PUBLIC =
  "Régénérer BEDS24_PUBLIC_REFRESH_TOKEN (scopes read:inventory, read:properties).";

/** Échange forcé du jeton public — exporté pour le cron keepalive, il lève en cas d'échec. */
export async function refreshBeds24PublicToken(): Promise<{ token: string; expiresIn: number }> {
  const rt = process.env.BEDS24_PUBLIC_REFRESH_TOKEN;
  if (!rt) throw new Error("BEDS24_PUBLIC_REFRESH_TOKEN non défini");
  return exchangeRefreshToken(rt, "publique");
}

async function getBeds24PublicToken(): Promise<string | null> {
  const rt = process.env.BEDS24_PUBLIC_REFRESH_TOKEN;
  if (!rt) return null;

  try {
    return await getAccessToken(rt, "publique");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Beds24 : ${message}. ${REGENERER_PUBLIC}`);
    return null;
  }
}

async function beds24FetchPublic<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const token = await getBeds24PublicToken();
  if (!token) return beds24Fetch<T>(path, params);

  const res = await fetch(beds24Url(path, params), {
    headers: { token },
    next: { revalidate: 60 },
  });

  if (res.status === 401) {
    const rt = process.env.BEDS24_PUBLIC_REFRESH_TOKEN;
    if (rt) accessTokenCache.delete(rt);
    console.error(`Beds24 : jeton public rejeté sur ${path}. ${REGENERER_PUBLIC}`);
    return beds24Fetch<T>(path, params);
  }
  if (!res.ok) {
    throw new Error(`Beds24 API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Écriture des consignes de ménage, et rien d'autre.
 *
 * Ce jeton ne voit ni `price`, ni `commission`, ni `invoiceItems` : un chemin qui n'a besoin
 * que d'annoter une réservation n'a pas à pouvoir lire le chiffre d'affaires.
 *
 * Échange forcé exporté pour le cron keepalive : l'écriture est bien trop rare pour entretenir
 * le jeton seule, et sans le cron il meurt au bout de 30 jours.
 */
export async function refreshBeds24WriteToken(): Promise<{ token: string; expiresIn: number }> {
  const rt = process.env.BEDS24_REFRESH_TOKEN;
  if (!rt) throw new Error("BEDS24_REFRESH_TOKEN non défini (requis pour l'écriture)");
  return exchangeRefreshToken(rt, "écriture");
}

async function getBeds24WriteToken(): Promise<string> {
  const rt = process.env.BEDS24_REFRESH_TOKEN;
  if (!rt) throw new Error("BEDS24_REFRESH_TOKEN non défini (requis pour l'écriture)");
  return getAccessToken(rt, "écriture");
}

export async function updateBookingNotes(id: number, notes: string): Promise<void> {
  const token = await getBeds24WriteToken();
  const res = await fetch(`${BEDS24_API_URL}/bookings`, {
    method: "POST",
    headers: { token, "Content-Type": "application/json" },
    body: JSON.stringify([{ id, notes }]),
    cache: "no-store",
  });
  const body = await res.text();
  if (!res.ok) {
    // Invalidate cache on 401 so next call refreshes
    // Invalide le cache sur 401 pour que l'appel suivant refasse l'échange.
    if (res.status === 401) {
      const rt = process.env.BEDS24_REFRESH_TOKEN;
      if (rt) accessTokenCache.delete(rt);
    }
    throw new Error(`Beds24 ${res.status}: ${body.slice(0, 300)}`);
  }
  // Beds24 v2 can return 200 with success:false inside the array
  try {
    const parsed = JSON.parse(body) as Array<{ success?: boolean; errors?: unknown; error?: unknown }>;
    const first = Array.isArray(parsed) ? parsed[0] : null;
    if (first && first.success === false) {
      const detail = JSON.stringify(first.errors ?? first.error ?? first).slice(0, 300);
      throw new Error(`Beds24 refus: ${detail}`);
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Beds24 refus:")) throw e;
    // JSON parse errors = unexpected format, but 200 OK → continue silently
  }
}

export async function getProperties(): Promise<Beds24Property[]> {
  const data = await beds24Fetch<{ data: Beds24Property[] }>("/properties");
  return data.data ?? [];
}

export async function getBookings(params?: {
  arrivalFrom?: string;
  arrivalTo?: string;
  departureFrom?: string;
  departureTo?: string;
  statuses?: string[];
  includeInvoiceItems?: boolean;
  includeInfoItems?: boolean;
}): Promise<Beds24Booking[]> {
  const queryParams: Record<string, string> = {};
  if (params?.arrivalFrom) queryParams.arrivalFrom = params.arrivalFrom;
  if (params?.arrivalTo) queryParams.arrivalTo = params.arrivalTo;
  if (params?.departureFrom) queryParams.departureFrom = params.departureFrom;
  if (params?.departureTo) queryParams.departureTo = params.departureTo;
  if (params?.statuses && params.statuses.length > 0) {
    queryParams.status = params.statuses.join(",");
  }
  if (params?.includeInvoiceItems) {
    queryParams.includeInvoiceItems = "true";
  }
  if (params?.includeInfoItems) {
    queryParams.includeInfoItems = "true";
  }

  const data = await beds24Fetch<{ data: Beds24Booking[] }>("/bookings", queryParams);
  const live = data.data ?? [];

  // Réinjecte l'historique des propriétés supprimées de Beds24 (voir lib/bookings-archive.ts).
  // Dédup par id : le live gagne, on n'ajoute que les résas archivées absentes du live.
  const liveIds = new Set(live.map((b) => b.id));
  const archived = getArchivedBookings({
    arrivalFrom: params?.arrivalFrom,
    arrivalTo: params?.arrivalTo,
    departureFrom: params?.departureFrom,
    departureTo: params?.departureTo,
    statuses: params?.statuses,
  }).filter((b) => !liveIds.has(b.id));

  /*
   * Symétrie avec l'API : ce qu'on n'a pas demandé n'est pas là.
   *
   * Beds24 ne renvoie `infoItems` et `invoiceItems` que si on les réclame — l'archive, elle,
   * est un JSON local qui les porte toujours, et **37 de ses 42 lignes contiennent un
   * `NUKI_PIN`**. Sans ce filtre, un appelant qui n'a rien demandé reçoit quand même les
   * codes de serrure, uniquement parce que la réservation est ancienne.
   *
   * C'est la fermeture **à la source**, en amont du DTO de `/api/dashboard/bookings`. Les
   * deux existent : celui-ci empêche la donnée d'entrer dans le processus, l'autre l'empêche
   * d'en sortir.
   */
  const conforme = archived.map((b) => {
    const copie = { ...b };
    if (!params?.includeInfoItems) delete copie.infoItems;
    if (!params?.includeInvoiceItems) delete copie.invoiceItems;
    return copie;
  });

  return [...live, ...conforme];
}

export async function getBookingById(id: number): Promise<Beds24Booking | null> {
  const data = await beds24Fetch<{ data: Beds24Booking[] }>("/bookings", {
    id: String(id),
    includeInvoiceItems: "true",
    includeGuests: "true",
    includeInfoItems: "true",
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

  const data = await beds24Fetch<{ data: Beds24Booking[] }>("/bookings", {
    arrivalFrom,
    arrivalTo,
    includeInfoItems: "true",
    includeGuests: "true",
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

interface AvailabilityRoom {
  roomId: number;
  propertyId: number;
  availability: Record<string, boolean>;
}

export async function getAvailability(
  propertyId: number,
  from: string,
  to: string,
): Promise<Record<string, boolean>> {
  const data = await beds24FetchPublic<{ data: AvailabilityRoom[] }>(
    "/inventory/rooms/availability",
    { startDate: from, endDate: to, propertyId: String(propertyId) },
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
  const data = await beds24FetchPublic<{ data: AvailabilityRoom[] }>(
    "/inventory/rooms/availability",
    { startDate: from, endDate: to, propertyId: String(propertyId) },
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

interface CalendarEntry {
  from: string;
  to: string;
  minStay?: number;
  price1?: number;
}

interface CalendarRoom {
  roomId: number;
  propertyId: number;
  calendar: CalendarEntry[];
}

/**
 * Fetch daily prices (price1) across all rooms of a property.
 * Returns a map of date → total daily price (sum of all rooms' price1 for that date).
 * Used for dynamic revenue projection.
 */
export async function getDailyPrices(
  propertyId: number,
  from: string,
  to: string,
): Promise<Record<string, number>> {
  const data = await beds24FetchPublic<{ data: CalendarRoom[] }>(
    "/inventory/rooms/calendar",
    {
      propertyId: String(propertyId),
      startDate: from,
      endDate: to,
      includePrices: "true",
    },
  );

  const sumByDate: Record<string, number> = {};
  for (const room of data.data ?? []) {
    for (const entry of room.calendar) {
      if (entry.price1 === undefined || entry.price1 === null) continue;
      const start = new Date(entry.from + "T00:00:00");
      const end = new Date(entry.to + "T00:00:00");
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        sumByDate[dateStr] = (sumByDate[dateStr] ?? 0) + entry.price1;
      }
    }
  }
  return sumByDate;
}

export async function getMinStay(
  propertyId: number,
  from: string,
  to: string,
): Promise<Record<string, number>> {
  const data = await beds24FetchPublic<{ data: CalendarRoom[] }>(
    "/inventory/rooms/calendar",
    {
      propertyId: String(propertyId),
      startDate: from,
      endDate: to,
      includeMinStay: "true",
    },
  );

  const result: Record<string, number> = {};
  for (const room of data.data ?? []) {
    for (const entry of room.calendar) {
      if (entry.minStay === undefined) continue;
      // Expand date range into per-day entries
      const start = new Date(entry.from + "T00:00:00");
      const end = new Date(entry.to + "T00:00:00");
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        result[dateStr] = entry.minStay;
      }
    }
  }
  return result;
}
