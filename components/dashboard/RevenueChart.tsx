"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MonthRevenue } from "@/lib/types";

interface RevenueChartProps {
  data: MonthRevenue[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-gray-900">
        Revenus mensuels
      </h3>
      <p className="mb-4 text-sm text-gray-400">
        Réalisé vs. à venir
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={0}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v} €`}
            />
            <Tooltip
              formatter={(value, name) => [
                `${Number(value).toLocaleString("fr-FR")} €`,
                name === "realized" ? "Réalisé" : "À venir",
              ]}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Legend
              formatter={(value) => (value === "realized" ? "Réalisé" : "À venir")}
              iconType="circle"
              wrapperStyle={{ fontSize: "12px", color: "#6b7280" }}
            />
            <Bar
              dataKey="realized"
              stackId="revenue"
              fill="#FF385C"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="upcoming"
              stackId="revenue"
              fill="#FFB8C6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
