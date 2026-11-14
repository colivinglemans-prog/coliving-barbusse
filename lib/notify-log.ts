import { getRedis, hasRedis, redisKey } from "./redis";

/**
 * Journal des notifications ntfy envoyées par le site, gardé 30 jours (2026-11-14).
 *
 * ntfy.sh n'en garde qu'environ 12 h : impossible, sans ce journal, de mesurer le volume réel ou
 * de repérer une alerte qui revient. Chaque envoi réussi ajoute une ligne à une liste Redis
 * (`barbusse:ntfy:log`) : instant, titre, priorité, mots-clés, et **jamais le corps** (prénoms,
 * erreurs, liens signés de la caméra). Lu par la page « Alertes » du dashboard (admin).
 *
 * Non couvertes : les notifications de la surveillance GitHub (`deploy-checks.yml`), envoyées
 * depuis GitHub Actions et non par le site.
 *
 * Un échec d'écriture est journalisé et ignoré : le journal ne doit jamais empêcher une alerte.
 */
export interface NotificationRecord {
  /** ISO 8601. */
  at: string;
  title: string;
  priority: number;
  tags?: string[];
}

export const NOTIFY_LOG_KEY = redisKey("ntfy", "log");
export const NOTIFY_LOG_DAYS = 30;
/** Plafond de la liste : très au-delà de 30 jours d'alertes normales, il ne sert que de garde-fou. */
const MAX_ENTRIES = 5000;

export async function recordNotification(record: Omit<NotificationRecord, "at">, now = new Date()): Promise<void> {
  if (!hasRedis()) return;
  try {
    const entry: NotificationRecord = { at: now.toISOString(), ...record };
    const redis = getRedis();
    await redis.lpush(NOTIFY_LOG_KEY, JSON.stringify(entry));
    await redis.ltrim(NOTIFY_LOG_KEY, 0, MAX_ENTRIES - 1);
  } catch (e) {
    console.error("[notify-log] écriture:", e instanceof Error ? e.message : e);
  }
}

/** Les notifications des `days` derniers jours, de la plus récente à la plus ancienne. */
export async function readNotifications(days = NOTIFY_LOG_DAYS, now = new Date()): Promise<NotificationRecord[]> {
  const raw = await getRedis().lrange<unknown>(NOTIFY_LOG_KEY, 0, MAX_ENTRIES - 1);
  const since = now.getTime() - days * 24 * 3600 * 1000;
  return raw
    .map((r) => (typeof r === "string" ? (JSON.parse(r) as NotificationRecord) : (r as NotificationRecord)))
    .filter((r) => r && typeof r.at === "string" && Date.parse(r.at) >= since);
}

export interface NotificationSummary {
  total: number;
  byPriority: Record<string, number>;
  /** Titres regroupés (les nombres remplacés par « N »), du plus fréquent au moins fréquent. */
  byTitle: Array<{ title: string; count: number; maxPriority: number; last: string }>;
  /** Jour de Paris (AAAA-MM-JJ) → nombre, sur toute la période. */
  byDay: Record<string, number>;
}

/** « 3 radiateur(s) en alerte » et « 1 radiateur(s) en alerte » sont la même alerte. */
export function titleFamily(title: string): string {
  return title.replace(/\d+/g, "N").trim();
}

function parisDay(iso: string): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date(iso));
}

export function summarizeNotifications(records: readonly NotificationRecord[]): NotificationSummary {
  const byPriority: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  const families = new Map<string, { title: string; count: number; maxPriority: number; last: string }>();
  for (const r of records) {
    byPriority[r.priority] = (byPriority[r.priority] ?? 0) + 1;
    const day = parisDay(r.at);
    byDay[day] = (byDay[day] ?? 0) + 1;
    const key = titleFamily(r.title);
    const f = families.get(key) ?? { title: key, count: 0, maxPriority: 0, last: r.at };
    f.count++;
    f.maxPriority = Math.max(f.maxPriority, r.priority);
    if (r.at > f.last) f.last = r.at;
    families.set(key, f);
  }
  return {
    total: records.length,
    byPriority,
    byTitle: [...families.values()].sort((a, b) => b.count - a.count || b.last.localeCompare(a.last)),
    byDay,
  };
}
