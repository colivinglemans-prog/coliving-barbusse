import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { toBooking } from "@/lib/beds24";
import { getStays } from "@/lib/bookings";
import { archiveOrigin, withArchive } from "@/lib/bookings-archive";
import { eventForStay, shortEventLabel } from "@/lib/events";
import { getUnlinkedEvents } from "@/lib/event-links";
import { soldBookings } from "@sejour/socle/lib/booking-status";
import { computeDashboardStats, parseStatsQuery } from "@sejour/socle/lib/dashboard-stats";
import { todayParis } from "@sejour/socle/lib/time";

/**
 * La charge utile de la page de statistiques — **la même que chez Albiez**, calculée par la
 * même fonction du socle.
 *
 * Cette route faisait 501 lignes. Elle publiait deux RevPAR différents sur la même page, une
 * « tendance actuelle » qui extrapolait un tarif moyen sur les jours non couverts, un « pricing
 * dynamique » qui changeait tout seul d'une heure à l'autre, et des triplets global/maison/
 * chambre pour une activité qui ne se loue plus à la chambre. Tout cela est parti — décision de
 * l'exploitant, arbitrage du douanier du 2026-09-12. Il ne reste que ce qui est propre à ce
 * bien : d'où viennent les séjours (Beds24 plus l'archive de la location à la chambre), neuf
 * logements louables, et le repère des lignes — l'événement du circuit, là où Albiez écrit la
 * période de vacances.
 *
 * L'unité est la **nuit de maison** : un logement louable, la maison ; une nuit de chambre de
 * l'époque à la chambre pèse un neuvième — c'est `toBooking` qui pose ce poids, le socle ne fait
 * que le lire. Décision de l'exploitant du 2026-09-13 : les indicateurs se lisent à la nuit de
 * maison, pas à la chambre.
 */
const UNITS_TOTAL = 1;

/**
 * L'activité a commencé en novembre 2025 : une fenêtre qui part du 1er janvier 2025 couvre tout,
 * archive comprise, en une requête. Les blocs de comparaison ont besoin de l'historique complet
 * quelle que soit la période choisie.
 */
const FIRST_ARRIVAL = "2025-01-01";

export async function GET(request: NextRequest) {
  const refus = await guard.denyNonAdmin(request);
  if (refus) return refus;

  const { period, mode } = parseStatsQuery(request.nextUrl.searchParams);
  const window = { arrivalFrom: FIRST_ARRIVAL, arrivalTo: `${Number(todayParis().slice(0, 4)) + 1}-12-31` };

  // Beds24 peut être injoignable : l'archive doit rester consultable, et la page le dit dans un
  // bandeau au lieu d'afficher zéro. Le détail de l'erreur reste dans les logs.
  let bookings;
  let beds24Error: string | null = null;
  try {
    bookings = soldBookings(await getStays(window));
  } catch (e) {
    console.error("Beds24 injoignable :", e instanceof Error ? e.message : e);
    beds24Error = "Beds24 est injoignable : seul l'historique archivé est affiché.";
    bookings = soldBookings(
      withArchive([], window, { invoiceItems: true }).map((b) => toBooking(b, "archive")),
    );
  }

  // Les rattachements d'événement déliés à la main : le repère des lignes doit dire la même
  // chose que la popup du calendrier, où le déliement a été écrit.
  const unlinkedEvents = await getUnlinkedEvents();

  const payload = computeDashboardStats({
    bookings,
    mode,
    period,
    unitsTotal: UNITS_TOTAL,
    markerOf: (b) => {
      // Une ligne d'archive sans identifiant Beds24 n'a jamais pu être déliée : `-1` ne
      // rencontre aucun couple stocké, et l'étiquetage automatique s'applique.
      const event = eventForStay(b.id ?? -1, b.arrival, b.departure, unlinkedEvents);
      return event ? shortEventLabel(event) : null;
    },
    warnings: { archiveMissing: archiveOrigin() === "absente", beds24Error },
  });

  return NextResponse.json(payload);
}
