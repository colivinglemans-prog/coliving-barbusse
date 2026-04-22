import Link from "next/link";
import type { Metadata } from "next";
import { BLOG_POSTS, getLocalizedPost } from "@/lib/blog/posts";
import type { Locale } from "@/lib/i18n";

const SITE_URL = "https://www.coliving-barbusse.fr";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "Blog — Coliving Barbusse Le Mans";
  const description =
    locale === "en"
      ? "Practical guides and tips for your stay in Le Mans: 24 Hours of Le Mans, MotoGP, Le Mans Classic, Sarthe tourism."
      : "Conseils et guides pratiques pour séjourner au Mans : 24 Heures du Mans, MotoGP, Le Mans Classic, tourisme en Sarthe.";

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog`,
      languages: {
        fr: `${SITE_URL}/fr/blog`,
        en: `${SITE_URL}/en/blog`,
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
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";
  const heading = "Blog";
  const subheading =
    locale === "en"
      ? "Practical guides for your stay in Le Mans and major events."
      : "Guides pratiques pour séjourner au Mans et profiter des grands événements.";

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
                      {locale === "en"
                        ? `Sold out for ${post.date.slice(0, 4)}`
                        : `Complet pour l'édition ${post.date.slice(0, 4)}`}
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
