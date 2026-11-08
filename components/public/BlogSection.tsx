import Link from "next/link";
import BlogCard from "@/components/public/BlogCard";
import { homeSelection, todayInParis } from "@/lib/blog/journey";
import type { Locale } from "@/lib/i18n";

/**
 * Les articles de l'accueil : les 3 prochains événements aux dates officielles (les seuls visibles
 * sur mobile), puis 3 séjours de groupe. Jamais d'archive ni d'édition passée.
 *
 * Avant le 2026-11-08 : les 6 derniers articles publiés, si bien que les 24 Heures du Mans 2027
 * n'y figuraient pas. Composant serveur (il était client et embarquait les métadonnées des 28
 * articles dans le paquet du navigateur) ; l'accueil se régénère chaque jour (`revalidate`).
 */
const TEXTS: Record<Locale, { heading: string; sub: string; all: string; allMobile: string }> = {
  fr: {
    heading: "Nos articles pour préparer votre séjour",
    sub: "Les prochains grands événements au Mans, et nos idées de séjours en groupe.",
    all: "Tous les articles →",
    allMobile: "Voir tous les articles →",
  },
  en: {
    heading: "Articles to help you plan your stay",
    sub: "The next major events in Le Mans, and our ideas for group stays.",
    all: "All articles →",
    allMobile: "See all articles →",
  },
  it: {
    heading: "I nostri articoli per preparare il tuo soggiorno",
    sub: "I prossimi grandi eventi a Le Mans e le nostre idee per soggiorni di gruppo.",
    all: "Tutti gli articoli →",
    allMobile: "Vedi tutti gli articoli →",
  },
  de: {
    heading: "Unsere Artikel zur Vorbereitung Ihres Aufenthalts",
    sub: "Die nächsten großen Events in Le Mans und unsere Ideen für Gruppenaufenthalte.",
    all: "Alle Artikel →",
    allMobile: "Alle Artikel anzeigen →",
  },
  es: {
    heading: "Nuestros artículos para preparar tu estancia",
    sub: "Los próximos grandes eventos en Le Mans y nuestras ideas para estancias en grupo.",
    all: "Todos los artículos →",
    allMobile: "Ver todos los artículos →",
  },
};

export default function BlogSection({ locale }: { locale: Locale }) {
  const texts = TEXTS[locale] ?? TEXTS.fr;
  const today = todayInParis();
  const posts = homeSelection(today);

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
        {posts.map((post, i) => (
          <BlogCard
            key={post.slug}
            post={post}
            locale={locale}
            today={today}
            heading="h3"
            compact
            className={i >= 3 ? "hidden sm:block" : ""}
          />
        ))}
      </ul>

      <div className="mt-5 text-center sm:hidden">
        <Link href={`/${locale}/blog`} className="text-sm font-medium text-primary hover:text-primary-dark">
          {texts.allMobile}
        </Link>
      </div>
    </section>
  );
}
