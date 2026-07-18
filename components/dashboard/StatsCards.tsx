import type { SplitMetric } from "@/lib/types";

interface StatsCardsProps {
  totalRevenue: number;
  netRevenue: number;
  commissionRate: number;
  totalBookings: number;
  occupancyRate: number;
  tjm: SplitMetric;
  revpar: SplitMetric;
  avgStay: SplitMetric;
  avgLeadTime: SplitMetric;
  directRevenueShare: number;
  directBookingShare: number;
  eventRevenueShare: number;
  eventPremium: number | null;
  forwardOccupancy90: number;
}

export default function StatsCards({
  totalRevenue,
  netRevenue,
  commissionRate,
  totalBookings,
  occupancyRate,
  tjm,
  revpar,
  avgStay,
  avgLeadTime,
  directRevenueShare,
  directBookingShare,
  eventRevenueShare,
  eventPremium,
  forwardOccupancy90,
}: StatsCardsProps) {
  const cards = [
    {
      label: "Revenus totaux",
      value: `${totalRevenue.toLocaleString("fr-FR")} €`,
      color: "text-rose-500",
      bg: "bg-rose-50",
      tooltip: "Chiffre d'affaires brut (avant commissions plateformes)",
    },
    {
      label: "Revenu net",
      value: `${netRevenue.toLocaleString("fr-FR")} €`,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      tooltip: "CA net des commissions Airbnb/Booking (extraites des factures Beds24). Avant charges fixes.",
      sub: `−${commissionRate} % de commissions`,
    },
    {
      label: "Réservations",
      value: totalBookings.toString(),
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Occupation moyenne",
      value: `${occupancyRate} %`,
      color: occupancyRate >= 75 ? "text-emerald-600" : occupancyRate >= 50 ? "text-amber-600" : "text-rose-500",
      bg: occupancyRate >= 75 ? "bg-emerald-50" : occupancyRate >= 50 ? "bg-amber-50" : "bg-rose-50",
      tooltip: "Taux d'occupation calendaire réalisé (nuits vendues ÷ nuits disponibles, depuis le début de la période)",
    },
    {
      label: "TJM",
      value: `${tjm.house} €`,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      tooltip: "Tarif Journalier Moyen (maison entière) : revenu divisé par le nombre de nuitées vendues",
    },
    {
      label: "RevPAR",
      value: `${revpar.house} €`,
      color: "text-violet-600",
      bg: "bg-violet-50",
      tooltip: "Revenu par nuit disponible (maison entière) : TJM × taux d'occupation. Intègre les nuits vides, donc toujours ≤ TJM.",
    },
    {
      label: "Durée moy. séjour",
      value: `${avgStay.house} nuits`,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      label: "Délai moy. réservation",
      value: `${avgLeadTime.house} jours`,
      color: "text-amber-600",
      bg: "bg-amber-50",
      tooltip: "Nombre moyen de jours entre la date de réservation et l'arrivée (maison entière)",
    },
    {
      label: "Résas directes",
      value: `${directBookingShare} %`,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
      tooltip: "Part des réservations faites en direct (sans commission). En dessous : part du chiffre d'affaires correspondante.",
      sub: `${directRevenueShare} % du CA`,
    },
    {
      label: "Occ. 90 j (à venir)",
      value: `${forwardOccupancy90} %`,
      color: "text-blue-600",
      bg: "bg-blue-50",
      tooltip: "Occupation des 90 prochains jours déjà réservée (occupancy on the books) : indicateur d'avance des réservations.",
    },
    {
      label: "CA événements",
      value: `${eventRevenueShare} %`,
      color: "text-fuchsia-600",
      bg: "bg-fuchsia-50",
      tooltip: "Part du chiffre d'affaires liée à un événement du circuit (24h, MotoGP, Classic…)",
    },
    {
      label: "Premium événement",
      value: eventPremium === null ? "n/a" : `${eventPremium >= 0 ? "+" : ""}${eventPremium} %`,
      color: "text-fuchsia-600",
      bg: "bg-fuchsia-50",
      tooltip: "Surcote du TJM pendant les événements par rapport aux périodes hors événement (n/a si trop peu de nuitées hors événement pour être fiable)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-2xl ${card.bg} p-5`} title={card.tooltip}>
          <p className="text-sm font-medium text-gray-500">
            {card.label}
            {card.tooltip && <span className="ml-1 cursor-help text-gray-300">?</span>}
          </p>
          <p className={`mt-1 text-2xl font-bold ${card.color}`}>{card.value}</p>
          {"sub" in card && card.sub && (
            <p className="mt-1 text-xs text-gray-500">{card.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
