import {
  nextAlertState,
  type AlertAction,
  type AlertInput,
  type AlertOptions,
  type AlertState,
  type AlertTransition,
} from "@sejour/socle/lib/alert-state";
import { getJson, redisKey, setJson } from "./redis";
import type { AlertPriority } from "./alerts";

/**
 * Anti-répétition des alertes de crons : `nextAlertState` du socle, avec l'état dans Redis
 * sous `barbusse:alert:<scope>`.
 *
 * **Règle commune (2026-11-10)**, décidée par l'hôte qui recevait trop d'alertes :
 * - une alerte part quand le problème est vu **deux passages de suite** (`confirmAfter: 2`) ;
 * - jamais deux fois à gravité égale ; de nouveau si la situation s'aggrave ;
 * - un rétablissement part en **priorité 1** (sans son), et seulement si une alerte était partie.
 *
 * **Redis injoignable** : l'état précédent est lu comme absent et la confirmation est levée
 * (`confirmAfter: 1`) — sans quoi le compteur ne survivrait jamais et l'alerte ne partirait plus.
 * L'alerte repart alors à chaque passage : mieux vaut une alerte répétée qu'une panne tue.
 */
const TTL_SECONDS = 90 * 24 * 3600;

export async function alertTransition(
  scope: string,
  inputs: readonly AlertInput[],
  now: Date = new Date(),
  options: AlertOptions = {},
): Promise<AlertTransition> {
  return (await advance(scope, inputs, now, options)).transition;
}

/** Calcule et enregistre la transition ; rend aussi l'état précédent, pour pouvoir le remettre. */
async function advance(
  scope: string,
  inputs: readonly AlertInput[],
  now: Date,
  options: AlertOptions,
): Promise<{ transition: AlertTransition; prev: AlertState | null; key: string }> {
  const key = redisKey("alert", scope);
  let prev: AlertState | null = null;
  let readable = true;
  try {
    prev = await getJson<AlertState>(key);
  } catch (e) {
    readable = false;
    console.error(`[alert-memory] lecture ${scope}:`, e instanceof Error ? e.message : e);
  }
  const transition = nextAlertState(prev, inputs, now, readable ? options : { ...options, confirmAfter: 1 });
  try {
    await setJson(key, transition.state, TTL_SECONDS);
  } catch (e) {
    console.error(`[alert-memory] écriture ${scope}:`, e instanceof Error ? e.message : e);
  }
  return { transition, prev, key };
}

/** Une liste d'identifiants KO, en entrées de `nextAlertState`. */
export function failingInputs(ids: readonly string[], gravity = 1): AlertInput[] {
  return ids.map((id) => ({ id, status: "fail", severity: "blocking", gravity }));
}

/** Un constat d'un passage : identifiant **stable**, priorité ntfy, ligne lisible. */
export interface TrackedAlert {
  id: string;
  priority: AlertPriority;
  line: string;
}

export type AlertSender = (subject: string, body: string, priority: AlertPriority) => Promise<unknown>;

export interface ReportOptions {
  /** Titre de l'alerte (le préfixe `[Chauffage]`… est ajouté par l'expéditeur). */
  title: (confirmed: TrackedAlert[]) => string;
  /** Titre du rétablissement. */
  recoveredTitle: string;
  recoveredBody?: string;
  /** En-tête facultatif du corps, avant les lignes. */
  intro?: string;
  /**
   * Priorité de l'envoi, décidée sur les seuls constats **confirmés** (défaut : la plus haute de
   * leurs priorités). Pour une règle qui dépend de leur nombre (« plusieurs radiateurs → 4 ») :
   * la mettre dans la gravité de chaque constat ferait escalader une alerte ouverte dès qu'un
   * autre constat apparaît, avant même sa confirmation.
   */
  priority?: (confirmed: TrackedAlert[]) => AlertPriority;
  confirmAfter?: number;
  now?: Date;
}

/**
 * Évalue les constats d'un passage et envoie ce qu'il faut — rien, l'alerte, ou le
 * rétablissement en priorité 1. La ligne d'un constat peut changer d'un passage à l'autre
 * (une heure, un message d'erreur) : seul l'identifiant compte pour la répétition.
 */
export async function reportAlerts(
  scope: string,
  alerts: readonly TrackedAlert[],
  send: AlertSender,
  options: ReportOptions,
): Promise<AlertAction> {
  const inputs = alerts.map((a) => ({ id: a.id, status: "fail", severity: "blocking", gravity: a.priority }));
  const now = options.now ?? new Date();
  const { transition, prev, key } = await advance(scope, inputs, now, { confirmAfter: options.confirmAfter ?? 2 });
  try {
    await notifyTransition(transition, alerts, send, options);
  } catch (e) {
    // Envoi raté (ntfy en panne) : l'état est remis tel qu'avant ce passage, sans quoi l'alerte,
    // désormais jamais répétée, serait perdue — le passage suivant la renverra.
    const restore: AlertState = prev ?? { open: false, since: null, updatedAt: now.toISOString(), failing: {} };
    await setJson(key, restore, TTL_SECONDS).catch((err) =>
      console.error(`[alert-memory] remise de ${scope}:`, err instanceof Error ? err.message : err),
    );
    throw e;
  }
  return transition.action;
}

/** La part pure de `reportAlerts` : quelle notification pour quelle transition. */
export async function notifyTransition(
  transition: Pick<AlertTransition, "action" | "failingIds">,
  alerts: readonly TrackedAlert[],
  send: AlertSender,
  options: Pick<ReportOptions, "title" | "recoveredTitle" | "recoveredBody" | "intro" | "priority">,
): Promise<void> {
  if (transition.action === "recover") {
    await send(options.recoveredTitle, options.recoveredBody ?? "Plus aucune alerte en cours.", 1);
    return;
  }
  if (transition.action !== "open" && transition.action !== "escalate") return;
  const ids = new Set(transition.failingIds);
  const confirmed = alerts.filter((a) => ids.has(a.id));
  if (confirmed.length === 0) return;
  const priority = options.priority
    ? options.priority(confirmed)
    : (Math.max(...confirmed.map((a) => a.priority)) as AlertPriority);
  const body = [...(options.intro ? [options.intro, ""] : []), ...confirmed.map((a) => a.line)].join("\n");
  await send(options.title(confirmed), body, priority);
}

/**
 * Erreur d'un cron (le `catch` de la route) : même règle — deux passages en erreur de suite
 * avant d'alerter, une seule alerte tant que l'erreur dure (le message peut changer, l'identifiant
 * non), rétablissement en priorité 1 au premier passage réussi. À appeler à **chaque** passage :
 * `error: null` quand il a réussi.
 */
export async function reportCronRun(
  cron: string,
  label: string,
  send: AlertSender,
  error: string | null,
): Promise<AlertAction> {
  const alerts: TrackedAlert[] = error === null ? [] : [{ id: cron, priority: 4, line: error }];
  return reportAlerts(`error:${cron}`, alerts, send, {
    title: () => `Erreur ${label}`,
    intro: `${label} échoue depuis deux passages :`,
    recoveredTitle: `${label} : de nouveau sans erreur`,
    recoveredBody: "Le dernier passage a réussi.",
  });
}
