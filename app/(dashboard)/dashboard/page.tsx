"use client";

import { useEffect, useState, useCallback } from "react";
import type { DashboardStats, RevenueMode } from "@/lib/types";
import StatsCards from "@/components/dashboard/StatsCards";
import RevenueChart from "@/components/dashboard/RevenueChart";
import ChannelPieChart from "@/components/dashboard/ChannelPieChart";
import OccupancyGauge from "@/components/dashboard/OccupancyGauge";
import PeriodSelector from "@/components/dashboard/PeriodSelector";
import RevenueModeSelector from "@/components/dashboard/RevenueModeSelector";
import DashboardNav from "@/components/dashboard/DashboardNav";

export default function Dashboard() {
  const [period, setPeriod] = useState("3m");
  const [mode, setMode] = useState<RevenueMode>("averagedPerNight");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/stats?period=${period}&mode=${mode}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setStats(data);
    } catch {
      setError("Impossible de charger les statistiques. Vérifiez votre token Beds24.");
    } finally {
      setLoading(false);
    }
  }, [period, mode]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <>
      <DashboardNav />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <RevenueModeSelector value={mode} onChange={setMode} />
            <PeriodSelector value={period} onChange={setPeriod} />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl bg-rose-50 p-6 text-rose-600">
            {error}
          </div>
        )}

        {stats && !loading && (
          <div className="space-y-6">
            <StatsCards
              totalRevenue={stats.totalRevenue}
              totalBookings={stats.totalBookings}
              occupancyRate={stats.occupancyRate}
            />

            <RevenueChart data={stats.revenueByMonth} />

            <ChannelPieChart data={stats.channelDistribution} />

            <OccupancyGauge rate={stats.occupancyRate} monthlyData={stats.revenueByMonth} />
          </div>
        )}
      </div>
    </>
  );
}
