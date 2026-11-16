import { countsAsSold } from "@sejour/socle/lib/booking-status";

/**
 * **Horaires convenus par réservation** : arrivée anticipée, départ tardif (2026-11-16).
 *
 * Le site vend « arrivée anticipée et départ tardif sur demande », mais rien dans le code ne
 * connaissait l'accord : le chauffage se coupait à 10 h le jour du départ, le ballon basculait à
 * 11 h et le code de la serrure cessait d'ouvrir à 14 h — un voyageur sorti après 14 h ne pouvait
 * plus rentrer. Une seule donnée, quatre consommateurs :
 *
 * | Consommateur | Standard | Arrivée convenue A / départ convenu D |
 * |---|---|---|
 * | Chauffage (`lib/heating-schedule.ts`) | occupé 17 h → 10 h, préchauffage 12 h / 15 h | occupé dès A et jusqu'à D, préchauffage A − 5 h / A − 2 h |
 * | Ballon (`countGuests`, `lib/bookings.ts`) | partants jusqu'à 11 h, arrivants dès 11 h | partants jusqu'à D, arrivants dès min(11 h, A − 6 h) |
 * | Code de la serrure (`lib/access-sync.ts`) | 14 h → 14 h | min(14 h, A − 1 h) → max(14 h, D + 1 h) |
 * | Préparation d'arrivée (`arrival-readiness`) | `arrivalTime` de Beds24 | A en `arrivalTime` |
 *
 * Plus les textes des messages voyageurs (`heureArrivee`, `heureDepart`, `lib/messages/engine.ts`).
 *
 * **Redis et non Beds24**, comme `lib/event-links.ts` : la note interne est le seul champ qu'on
 * sache écrire, elle est lue par la personne du ménage, et « dimanche à 16h » en texte libre ne se
 * lit pas par programme. Un hachage `barbusse:stay-hours`, un champ par réservation : deux
 * écritures concurrentes sur deux séjours ne s'écrasent pas (une table JSON unique, relue puis
 * réécrite, l'aurait permis).
 *
 * **Échec ouvert à la lecture** : Redis injoignable ⇒ aucun horaire convenu, donc les heures
 * standard — ce que faisait le site avant. **Échec franc à l'écriture** (la route répond 503) :
 * l'hôte doit savoir que l'accord n'est pas enregistré.
 *
 * Heures **entières**, heure de Paris.
 *
 * Ce module-ci est **pur** (aucun import serveur) : le calendrier du dashboard, côté navigateur,
 * l'importe pour ses sélecteurs et son avertissement de rotation. Les lectures et écritures
 * Redis sont dans `lib/stay-hours.ts`, qui le réexporte.
 */

/** Les heures annoncées par le site et `llms.txt` (« à partir de 17h », « avant 11h »). */
export const STANDARD_HOURS = { arrival: 17, departure: 11 } as const;

/**
 * Bornes saisissables. Une arrivée « anticipée » est avant 17 h ; un départ « tardif » est après
 * 11 h. Une valeur égale à l'heure standard n'est pas un accord : elle se retire (`DELETE`).
 */
export const AGREED_RANGE = {
  // 8 h au plus tôt : c'est aussi `earliestCheckIn` de la préparation d'arrivée
  // (`lib/readiness/config.ts`), qui avance ses contrôles jusque-là et pas avant.
  arrival: { min: 8, max: STANDARD_HOURS.arrival - 1 },
  departure: { min: STANDARD_HOURS.departure + 1, max: 23 },
} as const;

/** Ce qui est stocké pour une réservation : seulement ce qui a été convenu. */
export interface AgreedHours {
  arrivalHour?: number;
  departureHour?: number;
}

/** Réservation → horaires convenus. Les réservations sans accord n'y figurent pas. */
export type StayHoursTable = Readonly<Record<number, AgreedHours>>;

export interface StayHours {
  arrivalHour: number;
  departureHour: number;
  arrivalAgreed: boolean;
  departureAgreed: boolean;
}

/** **La** règle : les heures d'un séjour, valeurs standard sauf accord. */
export function stayHours(bookingId: number, table: StayHoursTable): StayHours {
  const agreed = table[bookingId] ?? {};
  return {
    arrivalHour: agreed.arrivalHour ?? STANDARD_HOURS.arrival,
    departureHour: agreed.departureHour ?? STANDARD_HOURS.departure,
    arrivalAgreed: agreed.arrivalHour !== undefined,
    departureAgreed: agreed.departureHour !== undefined,
  };
}

/**
 * Joint la table aux réservations : chacune reçoit `arrivalHour` / `departureHour` **seulement
 * s'ils ont été convenus**. Une réservation sans accord ressort telle quelle (même objet) : c'est
 * ce qui garantit que tout calcul fait sans horaire convenu reste celui d'avant.
 */
export function withAgreedHours<T>(
  items: readonly T[],
  table: StayHoursTable,
  idOf: (item: T) => number = (item) => (item as { id: number }).id,
): Array<T & AgreedHours> {
  return items.map((item): T & AgreedHours => {
    const agreed = table[idOf(item)];
    // `T` n'a ni `arrivalHour` ni `departureHour` à lui : le rendre tel quel est sûr.
    if (!agreed || (agreed.arrivalHour === undefined && agreed.departureHour === undefined)) return item as T & AgreedHours;
    return {
      ...item,
      ...(agreed.arrivalHour !== undefined ? { arrivalHour: agreed.arrivalHour } : {}),
      ...(agreed.departureHour !== undefined ? { departureHour: agreed.departureHour } : {}),
    };
  });
}

/**
 * Une valeur relue de Redis, réduite à ce qui est valide **selon les mêmes bornes que la saisie**
 * (`validateAgreedHours`, `AGREED_RANGE`), champ par champ ; `null` si rien ne l'est. Une valeur
 * écrite à la main dans Redis hors bornes (un départ à 3 h) est ignorée, pas appliquée.
 */
export function parseAgreedHours(raw: unknown): AgreedHours | null {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const arrival = validateAgreedHours({ arrivalHour: v.arrivalHour });
  const departure = validateAgreedHours({ departureHour: v.departureHour });
  const out: AgreedHours = {
    ...(arrival.ok ? arrival.value : {}),
    ...(departure.ok ? departure.value : {}),
  };
  return out.arrivalHour === undefined && out.departureHour === undefined ? null : out;
}

/**
 * Contrôle d'une saisie (corps de la route d'écriture). `null` ou absent : pas d'accord sur ce
 * point. Rend l'accord à stocker (éventuellement vide : tout retirer) ou un message d'erreur.
 */
export function validateAgreedHours(
  input: unknown,
): { ok: true; value: AgreedHours } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Corps JSON attendu" };
  const body = input as Record<string, unknown>;
  const value: AgreedHours = {};
  const check = (key: "arrivalHour" | "departureHour", range: { min: number; max: number }, label: string) => {
    const v = body[key];
    if (v === undefined || v === null) return null;
    if (typeof v !== "number" || !Number.isInteger(v) || v < range.min || v > range.max) {
      return `${label} : heure entière de ${range.min} à ${range.max} attendue`;
    }
    value[key] = v;
    return null;
  };
  const error =
    check("arrivalHour", AGREED_RANGE.arrival, "Arrivée anticipée") ??
    check("departureHour", AGREED_RANGE.departure, "Départ tardif");
  return error ? { ok: false, error } : { ok: true, value };
}

/** Le séjour voisin d'un jour de rotation, tel que le contrôle le regarde. */
export interface NeighbourStay {
  bookingId: number;
  arrival: string;
  departure: string;
}

/**
 * **La** définition des voisins de rotation, commune à la popup, à la route d'écriture et à la
 * synchro : séjours **vendus** (`countsAsSold` : ni annulés, ni options, ni demandes) qui partent
 * le jour de l'arrivée ou arrivent le jour du départ.
 */
export function rotationNeighbours(
  stay: NeighbourStay,
  bookings: ReadonlyArray<{ id: number; arrival: string; departure: string; status?: string | null }>,
): NeighbourStay[] {
  return bookings
    .filter(
      (b) =>
        b.id !== stay.bookingId &&
        countsAsSold(b.status) &&
        (b.arrival === stay.departure || b.departure === stay.arrival),
    )
    .map((b) => ({ bookingId: b.id, arrival: b.arrival, departure: b.departure }));
}

/** En dessous, une arrivée anticipée laisse trop peu de temps au ménage : avertissement rouge. */
export const ROTATION_TIGHT_HOURS = 3;

/**
 * Rotation (départ et arrivée le même jour) : un départ convenu ne peut pas être **postérieur**
 * à l'heure d'arrivée (convenue ou standard) du séjour qui arrive ce jour-là, ni une arrivée
 * convenue **antérieure** au départ (convenu ou standard) de celui qui part. Égalité admise.
 *
 * Rend `error` (refus) ou `warning` (accepté, à dire dans la popup), ou rien. `severe` : arrivée
 * anticipée à moins de `ROTATION_TIGHT_HOURS` d'un départ le même jour (avertissement en rouge).
 */
export function rotationCheck(
  stay: NeighbourStay,
  agreed: AgreedHours,
  neighbours: readonly NeighbourStay[],
  table: StayHoursTable,
): { error?: string; warning?: string; severe?: boolean } {
  let severe = false;
  const others = neighbours.filter((n) => n.bookingId !== stay.bookingId);
  const warnings: string[] = [];
  const incoming = others.find((n) => n.arrival === stay.departure);
  if (incoming) {
    const nextArrival = stayHours(incoming.bookingId, table).arrivalHour;
    const departure = agreed.departureHour ?? STANDARD_HOURS.departure;
    if (agreed.departureHour !== undefined && departure > nextArrival) {
      return { error: `Départ à ${departure} h impossible : une arrivée est prévue le même jour à ${nextArrival} h.` };
    }
    if (agreed.departureHour !== undefined) warnings.push(`Une arrivée est prévue le même jour à ${nextArrival} h.`);
  }
  const outgoing = others.find((n) => n.departure === stay.arrival);
  if (outgoing) {
    const previousDeparture = stayHours(outgoing.bookingId, table).departureHour;
    const arrival = agreed.arrivalHour ?? STANDARD_HOURS.arrival;
    if (agreed.arrivalHour !== undefined && arrival < previousDeparture) {
      return { error: `Arrivée à ${arrival} h impossible : un départ est prévu le même jour à ${previousDeparture} h.` };
    }
    if (agreed.arrivalHour !== undefined) {
      if (arrival - previousDeparture < ROTATION_TIGHT_HOURS) {
        severe = true;
        warnings.push(
          `Un départ est prévu le même jour à ${previousDeparture} h : moins de ${ROTATION_TIGHT_HOURS} h pour le ménage.`,
        );
      } else {
        warnings.push(`Un départ est prévu le même jour à ${previousDeparture} h.`);
      }
    }
  }
  if (warnings.length === 0) return {};
  return severe ? { warning: warnings.join(" "), severe } : { warning: warnings.join(" ") };
}

/**
 * Fenêtre du code de la serrure : de min(14 h, A − 1 h) le jour d'arrivée à max(14 h, D + 1 h)
 * le jour du départ. Rend **seulement** ce qui s'écarte de la politique (`ACCESS_POLICY`) : un
 * séjour sans accord ne porte rien, et la politique s'applique comme avant.
 */
export function accessHours(
  agreed: AgreedHours,
  policy: { validFromHour: number; validUntilHour: number },
): { validFromHour?: number; validUntilHour?: number } {
  const out: { validFromHour?: number; validUntilHour?: number } = {};
  if (agreed.arrivalHour !== undefined) {
    const from = Math.max(0, Math.min(policy.validFromHour, agreed.arrivalHour - 1));
    if (from !== policy.validFromHour) out.validFromHour = from;
  }
  if (agreed.departureHour !== undefined) {
    const until = Math.min(23, Math.max(policy.validUntilHour, agreed.departureHour + 1));
    if (until !== policy.validUntilHour) out.validUntilHour = until;
  }
  return out;
}

/** Un séjour tel que la synchro des codes le voit, réduit à ce que le bornage regarde. */
export interface WindowedStay {
  bookingId: number;
  arrival: string;
  departure: string;
  /** `confirmed` : séjour vendu, qui reçoit un code. */
  status: string;
  validFromHour?: number | null;
  validUntilHour?: number | null;
}

/**
 * Jour de rotation : le code des partants ne doit pas ouvrir après l'ouverture de celui des
 * arrivants (cerbere, 2026-11-16). Un départ convenu à 16 h donne un code jusqu'à 17 h ; si un
 * séjour **confirmé** arrive ce jour-là avec un code dès 14 h, le code des partants est borné à
 * 14 h. Rend des copies ; un séjour non concerné ressort tel quel.
 */
export function boundRotationWindows<T extends WindowedStay>(
  stays: readonly T[],
  policy: { validFromHour: number; validUntilHour: number },
): T[] {
  return stays.map((s) => {
    if (s.status !== "confirmed" || s.validUntilHour == null) return s;
    const incoming = stays.filter((o) => o.bookingId !== s.bookingId && o.status === "confirmed" && o.arrival === s.departure);
    if (incoming.length === 0) return s;
    const opening = Math.min(...incoming.map((o) => o.validFromHour ?? policy.validFromHour));
    const until = Math.min(s.validUntilHour, opening);
    if (until === s.validUntilHour) return s;
    const copy = { ...s };
    if (until <= policy.validUntilHour) delete copy.validUntilHour;
    else copy.validUntilHour = until;
    return copy;
  });
}

/**
 * Accords saisis que la situation contredit **désormais** (une réservation arrivée après coup rend
 * la rotation impossible) : même règle que la saisie (`rotationCheck`), sur les voisins vendus.
 */
export function agreedConflicts(
  table: StayHoursTable,
  bookings: ReadonlyArray<{ id: number; arrival: string; departure: string; status?: string | null }>,
): Array<{ bookingId: number; message: string }> {
  const out: Array<{ bookingId: number; message: string }> = [];
  for (const b of bookings) {
    const agreed = table[b.id];
    if (!agreed || !countsAsSold(b.status)) continue;
    const stay = { bookingId: b.id, arrival: b.arrival, departure: b.departure };
    const check = rotationCheck(stay, agreed, rotationNeighbours(stay, bookings), table);
    if (check.error) out.push({ bookingId: b.id, message: check.error });
  }
  return out;
}

/** « 14 » → « 14:00 », la forme `HH:MM` de `arrivalTime` (préparation d'arrivée). */
export function clockOf(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/**
 * Une heure dans la langue du voyageur, telle que les messages l'écrivaient en dur : « 17h »,
 * « 5 pm », « 17 Uhr », « 17:00 » (espagnol et italien, l'article est dans le texte).
 */
export function formatHourFor(locale: string, hour: number): string {
  switch (locale) {
    case "fr":
      return `${hour}h`;
    case "en": {
      const h12 = hour % 12 === 0 ? 12 : hour % 12;
      return `${h12} ${hour < 12 ? "am" : "pm"}`;
    }
    case "de":
      return `${hour} Uhr`;
    default:
      return `${hour}:00`;
  }
}

