import type { InvoiceTemplateConfig } from "@sejour/socle/lib/invoice-config";

/**
 * Ce que ce site imprime sur ses factures.
 *
 * Le mécanisme — lecture des variables `INVOICE_*`, gabarit React-PDF, numérotation — vit
 * dans `@sejour/socle/lib/invoice-config`, `.../invoice-pdf` et `.../invoice-number`. Ne
 * restent ici que les **valeurs** : l'identité visuelle et les mentions légales.
 *
 * ⚠️ **La mention de TVA est celle du régime, pas celle du site.** L'article 293 B du CGI
 * dispense de TVA l'entreprise individuelle sous les seuils de la franchise en base, ce qui
 * est le cas de cette activité de location meublée non professionnelle. Une autre entité,
 * une autre mention : elle est donc obligatoire dans `InvoiceMentions`, sans valeur par
 * défaut, pour qu'aucune facture ne parte avec la mention d'un régime qui n'est pas le sien.
 *
 * L'émetteur — raison sociale, adresse, IBAN — reste dans l'environnement : ce dépôt est
 * public.
 */
export const INVOICE_TEMPLATE: InvoiceTemplateConfig = {
  branding: {
    name: "COLIVING BARBUSSE",
    tagline: "Location saisonnière — Le Mans",
    accentColor: "#e11d48",
    logo: {
      viewBox: "0 0 32 32",
      size: 40,
      background: "#FF385C",
      radius: 6,
      path: "M16 6L5 15h3v10h6v-7h4v7h6V15h3L16 6z",
      pathColor: "#fff",
    },
  },
  mentions: {
    documentSubject: "Facture Coliving Barbusse",
    subject: "Location saisonnière meublée — Coliving Barbusse, Le Mans",
    vatNotice:
      "TVA non applicable, art. 293B du CGI (location meublée non professionnelle).",
    footerPrefix: "Coliving Barbusse",
  },
};

/**
 * Identifiant de l'entité dans la clé du compteur Upstash.
 *
 * Il n'apparaît **jamais** sur la facture : le numéro imprimé reste `AAAA-NNN`. Il ne sert
 * qu'à empêcher deux entités branchées sur le même Upstash de se partager une série — voir
 * l'en-tête de `@sejour/socle/lib/invoice-number`.
 */
export const INVOICE_COUNTER_PREFIX = "barbusse";

export {
  getInvoiceConfig,
  InvoiceConfigError,
  type InvoiceIssuerConfig,
  type InvoiceTemplateConfig,
} from "@sejour/socle/lib/invoice-config";
