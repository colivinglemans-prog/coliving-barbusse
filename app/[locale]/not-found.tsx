import type { Metadata } from "next";
import NotFoundContent from "@/components/public/NotFoundContent";
import { isLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { fr } from "@/lib/i18n/dictionaries/fr";
import { en } from "@/lib/i18n/dictionaries/en";
import { it } from "@/lib/i18n/dictionaries/it";
import { de } from "@/lib/i18n/dictionaries/de";
import { es } from "@/lib/i18n/dictionaries/es";

const DICTIONARIES: Record<Locale, Dictionary> = { fr, en, it, de, es };

/**
 * Page 404 du site, dans la langue du segment, avec en-tête et pied de page (layout de langue).
 *
 * Elle reçoit les `notFound()` des pages (`/fr/blog/<inconnu>`, devis expiré…) et, par
 * `[...rest]/page.tsx`, toute adresse inconnue sous une langue (`/de/xyz`). Sans ce fichier, Next
 * servait sa 404 nue : pas de `lang`, pas de navigation, et le titre de l'accueil hérité du layout.
 *
 * Métadonnées : un `not-found` ne reçoit pas les `params` dans son composant, mais son
 * `generateMetadata` si — c'est lui qui remplace le titre et la description de l'accueil.
 * `noindex` en plus de celui que Next pose sur toute réponse 404. Statut HTTP : 404 réel.
 *
 * Limite de Next 16 (deux layouts racines, pas d'`app/layout.tsx`) : un `notFound()` sort en
 * « coquille d'erreur » — le HTML serveur porte statut, titre et `noindex`, mais un `<body>` vide ;
 * le navigateur rend ensuite cette page dans le layout de langue (vérifié au navigateur).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = DICTIONARIES[locale && isLocale(locale) ? locale : "fr"].notFound;
  return {
    title: `${t.title} — Coliving Barbusse`,
    description: t.text,
    robots: { index: false, follow: true },
  };
}

export default function NotFound() {
  return <NotFoundContent />;
}
