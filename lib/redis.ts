import { Redis } from "@upstash/redis";

/**
 * Le client Upstash du site, en un seul exemplaire.
 *
 * `getRedis()` était recopié à l'identique dans `cozytouch.ts`, `heatzy.ts` et le cron de
 * notification d'arrivée — trois fois le même couple de variables d'environnement, avec à
 * chaque fois la même chance de se tromper de nom. Les nouveaux appelants passent par ici ;
 * les trois copies existantes n'ont pas été touchées, leur migration ne valant pas le risque
 * de toucher au pilotage du chauffage pour un gain purement cosmétique.
 *
 * Les variables sont celles posées par l'intégration Vercel KV (`KV_REST_API_URL` et
 * `KV_REST_API_TOKEN`), et non les `UPSTASH_*` de la console Upstash.
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
