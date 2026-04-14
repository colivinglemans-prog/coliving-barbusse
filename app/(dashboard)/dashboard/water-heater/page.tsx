"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { CozytouchWaterHeaterStatus, CozytouchDHWMode } from "@/lib/types";
import DashboardNav from "@/components/dashboard/DashboardNav";
import WaterHeaterCard from "@/components/dashboard/WaterHeaterCard";

interface WaterHeaterData {
  status: CozytouchWaterHeaterStatus;
  seriesNote: string;
}

export default function WaterHeaterPage() {
  const [data, setData] = useState<WaterHeaterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState<"admin" | "viewer">("viewer");
  const [viewAs, setViewAs] = useState<"admin" | "viewer" | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/water-heater");
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch role
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.role) setRole(d.role); })
      .catch(() => {});

    // Initial fetch + polling
    fetchData();
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  async function handleControl(body: Record<string, unknown>) {
    try {
      await fetch("/api/dashboard/water-heater/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setTimeout(fetchData, 2000);
    } catch {
      // Silently fail — next poll will show the state
    }
  }

  const effectiveRole = viewAs ?? role;

  return (
    <>
      <DashboardNav />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Eau chaude</h1>
          {role === "admin" && (
            <button
              onClick={() => setViewAs(viewAs ? null : "viewer")}
              className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200"
            >
              {viewAs ? "Vue admin" : "Vue viewer"}
            </button>
          )}
        </div>

        {loading && !data && (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-500" />
          </div>
        )}

        {error && !data && (
          <div className="rounded-2xl bg-red-50 p-6 text-red-600">{error}</div>
        )}

        {data && (
          <WaterHeaterCard
            data={data.status}
            seriesNote={data.seriesNote}
            onSetMode={(mode: CozytouchDHWMode) => handleControl({ action: "setMode", mode })}
            onSetBoost={(duration: number) => handleControl({ action: "setBoost", duration })}
            onRefresh={() => handleControl({ action: "refresh" })}
            loading={loading}
            role={effectiveRole}
          />
        )}
      </div>
    </>
  );
}
