import type { RevenueProjection as ProjectionData } from "@/lib/types";

interface RevenueProjectionProps {
  projection: ProjectionData;
}

export default function RevenueProjection({ projection }: RevenueProjectionProps) {
  const { projectedRevenue, daysRemaining, avgDailyRevenue, realizedRevenue } = projection;
  const progress = projectedRevenue > 0
    ? Math.min(100, Math.round((realizedRevenue / projectedRevenue) * 100))
    : 0;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <h3 className="text-lg font-semibold text-gray-900">Projection annuelle</h3>
      <p className="mt-1 text-sm text-gray-400">
        Basée sur le revenu journalier moyen constaté ({avgDailyRevenue.toLocaleString("fr-FR")} €/jour) &times; {daysRemaining} jours restants
      </p>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-900">
          {projectedRevenue.toLocaleString("fr-FR")} €
        </span>
        <span className="mb-1 text-sm text-gray-400">projeté sur l'année</span>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-gray-700">
            {realizedRevenue.toLocaleString("fr-FR")} € réalisés
          </span>
          <span className="text-gray-400">{progress} %</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
