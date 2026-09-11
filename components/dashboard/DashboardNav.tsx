"use client";

import SocleDashboardNav, {
  type DashboardLink,
} from "@sejour/socle/components/DashboardNav";
import type { DashboardRole } from "@/lib/auth";

/**
 * La barre de navigation du dashboard — structure, tiroir mobile et déconnexion — vient du
 * socle (`@sejour/socle/components/DashboardNav`). Ne restent ici que les **données** : le
 * nom du bien et la liste des écrans.
 *
 * Les couleurs passent désormais par les sept tokens sémantiques du thème : `text-primary`
 * vaut `#ff385c`, le rose Airbnb exact, là où `text-rose-500` en était une approximation
 * (`#f43f5e`) recopiée à sept endroits.
 */
const LIENS: DashboardLink[] = [
  { href: "/dashboard", label: "Statistiques", adminOnly: true },
  { href: "/dashboard/calendar", label: "Calendrier", adminOnly: false },
  { href: "/dashboard/heating", label: "Chauffage", adminOnly: false },
  { href: "/dashboard/water-heater", label: "Eau chaude", adminOnly: false },
  { href: "/dashboard/invoices", label: "Factures", adminOnly: true },
  { href: "/dashboard/taxe-sejour", label: "Taxe de séjour", adminOnly: true },
  { href: "/dashboard/fiscal", label: "Fiscalité", adminOnly: true },
  /*
   * Le guide voyageurs est une page publique du site, pas un écran du dashboard : il s'ouvre
   * dans un onglet à part, pour qu'on puisse le relire sans perdre le calendrier. Admin
   * seulement — c'est l'administrateur qui l'envoie aux voyageurs.
   */
  { href: "/fr/guide-arrivee", label: "Guide voyageurs", adminOnly: true, external: true },
];

/** Réservé à l'administrateur ici, contrairement à Albiez : le rôle restreint pilote le
 *  chauffage et l'eau chaude, il n'a rien à aller chercher sur la vitrine. */
const VITRINE: DashboardLink = { href: "/", label: "Retour au site", adminOnly: true };

export default function DashboardNav({ role }: { role?: DashboardRole }) {
  return (
    <SocleDashboardNav
      title="Coliving Barbusse"
      links={LIENS}
      siteLink={VITRINE}
      role={role}
    />
  );
}
