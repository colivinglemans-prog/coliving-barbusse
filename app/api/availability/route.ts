import { NextRequest, NextResponse } from "next/server";
import { addDays, daysBetween } from "@sejour/socle/lib/dates";
import { getAvailability, getMinStay } from "@/lib/beds24";
import { PROPERTY_ID } from "@/lib/beds24-property";

/**
 * Disponibilités de la maison, pour le calendrier public et les encarts du blog.
 *
 * **Route publique**, hors du `matcher` du proxy, et autorisée dans `robots.txt` : Googlebot
 * exécute le calendrier. Elle ne renvoie que des dates, des booléens et des séjours minimum.
 *
 * Deux garde-fous alignés sur `/api/disponibilites` d'Albiez :
 * - **une plage bornée à 400 jours** : sans borne, n'importe qui fait travailler l'API Beds24
 *   sur dix ans à chaque appel, et consomme le crédit du jeton public ;
 * - **un 502 au message générique** : le message d'une erreur Beds24 cite le chemin interne
 *   et un extrait de la réponse. Il reste dans les logs Vercel, jamais dans la réponse. C'est
 *   ce que vérifie `security.availabilityLeak` des tests post-déploiement.
 */
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 400;

function badRange(from: string, to: string): string | null {
  if (!DATE.test(from) || !DATE.test(to)) return "Dates attendues au format YYYY-MM-DD";
  if (to < from) return "La fin doit suivre le début";
  if (Date.parse(to) - Date.parse(from) > MAX_RANGE_DAYS * 86_400_000) {
    return `Plage limitée à ${MAX_RANGE_DAYS} jours`;
  }
  return null;
}

function unavailable(error: unknown) {
  console.error("[availability] Beds24 indisponible :", error instanceof Error ? error.message : String(error));
  return NextResponse.json({ error: "Disponibilités momentanément indisponibles" }, { status: 502 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("mode");

  // Map mode: return full availability for a date range (for the calendar)
  if (mode === "map") {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) {
      return NextResponse.json({ error: "from and to are required for map mode" }, { status: 400 });
    }
    const invalid = badRange(from, to);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
    try {
      const [availability, minStay] = await Promise.all([
        getAvailability(PROPERTY_ID, from, to),
        getMinStay(PROPERTY_ID, from, to),
      ]);
      return NextResponse.json({ dates: availability, minStay });
    } catch (error) {
      return unavailable(error);
    }
  }

  // Legacy check mode: check-in / check-out validation
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");

  if (!checkIn || !checkOut) {
    return NextResponse.json({ available: false, message: "Dates manquantes." }, { status: 400 });
  }
  const invalid = badRange(checkIn, checkOut);
  if (invalid) return NextResponse.json({ available: false, message: invalid }, { status: 400 });

  let availability: Record<string, boolean>;
  try {
    availability = await getAvailability(PROPERTY_ID, checkIn, checkOut);
  } catch (error) {
    return unavailable(error);
  }

  // Chaînes `YYYY-MM-DD` d'un bout à l'autre : aucun passage par un `Date` et son fuseau.
  const nights = daysBetween(checkIn, checkOut);
  const unavailableDates: string[] = [];
  for (let i = 0; i < nights; i++) {
    const dateStr = addDays(checkIn, i);
    if (availability[dateStr] === false) unavailableDates.push(dateStr);
  }

  if (unavailableDates.length === 0) {
    return NextResponse.json({
      available: true,
      message: `La maison est disponible pour ${nights} nuit${nights > 1 ? "s" : ""} du ${checkIn} au ${checkOut}.`,
    });
  }

  return NextResponse.json({
    available: false,
    message: `La maison n'est pas disponible sur ces dates. ${unavailableDates.length} jour(s) déjà réservé(s).`,
  });
}
