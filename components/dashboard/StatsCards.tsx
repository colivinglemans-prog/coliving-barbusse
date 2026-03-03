interface StatsCardsProps {
  totalRevenue: number;
  totalBookings: number;
  occupancyRate: number;
}

export default function StatsCards({ totalRevenue, totalBookings, occupancyRate }: StatsCardsProps) {
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
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-2xl ${card.bg} p-6`}>
          <p className="text-sm font-medium text-gray-500">{card.label}</p>
          <p className={`mt-2 text-3xl font-bold ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
