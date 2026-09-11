"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CHANNEL_COLORS, type Channel } from "@sejour/socle/lib/channels";
import {
  CHART_LEGEND,
  CHART_TOOLTIP_STYLE,
  chartEuro,
} from "@sejour/socle/lib/chart-theme";

interface ChannelPieChartProps {
  data: { channel: string; count: number; revenue: number }[];
}

export default function ChannelPieChart({ data }: ChannelPieChartProps) {
  const charts = [
    {
      title: "Répartition par canal",
      subtitle: "Nombre de réservations",
      dataKey: "count" as const,
      formatter: (value: number | string) => `${value} réservation${Number(value) > 1 ? "s" : ""}`,
    },
    {
      title: "Revenus par canal",
      subtitle: "Montant total",
      dataKey: "revenue" as const,
      formatter: (value: number | string) => chartEuro(Number(value)),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {charts.map((chart) => (
        <div key={chart.dataKey} className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-base font-semibold text-gray-900">
            {chart.title}
          </h3>
          <p className="mb-4 text-sm text-gray-400">{chart.subtitle}</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey={chart.dataKey}
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell
                      key={entry.channel}
                      fill={CHANNEL_COLORS[entry.channel as Channel] ?? "#d1d5db"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={chart.formatter as any}
                  contentStyle={CHART_TOOLTIP_STYLE}
                />
                <Legend {...CHART_LEGEND} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
