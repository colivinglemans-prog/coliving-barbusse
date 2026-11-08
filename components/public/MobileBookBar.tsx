"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";

/**
 * Barre « Réserver » fixée en bas de l'écran, sur mobile seulement.
 *
 * Sur téléphone, le bouton de l'en-tête est rangé dans le menu burger : depuis un article de
 * blog, il fallait six gestes pour atteindre le calendrier. 77 % des clics Google arrivent
 * sur mobile (Search Console, 90 jours au 2026-11-08), d'où cette barre. Elle n'a pas sa
 * place dans l'en-tête : le nom, les deux lignes d'accroche, la langue et le burger
 * occupent déjà toute la largeur d'un écran de 360 px.
 *
 * Elle s'efface quand un bloc de réservation est à l'écran (le calendrier de l'accueil,
 * le bloc d'événement d'un article) : deux boutons pour la même action se concurrencent.
 * L'espaceur final empêche la barre de recouvrir le bas du pied de page.
 */

/** Les ancres des blocs de réservation : la barre s'efface quand l'un d'eux est visible. */
const BOOKING_ANCHORS = ["disponibilite", "reserver-evenement"];

/**
 * Pages où la barre n'a rien à faire : le devis (il porte son propre lien de réservation)
 * et le guide d'arrivée (le voyageur a déjà réservé).
 */
const HIDDEN_SECTIONS = new Set(["devis", "guide-arrivee"]);

export default function MobileBookBar() {
  const { locale, t } = useTranslation();
  const pathname = usePathname();
  // L'état garde le chemin qu'il décrit : après une navigation, l'ancien « masqué » ne vaut plus.
  const [seen, setSeen] = useState<{ path: string; hidden: boolean }>({ path: "", hidden: false });
  const hidden = seen.path === pathname && seen.hidden;

  // La barre vit dans le layout et survit aux navigations : on relit les ancres de chaque page.
  useEffect(() => {
    const targets = BOOKING_ANCHORS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (targets.length === 0 || typeof IntersectionObserver === "undefined") return;
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setSeen({ path: pathname, hidden: visible.size > 0 });
    });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  if (HIDDEN_SECTIONS.has((pathname ?? "").split("/")[2] ?? "")) return null;

  return (
    <>
      <div aria-hidden className="h-20 md:hidden" />
      <div
        aria-hidden={hidden || undefined}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-white/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-200 md:hidden ${
          hidden ? "pointer-events-none translate-y-full" : ""
        }`}
      >
        <Link
          href={`/${locale}#disponibilite`}
          tabIndex={hidden ? -1 : undefined}
          className="block rounded-full bg-primary py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          {t.header.book}
        </Link>
      </div>
    </>
  );
}
