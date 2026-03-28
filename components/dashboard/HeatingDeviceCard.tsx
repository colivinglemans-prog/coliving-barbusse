"use client";

import type { HeatzyDevice } from "@/lib/types";

const MODE_LABELS: Record<string, string> = {
  cft: "Confort",
  cft1: "Confort-1",
  cft2: "Confort-2",
  eco: "Éco",
  fro: "Hors-gel",
  presence: "Présence",
  stop: "Stop",
};

const MODE_COLORS: Record<string, string> = {
  cft: "bg-orange-100 text-orange-700",
  cft1: "bg-orange-100 text-orange-700",
  cft2: "bg-orange-100 text-orange-700",
  eco: "bg-blue-100 text-blue-700",
  fro: "bg-gray-100 text-gray-600",
  presence: "bg-green-100 text-green-700",
  stop: "bg-red-100 text-red-700",
};

const MODE_BUTTONS: { mode: string; label: string; color: string }[] = [
  { mode: "cft", label: "Confort", color: "bg-orange-500 hover:bg-orange-600" },
  { mode: "eco", label: "Éco", color: "bg-blue-500 hover:bg-blue-600" },
  { mode: "fro", label: "Hors-gel", color: "bg-gray-500 hover:bg-gray-600" },
  { mode: "presence", label: "Présence", color: "bg-green-500 hover:bg-green-600" },
  { mode: "stop", label: "Stop", color: "bg-red-500 hover:bg-red-600" },
];

export type TempTrend = "up" | "down" | "stable";

function formatDuration(since: Date): string {
  const diffMs = Date.now() - since.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `depuis ${mins} min`;
  const hours = Math.floor(mins / 60);
  return `depuis ${hours}h${mins % 60 > 0 ? String(mins % 60).padStart(2, "0") : ""}`;
}

interface HeatingDeviceCardProps {
  device: HeatzyDevice;
  onSetMode: (did: string, mode: string) => void;
  onToggleLock?: (did: string, lock: boolean) => void;
  loading?: boolean;
  role?: "admin" | "viewer";
  trend?: TempTrend;
  presenceSince?: Date;
}

export default function HeatingDeviceCard({
  device,
  onSetMode,
  onToggleLock,
  loading,
  role = "admin",
  trend,
  presenceSince,
}: HeatingDeviceCardProps) {
  const modeLabel = MODE_LABELS[device.mode] ?? device.mode;
  const modeColor = MODE_COLORS[device.mode] ?? "bg-gray-100 text-gray-600";
  const errors = device.alerts.filter((a) => a.level === "error");
  const warnings = device.alerts.filter((a) => a.level === "warning");

  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${
      errors.length > 0
        ? "border-red-300"
        : warnings.length > 0
          ? "border-amber-300"
          : "border-gray-200"
    }`}>
      {/* Alert banners */}
      {errors.map((alert, i) => (
        <div key={`e${i}`} className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
          <span className="mr-1 font-medium">Action requise :</span>
          {alert.message}
        </div>
      ))}
      {warnings.map((alert, i) => (
        <div key={`w${i}`} className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          {alert.message}
        </div>
      ))}

      {/* Locked badge */}
      {device.isLocked && (
        <div className="mb-3 rounded-lg bg-purple-50 border border-purple-200 px-3 py-2 text-sm text-purple-800 flex items-center justify-between">
          <span>Verrouillé en hors-gel</span>
          {role === "admin" && onToggleLock && (
            <button
              onClick={() => onToggleLock(device.did, false)}
              disabled={loading}
              className="text-xs text-purple-600 underline hover:text-purple-800 disabled:opacity-40"
            >
              Déverrouiller
            </button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 text-sm">{device.name}</h4>
        <div className="flex items-center gap-2">
          {device.isHeating && (
            <span
              className="text-xs text-orange-500"
              title="En cours de chauffage"
            >
              ~
            </span>
          )}
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${
              device.isOnline ? "bg-green-400" : "bg-red-400"
            }`}
            title={device.isOnline ? "En ligne" : "Hors ligne"}
          />
        </div>
      </div>

      {/* Status row: mode + temperature → target + heating badge */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${modeColor}`}>
          {modeLabel}
        </span>
        {device.temperature !== undefined && (
          <span className="text-sm font-medium text-gray-700">
            {device.temperature}°C
            {trend === "up" && <span className="text-red-500 ml-0.5">↑</span>}
            {trend === "down" && <span className="text-blue-500 ml-0.5">↓</span>}
            {device.targetTemp !== undefined && (
              <span className="text-gray-400 font-normal"> → {device.targetTemp}°C</span>
            )}
          </span>
        )}
        {device.isHeating && (
          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600">
            Chauffe
          </span>
        )}
      </div>

      {/* Presence indicator */}
      {device.mode === "presence" && (
        <div className="flex items-center gap-2 mb-3">
          {device.presenceDetected ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-700">
              <span className="inline-flex h-2 w-2 rounded-full bg-green-400" />
              Présence {presenceSince && formatDuration(presenceSince)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <span className="inline-flex h-2 w-2 rounded-full bg-gray-300" />
              Aucune présence {presenceSince && formatDuration(presenceSince)}
              {device.cftTemp && device.ecoTemp && (
                <span className="text-blue-500 ml-1">
                  (-{Math.round(device.cftTemp - device.ecoTemp)}°C)
                </span>
              )}
            </span>
          )}
        </div>
      )}
      {device.mode !== "presence" && device.isOnline && (
        <div className="flex items-center gap-1 mb-3 text-xs text-gray-400">
          <span className="inline-flex h-2 w-2 rounded-full bg-gray-200" />
          Capteur inactif
        </div>
      )}

      {/* Mode buttons (admin only, not if locked) */}
      {role === "admin" && !device.isLocked && (
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-5">
          {MODE_BUTTONS.map((btn) => (
            <button
              key={btn.mode}
              onClick={() => onSetMode(device.did, btn.mode)}
              disabled={loading || device.mode === btn.mode}
              className={`rounded-lg px-1 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40 ${btn.color}`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* Lock button (admin only, not already locked) */}
      {role === "admin" && !device.isLocked && onToggleLock && (
        <button
          onClick={() => onToggleLock(device.did, true)}
          disabled={loading}
          className="mt-2 w-full rounded-lg border border-purple-300 px-2 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-50 transition-colors disabled:opacity-40"
        >
          Verrouiller en hors-gel
        </button>
      )}
    </div>
  );
}
