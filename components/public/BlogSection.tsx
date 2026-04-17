import Link from "next/link";
import { BLOG_POSTS } from "@/lib/blog/posts";

export default function BlogSection() {
  const posts = BLOG_POSTS.slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl border-b border-border px-6 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Nos articles pour préparer votre séjour
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Guides pratiques : grands événements au Mans, tourisme, bonnes adresses du quartier.
          </p>
        </div>
        <Link
          href="/blog"
          className="hidden shrink-0 text-sm font-medium text-primary hover:text-primary-dark sm:inline"
        >
          Tous les articles →
        </Link>
      </div>

      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li
            key={post.slug}
            className="group overflow-hidden rounded-xl border border-border transition-shadow hover:shadow-md"
          >
            <Link href={`/blog/${post.slug}`} className="block">
              <div
                className="aspect-[16/10] w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${post.image})` }}
              />
              <div className="p-4">
                <time className="text-xs font-medium uppercase tracking-wide text-secondary">
                  {new Date(post.date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
                <h3 className="mt-1.5 line-clamp-2 text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-secondary">{post.excerpt}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-5 text-center sm:hidden">
        <Link href="/blog" className="text-sm font-medium text-primary hover:text-primary-dark">
          Voir tous les articles →
        </Link>
      </div>
    </section>
  );
}
