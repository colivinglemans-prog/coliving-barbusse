import type { Metadata } from "next";
import Link from "next/link";
import PriceGrid from "@sejour/socle/components/PriceGrid";
import {
  jsonLdText,
  lowestTotal,
  priceGridOffer,
  type GridColumn,
  type GridRow,
  type PriceGrid as Grid,
} from "@sejour/socle/lib/price-grid";
import { isLocale, LOCALE_META, type Locale } from "@/lib/i18n";
import { alternatesFor, pageOpenGraph, pageTwitter, pricesPath } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { getPriceGrid } from "@/lib/tarifs";
import { pricesContent } from "./content";

/**
 * « Tarifs » : le prix exact des week-ends, des fêtes (et des courses si `TARIFS_EVENEMENTS=on`), en HTML lisible sans
 * JavaScript — ce que les assistants IA ne trouvaient nulle part (tests du 19/11/2026). Page
 * publique mais discrète : liée depuis le pied de page, le calendrier, les conditions et les
 * séminaires, pas depuis le menu.
 *
 * La page ne fait **que lire** la grille rangée dans Upstash par le cron `/api/cron/price-grid`
 * (toutes les heures) : jamais un appel Beds24 sur le chemin d'un visiteur. Régénérée au plus toutes
 * les 5 minutes (`revalidate`) : la lecture Upstash est servie par le CDN entre deux, et une grille
 * neuve paraît au plus 5 minutes après le calcul. Rien de rangé, ou autre composition : renvoi au
 * calendrier, jamais d'erreur. Grille de plus de 24 h : lignes passées retirées, pas de JSON-LD.
 */
export const revalidate = 300;

const asLocale = (raw: string): Locale => (isLocale(raw) ? raw : "fr");

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = asLocale(raw);
  const c = pricesContent(locale);
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: alternatesFor(locale, pricesPath),
    openGraph: pageOpenGraph(locale, { title: c.metaTitle, description: c.metaDescription, url: `${SITE_URL}${pricesPath(locale)}` }),
    twitter: pageTwitter({ title: c.metaTitle, description: c.metaDescription }),
  };
}

/** Le calendrier de l'accueil, pré-rempli pour ce séjour (lien `nofollow` de la grille). */
function calendarHref(locale: Locale) {
  return (row: GridRow, column: GridColumn) => {
    const party = column.parties[0];
    const q = new URLSearchParams({
      arrivee: row.checkIn,
      depart: row.checkOut,
      adultes: String(party.adults),
      enfants: String(party.children),
    });
    return `/${locale}?${q}#disponibilite`;
  };
}

/** Les fêtes portent un intitulé du moteur de prix (« Noël 2026 ») : traduit ici. */
function localized(grid: Grid, holidays: Record<string, string>): Grid {
  return {
    ...grid,
    rows: grid.rows.map((r) => {
      if (!r.key?.startsWith("fete:")) return r;
      const [, name, year] = r.key.split(":");
      return { ...r, label: `${holidays[name] ?? name} ${year}` };
    }),
  };
}

export default async function PricesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = asLocale(raw);
  const c = pricesContent(locale);
  const tag = LOCALE_META[locale].bcp47;
  const stored = await getPriceGrid();
  const grid = stored ? localized(stored.grid, c.holidays) : null;
  const min = grid?.pricesShown ? lowestTotal(grid, 0) : null;
  const from = min === null ? null : new Intl.NumberFormat(tag, { style: "currency", currency: "EUR" }).format(min);
  const offer = grid && !stored?.stale ? priceGridOffer(grid, `${SITE_URL}${pricesPath(locale)}`) : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {offer && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLdText({
              "@context": "https://schema.org",
              ...offer,
              itemOffered: { "@type": "House", name: "Coliving Barbusse", url: SITE_URL },
            }),
          }}
        />
      )}
      <h1 className="text-2xl font-semibold text-foreground">{c.title}</h1>
      <p className="mt-2 text-secondary">{c.lead(from)}</p>
      <p className="mt-2 mb-8 text-sm text-secondary">{c.house}</p>
      {grid && grid.rows.length > 0 ? (
        <PriceGrid grid={grid} locale={tag} labels={c.grid} linkFor={grid.pricesShown ? calendarHref(locale) : undefined} />
      ) : (
        <p className="rounded-2xl bg-light-bg p-4 text-sm">{c.noPrices}</p>
      )}
      <div className="mt-8 space-y-2 text-sm text-secondary">
        <p>{c.exact}</p>
        <p>
          {c.otherDates}{" "}
          <Link href={`/${locale}#disponibilite`} className="font-medium text-foreground underline">
            {c.calendarLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
