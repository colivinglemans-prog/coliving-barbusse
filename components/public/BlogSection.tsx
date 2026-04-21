"use client";

import Link from "next/link";
import { BLOG_POSTS, getLocalizedPost } from "@/lib/blog/posts";
import { useTranslation } from "@/lib/i18n";

export default function BlogSection() {
  const { locale } = useTranslation();
  // Available articles first, sold-out ones last
  const posts = [...BLOG_POSTS]
    .sort((a, b) => Number(!!a.soldOut) - Number(!!b.soldOut))
    .slice(0, 6);
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";

  const texts = {
    fr: {
      heading: "Nos articles pour préparer votre séjour",
      sub: "Guides pratiques : grands événements au Mans, tourisme, bonnes adresses du quartier.",
      all: "Tous les articles →",
      allMobile: "Voir tous les articles →",
    },
    en: {
      heading: "Articles to help you plan your stay",
      sub: "Practical guides: major events in Le Mans, tourism, local tips.",
      all: "All articles →",
      allMobile: "See all articles →",
    },
  }[locale === "en" ? "en" : "fr"];

  return (
    <section className="mx-auto max-w-6xl border-b border-border px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{texts.heading}</h2>
          <p className="mt-1 text-sm text-secondary">{texts.sub}</p>
        </div>
        <Link
          href={`/${locale}/blog`}
          className="hidden shrink-0 text-sm font-medium text-primary hover:text-primary-dark sm:inline"
        >
          {texts.all}
        </Link>
      </div>

      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => {
          const loc = getLocalizedPost(post, locale);
          const mobileHidden = i >= 3 ? "hidden sm:block" : "";
          const soldOut = !!post.soldOut;
          return (
            <li
              key={post.slug}
              className={`group overflow-hidden rounded-xl border border-border transition-shadow hover:shadow-md ${mobileHidden} ${soldOut ? "opacity-75" : ""}`}
            >
              <Link href={`/${locale}/blog/${post.slug}`} className="block">
                <div
                  className={`relative aspect-[16/10] w-full bg-cover bg-center ${soldOut ? "grayscale" : ""}`}
                  style={{ backgroundImage: `url(${post.image})` }}
                >
                  {soldOut && (
                    <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
                      {locale === "en" ? "Sold out" : "Complet"}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <time className="text-xs font-medium uppercase tracking-wide text-secondary">
                    {new Date(post.date).toLocaleDateString(dateLocale, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                  <h3 className="mt-1.5 line-clamp-2 text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                    {loc.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-secondary">{loc.excerpt}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 text-center sm:hidden">
        <Link href={`/${locale}/blog`} className="text-sm font-medium text-primary hover:text-primary-dark">
          {texts.allMobile}
        </Link>
      </div>
    </section>
  );
}
