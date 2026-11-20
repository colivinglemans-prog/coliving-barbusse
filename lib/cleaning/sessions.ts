import { managedBookingId } from "@sejour/socle/lib/access-codes";
import type { KeypadOpening } from "./intratone";

/**
 * Logique pure du suivi des intervenants de la maison (ménage Sophie, dépannage Eric…) :
 * fusionner leurs arrivées (garage Intratone + porte Nuki), détecter les nouvelles depuis le
 * dernier passage, et estimer la fin d'une visite.
 *
 * Les ouvertures du garage ne tracent que les **entrées** (pas les sorties par le bouton
 * poussoir intérieur). La fin d'une visite est donc **estimée**, pas mesurée : on prend le
 * dernier signe de présence dans une fenêtre après l'arrivée — dernier mouvement caméra, ou à
 * défaut un appui bouton poussoir. C'est un repère pour recouper une facture, pas un pointage.
 */

export type ArrivalSource = "garage" | "porte";

/** Une personne suivie : le nom tel qu'écrit sur le code, et un rôle d'affichage. */
export interface TrackedPerson {
  name: string;
  role: string;
}

export interface CleaningArrival {
  source: ArrivalSource;
  at: Date;
  /** Nom de la personne (libellé du code / du badge). */
  who: string;
}

export interface CleaningSession {
  who: string;
  arrival: Date;
  /** Fin estimée (dernier mouvement/BP dans la fenêtre), ou null si inconnue. */
  exitEstimate: Date | null;
  /** Comment la fin a été estimée. */
  exitBy: "camera" | "bouton" | "inconnu";
  arrivalSource: ArrivalSource;
  /** Durée estimée en minutes, ou null. */
  minutes: number | null;
}

/** Deux passages de la même personne à moins de 45 min = une venue (aussi la règle du magasin). */
export const SAME_VISIT_GAP_MS = 45 * 60 * 1000;
const MAX_VISIT_MS = 8 * 60 * 60 * 1000; // on ne cherche pas une sortie au-delà de 8 h

/**
 * Les ouvertures du garage dont le libellé correspond à l'une des personnes suivies. Rend le
 * nom **canonique** (celui de `people`), pas le libellé brut du code.
 */
export function trackedOpenings(openings: KeypadOpening[], people: TrackedPerson[]): CleaningArrival[] {
  const out: CleaningArrival[] = [];
  for (const o of openings) {
    const who = matchPerson(o.name, people);
    if (who) out.push({ source: "garage", at: o.at, who });
  }
  return out;
}

/**
 * Les passages de la porte (journal Nuki) faits avec le code **manuel** d'une personne suivie
 * (« # Sophie »…) : clavier (`trigger` 255), réussis (`state` 0).
 *
 * Un code **géré** (« <n° de réservation>: <Prénom> », `managedBookingId` du socle) est celui
 * d'un séjour : une voyageuse prénommée Sophie n'est pas le ménage. Il est exclu avant la
 * recherche du nom.
 */
export function doorLogArrivals(
  log: readonly { trigger: number; state?: number; name?: string | null; date: string }[],
  people: TrackedPerson[],
): CleaningArrival[] {
  const out: CleaningArrival[] = [];
  for (const e of log) {
    if (e.trigger !== 255 || e.state !== 0) continue;
    const name = e.name ?? "";
    if (managedBookingId(name) !== null) continue;
    const who = matchPerson(name, people);
    if (who) out.push({ source: "porte", at: new Date(e.date), who });
  }
  return out;
}

/** Une entrée au clavier par le code géré d'un séjour : le n° de réservation et l'instant. */
export interface GuestKeypadCode {
  bookingId: number;
  at: Date;
}

/**
 * Les entrées au clavier par un code **géré** (« <n° résa>: <Prénom> »), réussies, lues dans le
 * même journal que `doorLogArrivals`. Brutes : partants comme arrivants. `guestKeypadEntries`
 * n'en garde que les arrivants.
 */
export function guestKeypadCodes(
  log: readonly { trigger: number; state?: number; name?: string | null; date: string }[],
): GuestKeypadCode[] {
  const out: GuestKeypadCode[] = [];
  for (const e of log) {
    if (e.trigger !== 255 || e.state !== 0) continue;
    const bookingId = managedBookingId(e.name ?? "");
    if (bookingId !== null) out.push({ bookingId, at: new Date(e.date) });
  }
  return out;
}

const PARIS_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });

/** « YYYY-MM-DD » de l'instant, heure de Paris. */
export function parisDayOf(d: Date): string {
  return PARIS_DAY.format(d);
}

/**
 * Les entrées des **voyageurs qui arrivent** : code géré d'une réservation dont l'arrivée
 * (`arrivalDays`, n° → « YYYY-MM-DD ») est le jour même de l'entrée, heure de Paris. Un jour de
 * rotation, les voyageurs qui arrivent à 17 h bougent devant les caméras : sans cette borne, leur
 * arrivée devenait l'heure de sortie du ménage (audit du 15/11, heures et coût surestimés).
 *
 * Le code d'un **partant** ne borne rien (2026-11-20) : un voyageur qui revient chercher un
 * chargeur après l'arrivée du ménage tronquait sa sortie, voire l'annulait. Un code dont la
 * réservation est inconnue de `arrivalDays` (hors fenêtre, annulée) ne borne rien non plus.
 */
export function guestKeypadEntries(
  codes: readonly GuestKeypadCode[],
  arrivalDays: ReadonlyMap<number, string>,
): Date[] {
  return codes.filter((c) => arrivalDays.get(c.bookingId) === parisDayOf(c.at)).map((c) => c.at);
}

/**
 * Les ouvertures du garage par un code **nommé** : les voyageurs n'ont pas de code garage, donc
 * tout code nommé est celui d'une personne de la maison. Un code donné un jour à un groupe
 * (motos) se nomme avec le numéro de réservation : il est exclu (`managedBookingId`).
 */
export function namedOpenings(openings: readonly KeypadOpening[]): Array<{ at: Date; who: string }> {
  return openings
    .map((o) => ({ at: o.at, who: o.name.trim() }))
    .filter((o) => o.who !== "" && managedBookingId(o.who) === null);
}

/** Une ligne du journal de la serrure, telle que la lisent les fonctions de ce module. */
export interface DoorLogLine {
  trigger: number;
  state?: number;
  action?: number;
  name?: string | null;
  date: string;
}

/**
 * Les arrivées des **autres codes perso** (2026-11-18, demande de l'hôte : « une alerte pour
 * m'indiquer l'arrivée de tous les codes perso ») — ceux des personnes qui ne sont pas suivies :
 * - garage : tout code Intratone **nommé** (`namedOpenings`), hors codes de réservation ;
 * - porte : tout code Nuki **manuel** « # Nom » (convention des codes saisis à la main), ouverture
 *   réussie au clavier (`openingActions`, ceux du socle) ; les codes des séjours
 *   (« <n° résa>: Prénom ») ne commencent pas par « # » et sont de toute façon écartés.
 * Les personnes suivies (`TRACKED_PEOPLE`) ont déjà leur alerte : elles ne sont pas reprises ici.
 * Ces arrivées n'entrent **pas** dans le journal des intervenants (page « Suivi », heures, coût).
 */
export function personalGarageArrivals(openings: readonly KeypadOpening[], people: TrackedPerson[]): CleaningArrival[] {
  return namedOpenings(openings)
    .filter((o) => !matchPerson(o.who, people))
    .map((o) => ({ source: "garage" as const, at: o.at, who: o.who }));
}

/** Voir `personalGarageArrivals` : la moitié « porte ». */
export function personalDoorArrivals(
  log: readonly DoorLogLine[],
  people: TrackedPerson[],
  openingActions: ReadonlySet<number>,
): CleaningArrival[] {
  const out: CleaningArrival[] = [];
  for (const e of log) {
    if (e.trigger !== 255 || e.state !== 0) continue;
    if (e.action !== undefined && !openingActions.has(e.action)) continue;
    const label = (e.name ?? "").trim();
    if (!label.startsWith("#") || managedBookingId(label) !== null || matchPerson(label, people)) continue;
    const who = label.replace(/^#\s*/, "").trim();
    if (who) out.push({ source: "porte", at: new Date(e.date), who });
  }
  return out;
}

/** Ligne de base de l'alerte des codes perso, **par source** : instant (ms) du dernier code vu. */
export type PersonalBaseline = Partial<Record<ArrivalSource, number>>;

/**
 * Clé de dédoublonnage d'un nom de code perso : casse, accents, « # » et espaces ignorés.
 * « ALEXANDRE » au garage et « # Alexandre » à la porte sont la même personne.
 */
export function personalKey(who: string): string {
  return who
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^\s*#\s*/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Une venue d'un code perso : ses arrivées, de la plus ancienne à la plus récente (la 1re l'ouvre). */
export type PersonalVenue = CleaningArrival[];

/** Au-delà de 3 h, une venue n'est plus signalée seule : elle entre dans un résumé (panne longue). */
export const PERSONAL_MAX_AGE_MS = 3 * 3600_000;

/**
 * Les venues des codes perso à signaler : une par venue (même personne au sens de `personalKey`,
 * arrivées à moins de 45 min de la première de la venue, garage et porte confondus).
 *
 * Une venue est **nouvelle** si aucune de ses arrivées n'a déjà été vue, c'est-à-dire si chacune
 * est postérieure à la ligne de base de **sa** source. Une source sans ligne de base (premier
 * passage, ou source illisible jusqu'ici) ou illisible à ce passage (`readable`) ne signale rien :
 * ses arrivées restent à venir, la ligne de base de cette source ne bougeant pas.
 *
 * `recent` : venues ouvertes il y a moins de 3 h (`PERSONAL_MAX_AGE_MS`), une alerte chacune ;
 * `stale` : les plus anciennes (retour d'une panne longue), un seul résumé. Ordre chronologique.
 */
export function freshPersonalVenues(
  arrivals: readonly CleaningArrival[],
  baseline: PersonalBaseline,
  readable: Readonly<Record<ArrivalSource, boolean>>,
  now: Date,
): { recent: PersonalVenue[]; stale: PersonalVenue[] } {
  const venues: PersonalVenue[] = [];
  const openByPerson = new Map<string, PersonalVenue>();
  for (const a of [...arrivals].sort((x, y) => x.at.getTime() - y.at.getTime())) {
    const key = personalKey(a.who);
    const open = openByPerson.get(key);
    if (open && a.at.getTime() - open[0].at.getTime() < SAME_VISIT_GAP_MS) {
      open.push(a);
      continue;
    }
    const venue = [a];
    openByPerson.set(key, venue);
    venues.push(venue);
  }
  const unseen = (a: CleaningArrival) => {
    const base = baseline[a.source];
    return readable[a.source] && base !== undefined && a.at.getTime() > base;
  };
  const fresh = venues.filter((v) => v.every(unseen));
  const isRecent = (v: PersonalVenue) => now.getTime() - v[0].at.getTime() < PERSONAL_MAX_AGE_MS;
  return { recent: fresh.filter(isRecent), stale: fresh.filter((v) => !isRecent(v)) };
}

/**
 * La ligne de base une fois `sent` signalées (à écrire **après chaque envoi réussi**) : la venue
 * est marquée vue en avançant la source de son arrivée d'ouverture jusqu'à elle — sans dépasser
 * une arrivée des venues encore à envoyer (`pending`), qui resterait sinon perdue si le passage
 * s'interrompt. Ne recule jamais.
 */
export function coverPersonalVenues(
  baseline: PersonalBaseline,
  sent: readonly PersonalVenue[],
  pending: readonly PersonalVenue[],
): PersonalBaseline {
  const next: PersonalBaseline = { ...baseline };
  for (const v of sent) {
    const first = v[0];
    const prev = next[first.source];
    if (prev === undefined) continue;
    const cap = pending
      .flat()
      .filter((a) => a.source === first.source)
      .reduce((min, a) => Math.min(min, a.at.getTime() - 1), Infinity);
    next[first.source] = Math.max(prev, Math.min(first.at.getTime(), cap));
  }
  return next;
}

/** Lit la ligne de base stockée ; rend `null` si elle est illisible (à reposer, sans rafale). */
export function parsePersonalBaseline(stored: unknown): PersonalBaseline | null {
  let value = stored;
  if (value === null || value === undefined) return {};
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const out: PersonalBaseline = {};
  for (const source of ["garage", "porte"] as const) {
    const v = (value as Record<string, unknown>)[source];
    if (v === undefined) continue;
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    out[source] = v;
  }
  return out;
}

/**
 * La ligne de base après ce passage : chaque source **lisible** avance jusqu'à son dernier code vu
 * (ou `now` à sa première lecture sans code) ; une source illisible garde la sienne, telle quelle.
 */
export function advancePersonalBaseline(
  arrivals: readonly CleaningArrival[],
  baseline: PersonalBaseline,
  readable: Readonly<Record<ArrivalSource, boolean>>,
  now: Date,
): PersonalBaseline {
  const next: PersonalBaseline = { ...baseline };
  for (const source of ["garage", "porte"] as const) {
    if (!readable[source]) continue;
    const seen = maxArrivalMs(arrivals.filter((a) => a.source === source), 0);
    const prev = baseline[source];
    next[source] = prev === undefined ? (seen > 0 ? seen : now.getTime()) : Math.max(prev, seen);
  }
  return next;
}

/** Le nom canonique d'une personne suivie dont le libellé du code contient le nom, sinon null. */
export function matchPerson(label: string, people: TrackedPerson[]): string | null {
  const l = label.toLowerCase();
  const found = people.find((p) => l.includes(p.name.toLowerCase()));
  return found ? found.name : null;
}

/** Fusionne les arrivées des deux sources, triées de la plus ancienne à la plus récente. */
export function mergeArrivals(garage: CleaningArrival[], door: CleaningArrival[]): CleaningArrival[] {
  return [...garage, ...door].sort((a, b) => a.at.getTime() - b.at.getTime());
}

/**
 * Les arrivées strictement postérieures à `lastMs`, en **dédoublonnant par personne** les
 * venues séparées de moins de 45 min (le garage et la porte, ou deux passages, pour une même
 * venue de la même personne).
 */
export function newArrivalsSince(arrivals: CleaningArrival[], lastMs: number): CleaningArrival[] {
  const fresh: CleaningArrival[] = [];
  const lastByPerson = new Map<string, number>();
  for (const a of arrivals) {
    if (a.at.getTime() <= lastMs) continue;
    const prev = lastByPerson.get(a.who);
    if (prev !== undefined && a.at.getTime() - prev < SAME_VISIT_GAP_MS) continue;
    lastByPerson.set(a.who, a.at.getTime());
    fresh.push(a);
  }
  return fresh;
}

/** Le plus grand instant (ms) d'une liste d'arrivées, ou `fallback` si vide. */
export function maxArrivalMs(arrivals: CleaningArrival[], fallback: number): number {
  return arrivals.reduce((max, a) => Math.max(max, a.at.getTime()), fallback);
}

/**
 * Estime la fin d'une visite à partir des signes de présence postérieurs à l'arrivée et dans la
 * fenêtre de 8 h : dernier mouvement caméra en priorité, sinon dernier appui bouton poussoir.
 * La fenêtre s'arrête **avant** la première entrée au clavier d'un voyageur **qui arrive** ce
 * jour-là, après l'arrivée (`guestKeypadEntries`) : ce qui bouge ensuite, ce sont les voyageurs.
 */
export function estimateExit(
  arrival: Date,
  cameraMotions: Date[],
  buttonPresses: Date[],
  guestEntries: Date[] = [],
): { exit: Date | null; by: CleaningSession["exitBy"] } {
  const start = arrival.getTime();
  const firstGuest = guestEntries.map((d) => d.getTime()).filter((t) => t > start).sort((a, b) => a - b)[0];
  const inWindow = (d: Date) =>
    d.getTime() > start && d.getTime() <= start + MAX_VISIT_MS && (firstGuest === undefined || d.getTime() < firstGuest);
  const lastMotion = latest(cameraMotions.filter(inWindow));
  if (lastMotion) return { exit: lastMotion, by: "camera" };
  const lastButton = latest(buttonPresses.filter(inWindow));
  if (lastButton) return { exit: lastButton, by: "bouton" };
  return { exit: null, by: "inconnu" };
}

/** Construit les sessions (arrivée + fin estimée + durée) pour une liste d'arrivées. */
export function buildSessions(
  arrivals: CleaningArrival[],
  cameraMotions: Date[],
  buttonPresses: Date[],
  guestEntries: Date[] = [],
): CleaningSession[] {
  return arrivals.map((a) => {
    const { exit, by } = estimateExit(a.at, cameraMotions, buttonPresses, guestEntries);
    const minutes = exit ? Math.round((exit.getTime() - a.at.getTime()) / 60000) : null;
    return { who: a.who, arrival: a.at, exitEstimate: exit, exitBy: by, arrivalSource: a.source, minutes };
  });
}

/**
 * Fusionne les sessions d'une même venue (même personne, arrivées à moins de 45 min l'une de
 * l'autre, comme `newArrivalsSince`) : l'arrivée la plus tôt, la sortie la plus tardive. Le
 * magasin a pu en garder deux quand une source manquait à un passage (garage 9 h 20 seul, après
 * porte 9 h 00 : clé `who:arrivée` différente, passage compté deux fois — audit du 15/11).
 * Rend les sessions de la plus récente à la plus ancienne.
 */
export function collapseVisits(sessions: CleaningSession[]): CleaningSession[] {
  const kept: CleaningSession[] = [];
  const lastByPerson = new Map<string, CleaningSession>();
  for (const s of [...sessions].sort((a, b) => a.arrival.getTime() - b.arrival.getTime())) {
    const prev = lastByPerson.get(s.who);
    if (prev && s.arrival.getTime() - prev.arrival.getTime() < SAME_VISIT_GAP_MS) {
      const exits = [prev.exitEstimate, s.exitEstimate].filter((d): d is Date => d !== null);
      const exit = latest(exits);
      if (exit && exit !== prev.exitEstimate) {
        prev.exitEstimate = exit;
        prev.exitBy = s.exitBy;
      }
      prev.minutes = prev.exitEstimate ? Math.round((prev.exitEstimate.getTime() - prev.arrival.getTime()) / 60000) : null;
      continue;
    }
    const copy = { ...s };
    lastByPerson.set(s.who, copy);
    kept.push(copy);
  }
  return kept.sort((a, b) => b.arrival.getTime() - a.arrival.getTime());
}

/** Bilan d'une personne sur l'ensemble des sessions. */
export interface PersonSummary {
  who: string;
  role: string;
  count: number;
  totalMinutes: number;
  /** Nombre de sessions dont la sortie a pu être estimée (donc à durée connue). */
  withDuration: number;
  /** €/h si un taux est défini pour cette personne, sinon null. */
  ratePerHour: number | null;
  /** Coût estimé (taux × heures à durée connue), null si pas de taux. */
  estimatedCost: number | null;
}

/** Totaux par personne. `rates` associe un nom à un €/h (ex. `{Sophie: 21}`). */
export function summarizePeople(
  sessions: CleaningSession[],
  people: TrackedPerson[],
  rates: Record<string, number>,
): PersonSummary[] {
  return people.map((p) => {
    const mine = sessions.filter((s) => s.who === p.name);
    const totalMinutes = mine.reduce((sum, s) => sum + (s.minutes ?? 0), 0);
    const withDuration = mine.filter((s) => s.minutes !== null).length;
    const rate = rates[p.name] ?? null;
    return {
      who: p.name,
      role: p.role,
      count: mine.length,
      totalMinutes,
      withDuration,
      ratePerHour: rate,
      estimatedCost: rate !== null ? Math.round((totalMinutes / 60) * rate * 100) / 100 : null,
    };
  });
}

export interface MonthBucket {
  /** `YYYY-MM` (mois de Paris). */
  month: string;
  /** Nombre de passages par personne. */
  counts: Record<string, number>;
}

/** Passages par mois (de Paris) et par personne, du plus ancien au plus récent. */
export function monthlyBuckets(sessions: CleaningSession[]): MonthBucket[] {
  const byMonth = new Map<string, Record<string, number>>();
  for (const s of sessions) {
    const month = parisMonth(s.arrival);
    const row = byMonth.get(month) ?? {};
    row[s.who] = (row[s.who] ?? 0) + 1;
    byMonth.set(month, row);
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, counts]) => ({ month, counts }));
}

/** `YYYY-MM` dans le fuseau de Paris. */
export function parisMonth(date: Date): string {
  const parts = new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
  }).format(date);
  return parts.slice(0, 7); // "YYYY-MM"
}

/** Parse `"Sophie:21,Eric:0"` en table nom→€/h (ignore les entrées sans nombre valide). */
export function parseRates(spec: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const part of spec.split(",")) {
    const [name, value] = part.split(":").map((s) => s.trim());
    const rate = Number(value);
    if (name && Number.isFinite(rate)) out[name] = rate;
  }
  return out;
}

/** Valeur de `TRACKED_PEOPLE` quand la variable est absente. */
export const DEFAULT_TRACKED_PEOPLE = "Sophie:ménage,Eric:dépannage";

/** Les personnes suivies, lues dans `TRACKED_PEOPLE` (suivi ménage, alerte de porte au départ). */
export function trackedPeople(): TrackedPerson[] {
  return parsePeople(process.env.TRACKED_PEOPLE?.trim() || DEFAULT_TRACKED_PEOPLE);
}

/**
 * Le rôle est-il celui du ménage (« ménage », accents et casse ignorés) ? Un passage de dépannage
 * n'est pas un ménage (notification « arrivée imminente », `lib/arrival-notice.ts`).
 */
export function isCleaningRole(role: string): boolean {
  return role.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase() === "menage";
}

/** Parse `"Sophie:ménage,Eric:dépannage"` (ou juste `"Sophie,Eric"`) en liste de personnes. */
export function parsePeople(spec: string): TrackedPerson[] {
  return spec
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, role] = part.split(":").map((s) => s.trim());
      return { name, role: role || "intervenant" };
    })
    .filter((p) => p.name.length > 0);
}

function latest(dates: Date[]): Date | null {
  if (dates.length === 0) return null;
  return dates.reduce((max, d) => (d.getTime() > max.getTime() ? d : max));
}
