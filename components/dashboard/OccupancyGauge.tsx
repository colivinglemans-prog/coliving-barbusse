import type { MonthRevenue } from "@/lib/types";

interface OccupancyGaugeProps {
  rate: number;
  monthlyData: MonthRevenue[];
}

export default function OccupancyGauge({ rate, monthlyData }: OccupancyGaugeProps) {
  const barColor = (r: number) =>
    r >= 75 ? "bg-emerald-400" : r >= 50 ? "bg-amber-400" : "bg-rose-400";

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Taux d&apos;occupation
          </h3>
          <p className="text-sm text-gray-400">Moyenne : {rate}%</p>
        </div>
      </div>
      <div className="space-y-3">
        {monthlyData.map((m) => (
          <div key={m.month} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-sm text-gray-500">{m.month}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${barColor(m.occupancyRate)}`}
                style={{ width: `${Math.min(m.occupancyRate, 100)}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-sm font-medium text-gray-700">
              {m.occupancyRate}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
