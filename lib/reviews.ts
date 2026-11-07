import reviewsData from "@/data/reviews.json";

/**
 * Note et nombre d'avis affichés au JSON-LD (`AggregateRating`), **calculés** depuis
 * `data/reviews.json` — le même fichier que la section d'avis de l'accueil.
 *
 * Ils étaient écrits en dur dans deux pages (`"4.9"`, `"24"`) alors que le fichier en comptait
 * 30 : Google lisait un chiffre que la page démentait. Les tests post-déploiement
 * (`indexing.reviewsJsonLd`) comparent le JSON-LD servi au résultat de cette fonction.
 */
export interface ReviewsSummary {
  count: number;
  /** Moyenne arrondie au dixième, sur une échelle de 5. */
  ratingValue: number;
}

export function reviewsSummary(reviews: readonly { rating: number }[] = reviewsData): ReviewsSummary {
  const rated = reviews.filter((r) => Number.isFinite(r.rating));
  if (rated.length === 0) return { count: 0, ratingValue: 0 };
  const mean = rated.reduce((s, r) => s + r.rating, 0) / rated.length;
  return { count: rated.length, ratingValue: Math.round(mean * 10) / 10 };
}

/** Bloc `AggregateRating` prêt à poser dans un JSON-LD. */
export function aggregateRatingJsonLd() {
  const { count, ratingValue } = reviewsSummary();
  return {
    "@type": "AggregateRating",
    ratingValue: ratingValue.toFixed(1),
    reviewCount: String(count),
    bestRating: "5",
  } as const;
}
