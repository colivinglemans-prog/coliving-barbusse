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

function SplitDetail({ house, room, unit }: { house: number; room: number; unit: string }) {
  if (house === 0 && room === 0) return null;
  return (
    <div className="mt-2 flex gap-3 text-xs text-gray-500">
      <span title="Maison entière">🏠 {house}{unit}</span>
      <span title="Chambre">🛏️ {room}{unit}</span>
    </div>
  );
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
      value: `${tjm.global} €`,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      tooltip: "Tarif Journalier Moyen : revenu total divisé par le nombre de nuitées vendues",
      split: { house: tjm.house, room: tjm.room, unit: " €" },
    },
    {
      label: "Revenu / jour",
      value: `${Math.round(revpar.global)} €`,
      color: "text-violet-600",
      bg: "bg-violet-50",
      tooltip: "Revenu moyen de la maison par jour (jours vides inclus). Compare combien la maison rapporte par jour selon le mode de location",
      split: { house: Math.round(revpar.house), room: Math.round(revpar.room), unit: " €" },
    },
    {
      label: "Durée moy. séjour",
      value: `${avgStay.global} nuits`,
      color: "text-sky-600",
      bg: "bg-sky-50",
      split: { house: avgStay.house, room: avgStay.room, unit: " n" },
    },
    {
      label: "Délai moy. réservation",
      value: `${avgLeadTime.global} jours`,
      color: "text-amber-600",
      bg: "bg-amber-50",
      tooltip: "Nombre moyen de jours entre la date de réservation et l'arrivée",
      split: { house: avgLeadTime.house, room: avgLeadTime.room, unit: " j" },
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
          {"split" in card && card.split && (
            <SplitDetail {...card.split} />
          )}
        </div>
      ))}
    </div>
  );
}
