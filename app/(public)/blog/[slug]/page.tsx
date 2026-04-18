import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BLOG_POSTS, getPostBySlug } from "@/lib/blog/posts";
import Article24hDuMans2026 from "@/lib/blog/content/ou-se-loger-24h-du-mans-2026";
import Article24hMoto from "@/lib/blog/content/24-heures-moto-le-mans";
import ArticleMotoGP from "@/lib/blog/content/motogp-france-le-mans";
import ArticleLeMansClassic from "@/lib/blog/content/le-mans-classic";
import ArticleGPExplorer from "@/lib/blog/content/gp-explorer-le-mans";
import ArticleTourisme from "@/lib/blog/content/que-visiter-le-mans-sarthe";
import ArticleRestos from "@/lib/blog/content/restos-bars-magasins-le-mans";
import ArticleEntreprises from "@/lib/blog/content/entreprises-proches-le-mans";
import ArticleHippodrome from "@/lib/blog/content/hippodrome-des-hunaudieres";
import Article24hRollers from "@/lib/blog/content/24-heures-rollers-le-mans";

const CONTENT: Record<string, React.ComponentType> = {
  "ou-se-loger-24h-du-mans-2026": Article24hDuMans2026,
  "24-heures-moto-le-mans": Article24hMoto,
  "motogp-france-le-mans": ArticleMotoGP,
  "le-mans-classic": ArticleLeMansClassic,
  "gp-explorer-le-mans": ArticleGPExplorer,
  "que-visiter-le-mans-sarthe": ArticleTourisme,
  "restos-bars-magasins-le-mans": ArticleRestos,
  "entreprises-proches-le-mans": ArticleEntreprises,
  "hippodrome-des-hunaudieres": ArticleHippodrome,
  "24-heures-rollers-le-mans": Article24hRollers,
};

const SITE_URL = "https://www.coliving-barbusse.fr";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Article introuvable" };

  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = `${SITE_URL}${post.image}`;

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.date,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [image],
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const Content = CONTENT[slug];
  if (!Content) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
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
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="text-sm text-secondary">
        <Link href="/blog" className="hover:text-foreground">
          ← Retour au blog
        </Link>
      </nav>

      <header className="mt-6">
        <time className="text-xs font-medium uppercase tracking-wide text-secondary">
          {new Date(post.date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-lg text-secondary">{post.description}</p>
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
