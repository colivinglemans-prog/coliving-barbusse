"use client";

import type { HeatzyDevice } from "@/lib/types";

const MODE_LABELS: Record<string, string> = {
  cft: "Confort",
  eco: "Éco",
  fro: "Hors-gel",
  presence: "Présence",
  stop: "Stop",
};

const MODE_COLORS: Record<string, string> = {
  cft: "bg-orange-100 text-orange-700",
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

interface HeatingDeviceCardProps {
  device: HeatzyDevice;
  onSetMode: (did: string, mode: string) => void;
  loading?: boolean;
}

export default function HeatingDeviceCard({
  device,
  onSetMode,
  loading,
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

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 text-sm">{device.name}</h4>
        <span
          className={`inline-flex h-2.5 w-2.5 rounded-full ${
            device.isOnline ? "bg-green-400" : "bg-red-400"
          }`}
          title={device.isOnline ? "En ligne" : "Hors ligne"}
        />
      </div>

      {/* Status row */}
      <div className="flex items-center gap-3 mb-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${modeColor}`}>
          {modeLabel}
        </span>
        {device.temperature !== undefined && (
          <span className="text-sm text-gray-500">
            {device.temperature}°C
          </span>
        )}
        {device.humidity !== undefined && (
          <span className="text-sm text-gray-400">
            {device.humidity}%
          </span>
        )}
      </div>

      {/* Temperatures if available */}
      {(device.cftTemp || device.ecoTemp) && (
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-400">
          {device.cftTemp && <span>Confort: {device.cftTemp}°C</span>}
          {device.ecoTemp && <span>Éco: {device.ecoTemp}°C</span>}
        </div>
      )}

      {/* Mode buttons */}
      <div className="flex gap-1.5">
        {MODE_BUTTONS.map((btn) => (
          <button
            key={btn.mode}
            onClick={() => onSetMode(device.did, btn.mode)}
            disabled={loading || device.mode === btn.mode}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40 ${btn.color}`}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
