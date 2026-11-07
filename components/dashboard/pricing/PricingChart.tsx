"use client";

import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS, CHART_GRID, chartEuro } from "@sejour/socle/lib/chart-theme";
import { PERIOD_PALETTE } from "@sejour/socle/lib/calendar-lanes";
import type { NightRow } from "@/lib/pricing/dashboard-payload";
import { BEYOND_COLOUR, ENGINE_COLOUR, EVENT_FILL, LAST_YEAR_COLOUR, dayMonth } from "./format";

/**
 * Les nuits à venir : Beyond en trait plein, moteur en tirets, bande ±10 % autour de Beyond.
 * Une nuit vendue porte un point plein, une nuit bloquée un point creux — la lecture tient en
 * niveaux de gris. Les grands événements et les fêtes sont en bandeau.
 *
 * Pas d'infobulle au survol (le dashboard s'utilise au doigt) : un tap choisit la nuit, et son
 * détail s'imprime sous le graphe.
 */
export default function PricingChart({
  nights,
  selected,
  onSelect,
  uplift,
}: {
  nights: NightRow[];
  selected: string | null;
  onSelect: (date: string) => void;
  /** Majoration du réalisé de l'an dernier (0,1 = +10 %), `null` pour masquer la série. */
  uplift: number | null;
}) {
  const data = useMemo(
    () =>
      nights.map(([date, beyond, engine, , , state, , lastYear]) => ({
        date,
        beyond,
        engine,
        band: [Math.round(beyond * 0.9), Math.round(beyond * 1.1)],
        sold: state === 1 ? beyond : null,
        blocked: state === 2 ? beyond : null,
        lastYear: uplift == null || lastYear == null ? null : Math.round(lastYear * (1 + uplift)),
      })),
    [nights, uplift],
  );

  const bands = useMemo(() => {
    const out: { from: string; to: string; name: string; fete: boolean }[] = [];
    for (const [date, , , , , , category] of nights) {
      if (!category) continue;
      const last = out.at(-1);
      if (last && last.name === category) last.to = date;
      else out.push({ from: date, to: date, name: category, fete: /^(Noël|Nouvel An)/.test(category) });
    }
    return out;
  }, [nights]);

  return (
    <div className="h-[260px] w-full sm:h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          onClick={(state) => {
            const label = (state as { activeLabel?: string | number } | null)?.activeLabel;
            if (typeof label === "string") onSelect(label);
          }}
        >
          <CartesianGrid {...CHART_GRID} />
          {bands.map((b) => (
            <ReferenceArea
              key={`${b.name}-${b.from}`}
              x1={b.from}
              x2={b.to}
              fill={b.fete ? PERIOD_PALETTE.fete.line : EVENT_FILL}
              fillOpacity={b.fete ? 0.15 : 0.45}
              ifOverflow="hidden"
              label={{
                value: b.name.replace(/ 20\d\d$/, "").slice(0, 16),
                position: "insideTop",
                fontSize: 10,
                fill: b.fete ? PERIOD_PALETTE.fete.text : "#92400e",
              }}
            />
          ))}
          {selected && <ReferenceArea x1={selected} x2={selected} fill="#0f172a" fillOpacity={0.12} />}
          <XAxis dataKey="date" {...CHART_AXIS} tickFormatter={dayMonth} minTickGap={28} />
          <YAxis {...CHART_AXIS} tickFormatter={chartEuro} width={64} />
          <Area dataKey="band" stroke="none" fill={BEYOND_COLOUR} fillOpacity={0.08} isAnimationActive={false} />
          <Line
            dataKey="beyond"
            stroke={BEYOND_COLOUR}
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="engine"
            stroke={ENGINE_COLOUR}
            strokeWidth={1.75}
            strokeDasharray="5 4"
            dot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="sold"
            stroke="transparent"
            dot={{ r: 2.5, fill: "#0f172a", stroke: "#0f172a" }}
            isAnimationActive={false}
          />
          <Line
            dataKey="lastYear"
            stroke="transparent"
            dot={Diamond}
            isAnimationActive={false}
          />
          <Line
            dataKey="blocked"
            stroke="transparent"
            dot={{ r: 2.5, fill: "#ffffff", stroke: "#0f172a" }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Losange du réalisé de l'an dernier : la forme suffit à le distinguer en niveaux de gris. */
function Diamond(props: { cx?: number; cy?: number; value?: number | null; index?: number }) {
  const { cx, cy, value, index } = props;
  if (cx == null || cy == null || value == null) return <g key={`d-${index}`} />;
  return (
    <path
      key={`d-${index}`}
      d={`M ${cx} ${cy - 4} L ${cx + 4} ${cy} L ${cx} ${cy + 4} L ${cx - 4} ${cy} Z`}
      fill={LAST_YEAR_COLOUR}
    />
  );
}
