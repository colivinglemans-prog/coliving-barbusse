import Link from "next/link";
import type { Metadata } from "next";
import { alternatesFor, blogPath, pageOpenGraph, pageTwitter } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import BlogCard from "@/components/public/BlogCard";
import BlogListFilter from "@/components/public/BlogListFilter";
import {
  filterKeysOf,
  listedPosts,
  sortForList,
  todayInParis,
  visibleFilters,
} from "@/lib/blog/journey";

/**
 * Régénérée chaque jour : l'ordre (événements à venir d'abord) et les badges « Édition terminée »
 * dépendent de la date du jour, qu'une page figée au build garderait indéfiniment.
 */
export const revalidate = 86400;

const DESCRIPTIONS: Record<Locale, string> = {
  fr: "Conseils et guides pratiques pour séjourner en groupe au Mans : 24 Heures du Mans, MotoGP, Le Mans Classic, tourisme en Sarthe.",
  en: "Practical guides and tips for a group stay in Le Mans: 24 Hours of Le Mans, MotoGP, Le Mans Classic and tourism in the Sarthe.",
  it: "Consigli e guide pratiche per soggiornare in gruppo a Le Mans: 24 Ore di Le Mans, MotoGP, Le Mans Classic, turismo nella Sarthe.",
  de: "Praktische Guides und Tipps für Ihren Gruppenaufenthalt in Le Mans: 24 Stunden von Le Mans, MotoGP, Le Mans Classic, Tourismus in der Sarthe.",
  es: "Consejos y guías prácticas para tu estancia en grupo en Le Mans: 24 Horas de Le Mans, MotoGP, Le Mans Classic, turismo en la Sarthe.",
};

const SUBHEADINGS: Record<Locale, string> = {
  fr: "Guides pratiques pour séjourner au Mans et profiter des grands événements.",
  en: "Practical guides for your stay in Le Mans and major events.",
  it: "Guide pratiche per soggiornare a Le Mans e godersi i grandi eventi.",
  de: "Praktische Guides für Ihren Aufenthalt in Le Mans und die großen Events.",
  es: "Guías prácticas para tu estancia en Le Mans y para disfrutar de los grandes eventos.",
};

/**
 * Un titre par langue : le même « Blog — Coliving Barbusse Le Mans » servait aux cinq index,
 * ce que les moteurs lisent comme cinq pages en double (audit du 2026-11-08).
 */
const TITLES: Record<Locale, string> = {
  fr: "Blog — séjourner au Mans en groupe | Coliving Barbusse",
  en: "Blog — staying in Le Mans as a group | Coliving Barbusse",
  it: "Blog — soggiornare a Le Mans in gruppo | Coliving Barbusse",
  de: "Blog — Gruppenaufenthalt in Le Mans | Coliving Barbusse",
  es: "Blog — estancias en grupo en Le Mans | Coliving Barbusse",
};

const CTA: Record<Locale, { text: string; link: string }> = {
  fr: { text: "Vous avez déjà vos dates ?", link: "Voir les disponibilités" },
  en: { text: "Already know your dates?", link: "Check availability" },
  it: { text: "Hai già le tue date?", link: "Vedi le disponibilità" },
  de: { text: "Kennen Sie Ihre Termine schon?", link: "Verfügbarkeit ansehen" },
  es: { text: "¿Ya tienes tus fechas?", link: "Ver la disponibilidad" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const title = TITLES[locale];
  const description = DESCRIPTIONS[locale] ?? DESCRIPTIONS.fr;

  return {
    title,
    description,
    alternates: alternatesFor(locale, blogPath),
    // Sans ce bloc, l'index héritait de l'`og:title` de l'accueil : un lien partagé vers le blog
    // s'annonçait comme la page d'accueil.
    openGraph: pageOpenGraph(locale, { title, description, url: `${SITE_URL}${blogPath(locale)}` }),
    twitter: pageTwitter({ title, description }),
  };
}

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;
  const subheading = SUBHEADINGS[locale] ?? SUBHEADINGS.fr;
  const cta = CTA[locale] ?? CTA.fr;

  const today = todayInParis();
  // Les archives (`supersededBy`) sortent de la liste, comme du sitemap : elles restent en ligne,
  // en noindex, pour les liens existants.
  const listed = listedPosts();
  const posts = sortForList(listed, today);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Blog</h1>
      <p className="mt-3 text-secondary">{subheading}</p>

      <BlogListFilter locale={locale} filters={visibleFilters(listed)}>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} locale={locale} today={today} filterKeys={filterKeysOf(post)} />
          ))}
        </ul>
      </BlogListFilter>

      <p className="mt-10 rounded-xl border border-border bg-light-bg px-5 py-4 text-sm text-foreground">
        {cta.text}{" "}
        <Link href={`/${locale}#disponibilite`} className="font-semibold text-primary underline">
          {cta.link}
        </Link>
      </p>
    </div>
  );
}
