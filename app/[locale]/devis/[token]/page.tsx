import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QuoteSummary from "@sejour/socle/components/QuoteSummary";
import { isLocale } from "@sejour/socle/lib/locales";
import { loadQuotePage } from "@sejour/socle/lib/quote-page";
import { cancellationText, quoteLabels } from "@sejour/socle/lib/quote-labels";
import { quoteKeysFromEnv } from "@sejour/socle/lib/quote-token";
import { STAY_AGENT, STAY_QUOTE, stayAgentDeps } from "@/lib/agent";
import { PROPERTY_ID } from "@/lib/beds24-property";
import { CANCELLATION_POLICY } from "@/lib/property-info";
import { conditionsPath } from "@/lib/seo";

/**
 * Le devis partagé par une IA (`/api/agent/quote` → `quoteUrl`). Revérifié à chaque affichage :
 * voir `@sejour/socle/lib/quote-page`. Jamais indexé : une page par jeton, qui expire.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

const INCLUDED: Record<string, string> = {
  fr: "Draps, serviettes, ménage de fin de séjour et taxe de séjour compris.",
  en: "Bed linen, towels, end-of-stay cleaning and tourist tax included.",
  de: "Bettwäsche, Handtücher, Endreinigung und Kurtaxe inklusive.",
  es: "Ropa de cama, toallas, limpieza final y tasa turística incluidas.",
  it: "Biancheria, asciugamani, pulizia finale e tassa di soggiorno incluse.",
};

/** L'accueil des jeunes enfants, rappelé sous le prix (décision de l'hôte du 2026-11-07). */
/** Rappel du paiement sur le devis (relevé par le test voyageur : le devis ne le disait pas). */
const PAYMENT_NOTE: Record<string, string> = {
  fr: "Paiement : 100 % à la réservation, par carte, sur la page sécurisée Beds24.",
  en: "Payment: 100% at booking, by card, on the secure Beds24 page.",
  de: "Zahlung: 100 % bei der Buchung, per Karte, auf der sicheren Beds24-Seite.",
  es: "Pago: 100 % al reservar, con tarjeta, en la página segura de Beds24.",
  it: "Pagamento: 100% alla prenotazione, con carta, sulla pagina sicura di Beds24.",
};

const CHILDREN_NOTE: Record<string, string> = {
  fr: "Maison pensée pour les ados et les adultes : rien n'est aménagé pour les jeunes enfants (escaliers non protégés, tabourets hauts, salle de sport). Les moins de 10 ans sont acceptés sous la responsabilité de leurs parents.",
  en: "A house designed for teenagers and adults: nothing is set up for young children (unprotected stairs, high stools, gym). Children under 10 are welcome under their parents' responsibility.",
  de: "Ein Haus für Jugendliche und Erwachsene: Für kleine Kinder ist nichts eingerichtet (ungesicherte Treppen, hohe Hocker, Fitnessraum). Kinder unter 10 Jahren sind unter der Verantwortung ihrer Eltern willkommen.",
  es: "Una casa pensada para adolescentes y adultos: nada está preparado para niños pequeños (escaleras sin protección, taburetes altos, gimnasio). Los menores de 10 años son bienvenidos bajo la responsabilidad de sus padres.",
  it: "Una casa pensata per ragazzi e adulti: nulla è predisposto per i bambini piccoli (scale non protette, sgabelli alti, palestra). I bambini sotto i 10 anni sono accettati sotto la responsabilità dei genitori.",
};

export default async function QuotePage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  let keys;
  try {
    keys = quoteKeysFromEnv();
  } catch {
    notFound();
  }
  const state = await loadQuotePage(token, PROPERTY_ID, STAY_QUOTE, stayAgentDeps(), keys);
  const calendarUrl = (s: { checkIn: string; checkOut: string; adults: number; children: number }) =>
    `/${locale}?${new URLSearchParams({ arrivee: s.checkIn, depart: s.checkOut, adultes: String(s.adults), enfants: String(s.children) })}#disponibilite`;
  return (
    <div className="pt-24">
      <QuoteSummary
        state={state}
        lang={locale}
        labels={quoteLabels(locale, INCLUDED[locale] ?? INCLUDED.fr)}
        calendarUrl={calendarUrl}
        conditionsUrl={conditionsPath(locale)}
        cancellation={cancellationText(CANCELLATION_POLICY, locale)}
        notes={[PAYMENT_NOTE[locale] ?? PAYMENT_NOTE.fr, CHILDREN_NOTE[locale] ?? CHILDREN_NOTE.fr]}
        header={<p className="text-sm uppercase tracking-wide text-secondary">{STAY_AGENT.facts(locale).name}</p>}
      />
    </div>
  );
}
