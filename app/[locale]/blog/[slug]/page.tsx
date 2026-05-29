import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BLOG_POSTS, getPostBySlug, getLocalizedPost } from "@/lib/blog/posts";
import type { Locale } from "@/lib/i18n";

import Article24hDuMans2026 from "@/lib/blog/content/fr/ou-se-loger-24h-du-mans-2026";
import Article24hMoto from "@/lib/blog/content/fr/24-heures-moto-le-mans";
import ArticleMotoGP from "@/lib/blog/content/fr/motogp-france-le-mans";
import ArticleLeMansClassic from "@/lib/blog/content/fr/le-mans-classic";
import ArticleJardin from "@/lib/blog/content/fr/jardin-securise-le-mans";
import ArticleGPExplorer from "@/lib/blog/content/fr/gp-explorer-le-mans";
import ArticleTourisme from "@/lib/blog/content/fr/que-visiter-le-mans-sarthe";
import ArticleRestos from "@/lib/blog/content/fr/restos-bars-magasins-le-mans";
import ArticleEntreprises from "@/lib/blog/content/fr/entreprises-proches-le-mans";
import ArticleHippodrome from "@/lib/blog/content/fr/hippodrome-des-hunaudieres";
import Article24hRollers from "@/lib/blog/content/fr/24-heures-rollers-le-mans";
import ArticleSeminaire from "@/lib/blog/content/fr/seminaire-entreprise-le-mans";
import ArticleSWSKarting from "@/lib/blog/content/fr/sws-karting-finals-le-mans";
import Article24hCamions from "@/lib/blog/content/fr/24-heures-camions-le-mans";
import ArticleMondialKarting from "@/lib/blog/content/fr/championnat-monde-karting-kz-le-mans";

import ArticleEN24hDuMans2026 from "@/lib/blog/content/en/ou-se-loger-24h-du-mans-2026";
import ArticleEN24hMoto from "@/lib/blog/content/en/24-heures-moto-le-mans";
import ArticleENMotoGP from "@/lib/blog/content/en/motogp-france-le-mans";
import ArticleENLeMansClassic from "@/lib/blog/content/en/le-mans-classic";
import ArticleENJardin from "@/lib/blog/content/en/jardin-securise-le-mans";
import ArticleENGPExplorer from "@/lib/blog/content/en/gp-explorer-le-mans";
import ArticleENTourisme from "@/lib/blog/content/en/que-visiter-le-mans-sarthe";
import ArticleENRestos from "@/lib/blog/content/en/restos-bars-magasins-le-mans";
import ArticleENEntreprises from "@/lib/blog/content/en/entreprises-proches-le-mans";
import ArticleENHippodrome from "@/lib/blog/content/en/hippodrome-des-hunaudieres";
import ArticleEN24hRollers from "@/lib/blog/content/en/24-heures-rollers-le-mans";
import ArticleENSeminaire from "@/lib/blog/content/en/seminaire-entreprise-le-mans";
import ArticleENSWSKarting from "@/lib/blog/content/en/sws-karting-finals-le-mans";
import ArticleEN24hCamions from "@/lib/blog/content/en/24-heures-camions-le-mans";
import ArticleENMondialKarting from "@/lib/blog/content/en/championnat-monde-karting-kz-le-mans";

import ArticleIT24hDuMans2026 from "@/lib/blog/content/it/ou-se-loger-24h-du-mans-2026";
import ArticleIT24hMoto from "@/lib/blog/content/it/24-heures-moto-le-mans";
import ArticleITMotoGP from "@/lib/blog/content/it/motogp-france-le-mans";
import ArticleITLeMansClassic from "@/lib/blog/content/it/le-mans-classic";
import ArticleITJardin from "@/lib/blog/content/it/jardin-securise-le-mans";
import ArticleITGPExplorer from "@/lib/blog/content/it/gp-explorer-le-mans";
import ArticleITTourisme from "@/lib/blog/content/it/que-visiter-le-mans-sarthe";
import ArticleITRestos from "@/lib/blog/content/it/restos-bars-magasins-le-mans";
import ArticleITEntreprises from "@/lib/blog/content/it/entreprises-proches-le-mans";
import ArticleITHippodrome from "@/lib/blog/content/it/hippodrome-des-hunaudieres";
import ArticleIT24hRollers from "@/lib/blog/content/it/24-heures-rollers-le-mans";
import ArticleITSeminaire from "@/lib/blog/content/it/seminaire-entreprise-le-mans";
import ArticleITSWSKarting from "@/lib/blog/content/it/sws-karting-finals-le-mans";
import ArticleIT24hCamions from "@/lib/blog/content/it/24-heures-camions-le-mans";
import ArticleITMondialKarting from "@/lib/blog/content/it/championnat-monde-karting-kz-le-mans";

import ArticleDE24hDuMans2026 from "@/lib/blog/content/de/ou-se-loger-24h-du-mans-2026";
import ArticleDE24hMoto from "@/lib/blog/content/de/24-heures-moto-le-mans";
import ArticleDEMotoGP from "@/lib/blog/content/de/motogp-france-le-mans";
import ArticleDELeMansClassic from "@/lib/blog/content/de/le-mans-classic";
import ArticleDEJardin from "@/lib/blog/content/de/jardin-securise-le-mans";
import ArticleDEGPExplorer from "@/lib/blog/content/de/gp-explorer-le-mans";
import ArticleDETourisme from "@/lib/blog/content/de/que-visiter-le-mans-sarthe";
import ArticleDERestos from "@/lib/blog/content/de/restos-bars-magasins-le-mans";
import ArticleDEEntreprises from "@/lib/blog/content/de/entreprises-proches-le-mans";
import ArticleDEHippodrome from "@/lib/blog/content/de/hippodrome-des-hunaudieres";
import ArticleDE24hRollers from "@/lib/blog/content/de/24-heures-rollers-le-mans";
import ArticleDESeminaire from "@/lib/blog/content/de/seminaire-entreprise-le-mans";
import ArticleDESWSKarting from "@/lib/blog/content/de/sws-karting-finals-le-mans";
import ArticleDE24hCamions from "@/lib/blog/content/de/24-heures-camions-le-mans";
import ArticleDEMondialKarting from "@/lib/blog/content/de/championnat-monde-karting-kz-le-mans";

import ArticleES24hDuMans2026 from "@/lib/blog/content/es/ou-se-loger-24h-du-mans-2026";
import ArticleES24hMoto from "@/lib/blog/content/es/24-heures-moto-le-mans";
import ArticleESMotoGP from "@/lib/blog/content/es/motogp-france-le-mans";
import ArticleESLeMansClassic from "@/lib/blog/content/es/le-mans-classic";
import ArticleESJardin from "@/lib/blog/content/es/jardin-securise-le-mans";
import ArticleESGPExplorer from "@/lib/blog/content/es/gp-explorer-le-mans";
import ArticleESTourisme from "@/lib/blog/content/es/que-visiter-le-mans-sarthe";
import ArticleESRestos from "@/lib/blog/content/es/restos-bars-magasins-le-mans";
import ArticleESEntreprises from "@/lib/blog/content/es/entreprises-proches-le-mans";
import ArticleESHippodrome from "@/lib/blog/content/es/hippodrome-des-hunaudieres";
import ArticleES24hRollers from "@/lib/blog/content/es/24-heures-rollers-le-mans";
import ArticleESSeminaire from "@/lib/blog/content/es/seminaire-entreprise-le-mans";
import ArticleESSWSKarting from "@/lib/blog/content/es/sws-karting-finals-le-mans";
import ArticleES24hCamions from "@/lib/blog/content/es/24-heures-camions-le-mans";
import ArticleESMondialKarting from "@/lib/blog/content/es/championnat-monde-karting-kz-le-mans";

const SITE_URL = "https://www.coliving-barbusse.fr";

const CONTENT: Record<string, Record<Locale, React.ComponentType>> = {
  "jardin-securise-le-mans": {
    fr: ArticleJardin,
    en: ArticleENJardin,
    it: ArticleITJardin,
    de: ArticleDEJardin,
    es: ArticleESJardin,
  },
  "ou-se-loger-24h-du-mans-2026": {
    fr: Article24hDuMans2026,
    en: ArticleEN24hDuMans2026,
    it: ArticleIT24hDuMans2026,
    de: ArticleDE24hDuMans2026,
    es: ArticleES24hDuMans2026,
  },
  "24-heures-moto-le-mans": {
    fr: Article24hMoto,
    en: ArticleEN24hMoto,
    it: ArticleIT24hMoto,
    de: ArticleDE24hMoto,
    es: ArticleES24hMoto,
  },
  "motogp-france-le-mans": {
    fr: ArticleMotoGP,
    en: ArticleENMotoGP,
    it: ArticleITMotoGP,
    de: ArticleDEMotoGP,
    es: ArticleESMotoGP,
  },
  "le-mans-classic": {
    fr: ArticleLeMansClassic,
    en: ArticleENLeMansClassic,
    it: ArticleITLeMansClassic,
    de: ArticleDELeMansClassic,
    es: ArticleESLeMansClassic,
  },
  "gp-explorer-le-mans": {
    fr: ArticleGPExplorer,
    en: ArticleENGPExplorer,
    it: ArticleITGPExplorer,
    de: ArticleDEGPExplorer,
    es: ArticleESGPExplorer,
  },
  "que-visiter-le-mans-sarthe": {
    fr: ArticleTourisme,
    en: ArticleENTourisme,
    it: ArticleITTourisme,
    de: ArticleDETourisme,
    es: ArticleESTourisme,
  },
  "restos-bars-magasins-le-mans": {
    fr: ArticleRestos,
    en: ArticleENRestos,
    it: ArticleITRestos,
    de: ArticleDERestos,
    es: ArticleESRestos,
  },
  "entreprises-proches-le-mans": {
    fr: ArticleEntreprises,
    en: ArticleENEntreprises,
    it: ArticleITEntreprises,
    de: ArticleDEEntreprises,
    es: ArticleESEntreprises,
  },
  "hippodrome-des-hunaudieres": {
    fr: ArticleHippodrome,
    en: ArticleENHippodrome,
    it: ArticleITHippodrome,
    de: ArticleDEHippodrome,
    es: ArticleESHippodrome,
  },
  "24-heures-rollers-le-mans": {
    fr: Article24hRollers,
    en: ArticleEN24hRollers,
    it: ArticleIT24hRollers,
    de: ArticleDE24hRollers,
    es: ArticleES24hRollers,
  },
  "seminaire-entreprise-le-mans": {
    fr: ArticleSeminaire,
    en: ArticleENSeminaire,
    it: ArticleITSeminaire,
    de: ArticleDESeminaire,
    es: ArticleESSeminaire,
  },
  "sws-karting-finals-le-mans": {
    fr: ArticleSWSKarting,
    en: ArticleENSWSKarting,
    it: ArticleITSWSKarting,
    de: ArticleDESWSKarting,
    es: ArticleESSWSKarting,
  },
  "24-heures-camions-le-mans": {
    fr: Article24hCamions,
    en: ArticleEN24hCamions,
    it: ArticleIT24hCamions,
    de: ArticleDE24hCamions,
    es: ArticleES24hCamions,
  },
  "championnat-monde-karting-kz-le-mans": {
    fr: ArticleMondialKarting,
    en: ArticleENMondialKarting,
    it: ArticleITMondialKarting,
    de: ArticleDEMondialKarting,
    es: ArticleESMondialKarting,
  },
};

const OG_LOCALES: Record<Locale, string> = {
  fr: "fr_FR",
  en: "en_US",
  it: "it_IT",
  de: "de_DE",
  es: "es_ES",
};

const DATE_LOCALE: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  it: "it-IT",
  de: "de-DE",
  es: "es-ES",
};

const BACK_LABEL: Record<Locale, string> = {
  fr: "← Retour au blog",
  en: "← Back to blog",
  it: "← Torna al blog",
  de: "← Zurück zum Blog",
  es: "← Volver al blog",
};

const SOLD_OUT_TITLE: Record<Locale, string> = {
  fr: "Complet pour cette édition",
  en: "Sold out for this edition",
  it: "Tutto esaurito per questa edizione",
  de: "Für diese Edition ausgebucht",
  es: "Completo para esta edición",
};

const SOLD_OUT_BODY: Record<Locale, (nextEdition: string) => string> = {
  fr: (e) => `Merci à tous nos voyageurs ! Rendez-vous pour l'édition ${e}.`,
  en: (e) => `Thank you to everyone who booked! We'll welcome new travellers for the ${e} edition.`,
  it: (e) => `Grazie a tutti i nostri viaggiatori! Appuntamento all'edizione ${e}.`,
  de: (e) => `Danke an alle unsere Reisenden! Wir freuen uns auf die Edition ${e}.`,
  es: (e) => `¡Gracias a todos nuestros viajeros! Nos vemos en la edición ${e}.`,
};

export function generateStaticParams() {
  const locales: Locale[] = ["fr", "en", "it", "de", "es"];
  return locales.flatMap((locale) =>
    BLOG_POSTS.map((post) => ({ locale, slug: post.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Article introuvable" };

  const loc = getLocalizedPost(post, locale);
  const url = `${SITE_URL}/${locale}/blog/${post.slug}`;
  const image = `${SITE_URL}${post.image}`;

  return {
    title: loc.title,
    description: loc.description,
    keywords: loc.keywords,
    alternates: {
      canonical: url,
      languages: {
        fr: `${SITE_URL}/fr/blog/${post.slug}`,
        en: `${SITE_URL}/en/blog/${post.slug}`,
        it: `${SITE_URL}/it/blog/${post.slug}`,
        de: `${SITE_URL}/de/blog/${post.slug}`,
        es: `${SITE_URL}/es/blog/${post.slug}`,
        "x-default": `${SITE_URL}/fr/blog/${post.slug}`,
      },
    },
    openGraph: {
      title: loc.title,
      description: loc.description,
      url,
      type: "article",
      publishedTime: post.date,
      images: [{ url: image, width: 1200, height: 630, alt: loc.title }],
      locale: OG_LOCALES[locale] ?? "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title: loc.title,
      description: loc.description,
      images: [image],
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const loc = getLocalizedPost(post, locale);
  const Content = CONTENT[slug]?.[locale];
  if (!Content) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: loc.title,
    description: loc.description,
    image: `${SITE_URL}${post.image}`,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: "Coliving Barbusse",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Coliving Barbusse",
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/${locale}/blog/${post.slug}`,
    inLanguage: locale,
  };

  const dateLocale = DATE_LOCALE[locale] ?? "fr-FR";
  const backLabel = BACK_LABEL[locale] ?? BACK_LABEL.fr;
  const isSoldOut = !!post.soldOut;

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="text-sm text-secondary">
        <Link href={`/${locale}/blog`} className="hover:text-foreground">
          {backLabel}
        </Link>
      </nav>

      <header className="mt-6">
        <time className="text-xs font-medium uppercase tracking-wide text-secondary">
          {new Date(post.date).toLocaleDateString(dateLocale, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          {loc.title}
        </h1>
        <p className="mt-3 text-lg text-secondary">{loc.description}</p>
      </header>

      {isSoldOut && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="font-semibold text-amber-900">
            {SOLD_OUT_TITLE[locale] ?? SOLD_OUT_TITLE.fr}
          </p>
          <p className="mt-1 text-sm text-amber-800">
            {(SOLD_OUT_BODY[locale] ?? SOLD_OUT_BODY.fr)(post.nextEdition ?? "")}
          </p>
        </div>
      )}

      <div
        className="mt-8 aspect-[16/9] w-full rounded-xl bg-cover bg-center"
        style={{ backgroundImage: `url(${post.image})` }}
      />

      <div className="prose-article mt-10">
        <Content />
      </div>
    </article>
  );
}
