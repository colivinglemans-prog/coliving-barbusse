import { Redis } from "@upstash/redis";

/**
 * Le client Upstash du site, en un seul exemplaire.
 *
 * `getRedis()` était recopié dans six modules (`heatzy.ts`, `cozytouch.ts`, `access-sync.ts`,
 * `invoice-number.ts`, `pricing/snapshot.ts` et le cron de notification d'arrivée) — six fois
 * le même couple de variables d'environnement, avec à chaque fois la même chance de se tromper
 * de nom. Tous passent désormais par ici (2026-11-07).
 *
 * Les variables sont celles posées par l'intégration Vercel KV (`KV_REST_API_URL` et
 * `KV_REST_API_TOKEN`), et non les `UPSTASH_*` de la console Upstash.
 *
 * **Préfixe.** La base Upstash est partagée par tout ce qui porte ce nom de projet : les
 * **nouvelles** clés se construisent avec `redisKey(...)`, qui les range sous `barbusse:`.
 * Les clés existantes (`heatzy:*`, `cozytouch:*`, `nuki:*`, `checkin:notified:*`,
 * `pricing:*`, `invoice:counter:*`) ne sont **pas** renommées : les verrous, compteurs et
 * mémoires d'anti-doublon qu'elles portent repartiraient de zéro.
 */
let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return client;
}

/** `true` quand le couple de variables est présent — sans lui, tout appel partirait sur `undefined`. */
export function hasRedis(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/** Préfixe de toutes les clés créées à partir du 2026-11-07. */
export const REDIS_PREFIX = "barbusse";

/** `redisKey("readiness", "memory")` → `barbusse:readiness:memory`. */
export function redisKey(...parts: Array<string | number>): string {
  return [REDIS_PREFIX, ...parts].join(":");
}

/**
 * Le client vu comme un magasin clé → chaîne, la forme qu'attendent les modules du socle
 * (`HeartbeatStore`). Upstash désérialise le JSON à la lecture : on rend toujours une chaîne.
 */
export function stringStore(ttlSeconds?: number) {
  return {
    async get(key: string): Promise<string | null> {
      const v = await getRedis().get<unknown>(key);
      if (v === null || v === undefined) return null;
      return typeof v === "string" ? v : JSON.stringify(v);
    },
    async set(key: string, value: string): Promise<void> {
      if (ttlSeconds) await getRedis().set(key, value, { ex: ttlSeconds });
      else await getRedis().set(key, value);
    },
  };
}

/** Lecture JSON tolérante : `null` si la clé est absente ou illisible. */
export async function getJson<T>(key: string): Promise<T | null> {
  const v = await getRedis().get<unknown>(key);
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    // Upstash a déjà tenté le `JSON.parse` : une chaîne qui reste est soit une chaîne JSON
    // (`"…"` écrit par `setJson`), soit une valeur brute.
    try {
      return JSON.parse(v) as T;
    } catch {
      return v as T;
    }
  }
  return v as T;
}

export async function setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  const raw = JSON.stringify(value);
  if (ttlSeconds) await getRedis().set(key, raw, { ex: ttlSeconds });
  else await getRedis().set(key, raw);
}
