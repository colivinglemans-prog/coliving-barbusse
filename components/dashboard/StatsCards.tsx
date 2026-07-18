import type { SplitMetric } from "@/lib/types";

interface StatsCardsProps {
  totalRevenue: number;
  totalBookings: number;
  occupancyRate: number;
  tjm: SplitMetric;
  revpar: SplitMetric;
  avgStay: SplitMetric;
  avgLeadTime: SplitMetric;
}

export default function StatsCards({
  totalRevenue,
  totalBookings,
  occupancyRate,
  tjm,
  revpar,
  avgStay,
  avgLeadTime,
}: StatsCardsProps) {
  const cards = [
    {
      label: "Revenus totaux",
      value: `${totalRevenue.toLocaleString("fr-FR")} €`,
      color: "text-rose-500",
      bg: "bg-rose-50",
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
        </div>
      ))}
    </div>
  );
}
