"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MonthRevenue } from "@/lib/types";
import {
  CHART_AXIS,
  CHART_GRID,
  CHART_LEGEND,
  CHART_TOOLTIP_STYLE,
  chartAxisIn,
} from "@sejour/socle/lib/chart-theme";

interface RevenueChartProps {
  data: MonthRevenue[];
}

/** Violet du RevPAR : la courbe, son axe et ses points le partagent. */
const REVPAR_COLOUR = "#8b5cf6";

const SERIES_LABELS: Record<string, string> = {
  realized: "Réalisé",
  upcoming: "À venir",
  revpar: "RevPAR",
};

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-gray-900">
        Revenus mensuels
      </h3>
      <p className="mb-4 text-sm text-gray-400">
        Réalisé vs. à venir · RevPAR (revenu / nuit disponible)
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} barGap={0}>
            <CartesianGrid {...CHART_GRID} />
            <XAxis dataKey="month" {...CHART_AXIS} />
            <YAxis yAxisId="revenue" {...CHART_AXIS} tickFormatter={(v) => `${v} €`} />
            {/* L'axe de droite prend la couleur de sa courbe : sans ça, rien ne dit lequel
                des deux axes lit le RevPAR. */}
            <YAxis
              yAxisId="revpar"
              orientation="right"
              {...chartAxisIn(REVPAR_COLOUR)}
              tickFormatter={(v) => `${v} €`}
            />
            <Tooltip
              formatter={(value, name) => [
                `${Number(value).toLocaleString("fr-FR")} €`,
                SERIES_LABELS[String(name)] ?? name,
              ]}
              contentStyle={CHART_TOOLTIP_STYLE}
            />
            <Legend
              {...CHART_LEGEND}
              formatter={(value) => SERIES_LABELS[String(value)] ?? value}
            />
            <Bar
              yAxisId="revenue"
              dataKey="realized"
              stackId="revenue"
              fill="#FF385C"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              yAxisId="revenue"
              dataKey="upcoming"
              stackId="revenue"
              fill="#FFB8C6"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="revpar"
              type="monotone"
              dataKey="revpar"
              stroke={REVPAR_COLOUR}
              strokeWidth={2}
              dot={{ r: 3, fill: REVPAR_COLOUR }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
