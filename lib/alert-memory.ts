import { nextAlertState, type AlertInput, type AlertState, type AlertTransition } from "@sejour/socle/lib/alert-state";
import { getJson, redisKey, setJson } from "./redis";

/**
 * Anti-répétition des alertes de crons : `nextAlertState` du socle, avec l'état dans Redis
 * sous `barbusse:alert:<scope>`.
 *
 * Une alerte part à l'ouverture, à l'aggravation (nouvel identifiant, ou gravité qui monte)
 * et au rétablissement — jamais deux fois à gravité égale.
 *
 * **Redis injoignable** : l'état précédent est lu comme absent, l'alerte repart à chaque
 * passage. C'est voulu : mieux vaut une alerte répétée qu'une panne tue.
 */
const TTL_SECONDS = 90 * 24 * 3600;

export async function alertTransition(
  scope: string,
  inputs: readonly AlertInput[],
  now: Date = new Date(),
): Promise<AlertTransition> {
  const key = redisKey("alert", scope);
  let prev: AlertState | null = null;
  try {
    prev = await getJson<AlertState>(key);
  } catch (e) {
    console.error(`[alert-memory] lecture ${scope}:`, e instanceof Error ? e.message : e);
  }
  const transition = nextAlertState(prev, inputs, now);
  try {
    await setJson(key, transition.state, TTL_SECONDS);
  } catch (e) {
    console.error(`[alert-memory] écriture ${scope}:`, e instanceof Error ? e.message : e);
  }
  return transition;
}

/** Une liste d'identifiants KO, en entrées de `nextAlertState`. */
export function failingInputs(ids: readonly string[], gravity = 1): AlertInput[] {
  return ids.map((id) => ({ id, status: "fail", severity: "blocking", gravity }));
}
