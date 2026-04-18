import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { BLOG_POSTS, getLocalizedPost } from "@/lib/blog/posts";
import type { Locale } from "@/lib/i18n";

const SITE_URL = "https://www.coliving-barbusse.fr";

async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return (cookieStore.get("locale")?.value as Locale) || "fr";
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const title =
    locale === "en"
      ? "Blog — Coliving Barbusse Le Mans"
      : "Blog — Coliving Barbusse Le Mans";
  const description =
    locale === "en"
      ? "Practical guides and tips for your stay in Le Mans: 24 Hours of Le Mans, MotoGP, Le Mans Classic, Sarthe tourism."
      : "Conseils et guides pratiques pour séjourner au Mans : 24 Heures du Mans, MotoGP, Le Mans Classic, tourisme en Sarthe.";

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/blog` },
  };
}

export default async function BlogIndex() {
  const locale = await getLocale();
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";
  const heading = locale === "en" ? "Blog" : "Blog";
  const subheading =
    locale === "en"
      ? "Practical guides for your stay in Le Mans and major events."
      : "Guides pratiques pour séjourner au Mans et profiter des grands événements.";

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{heading}</h1>
      <p className="mt-3 text-secondary">{subheading}</p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        {BLOG_POSTS.map((post) => {
          const loc = getLocalizedPost(post, locale);
          return (
            <li
              key={post.slug}
              className="group overflow-hidden rounded-xl border border-border transition-shadow hover:shadow-md"
            >
              <Link href={`/blog/${post.slug}`} className="block">
                <div
                  className="aspect-[16/10] w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${post.image})` }}
                />
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
