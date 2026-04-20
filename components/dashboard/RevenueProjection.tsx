import type { RevenueProjection as ProjectionData } from "@/lib/types";

interface RevenueProjectionProps {
  projection: ProjectionData;
}

function fmt(n: number): string {
  return Math.round(n).toLocaleString("fr-FR");
}

export default function RevenueProjection({ projection }: RevenueProjectionProps) {
  const {
    projectedRevenue,
    daysRemaining,
    avgDailyRevenue,
    realizedRevenue,
    confirmedUpcoming,
    minimumRevenue,
    dynamicPricingRevenue,
    occupancyRatio,
  } = projection;

  const progress =
    projectedRevenue > 0
      ? Math.min(100, Math.round((minimumRevenue / projectedRevenue) * 100))
      : 0;
  const realizedPct =
    projectedRevenue > 0
      ? Math.min(100, Math.round((realizedRevenue / projectedRevenue) * 100))
      : 0;

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <h3 className="text-lg font-semibold text-gray-900">Projection annuelle</h3>
      <p className="mt-1 text-sm text-gray-400">
        {daysRemaining} jours restants dans l&apos;année
      </p>

      {/* Totaux réalisé + confirmé */}
      <div className="mt-5 rounded-xl bg-gray-50 p-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
          <span className="font-medium text-rose-600">
            {fmt(realizedRevenue)} € réalisés
          </span>
          <span className="text-gray-400">+</span>
          <span className="font-medium text-amber-600">
            {fmt(confirmedUpcoming)} € confirmés
          </span>
          <span className="text-gray-400">=</span>
          <span className="text-lg font-bold text-gray-900">
            {fmt(minimumRevenue)} € garantis
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
          <div className="flex h-full">
            <div
              className="h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all"
              style={{ width: `${realizedPct}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-amber-400 transition-all"
              style={{ width: `${Math.max(0, progress - realizedPct)}%` }}
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
          <span>{progress} % du projeté</span>
        </div>
      </div>

      {/* Scénarios de projection */}
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Minimum garanti
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {fmt(minimumRevenue)} €
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Si aucune nouvelle réservation.
          </p>
        </div>
        <div className="rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Tendance actuelle
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {fmt(projectedRevenue)} €
          </p>
          <p className="mt-1 text-xs text-gray-500">
            + {fmt(avgDailyRevenue)} €/j (TJM moyen) sur les jours non couverts.
          </p>
        </div>
        <div
          className={`rounded-xl p-4 ${
            dynamicPricingRevenue !== null
              ? "border-2 border-indigo-300 bg-indigo-50/30"
              : "border border-gray-100 opacity-60"
          }`}
        >
          <p
            className={`text-xs font-medium uppercase tracking-wide ${
              dynamicPricingRevenue !== null ? "text-indigo-500" : "text-gray-400"
            }`}
          >
            Pricing dynamique
          </p>
          <p
            className={`mt-1 text-2xl font-bold ${
              dynamicPricingRevenue !== null ? "text-indigo-700" : "text-gray-400"
            }`}
          >
            {dynamicPricingRevenue !== null ? `${fmt(dynamicPricingRevenue)} €` : "—"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {dynamicPricingRevenue !== null
              ? `Prix BeyondPricing × taux d'occupation ${Math.round(occupancyRatio * 100)} %.`
              : "Données indisponibles."}
          </p>
        </div>
      </div>
    </div>
  );
}
