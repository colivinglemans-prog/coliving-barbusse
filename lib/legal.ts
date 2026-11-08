/**
 * Identité de l'éditeur du site, pour la page « Mentions légales ».
 *
 * La maison du Mans est exploitée par l'entreprise individuelle d'Alexandre DELAN — entité
 * distincte de la SCI qui détient l'appartement d'Albiez : ne jamais reprendre ici les
 * informations de l'autre structure. Ces données sont publiques (annuaire des entreprises) ;
 * l'adresse et les coordonnées de contact restent lues dans `PROPERTY_INFO`.
 */
export const LEGAL_ENTITY = {
  name: "Alexandre DELAN",
  /** Statut juridique, par langue. */
  legalForm: {
    fr: "Entrepreneur individuel (EI)",
    en: "Sole proprietor (French \"entrepreneur individuel\", EI)",
    de: "Einzelunternehmer (französisch „entrepreneur individuel“, EI)",
    es: "Empresario individual (en francés « entrepreneur individuel », EI)",
    it: "Imprenditore individuale (in francese « entrepreneur individuel », EI)",
  },
  siren: "535 071 757",
  publicationDirector: "Alexandre DELAN",
} as const;

/** Hébergeur du site — adresse vérifiée sur vercel.com/legal/terms le 2026-11-08. */
export const HOST_PROVIDER = {
  name: "Vercel Inc.",
  address: "440 N Barranca Ave #4133, Covina, CA 91723",
  country: { fr: "États-Unis", en: "United States", de: "USA", es: "Estados Unidos", it: "Stati Uniti" },
  website: "https://vercel.com",
} as const;
