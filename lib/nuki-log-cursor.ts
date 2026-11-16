import { getJson, redisKey, setJson } from "./redis";

/**
 * Borne « depuis » de la lecture du journal de la serrure (`listLogSince` du socle).
 *
 * Jusqu'au 2026-11-16, le check-in et le suivi ménage lisaient `listLog(cfg, 100)` : l'API rend
 * **50 lignes au plus**, quel que soit `limit` (`LOG_PAGE_MAX`). Un soir chargé — vingt voyageurs
 * qui entrent et sortent — repoussait la première ouverture d'un séjour hors de la page : pas de
 * notification d'arrivée, pas de passage de ménage. `listLogSince` pagine depuis une date et lève
 * plutôt que de rendre un journal tronqué.
 *
 * La date est celle du **dernier passage réussi** de l'appelant (`barbusse:nuki:log-since:<nom>`),
 * moins un recouvrement de deux heures (une ligne qui arrive en retard dans le cloud Nuki, un
 * passage plus long que prévu). L'anti-doublon de chaque appelant reste en place : relire une ligne
 * ne renotifie rien. Bornes : 24 h au premier passage, 48 h au plus (au-delà, la pagination
 * dépasserait les 10 pages du socle et lèverait).
 */
export const LOG_OVERLAP_MS = 2 * 3600_000;
export const LOG_FIRST_LOOKBACK_MS = 24 * 3600_000;
export const LOG_MAX_LOOKBACK_MS = 48 * 3600_000;

export function logSince(lastOk: string | null, now: Date): Date {
  const floor = now.getTime() - LOG_MAX_LOOKBACK_MS;
  const last = lastOk === null ? NaN : Date.parse(lastOk);
  const from = Number.isNaN(last) ? now.getTime() - LOG_FIRST_LOOKBACK_MS : last - LOG_OVERLAP_MS;
  return new Date(Math.min(now.getTime(), Math.max(floor, from)));
}

const cursorKey = (reader: string) => redisKey("nuki", "log-since", reader);

/** Borne de lecture pour `reader` ; Redis illisible → comme un premier passage (24 h). */
export async function readLogSince(reader: string, now: Date = new Date()): Promise<Date> {
  let last: string | null = null;
  try {
    last = await getJson<string>(cursorKey(reader));
  } catch (e) {
    console.error(`[nuki-log] lecture ${reader}:`, e instanceof Error ? e.message : e);
  }
  return logSince(typeof last === "string" ? last : null, now);
}

/** À appeler seulement quand tout ce qui a été lu a été traité (sinon la borne ne bouge pas). */
export async function saveLogSince(reader: string, startedAt: Date): Promise<void> {
  try {
    await setJson(cursorKey(reader), startedAt.toISOString(), 7 * 24 * 3600);
  } catch (e) {
    console.error(`[nuki-log] écriture ${reader}:`, e instanceof Error ? e.message : e);
  }
}
