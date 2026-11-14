import { sendNtfy as sendSocleNtfy, type NtfyOptions } from "@sejour/socle/lib/ntfy";
import { recordNotification } from "./notify-log";

export type { NtfyOptions };

/**
 * `sendNtfy` du socle, plus une ligne dans le journal des 30 jours (`lib/notify-log.ts`) une
 * fois l'envoi réussi. **Tout envoi ntfy du site passe par ici**, jamais directement par le
 * socle : sans quoi la page « Alertes » sous-compterait.
 *
 * Sans `NTFY_TOPIC`, le socle journalise et n'envoie rien : rien n'est noté non plus.
 */
export async function sendNtfy(message: string, options: NtfyOptions = {}): Promise<void> {
  await sendSocleNtfy(message, options);
  if (!process.env.NTFY_TOPIC) return;
  await recordNotification({
    title: options.title ?? "(sans titre)",
    priority: options.priority ?? 3,
    ...(options.tags?.length ? { tags: options.tags } : {}),
  });
}
