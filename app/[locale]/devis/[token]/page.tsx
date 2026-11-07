import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QuoteSummary from "@sejour/socle/components/QuoteSummary";
import { isLocale } from "@sejour/socle/lib/locales";
import { loadQuotePage } from "@sejour/socle/lib/quote-page";
import { quoteLabels } from "@sejour/socle/lib/quote-labels";
import { quoteKeysFromEnv } from "@sejour/socle/lib/quote-token";
import { STAY_AGENT, STAY_QUOTE, stayAgentDeps } from "@/lib/agent";
import { PROPERTY_ID } from "@/lib/beds24-property";

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
        conditionsUrl={`/${locale}#disponibilite`}
        header={<p className="text-sm uppercase tracking-wide text-secondary">{STAY_AGENT.facts(locale).name}</p>}
      />
    </div>
  );
}
