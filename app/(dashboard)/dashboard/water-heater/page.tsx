"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { CozytouchWaterHeaterStatus, CozytouchDHWMode } from "@/lib/types";
import DashboardNav from "@/components/dashboard/DashboardNav";
import WaterHeaterCard from "@/components/dashboard/WaterHeaterCard";

interface WaterHeaterData {
  status: CozytouchWaterHeaterStatus;
  seriesNote: string;
  /** Décision d'appoint électrique du dernier passage de l'automation. */
  booster?: { allowed: boolean; reason: string; radiatorLoadW: number | null; budgetW: number; at: string } | null;
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement réseau : le drapeau « chargement » posé avant le premier await est ce que le rendu doit montrer (même convention qu’Albiez).
    fetchData();
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  async function handleControl(body: Record<string, unknown>) {
    try {
      const send = (b: Record<string, unknown>) =>
        fetch("/api/dashboard/water-heater/control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(b),
        });
      const res = await send(body);
      if (res.status === 409) {
        // Appoint refusé par la règle de délestage : l'admin peut forcer, en connaissance de cause.
        const json = await res.json().catch(() => ({}));
        const message = json.error ?? "Appoint électrique non permis en ce moment.";
        if (
          role === "admin" &&
          window.confirm(
            `${message}\n\nForcer quand même ? L'automation reprendra la main à son prochain passage (15 min au plus).`,
          )
        ) {
          const forced = await send({ ...body, force: true });
          if (!forced.ok) window.alert(`Échec du forçage (HTTP ${forced.status}).`);
        } else if (role !== "admin") {
          window.alert(message);
        }
      }
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

        {data?.booster && (
          <div
            className={`mb-4 rounded-2xl border p-4 text-sm ${
              data.booster.allowed ? "border-amber-200 bg-amber-50 text-amber-900" : "border-sky-200 bg-sky-50 text-sky-900"
            }`}
          >
            {data.booster.allowed ? "Appoint électrique permis" : "PAC seule"} — {data.booster.reason}
            {data.booster.radiatorLoadW !== null && (
              <>
                {" "}
                (radiateurs {(data.booster.radiatorLoadW / 1000).toFixed(1)} kW, budget{" "}
                {(data.booster.budgetW / 1000).toFixed(1)} kW)
              </>
            )}
          </div>
        )}

        {data && (
          <WaterHeaterCard
            data={data.status}
            seriesNote={data.seriesNote}
            onSetMode={(mode: CozytouchDHWMode) => handleControl({ action: "setMode", mode })}
            onSetBoost={(on: boolean) => handleControl({ action: "setBoost", on })}
            onRefresh={() => handleControl({ action: "refresh" })}
            loading={loading}
            role={effectiveRole}
          />
        )}
      </div>
    </>
  );
}
