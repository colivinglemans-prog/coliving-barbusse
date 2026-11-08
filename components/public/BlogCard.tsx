import Link from "next/link";
import { getLocalizedPost, type BlogPostMeta } from "@/lib/blog/posts";
import { eventOf, isPastEvent } from "@/lib/blog/journey";
import type { Locale } from "@/lib/i18n";

/**
 * La carte d'un article, partagée par la liste du blog et l'accueil (avant : deux balisages
 * recopiés). Sans hook ni état : elle se rend côté serveur comme côté client.
 *
 * - **Date affichée** : pour un article d'événement à venir, les dates **de l'événement**
 *   (« 8 – 11 avril 2027 »), suivies de « Dates officielles » seulement si `confirmed`. Une date
 *   de publication ne dit rien à quelqu'un qui cherche ses dates. Sinon, la date de publication.
 * - **Badge** : « Édition 2026 terminée » quand l'événement de l'article est passé (calculé),
 *   « Complet » seulement quand `soldOut` est posé sur une édition à venir (constat de l'hôte).
 *   L'ancien « Complet pour l'édition {année de publication} » affirmait un fait non vérifié.
 */
const COPY: Record<
  Locale,
  { finished: (year: string) => string; soldOut: string; official: string; bcp47: string }
> = {
  fr: { finished: (y) => `Édition ${y} terminée`, soldOut: "Complet", official: "Dates officielles", bcp47: "fr-FR" },
  en: { finished: (y) => `${y} edition over`, soldOut: "Fully booked", official: "Official dates", bcp47: "en-GB" },
  it: { finished: (y) => `Edizione ${y} conclusa`, soldOut: "Completo", official: "Date ufficiali", bcp47: "it-IT" },
  de: { finished: (y) => `Edition ${y} beendet`, soldOut: "Ausgebucht", official: "Offizielle Termine", bcp47: "de-DE" },
  es: { finished: (y) => `Edición ${y} terminada`, soldOut: "Completo", official: "Fechas oficiales", bcp47: "es-ES" },
};

/** « 8 – 11 avril 2027 » ; sur deux mois, « 30 juin – 3 juillet 2027 ». En UTC : pas de décalage. */
export function formatRange(start: string, end: string, bcp47: string): string {
  const d = (s: string) => new Date(`${s}T00:00:00Z`);
  const opts = { timeZone: "UTC" } as const;
  if (start === end) {
    return d(start).toLocaleDateString(bcp47, { ...opts, day: "numeric", month: "long", year: "numeric" });
  }
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const first = d(start).toLocaleDateString(bcp47, sameMonth ? { ...opts, day: "numeric" } : { ...opts, day: "numeric", month: "long" });
  const last = d(end).toLocaleDateString(bcp47, { ...opts, day: "numeric", month: "long", year: "numeric" });
  return `${first} – ${last}`;
}

export interface BlogCardProps {
  post: BlogPostMeta;
  locale: Locale;
  /** Date du jour (AAAA-MM-JJ), calculée par la page : décide « passé » et l'affichage de la date. */
  today: string;
  /** `h2` dans la liste du blog, `h3` sous un titre de section (accueil). */
  heading?: "h2" | "h3";
  compact?: boolean;
  className?: string;
  /** Pastilles auxquelles la carte appartient (`data-f`), lues par la règle CSS du filtre de la liste. */
  filterKeys?: readonly string[];
}

export default function BlogCard({ post, locale, today, heading = "h2", compact, className, filterKeys }: BlogCardProps) {
  const t = COPY[locale] ?? COPY.fr;
  const loc = getLocalizedPost(post, locale);
  const event = eventOf(post);
  const past = isPastEvent(post, today);
  const muted = past || !!post.soldOut;
  const badge = past && event ? t.finished(event.start.slice(0, 4)) : post.soldOut ? t.soldOut : null;
  const Heading = heading;

  return (
    <li
      data-f={filterKeys?.join(" ")}
      className={`group overflow-hidden rounded-xl border border-border transition-shadow hover:shadow-md ${
        muted ? "opacity-75" : ""
      } ${className ?? ""}`}
    >
      <Link href={`/${locale}/blog/${post.slug}`} className="block">
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <div
            className={`absolute inset-0 bg-cover bg-center ${muted ? "grayscale" : ""}`}
            style={{ backgroundImage: `url(${post.image})` }}
          />
          {badge && (
            <span className="absolute left-3 top-3 rounded-full bg-foreground/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow">
              {badge}
            </span>
          )}
        </div>
        <div className={compact ? "p-4" : "p-5"}>
          <p className="text-xs font-medium uppercase tracking-wide text-secondary">
            {event && !past ? (
              <>
                <span className="text-primary">{formatRange(event.start, event.end, t.bcp47)}</span>
                {event.confirmed && <> · {t.official}</>}
              </>
            ) : (
              <time dateTime={post.date}>
                {new Date(`${post.date}T00:00:00Z`).toLocaleDateString(t.bcp47, {
                  timeZone: "UTC",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
            )}
          </p>
          <Heading
            className={`mt-2 font-semibold text-foreground transition-colors group-hover:text-primary ${
              compact ? "line-clamp-2 text-base" : "text-lg"
            }`}
          >
            {loc.title}
          </Heading>
          <p className={`mt-2 text-sm text-secondary ${compact ? "line-clamp-2" : ""}`}>{loc.excerpt}</p>
        </div>
      </Link>
    </li>
  );
}
