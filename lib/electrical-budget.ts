/**
 * Budget électrique de la maison Barbusse — **un seul chiffre à changer** quand l'abonnement
 * passe de 9 à 12 kVA (`SUBSCRIBED_KVA`).
 *
 * Coupures des 7, 8 et 9 novembre 2026 (9 kVA, 14 voyageurs) : le compteur a disjoncté sur
 * dépassement de la puissance souscrite. Rien ne mesure la consommation réelle (pas de lecture
 * du Linky) : ces budgets s'appliquent à la charge **estimée** des radiateurs
 * (`lib/radiator-load.ts`, 15 radiateurs ACOVA Atoll LCD de 1 000 W, 15 kW installés).
 *
 * - `radiatorCapW` : au-delà, des étages passent en éco un quart d'heure (`lib/load-shedding.ts`).
 *   Le reste de l'abonnement est laissé au ballon classique de 300 L (~3 kW, permanent) et à
 *   la cuisine.
 * - L'appoint du ballon ne dépend plus de ce budget : le thermo passe en Absence aux heures de
 *   pic (`PEAK_WINDOWS`, `lib/cozytouch.ts`), seul moyen mesuré de couper son appoint.
 *
 * À remplacer par une mesure dès qu'un module TIC lira le Linky (voir TODO).
 */
export const SUBSCRIBED_KVA: 9 | 12 = 9;

const BY_KVA = {
  9: { radiatorCapW: 6000 },
  12: { radiatorCapW: 9000 },
} as const;

export const ELECTRICAL_BUDGET = { kva: SUBSCRIBED_KVA, ...BY_KVA[SUBSCRIBED_KVA] };

/**
 * Délestage des radiateurs **en observation** depuis sa mise en service (2026-11-09) : il calcule
 * et affiche ce qu'il ferait, sans toucher aux radiateurs.
 *
 * Le soir du 9/11 à 21 h 54, l'estimation donnait 13,3 kW (13 radiateurs sur 15 en demande de
 * chauffe) alors que le compteur de 9 kVA tenait : elle est trop pessimiste (`Heating_state` = le
 * Heatzy demande du chauffage, pas le radiateur à pleine puissance, qui régule aussi par son propre
 * thermostat). Actif, le délestage aurait mis les 9 chambres en éco toute la nuit. À passer en
 * `"active"` une fois calibré (puissance max du Linky, courbe de charge Enedis, module TIC).
 */
export const LOAD_SHEDDING_MODE: "observe" | "active" = "observe";
