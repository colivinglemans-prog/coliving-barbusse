import type { RevenueProjection as ProjectionData } from "@/lib/types";

interface RevenueProjectionProps {
  projection: ProjectionData;
}

export default function RevenueProjection({ projection }: RevenueProjectionProps) {
  const { projectedRevenue, daysRemaining, avgDailyRevenue, realizedRevenue, confirmedUpcoming } = projection;
  const totalConfirmed = realizedRevenue + confirmedUpcoming;
  const progress = projectedRevenue > 0
    ? Math.min(100, Math.round((totalConfirmed / projectedRevenue) * 100))
    : 0;
  const realizedPct = projectedRevenue > 0
    ? Math.min(100, Math.round((realizedRevenue / projectedRevenue) * 100))
    : 0;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <h3 className="text-lg font-semibold text-gray-900">Projection annuelle</h3>
      <p className="mt-1 text-sm text-gray-400">
        Réalisé + confirmé + estimation sur les jours restants non couverts ({avgDailyRevenue.toLocaleString("fr-FR")} €/jour &times; {daysRemaining} j restants)
      </p>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-900">
          {projectedRevenue.toLocaleString("fr-FR")} €
        </span>
        <span className="mb-1 text-sm text-gray-400">projeté sur l'année</span>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm">
          <div className="flex gap-4">
            <span className="font-medium text-rose-600">
              {realizedRevenue.toLocaleString("fr-FR")} € réalisés
            </span>
            <span className="font-medium text-amber-600">
              + {confirmedUpcoming.toLocaleString("fr-FR")} € confirmés
            </span>
          </div>
          <span className="text-gray-400">{progress} %</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100">
          <div className="flex h-full">
            <div
              className="h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all"
              style={{ width: `${realizedPct}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-amber-400 transition-all"
              style={{ width: `${progress - realizedPct}%` }}
            />
          </div>
        </div>
        <div className="mt-2 flex gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-rose-400" /> Réalisé
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> Confirmé
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-gray-200" /> Estimation
          </span>
        </div>
      </div>
    </div>
  );
}
