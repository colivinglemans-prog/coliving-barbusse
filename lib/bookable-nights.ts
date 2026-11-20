import { addDays } from "@sejour/socle/lib/dates";

/**
 * Les nuits de `[from, to[`, chacune `true` seulement si la réponse de disponibilité l'a lue
 * `true`. Une nuit **absente** est **non réservable**.
 *
 * Pourquoi : `longestFreeRange` du socle lit une clé absente comme « libre ». Or
 * `/api/availability` est bornée à aujourd'hui + 400 jours (2026-11-20) : un jour au-delà est
 * absent de la réponse, et l'encart du blog l'aurait annoncé « Disponible ». On ne promet rien
 * qu'on n'a pas lu — comme le calendrier et le devis IA, qui exigent un `true` explicite.
 * (Le changement du socle lui-même passe par le-douanier : Albiez d'abord.)
 */
export function knownNights(dates: Record<string, boolean>, from: string, to: string): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (let d = from; d < to; d = addDays(d, 1)) out[d] = dates[d] === true;
  return out;
}
