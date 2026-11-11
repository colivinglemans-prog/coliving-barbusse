import { getJson, getRedis, hasRedis, redisKey, setJson } from "@/lib/redis";

/**
 * Dernier appel du webhook Beds24, pour prouver depuis le dashboard que Beds24 envoie le bon
 * secret (demandé par l'hôte le 2026-11-08 : le champ « Custom Header » de Beds24 contenait des
 * chevrons recopiés, et rien ne permettait de voir que chaque appel était refusé).
 *
 * Rien du secret n'est gardé : seulement l'issue, et si la valeur reçue était entourée de
 * chevrons (l'erreur la plus probable).
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

const KEY = () => redisKey("webhook", "beds24", "last");

export async function recordWebhookCall(trace: WebhookTrace): Promise<void> {
  if (!hasRedis()) return;
  try {
    await setJson(KEY(), trace, 30 * 86_400);
    // Les 20 derniers appels. Les paires « no-header » puis « bad-secret » (POST, corps `{}`, agent
    // `node`, faux secret de 29 caractères) ne viennent PAS de Beds24 : c'est le contrôle
    // `security.webhooks` du socle (post-déploiement et surveillance), qui vérifie le refus
    // (établi le 2026-11-11). Beds24, lui, est accepté.
    const list = redisKey("webhook", "beds24", "recent");
    await getRedis().lpush(list, JSON.stringify(trace));
    await getRedis().ltrim(list, 0, 19);
    await getRedis().expire(list, 30 * 86_400);
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

/** Vrai au plus une fois toutes les 6 h : pour ne pas alerter à chaque appel refusé. */
export async function firstRefusalAlert(): Promise<boolean> {
  if (!hasRedis()) return true;
  try {
    return Boolean(await getRedis().set(redisKey("webhook", "beds24", "alert"), 1, { nx: true, ex: 6 * 3600 }));
  } catch {
    return false;
  }
}
