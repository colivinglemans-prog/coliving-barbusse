"use client";

import { createContext, useContext } from "react";
import type { Locale, Dictionary } from "./types";
import { fr } from "./dictionaries/fr";
import { en } from "./dictionaries/en";
import { it } from "./dictionaries/it";
import { de } from "./dictionaries/de";
import { es } from "./dictionaries/es";

const dictionaries: Record<Locale, Dictionary> = { fr, en, it, de, es };

interface I18nContextValue {
  locale: Locale;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * La langue vient du segment d'URL (`/fr/…`, `/de/…`), pas d'un état client : il n'y a donc
 * pas de `setLocale`, on change de langue en changeant d'URL. C'est ce que faisait déjà le
 * sélecteur du `Header`, avec un `<Link>` — le `setLocale` qui vivait ici n'avait aucun
 * appelant, et le cookie `locale` qu'il posait aucun lecteur.
 *
 * `<html lang>` est écrit par `app/[locale]/layout.tsx`, qui est le layout **racine** : ce
 * composant n'a plus à le corriger dans un `useEffect` après l'hydratation. C'est ce qui
 * corrige le vrai défaut — le HTML servi à Google et aux lecteurs d'écran annonçait `fr`
 * sur `/de`, `/es` et `/it`, et un `useEffect` ne rattrape ni l'un ni l'autre.
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, t: dictionaries[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
