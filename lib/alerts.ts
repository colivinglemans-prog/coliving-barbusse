import { sendNtfy, type NtfyOptions } from "@sejour/socle/lib/ntfy";

/**
 * Alertes d'exploitation des crons (chauffage, eau chaude, jetons Beds24), en notification
 * push ntfy — le canal de toutes les autres alertes du site.
 *
 * Elles partaient par e-mail via Resend jusqu'au 2026-11-07, depuis l'expéditeur de test
 * `onboarding@resend.dev` : un second canal, une dépendance et deux variables
 * (`RESEND_API_KEY`, `ALERT_EMAIL`) pour six crons. Les signatures sont restées les mêmes.
 *
 * Priorité 4 (haute) par défaut : ce sont des pannes ou des radiateurs injoignables, pas des
 * comptes rendus. Un troisième argument facultatif la change — un rétablissement part en 1
 * (règle commune, `lib/alert-memory.ts`), sans son ni vibration. Sans `NTFY_TOPIC`, `sendNtfy` journalise et n'envoie rien, comme
 * l'ancien code sans `ALERT_EMAIL`.
 */
export type AlertPriority = NonNullable<NtfyOptions["priority"]>;

function alert(prefix: string, tags: string[]) {
  return (subject: string, body: string, priority: AlertPriority = 4) =>
    sendNtfy(body, { title: `[${prefix}] ${subject}`, priority, tags });
}

export const sendHeatingAlert = alert("Chauffage", ["fire", "warning"]);
export const sendWaterHeaterAlert = alert("Eau chaude", ["droplet", "warning"]);
export const sendBeds24Alert = alert("Beds24", ["key", "warning"]);
export const sendCronAlert = alert("Crons", ["alarm_clock", "warning"]);
