import { listLog } from "@sejour/socle/lib/nuki";
import { nukiConfig } from "@/lib/access-sync";
import { AjCloud } from "@/lib/camera/ajcloud";
import { Intratone } from "@/lib/cleaning/intratone";
import { matchPerson, trackedOpenings, type CleaningArrival, type TrackedPerson } from "@/lib/cleaning/sessions";

/**
 * Les quatre sources de données du suivi des intervenants, partagées par le cron
 * (`/api/cron/cleaning-watch`) et la page dashboard (`/api/dashboard/suivi`) :
 *  - `garageArrivals` : ouvertures du digicode Intratone aux noms suivis ;
 *  - `doorArrivals`   : codes Nuki manuels (« # Sophie »…) dans le journal de la serrure ;
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

export async function doorArrivals(people: TrackedPerson[]): Promise<CleaningArrival[]> {
  if (!process.env.NUKI_API_TOKEN || !process.env.NUKI_SMARTLOCK_ID) throw new Error("no-credentials");
  const log = await listLog(nukiConfig(), 100);
  const out: CleaningArrival[] = [];
  for (const e of log) {
    if (e.trigger !== 255 || e.state !== 0) continue;
    const who = matchPerson(e.name ?? "", people);
    if (who) out.push({ source: "porte", at: new Date(e.date), who });
  }
  return out;
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
