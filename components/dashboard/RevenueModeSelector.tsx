"use client";

import type { RevenueMode } from "@/lib/types";

const MODES: { value: RevenueMode; label: string }[] = [
  { value: "averagedPerNight", label: "Réparti par nuit" },
  { value: "byCheckIn", label: "Par check-in" },
  { value: "byCheckOut", label: "Par check-out" },
  { value: "byBookingDate", label: "Par date résa" },
];

interface RevenueModeSelectorProps {
  value: RevenueMode;
  onChange: (mode: RevenueMode) => void;
}

export default function RevenueModeSelector({ value, onChange }: RevenueModeSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as RevenueMode)}
      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
    >
      {MODES.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
