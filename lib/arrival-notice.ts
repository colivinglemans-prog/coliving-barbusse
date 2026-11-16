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
 *   `TRACKED_PEOPLE` seulement (un dépannage n'est pas un ménage).
 * - **Priorité** : 4 sans ménage enregistré depuis le dernier départ, 2 sinon ; la nuit, 2 pour
 *   une arrivée le lendemain.
 * - **Anti-doublon** : `SET NX` sur `barbusse:arrival-notice:<résa>:<jour d'arrivée>`. Redis
 *   injoignable : rien n'est envoyé (c'est une information, pas une panne).
 *
 * Ce fichier : la règle pure (`arrivalNoticeTriggers`, `arrivalNoticeMessage`) et l'envoi, dont
 * les lectures et écritures sont passées en argument (`sendArrivalNotices`).
 */

/** Réservée moins de 48 h avant le jour d'arrivée : « dernière minute ». */
export const LATE_BOOKING_HOURS = 48;

/** Ce que la notification lit d'une réservation (forme Beds24). */
export interface NoticeBooking {
  id: number;
  arrival: string;
  departure: string;
  status?: string | null;
  firstName?: string | null;
  bookingTime?: string | null;
  numAdult?: number | null;
  numChild?: number | null;
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
 * Le dernier départ avant cette arrivée (jour de l'arrivée compris : rotation), parmi les séjours
 * vendus autres que celui-ci ; `null` s'il n'y en a aucun dans les réservations lues.
 */
export function lastDepartureBefore(bookings: readonly NoticeBooking[], stay: { id: number; arrival: string }): string | null {
  let last: string | null = null;
  for (const b of bookings) {
    if (b.id === stay.id || !countsAsSold(b.status) || b.departure > stay.arrival) continue;
    if (last === null || b.departure > last) last = b.departure;
  }
  return last;
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
  lastDeparture: string | null;
  cleanings: readonly CleaningVisit[] | null;
  cleaners: readonly string[];
  now: Date;
  night: boolean;
}): ArrivalNotice {
  const { trigger, booking, lastDeparture, now } = input;
  const guests = (booking.numAdult ?? 0) + (booking.numChild ?? 0);
  const what = trigger.reason === "late-booking" ? "réservation de dernière minute" : "date d'arrivée modifiée";
  const head = `Arrivée ${trigger.when === "today" ? "ce soir" : "demain"} — ${what}${guests > 0 ? `, ${guests} voyageur${guests > 1 ? "s" : ""}` : ""}.`;

  const cleaners = new Set(input.cleaners.map((c) => c.trim().toLowerCase()).filter(Boolean));
  const since = lastDeparture === null ? -Infinity : parisInstant(lastDeparture, 0).getTime();
  let last: CleaningVisit | null = null;
  for (const c of input.cleanings ?? []) {
    const t = c.arrival.getTime();
    if (!cleaners.has(c.who.trim().toLowerCase()) || t < since || t > now.getTime()) continue;
    if (last === null || t > last.arrival.getTime()) last = c;
  }
  const departure = lastDeparture === null ? "" : ` (dernier départ : ${ddmmOfDay(lastDeparture)})`;
  const cleaning =
    input.cleanings === null
      ? `Registre du ménage illisible${departure}.`
      : last
        ? `Dernier ménage enregistré : ${last.who}, ${ddmm(last.arrival)} ${hhmm(last.arrival)}${departure}.`
        : `Aucun ménage enregistré depuis le dernier départ${departure}.`;

  const priority: 2 | 4 = input.night && trigger.when === "tomorrow" ? 2 : last ? 2 : 4;
  const first = (booking.firstName ?? "").trim().split(/\s+/)[0] || "Voyageur";
  return { title: `Arrivée imminente — ${first}`, body: `${head}\n${cleaning}`, priority, logTitle: "Arrivée imminente" };
}

/** Clé anti-doublon : une notification par réservation et par jour d'arrivée. */
export const noticeKeyParts = (t: NoticeTrigger) => ["arrival-notice", t.bookingId, t.arrival] as const;

const CLAIM_SECONDS = 10 * 60;
const SENT_SECONDS = 7 * 24 * 3600;

export interface NoticeDeps {
  /** La clé Redis complète (`redisKey`). */
  key: (t: NoticeTrigger) => string;
  /** `SET` Redis : rend une valeur non nulle si posé (avec `nx`, `null` si la clé existe déjà). */
  set: (key: string, value: string, options: { nx?: boolean; ex: number }) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  /** Réservations de la maison avant l'arrivée (lecture de plus : la synchro ne lit que depuis la veille). */
  loadPastBookings: () => Promise<readonly NoticeBooking[]>;
  loadCleanings: () => Promise<readonly CleaningVisit[]>;
  cleaners: readonly string[];
  send: (body: string, options: { title: string; priority: 2 | 4; tags: string[] }, log: { title: string }) => Promise<void>;
  now: Date;
  night: boolean;
}

/**
 * Envoie les notifications d'arrivée imminente. Pour chacune : clé prise en `SET NX` (courte) avant
 * l'envoi — Redis injoignable ou clé déjà là : rien n'est envoyé —, posée pour 7 jours après un
 * envoi réussi, retirée si l'envoi échoue (le passage suivant ne la renverra que si l'action se
 * reproduit). Rend le nombre de notifications envoyées ; ne lève pas.
 */
export async function sendArrivalNotices(
  triggers: readonly NoticeTrigger[],
  bookings: readonly NoticeBooking[],
  deps: NoticeDeps,
): Promise<number> {
  if (triggers.length === 0) return 0;
  let past: readonly NoticeBooking[] | null = null;
  let cleanings: readonly CleaningVisit[] | null | undefined;
  let sent = 0;
  for (const trigger of triggers) {
    const booking = bookings.find((b) => b.id === trigger.bookingId);
    if (!booking) continue;
    const key = deps.key(trigger);
    try {
      if (!(await deps.set(key, "pending", { nx: true, ex: CLAIM_SECONDS }))) continue;
    } catch (e) {
      console.error("[arrival-notice] Redis injoignable, rien n'est envoyé :", e instanceof Error ? e.message : e);
      return sent;
    }
    if (past === null) {
      past = await deps.loadPastBookings().catch((e) => {
        console.error("[arrival-notice] réservations passées illisibles :", e instanceof Error ? e.message : e);
        return [] as NoticeBooking[];
      });
    }
    if (cleanings === undefined) {
      cleanings = await deps.loadCleanings().catch((e) => {
        console.error("[arrival-notice] registre du ménage illisible :", e instanceof Error ? e.message : e);
        return null;
      });
    }
    const all = new Map([...past, ...bookings].map((b) => [b.id, b]));
    const notice = arrivalNoticeMessage({
      trigger,
      booking,
      lastDeparture: lastDepartureBefore([...all.values()], booking),
      cleanings,
      cleaners: deps.cleaners,
      now: deps.now,
      night: deps.night,
    });
    try {
      await deps.send(notice.body, { title: notice.title, priority: notice.priority, tags: ["house"] }, { title: notice.logTitle });
      sent++;
      await deps.set(key, "sent", { ex: SENT_SECONDS }).catch(() => {});
    } catch (e) {
      console.error("[arrival-notice] envoi raté :", e instanceof Error ? e.message : e);
      await deps.del(key).catch(() => {});
    }
  }
  return sent;
}
