"use client";

import { useState } from "react";
import type { CozytouchWaterHeaterStatus, CozytouchDHWMode } from "@/lib/types";

interface WaterHeaterCardProps {
  data: CozytouchWaterHeaterStatus;
  seriesNote: string;
  onSetMode: (mode: CozytouchDHWMode) => void;
  onSetBoost: (duration: number) => void;
  onRefresh: () => void;
  loading: boolean;
  role: "admin" | "viewer";
}

const MODE_CONFIG: { mode: CozytouchDHWMode; label: string; color: string; activeColor: string }[] = [
  { mode: "autoMode", label: "Auto", color: "bg-gray-100 text-gray-700 hover:bg-green-100", activeColor: "bg-green-500 text-white" },
  { mode: "manualEcoActive", label: "Éco", color: "bg-gray-100 text-gray-700 hover:bg-blue-100", activeColor: "bg-blue-500 text-white" },
  { mode: "manualEcoInactive", label: "Performance", color: "bg-gray-100 text-gray-700 hover:bg-orange-100", activeColor: "bg-orange-500 text-white" },
];

export default function WaterHeaterCard({
  data,
  seriesNote,
  onSetMode,
  onSetBoost,
  onRefresh,
  loading,
  role,
}: WaterHeaterCardProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const isAdmin = role === "admin";
  const busy = loading || actionLoading;

  async function handleAction(fn: () => void) {
    setActionLoading(true);
    try {
      fn();
    } finally {
      setTimeout(() => setActionLoading(false), 2000);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Ballon thermodynamique
        </h3>
        <div className="flex items-center gap-2">
          {busy && (
            <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" className="opacity-75" />
            </svg>
          )}
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            data.isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {data.isAvailable ? "En ligne" : "Hors ligne"}
          </span>
        </div>
      </div>

      {/* Error banner */}
      {data.error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Erreur : {data.error}
        </div>
      )}

      {/* Metrics */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-sky-50 p-4">
          <p className="text-xs font-medium text-gray-500">Température</p>
          <p className="mt-1 text-2xl font-bold text-sky-600">{data.currentTemperature}°C</p>
          {data.middleTemperature != null && (
            <p className="text-xs text-gray-400">Milieu : {data.middleTemperature}°C</p>
          )}
        </div>
        <div className="rounded-xl bg-indigo-50 p-4">
          <p className="text-xs font-medium text-gray-500">Consigne</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{data.targetTemperature}°C</p>
        </div>
        {data.waterVolume != null && (
          <div className="rounded-xl bg-teal-50 p-4">
            <p className="text-xs font-medium text-gray-500">Volume à 40°C</p>
            <p className="mt-1 text-2xl font-bold text-teal-600">{data.waterVolume}L</p>
            {data.capacity != null && (
              <p className="text-xs text-gray-400">/ {data.capacity}L</p>
            )}
          </div>
        )}
        {data.energyConsumption != null && (
          <div className="rounded-xl bg-amber-50 p-4">
            <p className="text-xs font-medium text-gray-500">Consommation</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              {(data.energyConsumption / 1000).toFixed(1)} kWh
            </p>
          </div>
        )}
      </div>

      {/* Status badges */}
      <div className="mb-5 flex flex-wrap gap-2">
        {data.isHeating && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-orange-500" />
            Chauffe
          </span>
        )}
        {data.boostActive && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-600">
            Boost actif ({data.boostDuration}j)
          </span>
        )}
      </div>

      {/* Mode buttons */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-gray-500">Mode</p>
        <div className="flex gap-2">
          {MODE_CONFIG.map(({ mode, label, color, activeColor }) => (
            <button
              key={mode}
              onClick={() => handleAction(() => onSetMode(mode))}
              disabled={!isAdmin || busy}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                data.mode === mode ? activeColor : color
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Boost buttons */}
      {isAdmin && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-gray-500">Boost</p>
          <div className="flex gap-2">
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                onClick={() => handleAction(() => onSetBoost(d))}
                disabled={busy}
                className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200 disabled:opacity-50"
              >
                {d}j
              </button>
            ))}
            {data.boostActive && (
              <button
                onClick={() => handleAction(() => onSetBoost(0))}
                disabled={busy}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
              >
                Désactiver
              </button>
            )}
            <button
              onClick={() => handleAction(() => onRefresh())}
              disabled={busy}
              className="ml-auto rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-200 disabled:opacity-50"
            >
              Actualiser
            </button>
          </div>
        </div>
      )}

      {/* Series info note */}
      <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
        {seriesNote}
      </div>
    </div>
  );
}
