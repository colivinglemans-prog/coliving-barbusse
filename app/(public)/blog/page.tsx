import Link from "next/link";
import type { Metadata } from "next";
import { BLOG_POSTS } from "@/lib/blog/posts";

export const metadata: Metadata = {
  title: "Blog — Coliving Barbusse Le Mans",
  description:
    "Conseils et guides pratiques pour séjourner au Mans : 24 Heures du Mans, MotoGP, Le Mans Classic, tourisme en Sarthe.",
  alternates: {
    canonical: "https://coliving-barbusse.vercel.app/blog",
  },
};

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Blog</h1>
      <p className="mt-3 text-secondary">
        Guides pratiques pour séjourner au Mans et profiter des grands événements.
      </p>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        {BLOG_POSTS.map((post) => (
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
                  {new Date(post.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <h2 className="mt-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-secondary">{post.excerpt}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
