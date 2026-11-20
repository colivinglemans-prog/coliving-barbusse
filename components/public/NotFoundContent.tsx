"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslation } from "@/lib/i18n";

/**
 * Corps de la page 404 (`app/[locale]/not-found.tsx`). Client parce que la langue vient du
 * contexte : un `not-found` ne reçoit pas les `params` de la route, seul son `generateMetadata`
 * les a. En-tête, pied de page et barre de réservation mobile viennent du layout de langue.
 */
export default function NotFoundContent() {
  const { t, locale } = useTranslation();
  const base = `/${locale}`;
  const title = `${t.notFound.title} — Coliving Barbusse`;

  /*
   * Next rend la 404 côté navigateur (le HTML serveur n'est qu'une coquille : statut 404, titre
   * et `noindex` de `generateMetadata`). Au montage, il réapplique les métadonnées du layout, donc
   * le titre de l'accueil : on remet celui de la 404.
   */
  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-semibold text-foreground">{t.notFound.title}</h1>
      <p className="mt-4 text-secondary">{t.notFound.text}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={`${base}#disponibilite`}
          className="rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-dark"
        >
          {t.notFound.book}
        </Link>
        <Link
          href={base}
          className="rounded-lg border border-foreground px-6 py-3 font-medium text-foreground transition-colors hover:bg-light-bg"
        >
          {t.notFound.home}
        </Link>
      </div>
    </div>
  );
}
