import { Redis } from "@upstash/redis";
import {
  createInvoiceNumbering,
  type InvoiceCounterStore,
} from "@sejour/socle/lib/invoice-number";
import { INVOICE_COUNTER_PREFIX } from "./invoice-config";

/**
 * Numérotation des factures de ce site — le compteur Upstash, branché sur la mécanique du
 * socle.
 *
 * ⚠️ **La clé est passée de `invoice:counter:{année}` à
 * `invoice:counter:barbusse:{année}`.** Sans préfixe, deux entités partageant le même
 * Upstash se partageraient la même série de numéros — voir l'en-tête de
 * `@sejour/socle/lib/invoice-number`.
 *
 * **`legacyKey` n'est pas décoratif** : au 2026-09-11, `invoice:counter:2026` valait 13.
 * Préfixer la clé sans reprendre cette valeur ferait repartir la série à `2026-001` et
 * réémettrait treize numéros déjà utilisés — exactement l'anomalie qu'on corrige. Au premier
 * numéro attribué après la bascule, la nouvelle clé est semée avec l'ancienne valeur et la
 * série reprend à `2026-014`. À retirer une fois 2026 close.
 */
let redisClient: Redis | null = null;
function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return redisClient;
}

const store: InvoiceCounterStore = {
  incr: (key) => getRedis().incr(key),
  get: (key) => getRedis().get<number | string | null>(key),
  // `nx: true` : ne pose la valeur que si la clé est absente. C'est ce qui rend la reprise
  // idempotente et sans course avec un autre onglet.
  setIfAbsent: (key, value) => getRedis().set(key, value, { nx: true }),
};

const numbering = createInvoiceNumbering({
  counterPrefix: INVOICE_COUNTER_PREFIX,
  store,
  legacyKey: (year) => `invoice:counter:${year}`,
});

export function getNextInvoiceNumber(date = new Date()): Promise<string> {
  return numbering.next(date);
}

export { PREVIEW_NUMBER } from "@sejour/socle/lib/invoice-number";
