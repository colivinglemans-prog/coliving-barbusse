import { sendNtfy as sendSocleNtfy, type NtfyOptions } from "@sejour/socle/lib/ntfy";
import { recordNotification } from "./notify-log";

export type { NtfyOptions };

/**
 * `sendNtfy` du socle, plus une ligne dans le journal des 30 jours (`lib/notify-log.ts`) une
 * fois l'envoi réussi. **Tout envoi ntfy du site passe par ici**, jamais directement par le
 * socle : sans quoi la page « Alertes » sous-compterait.
 *
 * **Sans `NTFY_TOPIC`, l'envoi lève** (2026-11-16). Le socle, lui, journalise et rend la main
 * sans erreur : `reportAlerts` notait alors l'alerte comme partie, l'état passait « ouvert » et,
 * une alerte n'étant jamais répétée, elle ne repartait plus quand le sujet revenait. Une erreur
 * fait remettre l'état tel qu'avant le passage (`lib/alert-memory.ts`) : l'alerte repart au
 * passage suivant. Les appelants qui ne veulent pas échouer pour une notification gardent leur
 * `.catch`.
 */
export async function sendNtfy(
  message: string,
  options: NtfyOptions = {},
  /** Titre noté dans le journal à la place du vrai : jamais de prénom ni de donnée personnelle. */
  log: { title?: string } = {},
): Promise<void> {
  if (!process.env.NTFY_TOPIC) throw new Error("NTFY_TOPIC manquant : notification non envoyée");
  await sendSocleNtfy(message, options);
  // L'envoi a réussi : un journal qui lève ne doit pas le faire compter comme un échec (l'appelant
  // renverrait, ou mettrait en file, une notification déjà partie).
  await recordNotification({
    title: log.title ?? options.title ?? "(sans titre)",
    priority: options.priority ?? 3,
    ...(options.tags?.length ? { tags: options.tags } : {}),
  }).catch((e) => console.error("[ntfy] journal des notifications :", e instanceof Error ? e.message : e));
}
