"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CHANNEL_COLORS: Record<string, string> = {
  Airbnb: "#FF385C",
  "Booking.com": "#003580",
  Abritel: "#F5A623",
  Direct: "#00A699",
  Autre: "#d1d5db",
};

interface ChannelPieChartProps {
  data: { channel: string; count: number; revenue: number }[];
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
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
      formatter: (value: number | string) => formatEuro(Number(value)),
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
                      fill={CHANNEL_COLORS[entry.channel] ?? "#d1d5db"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={chart.formatter as any}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", color: "#6b7280" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
