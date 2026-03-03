"use client";

const PERIODS = [
  { value: "30d", label: "30 jours" },
  { value: "3m", label: "3 mois" },
  { value: "6m", label: "6 mois" },
  { value: "1y", label: "1 an" },
  { value: "fiscal", label: "Année fiscale" },
];

interface PeriodSelectorProps {
  value: string;
  onChange: (period: string) => void;
}

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            value === p.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
