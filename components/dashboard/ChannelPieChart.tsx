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

export default function ChannelPieChart({ data }: ChannelPieChartProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-gray-900">
        Répartition par canal
      </h3>
      <p className="mb-4 text-sm text-gray-400">
        Nombre de réservations
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
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
              formatter={(value, name) => [
                `${value} réservation${Number(value) > 1 ? "s" : ""}`,
                name,
              ]}
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
  );
}
