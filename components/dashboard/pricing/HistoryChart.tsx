"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS, CHART_GRID, chartEuro } from "@sejour/socle/lib/chart-theme";
import { BEYOND_COLOUR, ENGINE_COLOUR, dayMonth, euros } from "./format";

interface Point {
  photo: string;
  beyond: number;
  engine: number | null;
  available: boolean;
}

/**
 * Le prix affiché sur une plage de nuits, photo après photo : ce que Beyond a fait du prix au
 * fil des jours, à côté de ce qu'aurait affiché le moteur. La première photo où la plage n'est
 * plus vendable est marquée « vendue ».
 */
export default function HistoryChart({ from, to, label }: { from: string; to: string; label: string }) {
  const [points, setPoints] = useState<Point[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dashboard/pricing/history?from=${from}&to=${to}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Historique indisponible");
        if (!cancelled) {
          setPoints(body.points);
          setError(null);
        }
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const soldOn = points?.find((p) => !p.available)?.photo ?? null;

  return (
    <div>
      <p className="text-sm font-medium text-slate-700">
        {label} · nuits du {dayMonth(from)} au {dayMonth(to)}
      </p>
      {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
      {!points && !error && <p className="mt-2 text-sm text-slate-400">Chargement…</p>}
      {points && points.length < 2 && (
        <p className="mt-2 text-sm text-slate-500">
          Pas encore assez de photos pour une évolution : il en faut au moins deux.
          {points[0] && ` Aujourd'hui : Beyond ${euros(points[0].beyond)}, moteur ${euros(points[0].engine)}.`}
        </p>
      )}
      {points && points.length >= 2 && (
        <>
          <div className="mt-2 h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid {...CHART_GRID} />
                <XAxis dataKey="photo" {...CHART_AXIS} tickFormatter={dayMonth} minTickGap={24} />
                <YAxis {...CHART_AXIS} tickFormatter={chartEuro} width={64} />
                <Line dataKey="beyond" stroke={BEYOND_COLOUR} strokeWidth={1.75} dot={false} isAnimationActive={false} />
                <Line
                  dataKey="engine"
                  stroke={ENGINE_COLOUR}
                  strokeWidth={1.75}
                  strokeDasharray="5 4"
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {soldOn ? `Vendue (ou bloquée) au relevé du ${dayMonth(soldOn)}.` : "Toujours vendable au dernier relevé."}
          </p>
        </>
      )}
    </div>
  );
}
