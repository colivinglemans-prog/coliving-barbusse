import { listLogSince } from "@sejour/socle/lib/nuki";
import { managedBookingId } from "@sejour/socle/lib/access-codes";
import { nukiConfig } from "@/lib/access-sync";
import { AjCloud } from "@/lib/camera/ajcloud";
import { Intratone } from "@/lib/cleaning/intratone";
import { getBookings } from "@/lib/beds24";
import { getJson, redisKey, setJson } from "@/lib/redis";
import {
  doorLogArrivals,
  guestKeypadCodes,
  parisDayOf,
  trackedOpenings,
  type CleaningArrival,
  type GuestKeypadCode,
  type TrackedPerson,
} from "@/lib/cleaning/sessions";

/**
 * Les quatre sources de données du suivi des intervenants, partagées par le cron
 * (`/api/cron/cleaning-watch`) et la page dashboard (`/api/dashboard/suivi`) :
 *  - `garageArrivals` : ouvertures du digicode Intratone aux noms suivis ;
 *  - `doorArrivals`   : codes Nuki manuels (« # Sophie »…) dans le journal de la serrure, hors
 *                       codes gérés des séjours (« <n° résa>: <Prénom> ») ;
 *  - `cameraMotions`  : mouvements des caméras (pour estimer la sortie) ;
 *  - `buttonPresses`  : appuis sur le bouton poussoir (sortie de secours pour l'estimation).
 *
 * Chacune lève `Error("no-credentials")` si ses variables manquent — au cœur de l'appeler de
 * décider si c'est bloquant (le cron continue avec les autres sources ; la page le signale).
 */

export async function garageArrivals(people: TrackedPerson[]): Promise<CleaningArrival[]> {
  const client = intratoneClient();
  if (!client) throw new Error("no-credentials");
  await client.login();
  return trackedOpenings(await client.keypadOpenings(), people);
}

/**
 * **Toutes** les ouvertures du digicode du garage par un code **nommé**, sans le filtre des
 * personnes suivies (`trackedOpenings`) : les voyageurs n'ont pas de code garage, donc tout code
 * nommé est celui d'une personne de la maison (relevé de la porte au départ,
 * `lib/departure-lock.ts`). Un code donné un jour à un groupe (motos) se nomme avec le numéro de
 * réservation : il est alors exclu. Même connexion que `garageArrivals`.
 */
export async function garageOpenings(): Promise<Array<{ at: Date; who: string }>> {
  const client = intratoneClient();
  if (!client) throw new Error("no-credentials");
  await client.login();
  return (await client.keypadOpenings())
    .map((o) => ({ at: o.at, who: o.name.trim() }))
    .filter((o) => o.who !== "" && managedBookingId(o.who) === null);
}

/**
 * Journal lu depuis `since`, toutes pages (`listLogSince`) : `listLog` plafonne à 50 lignes et
 * laissait filer un passage un soir chargé. Lève si le journal ne peut pas être lu en entier.
 */
export async function doorArrivals(people: TrackedPerson[], since: Date): Promise<CleaningArrival[]> {
  return (await doorReading(people, since)).arrivals;
}

/**
 * La même lecture du journal, plus les entrées au clavier par les codes gérés des séjours
 * (`guestKeypadCodes`, partants comme arrivants). Celles des voyageurs **qui arrivent** bornent la
 * sortie estimée d'un ménage un jour de rotation (`guestKeypadEntries`, avec `guestArrivalDays`).
 * Une seule lecture Nuki.
 */
export async function doorReading(
  people: TrackedPerson[],
  since: Date,
): Promise<{ arrivals: CleaningArrival[]; guestCodes: GuestKeypadCode[] }> {
  if (!process.env.NUKI_API_TOKEN || !process.env.NUKI_SMARTLOCK_ID) throw new Error("no-credentials");
  const log = await listLogSince(nukiConfig(), since);
  // Les codes gérés des séjours (« <n° résa>: Sophie ») sont exclus par `doorLogArrivals`.
  return { arrivals: doorLogArrivals(log, people), guestCodes: guestKeypadCodes(log) };
}

/** Jours d'arrivée des réservations arrivées sur la fenêtre lue, gardés 30 min (quota Beds24). */
const ARRIVAL_DAYS_TTL_SECONDS = 1800;

/**
 * Le jour d'arrivée (« YYYY-MM-DD ») des réservations dont un code géré apparaît au journal :
 * **une** requête Beds24 sur les arrivées des jours couverts par ces entrées, gardée 30 min dans
 * Redis. Relue avant ce délai seulement si une réservation inconnue apparaît (réservée le jour
 * même). Aucun code géré : aucun appel. Lève si Beds24 ne répond pas.
 */
export async function guestArrivalDays(codes: readonly GuestKeypadCode[]): Promise<Map<number, string>> {
  if (codes.length === 0) return new Map();
  const days = codes.map((c) => parisDayOf(c.at)).sort();
  const from = days[0];
  const to = days[days.length - 1];
  const ids = [...new Set(codes.map((c) => c.bookingId))];
  const key = redisKey("cleaning", "arrival-days", from, to);
  const cached = await getJson<Record<string, string>>(key).catch(() => null);
  if (cached && ids.every((id) => String(id) in cached)) return new Map(Object.entries(cached).map(([id, d]) => [Number(id), d]));
  const bookings = await getBookings({ arrivalFrom: from, arrivalTo: to });
  const out: Record<string, string> = {};
  for (const b of bookings) if (b.arrival) out[String(b.id)] = b.arrival;
  // Les réservations encore inconnues sont notées « hors fenêtre » : pas de relecture pour elles.
  for (const id of ids) if (!(String(id) in out)) out[String(id)] = "";
  await setJson(key, out, ARRIVAL_DAYS_TTL_SECONDS).catch(() => {});
  return new Map(Object.entries(out).filter(([, d]) => d !== "").map(([id, d]) => [Number(id), d]));
}

/** Instants des mouvements de toutes les caméras (pour estimer la sortie). */
export async function cameraMotions(): Promise<Date[]> {
  const email = process.env.AJCLOUD_EMAIL;
  const password = process.env.AJCLOUD_PASSWORD;
  if (!email || !password) throw new Error("no-credentials");
  const client = new AjCloud({ email, password, region: "eu" });
  await client.login();
  const devices = await client.devices();
  const out: Date[] = [];
  for (const d of devices) {
    if (!d.emcUrl) continue;
    for (const a of await client.alarmsSurvey(d)) out.push(new Date(Number(a.cts)));
  }
  return out;
}

export async function buttonPresses(): Promise<Date[]> {
  const client = intratoneClient();
  if (!client) return [];
  await client.login();
  return client.buttonPresses();
}

function intratoneClient(): Intratone | null {
  const user = process.env.INTRATONE_USER;
  const password = process.env.INTRATONE_PASS;
  const centraleId = process.env.INTRATONE_CENTRALE_ID?.trim();
  if (!user || !password || !centraleId) return null;
  return new Intratone({ user, password, centraleId });
}
