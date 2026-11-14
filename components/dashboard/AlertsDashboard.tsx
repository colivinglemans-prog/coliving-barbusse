"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/**
 * Page « Alertes » (admin) : les notifications ntfy envoyées par le site sur 30 jours (journal
 * `lib/notify-log.ts`, titre et priorité seulement). Sert à voir le volume réel et ce qui revient
 * — ntfy.sh lui-même n'en garde qu'une douzaine d'heures.
 */

interface NotificationRecord {
  at: string;
  title: string;
  priority: number;
  tags?: string[];
}
interface Payload {
  days: number;
  /** Plafond du journal atteint : la période affichée est incomplète. */
  capped: boolean;
  summary: {
    total: number;
    byPriority: Record<string, number>;
    byTitle: Array<{ title: string; count: number; maxPriority: number; last: string }>;
    byDay: Record<string, number>;
  };
  recent: NotificationRecord[];
  /** Instant de chargement (ms), fixé hors du rendu. */
  loadedAt: number;
}

const PRIORITY: Record<number, { label: string; className: string }> = {
  5: { label: "Urgente", className: "bg-red-600 text-white" },
  4: { label: "Haute", className: "bg-orange-500 text-white" },
  3: { label: "Normale", className: "bg-slate-500 text-white" },
  2: { label: "Basse", className: "bg-slate-300 text-slate-800" },
  1: { label: "Silencieuse", className: "bg-slate-100 text-slate-600" },
};

function Badge({ priority }: { priority: number }) {
  const p = PRIORITY[priority] ?? PRIORITY[3];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.className}`}>{p.label}</span>;
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AlertsDashboard() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/alertes", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(r.status === 403 ? "Accès réservé à l'administrateur" : "Journal indisponible");
        setData({ ...((await r.json()) as Omit<Payload, "loadedAt">), loadedAt: Date.now() });
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const daily = useMemo(() => {
    if (!data) return [];
    const out: Array<{ day: string; label: string; count: number }> = [];
    const fmt = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" });
    for (let i = data.days - 1; i >= 0; i--) {
      const d = new Date(data.loadedAt - i * 24 * 3600 * 1000);
      const day = fmt.format(d);
      out.push({ day, label: `${day.slice(8, 10)}/${day.slice(5, 7)}`, count: data.summary.byDay[day] ?? 0 });
    }
    return out;
  }, [data]);

  if (error) return <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-red-600">{error}</p>;
  if (!data) return <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate-500">Chargement…</p>;

  const { summary } = data;
  const sonores = (summary.byPriority["4"] ?? 0) + (summary.byPriority["5"] ?? 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Alertes</h1>
        <p className="text-sm text-slate-500">
          Notifications ntfy envoyées par le site sur {data.days} jours (titre et priorité seulement). Les
          alertes de la surveillance GitHub n&apos;y figurent pas.
        </p>
      </header>

      {data.capped && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Le journal a atteint son plafond : les notifications les plus anciennes de la période ne sont plus
          comptées.
        </div>
      )}

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Total</div>
          <div className="text-2xl font-semibold text-slate-800">{summary.total}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Par jour (moyenne)</div>
          <div className="text-2xl font-semibold text-slate-800">
            {(summary.total / data.days).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Sonores (haute, urgente)</div>
          <div className="text-2xl font-semibold text-slate-800">{sonores}</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Silencieuses et basses</div>
          <div className="text-2xl font-semibold text-slate-800">
            {(summary.byPriority["1"] ?? 0) + (summary.byPriority["2"] ?? 0)}
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-medium text-slate-700">Par jour</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} width={28} />
              <Tooltip formatter={(v) => [v, "notifications"]} labelFormatter={(l) => `Le ${l}`} />
              <Bar dataKey="count" fill="#334155" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
          Ce qui revient le plus
        </h2>
        {summary.byTitle.length === 0 ? (
          <p className="px-4 py-3 text-sm text-slate-500">Aucune notification sur la période.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2 font-medium">Notification</th>
                  <th className="px-4 py-2 font-medium">Nombre</th>
                  <th className="px-4 py-2 font-medium">Priorité max.</th>
                  <th className="px-4 py-2 font-medium">Dernière</th>
                </tr>
              </thead>
              <tbody>
                {summary.byTitle.map((t) => (
                  <tr key={t.title} className="border-t border-slate-100">
                    <td className="px-4 py-2 text-slate-800">{t.title}</td>
                    <td className="px-4 py-2 font-semibold text-slate-800">{t.count}</td>
                    <td className="px-4 py-2">
                      <Badge priority={t.maxPriority} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-slate-500">{when(t.last)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
          Dernières notifications
        </h2>
        <ul className="divide-y divide-slate-100 text-sm">
          {data.recent.map((r, i) => (
            <li key={`${r.at}-${i}`} className="flex items-center gap-3 px-4 py-2">
              <span className="w-24 shrink-0 whitespace-nowrap text-slate-500">{when(r.at)}</span>
              <Badge priority={r.priority} />
              <span className="text-slate-800">{r.title}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
