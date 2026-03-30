"use client";

import type { HeatzyDevice } from "@/lib/types";
import HeatingDeviceCard from "./HeatingDeviceCard";
import type { TempTrend } from "./HeatingDeviceCard";

const ZONE_MODE_BUTTONS: { mode: string; label: string; color: string }[] = [
  { mode: "cft", label: "Confort", color: "bg-orange-500 hover:bg-orange-600" },
  { mode: "eco", label: "Éco", color: "bg-blue-500 hover:bg-blue-600" },
  { mode: "fro", label: "Hors-gel", color: "bg-gray-500 hover:bg-gray-600" },
  { mode: "presence", label: "Présence", color: "bg-green-500 hover:bg-green-600" },
  { mode: "stop", label: "Stop", color: "bg-red-500 hover:bg-red-600" },
];

interface HeatingZoneCardProps {
  zoneId: string;
  label: string;
  cftTemp?: number;
  ecoTemp?: number;
  devices: HeatzyDevice[];
  onSetZoneMode: (zoneId: string, mode: string) => void;
  onSetDeviceMode: (did: string, mode: string) => void;
  onToggleLock?: (did: string, lock: boolean) => void;
  loading?: boolean;
  role?: "admin" | "viewer";
  trends?: Map<string, TempTrend>;
  presenceSince?: Map<string, Date>;
}

export default function HeatingZoneCard({
  zoneId,
  label,
  cftTemp,
  ecoTemp,
  devices,
  onSetZoneMode,
  onSetDeviceMode,
  loading,
  role = "admin",
  trends,
  presenceSince,
  onToggleLock,
}: HeatingZoneCardProps) {
  const alertCount = devices.filter((d) => d.alerts.length > 0).length;

  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      {/* Zone header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
          <span className="text-sm text-gray-500">
            {devices.length} radiateur{devices.length > 1 ? "s" : ""}
          </span>
          {cftTemp && ecoTemp && (
            <span className="text-xs text-gray-400">
              Confort {cftTemp}°C · Éco {ecoTemp}°C
            </span>
          )}
          {alertCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              {alertCount} alerte{alertCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Zone-wide mode buttons (admin only) */}
        {role === "admin" && (
          <div className="flex flex-wrap gap-1.5">
            {ZONE_MODE_BUTTONS.map((btn) => (
              <button
                key={btn.mode}
                onClick={() => onSetZoneMode(zoneId, btn.mode)}
                disabled={loading}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40 ${btn.color}`}
              >
                {btn.label}
              </button>
            ))}
            {loading && (
              <svg className="inline-block h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Device grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => (
          <HeatingDeviceCard
            key={device.did}
            device={device}
            onSetMode={onSetDeviceMode}
            onToggleLock={onToggleLock}
            loading={loading}
            role={role}
            trend={trends?.get(device.did)}
            presenceSince={presenceSince?.get(device.did)}
          />
        ))}
      </div>
    </section>
  );
}
