import Link from "next/link";
import type { Metadata } from "next";
import { BLOG_POSTS, getLocalizedPost } from "@/lib/blog/posts";
import type { Locale } from "@/lib/i18n";

const SITE_URL = "https://www.coliving-barbusse.fr";

const DESCRIPTIONS: Record<Locale, string> = {
  fr: "Conseils et guides pratiques pour séjourner au Mans : 24 Heures du Mans, MotoGP, Le Mans Classic, tourisme en Sarthe.",
  en: "Practical guides and tips for your stay in Le Mans: 24 Hours of Le Mans, MotoGP, Le Mans Classic, Sarthe tourism.",
  it: "Consigli e guide pratiche per soggiornare a Le Mans: 24 Ore di Le Mans, MotoGP, Le Mans Classic, turismo nella Sarthe.",
  de: "Praktische Guides und Tipps für Ihren Aufenthalt in Le Mans: 24 Stunden von Le Mans, MotoGP, Le Mans Classic, Tourismus in der Sarthe.",
  es: "Consejos y guías prácticas para tu estancia en Le Mans: 24 Horas de Le Mans, MotoGP, Le Mans Classic, turismo en la Sarthe.",
};

const SUBHEADINGS: Record<Locale, string> = {
  fr: "Guides pratiques pour séjourner au Mans et profiter des grands événements.",
  en: "Practical guides for your stay in Le Mans and major events.",
  it: "Guide pratiche per soggiornare a Le Mans e godersi i grandi eventi.",
  de: "Praktische Guides für Ihren Aufenthalt in Le Mans und die großen Events.",
  es: "Guías prácticas para tu estancia en Le Mans y para disfrutar de los grandes eventos.",
};

const SOLD_OUT_LABEL: Record<Locale, (year: string) => string> = {
  fr: (y) => `Complet pour l'édition ${y}`,
  en: (y) => `Sold out for ${y}`,
  it: (y) => `Tutto esaurito per l'edizione ${y}`,
  de: (y) => `Ausgebucht für die Edition ${y}`,
  es: (y) => `Completo para la edición ${y}`,
};

const DATE_LOCALE: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  it: "it-IT",
  de: "de-DE",
  es: "es-ES",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const title = "Blog — Coliving Barbusse Le Mans";
  const description = DESCRIPTIONS[locale] ?? DESCRIPTIONS.fr;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog`,
      languages: {
        fr: `${SITE_URL}/fr/blog`,
        en: `${SITE_URL}/en/blog`,
        it: `${SITE_URL}/it/blog`,
        de: `${SITE_URL}/de/blog`,
        es: `${SITE_URL}/es/blog`,
        "x-default": `${SITE_URL}/fr/blog`,
      },
    },
  };
}

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const dateLocale = DATE_LOCALE[locale] ?? "fr-FR";
  const heading = "Blog";
  const subheading = SUBHEADINGS[locale] ?? SUBHEADINGS.fr;
  const soldOutLabel = SOLD_OUT_LABEL[locale] ?? SOLD_OUT_LABEL.fr;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{heading}</h1>
      <p className="mt-3 text-secondary">{subheading}</p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        {[...BLOG_POSTS]
          .sort((a, b) => Number(!!a.soldOut) - Number(!!b.soldOut))
          .map((post) => {
          const loc = getLocalizedPost(post, locale);
          const soldOut = !!post.soldOut;
          return (
            <li
              key={post.slug}
              className={`group overflow-hidden rounded-xl border border-border transition-shadow hover:shadow-md ${
                soldOut ? "opacity-75" : ""
              }`}
            >
              <Link href={`/${locale}/blog/${post.slug}`} className="block">
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-cover bg-center ${
                      soldOut ? "grayscale" : ""
                    }`}
                    style={{ backgroundImage: `url(${post.image})` }}
                  />
                  {soldOut && (
                    <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
                      {soldOutLabel(post.date.slice(0, 4))}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <time className="text-xs font-medium uppercase tracking-wide text-secondary">
                    {new Date(post.date).toLocaleDateString(dateLocale, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                  <h2 className="mt-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                    {loc.title}
                  </h2>
                  <p className="mt-2 text-sm text-secondary">{loc.excerpt}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
