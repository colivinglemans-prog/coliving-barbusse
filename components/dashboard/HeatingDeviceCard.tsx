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

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Alert banner */}
      {device.hasAlert && (
        <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          <span className="mr-1">⚠</span>
          {device.alertMessage}
        </div>
      )}

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
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${modeColor}`}
        >
          {modeLabel}
        </span>
        {device.temperature !== undefined && (
          <span className="text-sm text-gray-500">
            {device.temperature}°C
          </span>
        )}
      </div>

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
