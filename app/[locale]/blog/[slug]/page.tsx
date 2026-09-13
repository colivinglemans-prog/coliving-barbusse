import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BLOG_POSTS, getPostBySlug, getLocalizedPost } from "@/lib/blog/posts";
import { LE_MANS_EVENTS } from "@/lib/events";
import { eventJsonLd, findEventByKey } from "@sejour/socle/lib/events";
import EventBookingCTA from "@/components/public/EventBookingCTA";
import { alternatesFor, articleJsonLd, blogPostPath, openGraphLocales } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import { isLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

/**
 * Le contenu de chaque article, chargé à la demande.
 *
 * Les imports sont **paresseux**, et c'est tout l'objet de cette table : ce fichier en
 * portait cent en tête — vingt articles fois cinq langues — pour n'en rendre qu'un seul.
 * Le bundler ne peut pas deviner lequel, donc les cent partaient dans le graphe de la page.
 *
 * Les chemins restent des **littéraux**. Une expression `content/${locale}/${slug}` ferait
 * perdre au bundler son analyse statique : il ne saurait plus quels modules produire. C'est
 * la seule raison de la longueur de cette table, et il ne faut pas chercher à l'abréger.
 */
type ContentLoader = () => Promise<{ default: React.ComponentType }>;

const CONTENT: Record<string, Record<Locale, ContentLoader>> = {
  "24-heures-moto-le-mans-2027": {
    fr: () => import("@/lib/blog/content/fr/24-heures-moto-le-mans-2027"),
    en: () => import("@/lib/blog/content/en/24-heures-moto-le-mans-2027"),
    it: () => import("@/lib/blog/content/it/24-heures-moto-le-mans-2027"),
    de: () => import("@/lib/blog/content/de/24-heures-moto-le-mans-2027"),
    es: () => import("@/lib/blog/content/es/24-heures-moto-le-mans-2027"),
  },
  "le-mans-classic-2027": {
    fr: () => import("@/lib/blog/content/fr/le-mans-classic-2027"),
    en: () => import("@/lib/blog/content/en/le-mans-classic-2027"),
    it: () => import("@/lib/blog/content/it/le-mans-classic-2027"),
    de: () => import("@/lib/blog/content/de/le-mans-classic-2027"),
    es: () => import("@/lib/blog/content/es/le-mans-classic-2027"),
  },
  "ou-se-loger-24h-du-mans-2027": {
    fr: () => import("@/lib/blog/content/fr/ou-se-loger-24h-du-mans-2027"),
    en: () => import("@/lib/blog/content/en/ou-se-loger-24h-du-mans-2027"),
    it: () => import("@/lib/blog/content/it/ou-se-loger-24h-du-mans-2027"),
    de: () => import("@/lib/blog/content/de/ou-se-loger-24h-du-mans-2027"),
    es: () => import("@/lib/blog/content/es/ou-se-loger-24h-du-mans-2027"),
  },
  "motogp-france-le-mans-2027": {
    fr: () => import("@/lib/blog/content/fr/motogp-france-le-mans-2027"),
    en: () => import("@/lib/blog/content/en/motogp-france-le-mans-2027"),
    it: () => import("@/lib/blog/content/it/motogp-france-le-mans-2027"),
    de: () => import("@/lib/blog/content/de/motogp-france-le-mans-2027"),
    es: () => import("@/lib/blog/content/es/motogp-france-le-mans-2027"),
  },
  "porsche-sprint-challenge-le-mans": {
    fr: () => import("@/lib/blog/content/fr/porsche-sprint-challenge-le-mans"),
    en: () => import("@/lib/blog/content/en/porsche-sprint-challenge-le-mans"),
    it: () => import("@/lib/blog/content/it/porsche-sprint-challenge-le-mans"),
    de: () => import("@/lib/blog/content/de/porsche-sprint-challenge-le-mans"),
    es: () => import("@/lib/blog/content/es/porsche-sprint-challenge-le-mans"),
  },
  "jardin-securise-le-mans": {
    fr: () => import("@/lib/blog/content/fr/jardin-securise-le-mans"),
    en: () => import("@/lib/blog/content/en/jardin-securise-le-mans"),
    it: () => import("@/lib/blog/content/it/jardin-securise-le-mans"),
    de: () => import("@/lib/blog/content/de/jardin-securise-le-mans"),
    es: () => import("@/lib/blog/content/es/jardin-securise-le-mans"),
  },
  "ou-se-loger-24h-du-mans-2026": {
    fr: () => import("@/lib/blog/content/fr/ou-se-loger-24h-du-mans-2026"),
    en: () => import("@/lib/blog/content/en/ou-se-loger-24h-du-mans-2026"),
    it: () => import("@/lib/blog/content/it/ou-se-loger-24h-du-mans-2026"),
    de: () => import("@/lib/blog/content/de/ou-se-loger-24h-du-mans-2026"),
    es: () => import("@/lib/blog/content/es/ou-se-loger-24h-du-mans-2026"),
  },
  "24-heures-moto-le-mans": {
    fr: () => import("@/lib/blog/content/fr/24-heures-moto-le-mans"),
    en: () => import("@/lib/blog/content/en/24-heures-moto-le-mans"),
    it: () => import("@/lib/blog/content/it/24-heures-moto-le-mans"),
    de: () => import("@/lib/blog/content/de/24-heures-moto-le-mans"),
    es: () => import("@/lib/blog/content/es/24-heures-moto-le-mans"),
  },
  "motogp-france-le-mans": {
    fr: () => import("@/lib/blog/content/fr/motogp-france-le-mans"),
    en: () => import("@/lib/blog/content/en/motogp-france-le-mans"),
    it: () => import("@/lib/blog/content/it/motogp-france-le-mans"),
    de: () => import("@/lib/blog/content/de/motogp-france-le-mans"),
    es: () => import("@/lib/blog/content/es/motogp-france-le-mans"),
  },
  "le-mans-classic": {
    fr: () => import("@/lib/blog/content/fr/le-mans-classic"),
    en: () => import("@/lib/blog/content/en/le-mans-classic"),
    it: () => import("@/lib/blog/content/it/le-mans-classic"),
    de: () => import("@/lib/blog/content/de/le-mans-classic"),
    es: () => import("@/lib/blog/content/es/le-mans-classic"),
  },
  "gp-explorer-le-mans": {
    fr: () => import("@/lib/blog/content/fr/gp-explorer-le-mans"),
    en: () => import("@/lib/blog/content/en/gp-explorer-le-mans"),
    it: () => import("@/lib/blog/content/it/gp-explorer-le-mans"),
    de: () => import("@/lib/blog/content/de/gp-explorer-le-mans"),
    es: () => import("@/lib/blog/content/es/gp-explorer-le-mans"),
  },
  "que-visiter-le-mans-sarthe": {
    fr: () => import("@/lib/blog/content/fr/que-visiter-le-mans-sarthe"),
    en: () => import("@/lib/blog/content/en/que-visiter-le-mans-sarthe"),
    it: () => import("@/lib/blog/content/it/que-visiter-le-mans-sarthe"),
    de: () => import("@/lib/blog/content/de/que-visiter-le-mans-sarthe"),
    es: () => import("@/lib/blog/content/es/que-visiter-le-mans-sarthe"),
  },
  "restos-bars-magasins-le-mans": {
    fr: () => import("@/lib/blog/content/fr/restos-bars-magasins-le-mans"),
    en: () => import("@/lib/blog/content/en/restos-bars-magasins-le-mans"),
    it: () => import("@/lib/blog/content/it/restos-bars-magasins-le-mans"),
    de: () => import("@/lib/blog/content/de/restos-bars-magasins-le-mans"),
    es: () => import("@/lib/blog/content/es/restos-bars-magasins-le-mans"),
  },
  "entreprises-proches-le-mans": {
    fr: () => import("@/lib/blog/content/fr/entreprises-proches-le-mans"),
    en: () => import("@/lib/blog/content/en/entreprises-proches-le-mans"),
    it: () => import("@/lib/blog/content/it/entreprises-proches-le-mans"),
    de: () => import("@/lib/blog/content/de/entreprises-proches-le-mans"),
    es: () => import("@/lib/blog/content/es/entreprises-proches-le-mans"),
  },
  "hippodrome-des-hunaudieres": {
    fr: () => import("@/lib/blog/content/fr/hippodrome-des-hunaudieres"),
    en: () => import("@/lib/blog/content/en/hippodrome-des-hunaudieres"),
    it: () => import("@/lib/blog/content/it/hippodrome-des-hunaudieres"),
    de: () => import("@/lib/blog/content/de/hippodrome-des-hunaudieres"),
    es: () => import("@/lib/blog/content/es/hippodrome-des-hunaudieres"),
  },
  "24-heures-rollers-le-mans": {
    fr: () => import("@/lib/blog/content/fr/24-heures-rollers-le-mans"),
    en: () => import("@/lib/blog/content/en/24-heures-rollers-le-mans"),
    it: () => import("@/lib/blog/content/it/24-heures-rollers-le-mans"),
    de: () => import("@/lib/blog/content/de/24-heures-rollers-le-mans"),
    es: () => import("@/lib/blog/content/es/24-heures-rollers-le-mans"),
  },
  "seminaire-entreprise-le-mans": {
    fr: () => import("@/lib/blog/content/fr/seminaire-entreprise-le-mans"),
    en: () => import("@/lib/blog/content/en/seminaire-entreprise-le-mans"),
    it: () => import("@/lib/blog/content/it/seminaire-entreprise-le-mans"),
    de: () => import("@/lib/blog/content/de/seminaire-entreprise-le-mans"),
    es: () => import("@/lib/blog/content/es/seminaire-entreprise-le-mans"),
  },
  "sws-karting-finals-le-mans": {
    fr: () => import("@/lib/blog/content/fr/sws-karting-finals-le-mans"),
    en: () => import("@/lib/blog/content/en/sws-karting-finals-le-mans"),
    it: () => import("@/lib/blog/content/it/sws-karting-finals-le-mans"),
    de: () => import("@/lib/blog/content/de/sws-karting-finals-le-mans"),
    es: () => import("@/lib/blog/content/es/sws-karting-finals-le-mans"),
  },
  "24-heures-camions-le-mans": {
    fr: () => import("@/lib/blog/content/fr/24-heures-camions-le-mans"),
    en: () => import("@/lib/blog/content/en/24-heures-camions-le-mans"),
    it: () => import("@/lib/blog/content/it/24-heures-camions-le-mans"),
    de: () => import("@/lib/blog/content/de/24-heures-camions-le-mans"),
    es: () => import("@/lib/blog/content/es/24-heures-camions-le-mans"),
  },
  "championnat-monde-karting-kz-le-mans": {
    fr: () => import("@/lib/blog/content/fr/championnat-monde-karting-kz-le-mans"),
    en: () => import("@/lib/blog/content/en/championnat-monde-karting-kz-le-mans"),
    it: () => import("@/lib/blog/content/it/championnat-monde-karting-kz-le-mans"),
    de: () => import("@/lib/blog/content/de/championnat-monde-karting-kz-le-mans"),
    es: () => import("@/lib/blog/content/es/championnat-monde-karting-kz-le-mans"),
  },
};

/*
 * `DATE_LOCALE` reste ici, et n'est pas remplacé par le `bcp47` de `LOCALE_META`. Ce n'est
 * pas la même chose : `LOCALE_META.bcp47` vise `en-GB`, ce tableau `en-US`, et c'est un
 * **format de date affiché** — « 5 January 2026 » contre « January 5, 2026 ». Le changer
 * modifierait le texte des articles, ce qui n'est pas l'objet.
 */
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

// Ponctuation incluse : l'espace avant le deux-points est une regle typographique
// francaise, absente en anglais / italien / allemand / espagnol.
const PHOTO_CREDIT_LABEL: Record<Locale, string> = {
  fr: "Photo :",
  en: "Photo:",
  it: "Foto:",
  de: "Foto:",
  es: "Foto:",
};

const SUPERSEDED_CTA: Record<Locale, (title: string) => string> = {
  fr: (t) => `Lire l'édition à venir : ${t} →`,
  en: (t) => `Read the upcoming edition: ${t} →`,
  it: (t) => `Leggi l'edizione in arrivo: ${t} →`,
  de: (t) => `Zur kommenden Ausgabe: ${t} →`,
  es: (t) => `Leer la próxima edición: ${t} →`,
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
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = getPostBySlug(slug);
  if (!post) return { title: "Article introuvable" };

  const loc = getLocalizedPost(post, locale);
  const pathFor = blogPostPath(post.slug);
  const url = `${SITE_URL}${pathFor(locale)}`;
  const image = `${SITE_URL}${post.image}`;

  return {
    title: loc.title,
    description: loc.description,
    keywords: loc.keywords,
    // Une edition passee remplacee par la suivante ne doit plus concurrencer
    // celle-ci dans l'index : on la desindexe tout en gardant ses liens suivis.
    ...(post.supersededBy ? { robots: { index: false, follow: true } } : {}),
    alternates: alternatesFor(locale, pathFor),
    openGraph: {
      title: loc.title,
      description: loc.description,
      url,
      type: "article",
      publishedTime: post.date,
      images: [{ url: image, width: 1200, height: 630, alt: loc.title }],
      ...openGraphLocales(locale),
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
  const loader = CONTENT[slug]?.[locale];
  if (!loader) notFound();
  const { default: Content } = await loader();

  const jsonLd = articleJsonLd({
    locale,
    pathFor: blogPostPath(post.slug),
    title: loc.title,
    description: loc.description,
    imageUrl: `${SITE_URL}${post.image}`,
    date: post.date,
  });

  const dateLocale = DATE_LOCALE[locale] ?? "fr-FR";
  const backLabel = BACK_LABEL[locale] ?? BACK_LABEL.fr;
  const isSoldOut = !!post.soldOut;
  const nextPost = post.supersededBy ? getPostBySlug(post.supersededBy) : undefined;

  // L'événement de l'article, quand il en référence un — par sa clé. Le bloc de
  // réservation décide lui-même de s'afficher ou non selon la disponibilité réelle et la
  // date du jour ; il calcule sa fenêtre de séjour à partir de l'événement.
  const linkedEvent = post.event ? findEventByKey(LE_MANS_EVENTS, post.event) : undefined;
  // `eventJsonLd` rend `null` tant que les dates ne sont pas officielles : on ne déclare
  // pas une date supposée à Google, qui l'afficherait comme un fait. Le test est dans le
  // socle, avec le champ qui le commande, pour qu'aucun appelant ne l'oublie.
  const eventNode = linkedEvent
    ? eventJsonLd(
        linkedEvent,
        { commune: "Le Mans", region: "Pays de la Loire" },
        // La description et l'image sont celles de l'article, dans la langue de la page : le socle
        // ne connaît pas l'i18n, c'est ici qu'on sait ce qu'on rend.
        { description: loc.description, imageUrl: `${SITE_URL}${post.image}` },
      )
    : null;

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Deuxième bloc JSON-LD, indépendant du premier : deux nœuds sur une page sont
          valides et se lisent mieux qu'un `@graph` dont les entrées n'ont rien à se dire. */}
      {eventNode && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventNode) }}
        />
      )}
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
          {nextPost && (
            <p className="mt-3 text-sm">
              <Link
                href={`/${locale}/blog/${nextPost.slug}`}
                className="font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
              >
                {(SUPERSEDED_CTA[locale] ?? SUPERSEDED_CTA.fr)(
                  getLocalizedPost(nextPost, locale).title,
                )}
              </Link>
            </p>
          )}
        </div>
      )}

      <figure className="mt-8">
        <div
          className="aspect-[16/9] w-full rounded-xl bg-cover bg-center"
          style={{ backgroundImage: `url(${post.image})` }}
        />
        {post.imageCredit && (
          <figcaption className="mt-2 text-right text-xs text-stone-500">
            {PHOTO_CREDIT_LABEL[locale] ?? PHOTO_CREDIT_LABEL.fr}{" "}
            <a
              href={post.imageCredit.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline underline-offset-2 hover:text-stone-700"
            >
              {post.imageCredit.author}
            </a>
            {" · "}
            <a
              href={post.imageCredit.licenseUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline underline-offset-2 hover:text-stone-700"
            >
              {post.imageCredit.license}
            </a>
          </figcaption>
        )}
      </figure>

      <div className="prose-article mt-10">
        <Content />
      </div>

      {linkedEvent && <EventBookingCTA locale={locale} event={linkedEvent} />}
    </article>
  );
}
