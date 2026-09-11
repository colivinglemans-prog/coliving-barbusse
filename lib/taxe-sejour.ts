import type { TaxeSejourBareme } from "@sejour/socle/lib/taxe-sejour";

/**
 * Le barème voté par Le Mans Métropole, et rien d'autre.
 *
 * Le moteur — assiette par personne et par nuitée, plafonnement, part départementale,
 * exonération des mineurs, détection de la provenance, regroupements par trimestre et par
 * canal — vit dans `@sejour/socle/lib/taxe-sejour`. Ne reste ici que la **délibération**,
 * qui est propre à la collectivité : chacune vote la sienne au titre de l'article L.2333-30
 * du CGCT, et Albiez-Montrond n'est pas Le Mans.
 *
 * Source des trois nombres : délibération de Le Mans Métropole, meublé de tourisme non
 * classé — 2,5 % du prix de la nuitée hors taxes par personne accueillie, plafonné à 4,00 €
 * par personne et par nuitée, majoré de 10 % au titre de la part départementale (Sarthe).
 */
export const TAXE_SEJOUR_CONFIG: TaxeSejourBareme = {
  collectivite: "Le Mans Métropole",
  regime: "Meublé de tourisme non classé",
  tauxPourcent: 0.025,
  plafondParPersonneNuit: 4.0,
  tauxDepartemental: 0.1,
};

export {
  computeTaxeSejour,
  ecartDeCollecte,
  groupByChannel,
  groupByQuarter,
  type ChannelTotals,
  type MonthTotals,
  type Provenance,
  type QuarterTotals,
  type TaxeSejourBareme,
  type TaxeSejourLine,
} from "@sejour/socle/lib/taxe-sejour";
