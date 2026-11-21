/**
 * Client **en lecture** de l'API Beyond Pricing (jeton personnel, `bpat_…`) — le calendrier d'une
 * annonce : prix suggéré, prix publié, prix minimum effectif, séjour minimum, facteurs.
 *
 * Pur et injecté : aucune variable d'environnement, aucun import du site, seulement des GET. Le
 * jeton passe dans l'en-tête `Authorization`, jamais dans l'URL, et aucune erreur ne le cite ni ne
 * recopie la réponse brute (relecture cerbere ; même modèle que le client Bing Webmaster).
 *
 * Candidat au socle avec le moteur générique, si la simulation d'Albiez compare au prix suggéré.
 * Doc : https://developers.beyondpricing.com/full-documentation.md
 */

export const BEYOND_API_BASE = "https://developers.beyondpricing.com/api/v1";

export interface BeyondCalendarDay {
  date: string;
  availability: string;
  /** Prix suggéré par Beyond (celui du tableau de bord). */
  price: number | null;
  /** Dernier prix envoyé au canal (`null` si jamais envoyé). */
  posted: number | null;
  effectiveMinPrice: number | null;
  minStay: number | null;
  /** Ratio du facteur « event » s'il existe (0,1 = +10 %). */
  eventRatio: number | null;
}

export class BeyondApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BeyondApiError";
  }
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Décode une réponse JSON:API du calendrier ; ignore toute entrée mal formée. */
export function decodeBeyondCalendar(json: unknown): BeyondCalendarDay[] {
  const data = (json as { data?: unknown })?.data;
  if (!Array.isArray(data)) throw new BeyondApiError(200, "Réponse du calendrier Beyond inattendue");
  const out: BeyondCalendarDay[] = [];
  for (const e of data) {
    const a = (e as { attributes?: Record<string, unknown> })?.attributes;
    if (!a || typeof a.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(a.date)) continue;
    const factors = Array.isArray(a.factors) ? (a.factors as { key?: unknown; ratio?: unknown }[]) : [];
    out.push({
      date: a.date,
      availability: typeof a.availability === "string" ? a.availability : "unknown",
      price: num(a.price),
      posted: num(a["price-posted"]),
      effectiveMinPrice: num(a["effective-min-price"]),
      minStay: num(a["min-stay"]),
      eventRatio: num(factors.find((f) => f?.key === "event")?.ratio),
    });
  }
  return out;
}

export async function getBeyondCalendar(input: {
  token: string;
  listingId: string | number;
  from: string;
  to: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}): Promise<BeyondCalendarDay[]> {
  const { token, listingId, from, to, fetchImpl = fetch, timeoutMs = 15_000 } = input;
  const url =
    `${BEYOND_API_BASE}/listings/${encodeURIComponent(String(listingId))}/calendar/` +
    `?filter%5Bstart-date%5D=${from}&filter%5Bend-date%5D=${to}&page%5Bsize%5D=731`;
  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.api+json" },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
  } catch {
    throw new BeyondApiError(0, "API Beyond injoignable");
  }
  if (!res.ok) {
    const hint = res.status === 401 || res.status === 403 ? " (jeton refusé ou abonnement Beyond Pro arrêté ?)" : "";
    throw new BeyondApiError(res.status, `API Beyond : HTTP ${res.status}${hint}`);
  }
  return decodeBeyondCalendar(await res.json());
}
