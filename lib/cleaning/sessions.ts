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

const SAME_VISIT_GAP_MS = 45 * 60 * 1000; // deux passages de la même personne à <45 min = une venue
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
 */
export function estimateExit(
  arrival: Date,
  cameraMotions: Date[],
  buttonPresses: Date[],
): { exit: Date | null; by: CleaningSession["exitBy"] } {
  const start = arrival.getTime();
  const end = start + MAX_VISIT_MS;
  const inWindow = (d: Date) => d.getTime() > start && d.getTime() <= end;
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
): CleaningSession[] {
  return arrivals.map((a) => {
    const { exit, by } = estimateExit(a.at, cameraMotions, buttonPresses);
    const minutes = exit ? Math.round((exit.getTime() - a.at.getTime()) / 60000) : null;
    return { who: a.who, arrival: a.at, exitEstimate: exit, exitBy: by, arrivalSource: a.source, minutes };
  });
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
