"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Page « Suivi » (admin) : les passages des intervenants (ménage Sophie, dépannage Eric…),
 * reconstitués depuis le garage (Intratone) et la porte (Nuki), fin de visite estimée par la
 * caméra. Totaux par personne (heures, coût), graphe mensuel, et journal des passages.
 *
 * Les heures servent à **recouper une facture, pas à pointer** : la sortie est estimée (dernier
 * mouvement caméra), et ne couvre que les visites récentes — d'où la mention « estimée ».
 */

interface Summary {
  who: string;
  role: string;
  count: number;
  totalMinutes: number;
  withDuration: number;
  ratePerHour: number | null;
  estimatedCost: number | null;
}
interface MonthBucket {
  month: string;
  counts: Record<string, number>;
}
interface Session {
  who: string;
  arrival: string;
  exit: string | null;
  by: "camera" | "bouton" | "inconnu";
  source: "garage" | "porte";
  minutes: number | null;
}
interface Payload {
  generatedAt: string;
  people: { name: string; role: string }[];
  summaries: Summary[];
  monthly: MonthBucket[];
  sessions: Session[];
  notes: Record<string, string>;
}

const COLORS = ["#475569", "#d97706", "#0e7490", "#7c3aed", "#be123c"];

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "2-digit",
  month: "2-digit",
  year: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
});

function hhmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

export default function SuiviDashboard() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/dashboard/suivi", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as Payload;
      })
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  const colorOf = useMemo(() => {
    const map: Record<string, string> = {};
    (data?.people ?? []).forEach((p, i) => (map[p.name] = COLORS[i % COLORS.length]));
    return map;
  }, [data]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.monthly.map((b) => ({ month: b.month, ...b.counts }));
  }, [data]);

  if (error) {
    return (
      <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-red-600">
        Impossible de charger le suivi : {error}
      </p>
    );
  }
  if (!data) {
    return <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate-500">Chargement…</p>;
  }

  const noteEntries = Object.entries(data.notes);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Suivi des accès</h1>
        <p className="text-sm text-slate-500">
          Passages des intervenants — garage (digicode) et porte (serrure). La sortie et les
          heures sont <strong>estimées</strong> (dernier mouvement caméra) : un repère pour
          recouper une facture, pas un pointage.
        </p>
      </header>

      {noteEntries.length > 0 && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Sources indisponibles : {noteEntries.map(([k, v]) => `${k} (${v})`).join(" · ")}
        </div>
      )}

      {/* Cartes par personne */}
      <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.summaries.map((s) => (
          <div key={s.who} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-800">{s.who}</span>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: colorOf[s.who] }}
              >
                {s.role}
              </span>
            </div>
            <dl className="mt-3 space-y-1 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Passages</dt>
                <dd className="font-semibold text-slate-800">{s.count}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Heures estimées</dt>
                <dd className="font-semibold text-slate-800">
                  {s.totalMinutes > 0 ? hhmm(s.totalMinutes) : "—"}
                  {s.count > s.withDuration && (
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      ({s.withDuration}/{s.count} datés)
                    </span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Coût estimé{s.ratePerHour !== null ? ` (${s.ratePerHour} €/h)` : ""}</dt>
                <dd className="font-semibold text-slate-800">
                  {s.estimatedCost !== null && s.totalMinutes > 0
                    ? `${s.estimatedCost.toFixed(2)} €`
                    : "—"}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </section>

      {/* Graphe mensuel */}
      {chartData.length > 0 && (
        <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-slate-700">Passages par mois</h2>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {data.people.map((p) => (
                  <Bar key={p.name} dataKey={p.name} fill={colorOf[p.name]} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Journal des passages */}
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
          Derniers passages
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2 font-medium">Qui</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Arrivée</th>
                <th className="px-4 py-2 font-medium">Sortie (est.)</th>
                <th className="px-4 py-2 font-medium">Durée</th>
                <th className="px-4 py-2 font-medium">Par</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.sessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                    Aucun passage enregistré pour le moment.
                  </td>
                </tr>
              )}
              {data.sessions.map((s, i) => {
                const a = new Date(s.arrival);
                const ex = s.exit ? new Date(s.exit) : null;
                return (
                  <tr key={i} className="text-slate-700">
                    <td className="px-4 py-2">
                      <span
                        className="mr-2 inline-block h-2 w-2 rounded-full align-middle"
                        style={{ backgroundColor: colorOf[s.who] ?? "#94a3b8" }}
                      />
                      {s.who}
                    </td>
                    <td className="px-4 py-2">{dateFmt.format(a)}</td>
                    <td className="px-4 py-2">
                      {timeFmt.format(a)}
                      <span className="ml-1 text-xs text-slate-400">
                        {s.source === "garage" ? "garage" : "porte"}
                      </span>
                    </td>
                    <td className="px-4 py-2">{ex ? timeFmt.format(ex) : "—"}</td>
                    <td className="px-4 py-2">{s.minutes !== null ? hhmm(s.minutes) : "—"}</td>
                    <td className="px-4 py-2 text-xs text-slate-400">
                      {s.by === "camera" ? "caméra" : s.by === "bouton" ? "bouton" : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-3 text-right text-xs text-slate-400">
        Mis à jour à {timeFmt.format(new Date(data.generatedAt))}
      </p>
    </div>
  );
}
