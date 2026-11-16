import type { AccessAction } from "@sejour/socle/lib/access-codes";
import { countsAsSold } from "@sejour/socle/lib/booking-status";
import { addDays } from "@sejour/socle/lib/dates";
import { isLateBooking } from "@sejour/socle/lib/guest-messaging/schedule";
import type { NukiAuth } from "@sejour/socle/lib/nuki";
import { parisInstant } from "@sejour/socle/lib/time";

/**
 * **Arrivée imminente** (2026-11-16) : prévenir l'hôte quand une réservation est créée, ou son
 * arrivée déplacée, pour une arrivée aujourd'hui ou demain. Le 16/11, une réservation de dernière
 * minute est arrivée dans une maison pas prête, et rien ne l'avait signalé.
 *
 * - **Déclencheur** : les actions que la synchro de la serrure a **réellement exécutées** (jamais à
 *   blanc ni en `?dry=1`), pour une arrivée aujourd'hui ou demain (heure de Paris), et seulement :
 *   la création du code d'une réservation faite moins de 48 h avant l'arrivée (`isLateBooking` du
 *   socle), ou la mise à jour de fenêtre (`window`) d'un code dont le jour d'arrivée a changé.
 *   Jamais « toute réservation qui entre dans la fenêtre », qui notifierait chaque séjour la veille.
 * - **Texte** factuel, prénom seul, jamais d'heure d'arrivée (`arrivalTime` est vide sur Airbnb),
 *   jamais « non constaté » (Intratone remonte en retard : une absence n'est pas prouvée). Le
 *   dernier ménage vient du registre `barbusse:cleaning:log`, personnes au rôle « ménage » de
 *   `TRACKED_PEOPLE` seulement (un dépannage n'est pas un ménage). Le dernier départ est un départ
 *   **déjà passé** ; un départ encore à venir avant l'arrivée (rotation) s'écrit « départ prévu ».
 * - **Priorité** : 2 si un ménage est enregistré depuis le dernier départ passé, 4 sinon (dont
 *   départ inconnu, à venir ou introuvable) ; la nuit, 2 pour une arrivée le lendemain.
 * - **Anti-doublon** : `SET NX` sur `barbusse:arrival-notice:<résa>:<jour d'arrivée>`. Redis
 *   injoignable : rien n'est envoyé (c'est une information, pas une panne).
 * - **Envoi raté** : le déclencheur ne se reproduira pas, donc la notification est mise en file
 *   (`barbusse:arrival-notice:retry:<résa>:<jour>`, texte et priorité, jusqu'au lendemain de
 *   l'arrivée) ; chaque passage live de la synchro la retente (`retryArrivalNotices`), même
 *   anti-doublon.
 *
 * Ce fichier : la règle pure (`arrivalNoticeTriggers`, `departureBefore`, `arrivalNoticeMessage`)
 * et l'envoi, dont les lectures et écritures sont passées en argument.
 */

/** Réservée moins de 48 h avant le jour d'arrivée : « dernière minute ». */
export const LATE_BOOKING_HOURS = 48;

/** Ce que la notification lit d'une réservation (forme Beds24, horaires convenus joints). */
export interface NoticeBooking {
  id: number;
  arrival: string;
  departure: string;
  status?: string | null;
  firstName?: string | null;
  bookingTime?: string | null;
  numAdult?: number | null;
  numChild?: number | null;
  /** Heure de départ convenue, s'il y en a une (sinon 11 h). */
  departureHour?: number;
}

export type NoticeReason = "late-booking" | "arrival-moved";

export interface NoticeTrigger {
  bookingId: number;
  /** Jour d'arrivée, « YYYY-MM-DD » : fait partie de la clé anti-doublon. */
  arrival: string;
  reason: NoticeReason;
  when: "today" | "tomorrow";
}

/** Le jour, à Paris, d'un instant ISO. */
function parisDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(iso),
  );
}

/**
 * Les arrivées à signaler, à partir des actions **exécutées avec succès** par la synchro.
 * `auths` : les codes de la serrure lus **avant** le passage (pour l'ancienne fenêtre d'un code
 * recalé). Une réservation n'est signalée qu'une fois par passage.
 */
export function arrivalNoticeTriggers(input: {
  executed: readonly AccessAction[];
  auths: readonly NukiAuth[];
  bookings: readonly NoticeBooking[];
  today: string;
}): NoticeTrigger[] {
  const tomorrow = addDays(input.today, 1);
  const byId = new Map(input.bookings.map((b) => [b.id, b]));
  const out = new Map<number, NoticeTrigger>();
  for (const action of input.executed) {
    const b = byId.get(action.bookingId);
    if (!b || out.has(b.id)) continue;
    const when = b.arrival === input.today ? "today" : b.arrival === tomorrow ? "tomorrow" : null;
    if (!when) continue;
    let reason: NoticeReason | null = null;
    if (action.kind === "create") {
      if (isLateBooking({ arrival: b.arrival, bookingTime: b.bookingTime ?? "" }, LATE_BOOKING_HOURS)) reason = "late-booking";
    } else if (action.kind === "update" && action.reasons.includes("window")) {
      const previous = input.auths.find((a) => a.id === action.authId)?.allowedFromDate;
      if (previous && parisDay(previous) !== parisDay(action.allowedFromDate)) reason = "arrival-moved";
    }
    if (reason) out.set(b.id, { bookingId: b.id, arrival: b.arrival, reason, when });
  }
  return [...out.values()];
}

/**
 * Le départ qui précède cette arrivée, parmi les séjours vendus autres que celui-ci :
 * - `upcoming` : un départ pas encore passé (plus tard aujourd'hui, ou d'ici le jour d'arrivée —
 *   rotation) ; le plus proche de l'arrivée ;
 * - `past` : sinon, le dernier départ **déjà passé** (jour ≤ aujourd'hui, heure passée) ;
 * - `none` : aucun départ dans les réservations lues ;
 * - `unreadable` : les réservations passées n'ont pas pu être lues (`pastReadable` faux) et aucun
 *   départ à venir n'est connu.
 */
export type DepartureInfo =
  | { kind: "past"; day: string }
  | { kind: "upcoming"; day: string }
  | { kind: "none" }
  | { kind: "unreadable" };

export function departureBefore(
  bookings: readonly NoticeBooking[],
  stay: { id: number; arrival: string },
  now: Date,
  today: string,
  pastReadable = true,
): DepartureInfo {
  let past: string | null = null;
  let upcoming: string | null = null;
  for (const b of bookings) {
    if (b.id === stay.id || !countsAsSold(b.status) || b.departure > stay.arrival) continue;
    const passed = b.departure < today || (b.departure === today && now.getTime() >= parisInstant(today, b.departureHour ?? 11).getTime());
    if (passed) {
      if (past === null || b.departure > past) past = b.departure;
    } else if (upcoming === null || b.departure > upcoming) {
      upcoming = b.departure;
    }
  }
  if (upcoming !== null) return { kind: "upcoming", day: upcoming };
  if (!pastReadable) return { kind: "unreadable" };
  return past !== null ? { kind: "past", day: past } : { kind: "none" };
}

/** Un passage enregistré dans le registre du ménage (`loadSessions`, `lib/cleaning/store.ts`). */
export interface CleaningVisit {
  who: string;
  arrival: Date;
}

const ddmm = (d: Date) =>
  d.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit" });
const ddmmOfDay = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
function hhmm(d: Date): string {
  const [h, m] = d
    .toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false })
    .split(":");
  return `${Number(h)} h ${m}`;
}

export interface ArrivalNotice {
  title: string;
  body: string;
  priority: 2 | 4;
  /** Titre noté dans le journal des notifications : sans prénom. */
  logTitle: string;
}

/**
 * Le texte et la priorité d'une notification. `cleanings` : le registre (`null` s'il n'a pas pu
 * être lu) ; `cleaners` : les personnes au rôle ménage ; `night` : 22 h – 8 h à l'heure du passage.
 */
export function arrivalNoticeMessage(input: {
  trigger: NoticeTrigger;
  booking: NoticeBooking;
  departure: DepartureInfo;
  cleanings: readonly CleaningVisit[] | null;
  cleaners: readonly string[];
  now: Date;
  night: boolean;
}): ArrivalNotice {
  const { trigger, booking, departure, now } = input;
  const guests = (booking.numAdult ?? 0) + (booking.numChild ?? 0);
  const what = trigger.reason === "late-booking" ? "réservation de dernière minute" : "date d'arrivée modifiée";
  const head = `Arrivée ${trigger.when === "today" ? "ce soir" : "demain"} — ${what}${guests > 0 ? `, ${guests} voyageur${guests > 1 ? "s" : ""}` : ""}.`;

  const cleaners = new Set(input.cleaners.map((c) => c.trim().toLowerCase()).filter(Boolean));
  let last: CleaningVisit | null = null;
  for (const c of input.cleanings ?? []) {
    const t = c.arrival.getTime();
    if (!cleaners.has(c.who.trim().toLowerCase()) || t > now.getTime()) continue;
    if (last === null || t > last.arrival.getTime()) last = c;
  }
  const lastText = last ? `Dernier ménage enregistré : ${last.who}, ${ddmm(last.arrival)} ${hhmm(last.arrival)}` : null;

  let cleaning: string;
  // Un ménage n'est annoncé « depuis le dernier départ » que si ce départ est connu et passé.
  let cleanedSinceDeparture = false;
  if (input.cleanings === null) {
    cleaning = "Registre du ménage illisible";
  } else if (departure.kind === "past") {
    cleanedSinceDeparture = last !== null && last.arrival.getTime() >= parisInstant(departure.day, 0).getTime();
    cleaning = cleanedSinceDeparture ? lastText! : "Aucun ménage enregistré depuis le dernier départ";
  } else {
    cleaning = lastText ?? "Aucun ménage enregistré";
  }
  const departureText =
    departure.kind === "past"
      ? ` (dernier départ : ${ddmmOfDay(departure.day)})`
      : departure.kind === "upcoming"
        ? ` ; départ prévu le ${ddmmOfDay(departure.day)}`
        : departure.kind === "unreadable"
          ? " ; dernier départ inconnu (lecture impossible)"
          : " ; aucun départ enregistré sur les 60 derniers jours";

  const priority: 2 | 4 = input.night && trigger.when === "tomorrow" ? 2 : cleanedSinceDeparture ? 2 : 4;
  const first = (booking.firstName ?? "").trim().split(/\s+/)[0] || "Voyageur";
  return {
    title: `Arrivée imminente — ${first}`,
    body: `${head}\n${cleaning}${departureText}.`,
    priority,
    logTitle: "Arrivée imminente",
  };
}

/** Clé anti-doublon : une notification par réservation et par jour d'arrivée. */
export const noticeKeyParts = (t: Pick<NoticeTrigger, "bookingId" | "arrival">) => ["arrival-notice", t.bookingId, t.arrival] as const;
/** Clé de la file des envois ratés, une par réservation et jour d'arrivée. */
export const retryKeyParts = (t: Pick<NoticeTrigger, "bookingId" | "arrival">) =>
  ["arrival-notice", "retry", t.bookingId, t.arrival] as const;

const CLAIM_SECONDS = 10 * 60;
const SENT_SECONDS = 7 * 24 * 3600;

/** Une notification en attente de renvoi. */
interface PendingNotice extends ArrivalNotice {
  bookingId: number;
  arrival: string;
}

export interface NoticeDeps {
  /** Clé anti-doublon complète (`redisKey(...noticeKeyParts(t))`). */
  key: (t: Pick<NoticeTrigger, "bookingId" | "arrival">) => string;
  /** Clé de file complète (`redisKey(...retryKeyParts(t))`). */
  retryKey: (t: Pick<NoticeTrigger, "bookingId" | "arrival">) => string;
  /** `SET` Redis : rend une valeur non nulle si posé (avec `nx`, `null` si la clé existe déjà). */
  set: (key: string, value: string, options: { nx?: boolean; ex: number }) => Promise<unknown>;
  get: (key: string) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  /** Les clés de la file (`SCAN` sur `barbusse:arrival-notice:retry:*`). */
  listRetryKeys: () => Promise<string[]>;
  /** Réservations de la maison avant l'arrivée (lecture de plus : la synchro ne lit que depuis la veille). */
  loadPastBookings: () => Promise<readonly NoticeBooking[]>;
  loadCleanings: () => Promise<readonly CleaningVisit[]>;
  cleaners: readonly string[];
  send: (body: string, options: { title: string; priority: 2 | 4; tags: string[] }, log: { title: string }) => Promise<void>;
  now: Date;
  today: string;
  night: boolean;
}

/** Secondes jusqu'à la fin du lendemain du jour d'arrivée (au moins une minute). */
function retrySeconds(arrival: string, now: Date): number {
  return Math.max(60, Math.ceil((parisInstant(addDays(arrival, 2), 0).getTime() - now.getTime()) / 1000));
}

/**
 * Un envoi sous anti-doublon : clé prise en `SET NX` (courte), envoi, clé posée 7 jours. Rend
 * `sent`, `duplicate` (déjà envoyée), ou `failed` (clé retirée). Lève si Redis est injoignable
 * avant l'envoi.
 */
async function sendOnce(notice: PendingNotice, deps: NoticeDeps): Promise<"sent" | "duplicate" | "failed"> {
  const key = deps.key(notice);
  if (!(await deps.set(key, "pending", { nx: true, ex: CLAIM_SECONDS }))) return "duplicate";
  try {
    await deps.send(notice.body, { title: notice.title, priority: notice.priority, tags: ["house"] }, { title: notice.logTitle });
  } catch (e) {
    console.error("[arrival-notice] envoi raté :", e instanceof Error ? e.message : e);
    await deps.del(key).catch(() => {});
    return "failed";
  }
  await deps.set(key, "sent", { ex: SENT_SECONDS }).catch(() => {});
  return "sent";
}

/** Met une notification en file pour le passage suivant (jusqu'au lendemain de l'arrivée). */
async function enqueue(notice: PendingNotice, deps: NoticeDeps): Promise<void> {
  await deps
    .set(deps.retryKey(notice), JSON.stringify(notice), { ex: retrySeconds(notice.arrival, deps.now) })
    .catch((e) => console.error("[arrival-notice] mise en file impossible :", e instanceof Error ? e.message : e));
}

/**
 * Envoie les notifications d'arrivée imminente. Redis injoignable ou clé déjà là : rien n'est
 * envoyé. Envoi raté : clé retirée et notification mise en file. Rend le nombre de notifications
 * envoyées ; ne lève pas.
 */
export async function sendArrivalNotices(
  triggers: readonly NoticeTrigger[],
  bookings: readonly NoticeBooking[],
  deps: NoticeDeps,
): Promise<number> {
  if (triggers.length === 0) return 0;
  let past: readonly NoticeBooking[] | null | undefined;
  let cleanings: readonly CleaningVisit[] | null | undefined;
  let sent = 0;
  for (const trigger of triggers) {
    const booking = bookings.find((b) => b.id === trigger.bookingId);
    if (!booking) continue;
    // Déjà envoyée ? (lecture seule ; l'anti-doublon reste le `SET NX` de `sendOnce`).
    try {
      if (await deps.get(deps.key(trigger))) continue;
    } catch (e) {
      console.error("[arrival-notice] Redis injoignable, rien n'est envoyé :", e instanceof Error ? e.message : e);
      return sent;
    }
    if (past === undefined) {
      past = await deps.loadPastBookings().catch((e) => {
        console.error("[arrival-notice] réservations passées illisibles :", e instanceof Error ? e.message : e);
        return null;
      });
    }
    if (cleanings === undefined) {
      cleanings = await deps.loadCleanings().catch((e) => {
        console.error("[arrival-notice] registre du ménage illisible :", e instanceof Error ? e.message : e);
        return null;
      });
    }
    const all = new Map([...(past ?? []), ...bookings].map((b) => [b.id, b]));
    const notice = arrivalNoticeMessage({
      trigger,
      booking,
      departure: departureBefore([...all.values()], booking, deps.now, deps.today, past !== null),
      cleanings,
      cleaners: deps.cleaners,
      now: deps.now,
      night: deps.night,
    });
    const pending: PendingNotice = { ...notice, bookingId: trigger.bookingId, arrival: trigger.arrival };
    let outcome: "sent" | "duplicate" | "failed";
    try {
      outcome = await sendOnce(pending, deps);
    } catch (e) {
      console.error("[arrival-notice] Redis injoignable, rien n'est envoyé :", e instanceof Error ? e.message : e);
      return sent;
    }
    if (outcome === "sent") sent++;
    if (outcome === "failed") await enqueue(pending, deps);
  }
  return sent;
}

/**
 * Retente la file des envois ratés, à chaque passage live de la synchro. Une notification déjà
 * partie entre-temps (clé anti-doublon posée) est retirée de la file sans renvoi. Rend le nombre
 * d'envois ; ne lève pas.
 */
export async function retryArrivalNotices(deps: NoticeDeps): Promise<number> {
  let sent = 0;
  try {
    for (const retryKey of await deps.listRetryKeys()) {
      const raw = await deps.get(retryKey);
      let notice: PendingNotice | null = null;
      try {
        notice = (typeof raw === "string" ? JSON.parse(raw) : raw) as PendingNotice | null;
      } catch {
        notice = null;
      }
      if (!notice || typeof notice.bookingId !== "number" || typeof notice.arrival !== "string" || typeof notice.body !== "string") {
        await deps.del(retryKey);
        continue;
      }
      const outcome = await sendOnce(notice, deps);
      if (outcome === "sent") sent++;
      if (outcome !== "failed") await deps.del(retryKey);
    }
  } catch (e) {
    console.error("[arrival-notice] file des renvois :", e instanceof Error ? e.message : e);
  }
  return sent;
}
