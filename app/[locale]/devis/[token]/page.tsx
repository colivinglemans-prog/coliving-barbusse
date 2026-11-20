import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QuoteSummary from "@sejour/socle/components/QuoteSummary";
import { isLocale } from "@sejour/socle/lib/locales";
import { loadQuotePage } from "@sejour/socle/lib/quote-page";
import { cancellationText, quoteLabels } from "@sejour/socle/lib/quote-labels";
import { quoteKeysFromEnv } from "@sejour/socle/lib/quote-token";
import { STAY_AGENT, STAY_QUOTE, stayAgentDeps } from "@/lib/agent";
import { PROPERTY_ID } from "@/lib/beds24-property";
import { INCLUDED } from "@/lib/included";
import { CANCELLATION_POLICY } from "@/lib/property-info";
import { CHILDREN_NOTE, PAYMENT_NOTE } from "@/lib/quote-notes";
import { conditionsPath } from "@/lib/seo";

/**
 * Le devis partagé par une IA (`/api/agent/quote` → `quoteUrl`). Revérifié à chaque affichage :
 * voir `@sejour/socle/lib/quote-page`. Jamais indexé : une page par jeton, qui expire.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

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
