import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BLOG_POSTS, getPostBySlug, getLocalizedPost } from "@/lib/blog/posts";
import type { Locale } from "@/lib/i18n";

import Article24hDuMans2026 from "@/lib/blog/content/fr/ou-se-loger-24h-du-mans-2026";
import Article24hMoto from "@/lib/blog/content/fr/24-heures-moto-le-mans";
import ArticleMotoGP from "@/lib/blog/content/fr/motogp-france-le-mans";
import ArticleLeMansClassic from "@/lib/blog/content/fr/le-mans-classic";
import ArticleGPExplorer from "@/lib/blog/content/fr/gp-explorer-le-mans";
import ArticleTourisme from "@/lib/blog/content/fr/que-visiter-le-mans-sarthe";
import ArticleRestos from "@/lib/blog/content/fr/restos-bars-magasins-le-mans";
import ArticleEntreprises from "@/lib/blog/content/fr/entreprises-proches-le-mans";
import ArticleHippodrome from "@/lib/blog/content/fr/hippodrome-des-hunaudieres";
import Article24hRollers from "@/lib/blog/content/fr/24-heures-rollers-le-mans";
import ArticleSeminaire from "@/lib/blog/content/fr/seminaire-entreprise-le-mans";

import ArticleEN24hDuMans2026 from "@/lib/blog/content/en/ou-se-loger-24h-du-mans-2026";
import ArticleEN24hMoto from "@/lib/blog/content/en/24-heures-moto-le-mans";
import ArticleENMotoGP from "@/lib/blog/content/en/motogp-france-le-mans";
import ArticleENLeMansClassic from "@/lib/blog/content/en/le-mans-classic";
import ArticleENGPExplorer from "@/lib/blog/content/en/gp-explorer-le-mans";
import ArticleENTourisme from "@/lib/blog/content/en/que-visiter-le-mans-sarthe";
import ArticleENRestos from "@/lib/blog/content/en/restos-bars-magasins-le-mans";
import ArticleENEntreprises from "@/lib/blog/content/en/entreprises-proches-le-mans";
import ArticleENHippodrome from "@/lib/blog/content/en/hippodrome-des-hunaudieres";
import ArticleEN24hRollers from "@/lib/blog/content/en/24-heures-rollers-le-mans";
import ArticleENSeminaire from "@/lib/blog/content/en/seminaire-entreprise-le-mans";

const SITE_URL = "https://www.coliving-barbusse.fr";

const CONTENT: Record<string, Record<Locale, React.ComponentType>> = {
  "ou-se-loger-24h-du-mans-2026": { fr: Article24hDuMans2026, en: ArticleEN24hDuMans2026 },
  "24-heures-moto-le-mans": { fr: Article24hMoto, en: ArticleEN24hMoto },
  "motogp-france-le-mans": { fr: ArticleMotoGP, en: ArticleENMotoGP },
  "le-mans-classic": { fr: ArticleLeMansClassic, en: ArticleENLeMansClassic },
  "gp-explorer-le-mans": { fr: ArticleGPExplorer, en: ArticleENGPExplorer },
  "que-visiter-le-mans-sarthe": { fr: ArticleTourisme, en: ArticleENTourisme },
  "restos-bars-magasins-le-mans": { fr: ArticleRestos, en: ArticleENRestos },
  "entreprises-proches-le-mans": { fr: ArticleEntreprises, en: ArticleENEntreprises },
  "hippodrome-des-hunaudieres": { fr: ArticleHippodrome, en: ArticleENHippodrome },
  "24-heures-rollers-le-mans": { fr: Article24hRollers, en: ArticleEN24hRollers },
  "seminaire-entreprise-le-mans": { fr: ArticleSeminaire, en: ArticleENSeminaire },
};

export function generateStaticParams() {
  const locales: Locale[] = ["fr", "en"];
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
      locale: locale === "en" ? "en_US" : "fr_FR",
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

  const dateLocale = locale === "en" ? "en-US" : "fr-FR";
  const backLabel = locale === "en" ? "← Back to blog" : "← Retour au blog";

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
