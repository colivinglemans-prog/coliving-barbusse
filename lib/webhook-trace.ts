import { getJson, getRedis, hasRedis, redisKey, setJson } from "@/lib/redis";

/**
 * Dernier appel du webhook Beds24, pour prouver depuis le dashboard que Beds24 envoie le bon
 * secret (demandé par l'hôte le 2026-11-08 : le champ « Custom Header » de Beds24 contenait des
 * chevrons recopiés, et rien ne permettait de voir que chaque appel était refusé).
 *
 * Rien du secret n'est gardé : seulement l'issue et la voie (`via`).
 *
 * **Appels acceptés seulement** depuis l'audit du 15/11 : un appel anonyme (ou le contrôle
 * `security.webhooks` du socle, qui envoie exprès un faux secret) écrasait le témoin. Les refus
 * n'écrivent plus rien ; les clés ont changé (`…:accepted`, `…:accepted-recent`) pour que le
 * dernier refus gardé sous l'ancienne clé ne reste pas affiché 30 jours.
 */
export type WebhookResult = "accepted" | "no-header" | "bad-secret" | "no-config";
export interface WebhookTrace {
  at: string;
  result: WebhookResult;
  /** La valeur reçue commençait par « < » et finissait par « > ». */
  bracketed?: boolean;
  /**
   * Diagnostic d'un refus : longueurs et 6 premiers caractères hexadécimaux du SHA-256 de la
   * valeur reçue et de la valeur attendue — assez pour voir « mauvaise longueur » ou « autre
   * secret », jamais assez pour retrouver le secret.
   */
  got?: { length: number; hash: string };
  expected?: { length: number; hash: string };
  /**
   * Forme de l'appel (2026-11-11), pour distinguer les réglages de webhook de Beds24 : deux
   * expéditeurs arrivent sur la même route (l'un accepté, l'autre par paires « no-header » puis
   * « bad-secret »). Aucune valeur d'en-tête ni de paramètre n'est gardée : leurs **noms**,
   * la méthode, le type et la taille du corps (jamais lu), et un agent utilisateur raccourci.
   */
  method?: string;
  /** Voie par laquelle le secret accepté est arrivé. */
  via?: "query" | "header";
  /** Noms des paramètres d'URL (`key` présent ou non, et ce qu'ajoute Beds24). */
  queryNames?: string[];
  /** Noms des en-têtes non standard (hors `x-vercel-*`, `x-forwarded-*`, etc.). */
  headerNames?: string[];
  contentType?: string;
  contentLength?: number;
  userAgent?: string;
}

const KEY = () => redisKey("webhook", "beds24", "accepted");
const RECENT = () => redisKey("webhook", "beds24", "accepted-recent");

/** À n'appeler que pour un appel **accepté** (la route refuse sans rien écrire). */
export async function recordWebhookCall(trace: WebhookTrace): Promise<void> {
  if (!hasRedis() || trace.result !== "accepted") return;
  try {
    await setJson(KEY(), trace, 30 * 86_400);
    // Les 20 derniers appels acceptés.
    await getRedis().lpush(RECENT(), JSON.stringify(trace));
    await getRedis().ltrim(RECENT(), 0, 19);
    await getRedis().expire(RECENT(), 30 * 86_400);
  } catch {
    // Jamais fatal : c'est un témoin, pas une fonction.
  }
}

export async function lastWebhookCall(): Promise<WebhookTrace | null> {
  if (!hasRedis()) return null;
  try {
    return await getJson<WebhookTrace>(KEY());
  } catch {
    return null;
  }
}
