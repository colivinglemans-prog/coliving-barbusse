import path from "node:path";
import { getDailyPrices } from "@/lib/beds24";
import { getBookingsWithArchive } from "@/lib/bookings";
import {
  loadFiscalConfig as loadFiscalConfigSocle,
  type FiscalConfig,
} from "@sejour/socle/lib/fiscal/config";
import type { RevenusDeps } from "@sejour/socle/lib/fiscal/revenus";

/**
 * Branchement du module fiscal du socle sur les données de ce site.
 *
 * Le module lui-même — BIC au réel, amortissements réputés différés, IR avec quotient
 * familial, test LMP, cotisations, orientations et échéances — vit dans
 * `@sejour/socle/lib/fiscal/*`. Ne restent ici que les trois choses qu'il refuse de
 * supposer :
 *
 * 1. **Où sont les données de l'exercice.** `process.cwd()` est le répertoire de
 *    l'application, pas celui du socle.
 * 2. **D'où viennent les réservations.** La fusion avec l'archive est le choix du site : le
 *    Lot 2 l'a sortie du client d'API précisément pour qu'aucune fonction ne complète en
 *    silence ce que Beds24 a renvoyé.
 * 3. **Combien de logements** compte un bien qui regroupe plusieurs `propertyId` — le
 *    dénominateur du taux d'occupation. Neuf ici : la maison se loue aussi à la chambre.
 */

/** Répertoire des `AAAA.json` de l'exercice, versionnés avec l'application. */
export const FISCAL_DATA_DIR = path.join(process.cwd(), "data", "fiscal");

/** Collectivité citée par les orientations (exonérations de CFE, meublés classés). */
export const FISCAL_COLLECTIVITE = "Le Mans Métropole";

export const FISCAL_REVENUS_DEPS: RevenusDeps = {
  fetchBookings: (params) => getBookingsWithArchive(params),
  fetchDailyPrices: (propertyId, from, to) => getDailyPrices(propertyId, from, to),
  unitsWhenMultiProperty: 9,
};

export function loadFiscalConfig(year: number): FiscalConfig {
  return loadFiscalConfigSocle(year, { dir: FISCAL_DATA_DIR });
}
