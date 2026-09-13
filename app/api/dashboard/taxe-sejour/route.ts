import { NextRequest, NextResponse } from "next/server";
import { getBookingsWithArchive } from "@/lib/bookings";
import {
  TAXE_SEJOUR_CONFIG,
  computeTaxeSejour,
  groupByChannel,
  groupByQuarter,
  type ChannelTotals,
  type QuarterTotals,
  type TaxeSejourLine,
} from "@/lib/taxe-sejour";
import { countsAsSold } from "@sejour/socle/lib/booking-status";
import type { Channel } from "@sejour/socle/lib/channels";
import { guard } from "@/lib/auth";

/**
 * Les canaux dont la plateforme collecte et reverse elle-même la taxe de séjour.
 *
 * Airbnb, Booking.com **et Abritel/Vrbo** sont tous trois des opérateurs numériques
 * intermédiaires de paiement : la collecte au réel de la taxe de séjour et son reversement à
 * la collectivité leur incombent de plein droit depuis le 1er janvier 2019 (art. L.2333-33 et
 * L.2333-34 du CGCT). Abritel manquait ici : une réservation Abritel n'apparaissait ni en
 * direct, ni en tiers collecteur, donc nulle part dans une pièce de préparation déclarative.
 *
 * `Autre` — cinquième valeur de `Channel` dans le socle — n'a volontairement aucune place
 * dans ce partage. `normalizeChannel` ne le renvoie jamais (une réservation non identifiée
 * est rangée en `Direct`) ; seule une donnée d'archive peut le porter. Si une telle ligne
 * arrivait ici, elle tomberait **nulle part**, exactement comme Abritel avant cette
 * correction. On ne le corrige pas par anticipation : décider si un séjour `Autre` relève du
 * direct ou d'un tiers collecteur suppose de savoir qui a encaissé, et cela ne s'arbitre pas
 * à l'aveugle.
 */
const CANAUX_TIERS_COLLECTEURS: Channel[] = ["Airbnb", "Booking.com", "Abritel"];

export interface TaxeSejourResponse {
  year: number;
  config: typeof TAXE_SEJOUR_CONFIG;
  direct: {
    totalTax: number;
    bookingsCount: number;
    nightsCount: number;
    quarters: QuarterTotals[];
  };
  collectees: {
    channels: ChannelTotals[];
    totalTax: number;
    totalTaxCollected: number;
    bookingsCount: number;
  };
}

export async function GET(req: NextRequest) {
  const refus = await guard.denyNonAdmin(req);
  if (refus) return refus;

  const year = Number(req.nextUrl.searchParams.get("year")) || new Date().getFullYear();

  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  let bookings;
  try {
    bookings = await getBookingsWithArchive({
      departureFrom: from,
      departureTo: to,
      includeInvoiceItems: true,
    });
  } catch (err) {
    // Le détail reste dans les logs : le message du client Beds24 porte le chemin interne et
    // 200 caractères de la réponse de l'API. Utile pour diagnostiquer, inutile au navigateur —
    // et c'est précisément ce qu'on a retiré du rôle restreint côté Albiez.
    console.error("[taxe-sejour] Beds24 :", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Beds24 momentanément injoignable" }, { status: 502 });
  }

  const lines: TaxeSejourLine[] = bookings
    .filter((b) => countsAsSold(b.status))
    .filter((b) => Boolean(b.arrival) && Boolean(b.departure))
    // Le barème est une donnée injectée depuis le Lot 4 : le moteur du socle ne connaît
    // aucune délibération communale.
    .map((b) => computeTaxeSejour(b, TAXE_SEJOUR_CONFIG));

  const directLines = lines.filter((l) => l.channel === "Direct");
  const collecteesLines = lines.filter((l) => CANAUX_TIERS_COLLECTEURS.includes(l.channel));

  const directQuarters = groupByQuarter(directLines, year);
  const collecteesChannels = groupByChannel(collecteesLines, CANAUX_TIERS_COLLECTEURS);

  const response: TaxeSejourResponse = {
    year,
    config: TAXE_SEJOUR_CONFIG,
    direct: {
      totalTax: directLines.reduce((sum, l) => sum + l.taxTotal, 0),
      bookingsCount: directLines.length,
      nightsCount: directLines.reduce((sum, l) => sum + l.nights, 0),
      quarters: directQuarters,
    },
    collectees: {
      channels: collecteesChannels,
      totalTax: collecteesLines.reduce((sum, l) => sum + l.taxTotal, 0),
      // Somme des montants de taxe **effectivement remontés** par Beds24. Un `taxCollected`
      // à `null` (Airbnb et Abritel ne font transiter aucune ligne de taxe) n'est pas un
      // zéro : c'est une absence d'information. Il n'ajoute rien à ce total, et l'affichage
      // doit dire « non renseigné » plutôt que « 0 € » — d'où le `null` conservé jusqu'à la
      // page, jamais aplati en amont.
      totalTaxCollected: collecteesLines.reduce(
        (sum, l) => sum + (l.taxCollected ?? 0),
        0,
      ),
      bookingsCount: collecteesLines.length,
    },
  };

  return NextResponse.json(response);
}
