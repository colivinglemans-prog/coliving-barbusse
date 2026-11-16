import type { NukiLogEntry } from "@sejour/socle/lib/nuki";
import { isProtectedName, managedBookingId } from "@sejour/socle/lib/access-codes";
import { parisInstant } from "@sejour/socle/lib/time";
import type { TrackedAlert } from "./alert-memory";

/**
 * Le départ des voyageurs, vu par la serrure — **fonctions pures**, état et lectures passés en
 * argument (patron : `powerCutTransition` de `lib/power-cut.ts`).
 *
 * Phase A (2026-11-16) : `departureLockCheck`, l'alerte « serrure non verrouillée après le
 * départ », surveillée jusqu'à la fin de validité du code des partants (complément du
 * 2026-11-16). Phase B y ajoutera la détection du départ réel (présence des radiateurs, journal
 * de la serrure, message du voyageur) et l'état servi par `/api/dashboard/stay-status`.
 */

/**
 * Délai de grâce après l'heure de départ avant le premier relevé qui compte : un groupe qui
 * part avec dix minutes de retard ne doit pas faire sonner le téléphone. Le premier constat est
 * pris au relevé ≥ D + 30 min, l'alerte part au relevé suivant (deux relevés, règle commune), donc
 * vers D + 45 min. Validé par l'hôte le 2026-11-16.
 */
export const DEPARTURE_LOCK_GRACE_MINUTES = 30;

/**
 * Le ménage (ou les voyageurs suivants) peut entrer **avant** l'heure de départ : une prise en
 * main compte dès D − 2 h.
 */
export const REOCCUPY_LOOKBACK_HOURS = 2;

/** Ouvertures réussies : déverrouillage, ouverture (« unlatch »), déverrouillage avec ouverture. */
const OPENING_ACTIONS: ReadonlySet<number> = new Set([1, 3, 5]);
/** `trigger` d'une ligne du journal venue du clavier. */
const KEYPAD_TRIGGER = 255;
/** `trigger` d'une ouverture par l'application ou l'API Nuki. */
const APP_TRIGGER = 0;
/** `state.state` d'une serrure verrouillée. */
export const LOCK_STATE_LOCKED = 1;
/**
 * États de passage ou indéfinis (déverrouillage, verrouillage, ouverture en cours, indéfini) : le
 * relevé ne tranche pas, le suivant le fera (relecture C5).
 */
export const LOCK_STATES_TRANSIENT: ReadonlySet<number> = new Set([2, 4, 7, 255]);

const LOCK_STATE_LABEL: Record<number, string> = {
  2: "en cours de déverrouillage",
  3: "déverrouillée",
  4: "en cours de verrouillage",
  5: "entrebâillée",
  6: "déverrouillée (verrouillage auto)",
  7: "en cours d'ouverture",
  254: "moteur bloqué",
  255: "état indéfini",
};

export interface DepartureLockInput {
  now: Date;
  /** Aujourd'hui à Paris, « YYYY-MM-DD ». */
  today: string;
  /** Séjours vendus qui partent aujourd'hui, avec leur heure de départ (11 h ou convenue). */
  departures: ReadonlyArray<{ bookingId: number; departureHour: number }>;
  /** Séjours qui arrivent aujourd'hui : leur code qui ouvre vaut prise en main. */
  arrivals: ReadonlyArray<{ bookingId: number }>;
  /**
   * E, la fin de validité **réelle** du code des partants (`departingCodesEnd`,
   * `lib/stay-hours-rules.ts`) : la journée n'est close sur « verrouillée » qu'une fois E passé.
   * Absent ou `null` : E = D + délai de grâce, un seul relevé (règle d'avant).
   */
  codeEnd?: Date | null;
  /** `null` : serrure illisible (API Nuki en panne, jeton absent, délai dépassé). */
  lock: { online: boolean; lockState: number | null } | null;
  /**
   * Journal depuis D − 2 h ; `null` s'il n'a pas pu être lu en entier. Pas lu (`undefined`) quand
   * la porte est verrouillée : il n'y a alors rien de plus à conclure.
   */
  log?: readonly NukiLogEntry[] | null;
  /**
   * Ouvertures du garage (Intratone) par un code **nommé** (`garageOpenings`) ; `null` ou absent :
   * non lu (panne, lenteur, pas d'identifiants) — jamais une raison de ne pas conclure.
   */
  garage?: ReadonlyArray<{ who: string; at: Date }> | null;
  /** Personnes suivies (`TRACKED_PEOPLE`), reconnues aux codes « # Sophie »… */
  people: readonly string[];
}

/**
 * - `none` : pas de départ aujourd'hui, ou heure de départ + délai de grâce pas encore passée ;
 * - `unreadable` : serrure hors ligne ou illisible, ou journal illisible — rien n'est conclu ;
 * - `reoccupied` : quelqu'un de la maison (code personnel, au clavier ou au garage) ou les
 *   voyageurs suivants ont pris la main après la dernière ouverture des partants ;
 * - `locked` : porte verrouillée ;
 * - `unlocked` : porte non verrouillée, personne n'a pris la main.
 */
export type DepartureLockStatus = "none" | "unreadable" | "reoccupied" | "locked" | "unlocked";

/** Ce que l'appelant fait de l'état d'alerte `departure-lock`. */
export type DepartureLockReport =
  /** Ne pas toucher à l'état (rien à conclure ce passage). */
  | "skip"
  /** Fermer sans message une alerte ouverte (maison reprise en main, journée finie). */
  | "close-silently"
  /** Règle commune (`reportAlerts`) avec `alerts` : alerte au 2e relevé, « verrouillée » en priorité 1. */
  | "report";

export interface DepartureLockResult {
  status: DepartureLockStatus;
  /** Heure de départ retenue (la plus tardive du jour), `null` sans départ. */
  departureHour: number | null;
  report: DepartureLockReport;
  alerts: TrackedAlert[];
  /**
   * La journée est close : plus aucun relevé jusqu'au lendemain. Vrai pour `reoccupied`, et pour
   * `locked` seulement une fois E passé.
   */
  closesDay?: boolean;
  /** Un voyageur qui part est revenu (son code a ouvert après D) : titre de l'alerte. */
  guestReturned?: boolean;
  /**
   * Alerte distincte « journal illisible, porte non verrouillée » (scope `departure-lock-log`,
   * règle commune) : `undefined` ne touche pas à son état, `[]` le fait avancer sans constat, un
   * élément est un constat (priorité 3).
   */
  journalAlerts?: TrackedAlert[];
  /** Pour le journal du cron et la réponse JSON : jamais de nom de voyageur ni de code. */
  detail: string;
}

/** Heure de départ retenue pour la journée : la plus tardive. */
export function departureDeadlineHour(departures: DepartureLockInput["departures"]): number | null {
  return departures.length > 0 ? Math.max(...departures.map((d) => d.departureHour)) : null;
}

/** Instant à partir duquel un relevé compte : heure de départ + délai de grâce. */
export function departureLockDueAt(today: string, departureHour: number): Date {
  return new Date(parisInstant(today, departureHour).getTime() + DEPARTURE_LOCK_GRACE_MINUTES * 60_000);
}

/**
 * Le nom d'un code est-il celui d'une personne du ménage ? Seulement pour un code **non géré**
 * (pas « <n° de réservation>: <Prénom> ») : un voyageur prénommé comme la personne du ménage
 * n'est pas le ménage.
 */
export function isCleaningCode(name: string | null | undefined, people: readonly string[]): boolean {
  if (!name || managedBookingId(name) !== null) return false;
  return people.some((p) => mentionsPerson(name, p));
}

/** Minuscules, sans accents : « Éric » et « eric » se valent. */
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/**
 * Le libellé contient-il le nom de la personne **en mots entiers** (casse et accents ignorés) ?
 * « # Eric » oui, « Frederic » non (relecture du 2026-11-16 : une sous-chaîne prenait l'un pour
 * l'autre).
 */
export function mentionsPerson(label: string, person: string): boolean {
  const p = fold(person);
  if (p === "") return false;
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, "u").test(fold(label));
}

/**
 * Un **code personnel** du clavier, celui de quelqu'un de la maison : un code protégé (nom qui
 * commence par `#`, `isProtectedName` du socle — l'hôte, le ménage, le dépannage) ou dont le nom
 * contient une personne de `TRACKED_PEOPLE`. Nom non vide. Un code géré (`<n° résa>: …`) n'en est
 * jamais un, ni un code voyageur saisi à la main (sans `#`, absent de `TRACKED_PEOPLE`).
 */
export function isPersonalCode(name: string | null | undefined, people: readonly string[]): boolean {
  if (!name || name.trim() === "" || managedBookingId(name) !== null) return false;
  return isProtectedName(name) || isCleaningCode(name, people);
}

/** Heure de Paris d'un instant, « 12:10 ». */
function parisClock(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Heure (0-23) à Paris d'un instant : l'horloge injectée, jamais celle de la machine. */
export function parisHourOf(d: Date): number {
  return Number(d.toLocaleString("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false })) % 24;
}

const isOpening = (e: NukiLogEntry) => e.state === 0 && OPENING_ACTIONS.has(e.action);

/** Ce que le journal (et le garage) disent depuis D − 2 h. */
export interface DepartureLogReading {
  /** Dernière ouverture par un code des partants dans le journal lu, ou `null`. */
  lastDepartingOpening: number | null;
  /** Une ouverture par un code des partants **après D** : un voyageur est revenu. */
  guestReturned: boolean;
  /** Prise en main de la maison : par quoi, `null` sinon. */
  takeover: "code personnel" | "code personnel (garage)" | "voyageurs suivants" | null;
  /** Dernière ouverture par l'application Nuki depuis D − 2 h (ce n'est pas une prise en main). */
  lastAppOpening: number | null;
}

/**
 * Lecture du journal pour le relevé de la porte. Une **prise en main** est une ouverture par un
 * code personnel (au clavier : `isPersonalCode` ; au garage : tout code nommé, les voyageurs n'en
 * ont pas) ou par le code des voyageurs suivants, **postérieure à la dernière ouverture par un
 * code des partants** et au plus tôt à D − 2 h. L'application Nuki n'en est pas une : on ne
 * distingue pas une ouverture sur place d'une ouverture à distance.
 *
 * Un **retour** est une ouverture par un code des partants après D (à 10 h, quand ils chargent la
 * voiture, ce n'en est pas un). Ce n'est pas une prise en main.
 */
export function readDepartureLog(
  input: Pick<DepartureLockInput, "log" | "garage" | "people" | "departures" | "arrivals" | "today">,
  departureHour: number,
): DepartureLogReading {
  const departureAt = parisInstant(input.today, departureHour).getTime();
  const lookback = departureAt - REOCCUPY_LOOKBACK_HOURS * 3600_000;
  const leaving = new Set(input.departures.map((d) => d.bookingId));
  const coming = new Set(input.arrivals.map((a) => a.bookingId));
  const keypad = (input.log ?? []).filter((e) => isOpening(e) && e.trigger === KEYPAD_TRIGGER);

  let lastDepartingOpening: number | null = null;
  for (const e of keypad) {
    const id = managedBookingId(e.name ?? "");
    if (id !== null && leaving.has(id)) {
      const t = Date.parse(e.date);
      if (lastDepartingOpening === null || t > lastDepartingOpening) lastDepartingOpening = t;
    }
  }
  const guestReturned = lastDepartingOpening !== null && lastDepartingOpening > departureAt;
  const counts = (t: number) => t >= lookback && (lastDepartingOpening === null || t > lastDepartingOpening);

  let takeover: DepartureLogReading["takeover"] = null;
  for (const e of keypad) {
    if (!counts(Date.parse(e.date))) continue;
    if (isPersonalCode(e.name, input.people)) {
      takeover = "code personnel";
      break;
    }
    const id = managedBookingId(e.name ?? "");
    if (id !== null && coming.has(id)) {
      takeover = "voyageurs suivants";
      break;
    }
  }
  if (takeover === null) {
    for (const g of input.garage ?? []) {
      if (g.who.trim() !== "" && managedBookingId(g.who) === null && counts(g.at.getTime())) {
        takeover = "code personnel (garage)";
        break;
      }
    }
  }

  let lastAppOpening: number | null = null;
  for (const e of input.log ?? []) {
    if (!isOpening(e) || e.trigger !== APP_TRIGGER) continue;
    const t = Date.parse(e.date);
    if (t >= lookback && (lastAppOpening === null || t > lastAppOpening)) lastAppOpening = t;
  }
  return { lastDepartingOpening, guestReturned, takeover, lastAppOpening };
}

/**
 * Alerte « serrure non verrouillée après le départ » (priorité 4, 3 la nuit ; scope
 * `departure-lock`).
 *
 * Le jour d'un départ, de l'heure de départ D (11 h, ou la plus tardive des heures convenues du
 * jour) **plus le délai de grâce** jusqu'à E, la fin de validité réelle du code des partants
 * (`codeEnd`), une porte non verrouillée est un constat — l'alerte part au relevé suivant (règle
 * commune des deux relevés). La journée n'est close que :
 * - sur une **prise en main** de la maison (`readDepartureLog`) : aucune alerte ensuite, même porte
 *   ouverte (le ménage), et une alerte ouverte se referme sans message ;
 * - ou sur une porte **verrouillée une fois E passé**. Verrouillée avant E, on continue : un
 *   voyageur peut revenir chercher un oubli et repartir sans fermer.
 *
 * Une porte non verrouillée après E reste surveillée jusqu'au verrouillage ou à la prise en main ;
 * à minuit (plus de départ « aujourd'hui »), l'alerte se referme sans message. Si E ≤ D + 30 min
 * (rotation), le premier relevé est déjà après E : la règle est celle d'un seul relevé.
 *
 * Pas d'alerte si la serrure est hors ligne (c'est l'alerte de la synchronisation). L'identifiant
 * de l'alerte porte le jour : une alerte d'hier ne masque pas celle d'aujourd'hui.
 *
 * **Point d'extension, non fait** (à décider après la mesure du retard d'Intratone) : la parade
 * caméra — pas d'alerte tant qu'un mouvement de la caméra « Porte d'entrée » a été vu dans les
 * 30 dernières minutes après D. Elle se brancherait ici comme une entrée de plus (par exemple
 * `recentMotion?: Date | null`), testée juste avant de rendre `unlocked`, et lue par
 * `runDepartureLockCheck` après le garage, avec son propre délai.
 */
export function departureLockCheck(input: DepartureLockInput): DepartureLockResult {
  const { now, today, departures, lock, log } = input;
  const departureHour = departureDeadlineHour(departures);
  const none = (detail: string): DepartureLockResult => ({
    status: "none",
    departureHour,
    report: "close-silently",
    alerts: [],
    detail,
  });
  if (departureHour === null) return none("pas de départ aujourd'hui");
  const dueAt = departureLockDueAt(today, departureHour);
  if (now.getTime() < dueAt.getTime()) {
    return none(`départ à ${departureHour} h, délai de grâce de ${DEPARTURE_LOCK_GRACE_MINUTES} min pas encore passé`);
  }
  const codeEnd = input.codeEnd ?? dueAt;
  const ended = now.getTime() >= codeEnd.getTime();

  const unreadable = (detail: string): DepartureLockResult => ({ status: "unreadable", departureHour, report: "skip", alerts: [], detail });
  if (lock === null) return unreadable("serrure illisible");
  if (!lock.online) return unreadable("serrure hors ligne (alerte de la synchronisation)");
  if (lock.lockState === null || LOCK_STATES_TRANSIENT.has(lock.lockState)) {
    return unreadable(`serrure dans un état de passage (${lock.lockState === null ? "inconnu" : (LOCK_STATE_LABEL[lock.lockState] ?? lock.lockState)}) : le relevé suivant tranchera`);
  }
  if (lock.lockState === LOCK_STATE_LOCKED) {
    return {
      status: "locked",
      departureHour,
      report: "report",
      alerts: [],
      journalAlerts: [],
      closesDay: ended,
      detail: ended
        ? "porte verrouillée, code des partants expiré : journée close"
        : `porte verrouillée, surveillée jusqu'à ${parisClock(codeEnd)}`,
    };
  }
  if (log === null || log === undefined) {
    // La porte n'est pas verrouillée, mais on ne peut pas savoir si le ménage est entré : alerte
    // distincte, priorité 3, au 2e relevé (relecture C6). L'alerte principale ne bouge pas.
    return {
      ...unreadable("journal de la serrure illisible, porte non verrouillée"),
      journalAlerts: [
        {
          id: `departure-lock-log:${today}`,
          priority: 3,
          line: `Porte non verrouillée après le départ de ${departureHour} h, journal de la serrure illisible : impossible de savoir si le ménage est entré.`,
        },
      ],
    };
  }

  const reading = readDepartureLog(input, departureHour);
  if (reading.takeover) {
    return {
      status: "reoccupied",
      departureHour,
      report: "close-silently",
      alerts: [],
      journalAlerts: [],
      closesDay: true,
      detail: `maison reprise en main (${reading.takeover})`,
    };
  }
  const state =
    lock.lockState === null ? "état inconnu" : (LOCK_STATE_LABEL[lock.lockState] ?? `état ${lock.lockState}`);
  const returned =
    reading.guestReturned && reading.lastDepartingOpening !== null
      ? ` Un voyageur est revenu avec son code à ${parisClock(new Date(reading.lastDepartingOpening))}.`
      : "";
  const app =
    reading.lastAppOpening !== null ? ` Ouverture par l'application à ${parisClock(new Date(reading.lastAppOpening))}.` : "";
  return {
    status: "unlocked",
    departureHour,
    report: "report",
    journalAlerts: [],
    guestReturned: reading.guestReturned,
    alerts: [
      {
        id: `departure-lock:${today}`,
        priority: 4,
        line: `Le départ de ${departureHour} h est passé et la porte d'entrée n'est pas verrouillée (${state}).${returned}${app} Ni le ménage, ni l'hôte, ni les voyageurs suivants n'ont repris la main.`,
      },
    ],
    detail: `porte non verrouillée (${state})${reading.guestReturned ? ", voyageur revenu" : ""}`,
  };
}

/** Titre de l'alerte, pour `reportAlerts`. */
export function departureLockTitle(departureHour: number | null, guestReturned = false): string {
  return guestReturned
    ? "Serrure non verrouillée après le retour d'un voyageur"
    : `Serrure non verrouillée — départ de ${departureHour ?? 11} h dépassé`;
}
