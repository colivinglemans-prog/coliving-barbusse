import { notFound } from "next/navigation";

/**
 * Toute adresse inconnue sous une langue (`/fr/xyz`, `/de/a/b`) aboutit ici, pour être rendue par
 * `app/[locale]/not-found.tsx` : 404 réel, dans la langue de l'URL, avec en-tête et pied de page.
 * Sans cette route, Next ne passait pas par le layout de langue et servait sa 404 nue. Les routes
 * existantes, statiques ou dynamiques (`blog/[slug]`), restent prioritaires sur un attrape-tout.
 */
export default function UnknownPage() {
  notFound();
}
