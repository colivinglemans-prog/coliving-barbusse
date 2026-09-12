/**
 * Les événements datés du Mans — circuit Bugatti, hippodrome des Hunaudières, marathon.
 *
 * **Il ne reste ici que les données et les libellés.** Le type `LocalEvent` et les fonctions
 * (`findEventForStay`, `findEventOnDay`, `findEventByKey`, `stayWindow`, `eventJsonLd`) sont
 * montées dans `@sejour/socle/lib/events`, où Albiez tient l'autre moitié du couple : un
 * catalogue est une valeur, il ne monte jamais.
 *
 * Deux champs sont apparus au passage, et l'un remplace une jointure fragile :
 *
 * - `key` — clé stable, jamais affichée, c'est elle que porte `BlogPostMeta.event`. Les
 *   articles se raccordaient jusqu'ici par le **nom**, qui est de l'affichage : il se
 *   corrige, il finira par se traduire, et il n'avait rien à faire en clé étrangère. Sept
 *   réunions hippiques portaient d'ailleurs le même nom, donc la même « clé ».
 * - `confirmed` — `false` tant que l'organisateur n'a pas publié ses dates. Il remplace le
 *   suffixe « (à confirmer) » qu'on collait dans le nom et qu'il fallait ensuite reconnaître
 *   par sous-chaîne, et c'est lui qui autorise l'émission du JSON-LD `Event`.
 *
 * La commune n'est pas portée par les entrées : tout le catalogue se passe au Mans, et elle
 * est fournie une fois pour toutes à `eventJsonLd` par la page qui l'appelle.
 */
import type { LocalEvent } from "@sejour/socle/lib/events";

export type { LocalEvent };

/**
 * Les événements connus du Mans et leurs dates.
 *
 * Une réservation est rattachée à un événement quand sa fenêtre `[arrivée, départ[` recouvre
 * la fenêtre de l'événement, marge comprise — voir `findEventForStay` dans le socle.
 */
export const LE_MANS_EVENTS: LocalEvent[] = [
  // 2025
  { key: "24h-moto-2025", name: "24 Heures Moto 2025", start: "2025-04-18", end: "2025-04-20", confirmed: true },
  { key: "motogp-2025", name: "MotoGP France 2025", start: "2025-05-09", end: "2025-05-11", confirmed: true },
  { key: "24h-mans-2025", name: "24 Heures du Mans 2025", start: "2025-06-06", end: "2025-06-15", confirmed: true },
  { key: "24h-rollers-2025", name: "24 Heures Rollers 2025", start: "2025-07-05", end: "2025-07-06", confirmed: true },
  { key: "classic-2025", name: "Le Mans Classic 2025", start: "2025-07-03", end: "2025-07-06", confirmed: true },
  { key: "24h-camions-2025", name: "24 Heures Camions 2025", start: "2025-10-04", end: "2025-10-05", confirmed: true },
  { key: "marathon-2025", name: "Marathon du Mans 2025", start: "2025-10-12", end: "2025-10-12", confirmed: true },

  // 2026 — Circuit du Mans (calendrier officiel lemans.org)
  { key: "karting-ouest-2026", name: "Championnat de l'Ouest Karting / Fun Cup 2026", start: "2026-03-28", end: "2026-03-29", confirmed: true },
  { key: "superbike-2026", name: "Superbike 2026", start: "2026-04-04", end: "2026-04-05", confirmed: true },
  { key: "mini-ogp-2026", name: "Championnat Mini OGP / E-TROTT 2026", start: "2026-04-11", end: "2026-04-12", confirmed: true },
  { key: "24h-moto-2026", name: "24 Heures Moto 2026", start: "2026-04-18", end: "2026-04-19", confirmed: true },
  { key: "rallye-sarthe-2026", name: "Rallye de la Sarthe 2026", start: "2026-05-02", end: "2026-05-02", confirmed: true },
  { key: "motogp-2026", name: "MotoGP France 2026", start: "2026-05-08", end: "2026-05-10", confirmed: true },
  { key: "sws-karting-2026", name: "SWS Karting Finals 2026", start: "2026-05-20", end: "2026-05-23", confirmed: true },
  { key: "test-24h-2026", name: "Journée Test 24 Heures du Mans 2026", start: "2026-06-01", end: "2026-06-07", confirmed: true },
  { key: "24h-mans-2026", name: "24 Heures du Mans 2026", start: "2026-06-11", end: "2026-06-15", confirmed: true },
  { key: "classic-2026", name: "Le Mans Classic 2026", start: "2026-07-02", end: "2026-07-05", confirmed: true },
  { key: "24h-rollers-2026", name: "24 Heures Rollers 2026", start: "2026-07-11", end: "2026-07-12", confirmed: true },
  { key: "rotax-karting-2026", name: "Rotax Max Challenge Karting 2026", start: "2026-07-15", end: "2026-07-18", confirmed: true },
  { key: "23h60-2026", name: "23H60 2026", start: "2026-08-21", end: "2026-08-23", confirmed: true },
  { key: "24h-velo-2026", name: "24 Heures Vélo 2026", start: "2026-08-29", end: "2026-08-30", confirmed: true },
  // Calendrier officiel lemans.org : "Porsche Sprint Challenge" seul (pas de F4 au Mans en 2026).
  { key: "porsche-sprint-2026", name: "Porsche Sprint Challenge France 2026", start: "2026-09-11", end: "2026-09-12", confirmed: true },
  { key: "mondial-karting-2026", name: "Championnat du Monde Karting KZ 2026", start: "2026-09-16", end: "2026-09-20", confirmed: true },
  { key: "24h-camions-2026", name: "24 Heures Camions 2026", start: "2026-09-26", end: "2026-09-27", confirmed: true },
  { key: "iame-karting-2026", name: "Euro Challenge IAME 2026", start: "2026-10-07", end: "2026-10-11", confirmed: true },
  { key: "marathon-2026", name: "Marathon du Mans 2026", start: "2026-10-11", end: "2026-10-11", confirmed: true },
  { key: "slalom-aco-2026", name: "Inter Écurie / Slalom ACO 2026", start: "2026-11-07", end: "2026-11-08", confirmed: true },
  { key: "tte-2026", name: "Trophée Tourisme Endurance 2026", start: "2026-11-13", end: "2026-11-15", confirmed: true },
  // Hippodrome des Hunaudières 2026 (réunions hippiques)
  { key: "hippodrome-2026", name: "Réunion hippique Hunaudières", start: "2026-03-04", end: "2026-03-04", confirmed: true },
  { key: "hippodrome-2026-03-10", name: "Réunion hippique Hunaudières", start: "2026-03-10", end: "2026-03-10", confirmed: true },
  { key: "hippodrome-2026-03-21", name: "Réunion hippique Hunaudières", start: "2026-03-21", end: "2026-03-21", confirmed: true },
  { key: "hippodrome-2026-04-05", name: "Réunion hippique Hunaudières", start: "2026-04-05", end: "2026-04-05", confirmed: true },
  { key: "hippodrome-2026-05-03", name: "Réunion hippique Hunaudières", start: "2026-05-03", end: "2026-05-03", confirmed: true },
  { key: "hippodrome-2026-05-08", name: "Réunion hippique Hunaudières", start: "2026-05-08", end: "2026-05-08", confirmed: true },
  { key: "hippodrome-2026-05-21", name: "Réunion hippique Hunaudières", start: "2026-05-21", end: "2026-05-21", confirmed: true },
  // GP Explorer : plus d’édition. La 3e (« The Last Race », 3-5 octobre 2025) était la
  // dernière ; ne rien attendre pour 2026 ou après.

  // 2027 — uniquement les dates officiellement annoncées par les organisateurs.
  // Le calendrier complet du circuit (lemans.org) paraît habituellement en octobre
  // pour l'année suivante : revenir le compléter à ce moment-là.
  { key: "exclusive-drive-2027", name: "Exclusive Drive 2027", start: "2027-03-19", end: "2027-03-21", confirmed: true },
  { key: "24h-moto-2027", name: "24 Heures Moto 2027", start: "2027-04-16", end: "2027-04-19", confirmed: true },
  // ATTENTION : le calendrier MotoGP 2027 n'est PAS officiel à ce jour
  // (tickets.motogp.com affiche « no official date » pour la France). Le 7-9 mai vient
  // des revendeurs de billets, d'autres sources annoncent le 14-16 mai. Ne rien bloquer
  // ni tarifer sur cette base avant publication du calendrier FIM/Dorna.
  { key: "motogp-2027", name: "MotoGP France 2027", start: "2027-05-07", end: "2027-05-09", confirmed: false },
  { key: "24h-mans-2027", name: "24 Heures du Mans 2027", start: "2027-06-09", end: "2027-06-13", confirmed: true },
  { key: "classic-2027", name: "Le Mans Classic Heritage 2027", start: "2027-07-01", end: "2027-07-04", confirmed: true },
];

/**
 * Libellé court pour l'affichage en calendrier (« 24h Mans », « MotoGP », « Classic »).
 *
 * Reste ici, et y restera : c'est une table de noms propres du Mans, c'est-à-dire une
 * donnée. Un événement dont les dates ne sont pas encore officielles est suffixé « ? » —
 * l'information vient maintenant de `confirmed` et non plus d'une sous-chaîne du nom.
 */
export function shortEventLabel(event: LocalEvent): string {
  const base = baseEventLabel(event.name);
  return event.confirmed ? base : `${base} ?`;
}

function baseEventLabel(name: string): string {
  if (name.includes("24 Heures du Mans")) return "24h Mans";
  if (name.includes("24 Heures Moto")) return "24h Moto";
  if (name.includes("MotoGP")) return "MotoGP";
  if (name.includes("Le Mans Classic")) return "Classic";
  if (name.includes("24 Heures Rollers")) return "24h Rollers";
  if (name.includes("24 Heures Camions")) return "24h Camions";
  if (name.includes("Marathon")) return "Marathon";
  if (name.includes("GP Explorer")) return "GP Explorer";
  if (name.includes("Hunaudières") || name.includes("hippique")) return "Hippodrome";
  if (name.includes("SWS Karting")) return "SWS Karting";
  if (name.includes("Rotax")) return "Rotax Karting";
  if (name.includes("IAME")) return "IAME Karting";
  if (name.includes("Monde Karting")) return "Mondial Karting";
  if (name.includes("Championnat de l'Ouest Karting")) return "Karting Ouest";
  if (name.includes("Fun Cup")) return "Fun Cup";
  if (name.includes("Superbike")) return "Superbike";
  if (name.includes("Mini OGP")) return "Mini OGP";
  if (name.includes("Rallye")) return "Rallye Sarthe";
  if (name.includes("23H60")) return "23H60";
  if (name.includes("Vélo")) return "24h Vélo";
  if (name.includes("Porsche")) return "Porsche Sprint";
  if (name.includes("Inter Écurie") || name.includes("Slalom")) return "Slalom ACO";
  if (name.includes("Trophée Tourisme")) return "TTE";
  if (name.includes("Exclusive Drive")) return "Exclusive Drive";
  return name;
}
