"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Line, LineChart, ReferenceLine, ResponsiveContainer, YAxis } from "recharts";
import MetricCard from "@sejour/socle/components/stats/MetricCard";
import { addDays, daysBetween } from "@sejour/socle/lib/dates";
import type { PricingPayload, NightRow } from "@/lib/pricing/dashboard-payload";
import {
  CHANNEL_MULTIPLIERS,
  CHANNEL_PRICES_AS_OF,
  nightPriceFor,
} from "@/lib/pricing/channel-prices";
import HistoryChart from "./HistoryChart";
import PricingChart from "./PricingChart";
import { BEYOND_COLOUR, ENGINE_COLOUR, dayMonth, euros, pct, shortDate, signedPct, weekday } from "./format";

/**
 * Page d'évaluation de Beyond contre le moteur maison, jusqu'à la décision du 15/01/2027.
 *
 * **Page interne** : les prix du moteur sont une simulation. Elle le dit en tête, et rien
 * d'ici n'entre dans `/dashboard/stats`, qui se montre à un banquier.
 *
 * Ordre des sections = ordre d'importance pour décider : le verdict, la courbe des nuits, les
 * cartes, les événements, l'évolution d'un prix, les réservations de la semaine, et l'activité
 * de Beyond repliée.
 */
const HORIZONS = [90, 180, 365] as const;
const STATE_LABEL = ["vendable", "vendue", "bloquée"] as const;

export default function PricingDashboard() {
  const [data, setData] = useState<PricingPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>(90);
  const [selected, setSelected] = useState<string | null>(null);
  const [history, setHistory] = useState<{ from: string; to: string; label: string } | null>(null);
  const historyRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetch("/api/dashboard/pricing")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "Données indisponibles");
        setData(body);
        const first = (body as PricingPayload).events[0];
        if (first) {
          setHistory({ from: first.firstNight, to: clampRange(first.firstNight, first.lastNight), label: first.name });
        }
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const visible = useMemo(() => data?.nights.slice(0, horizon) ?? [], [data, horizon]);
  const selectedRow = useMemo(
    () => (selected ? data?.nights.find((n) => n[0] === selected) ?? null : null),
    [data, selected],
  );

  if (error) {
    return <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">{error}</p>;
  }
  if (!data) return <p className="text-sm text-slate-400">Chargement…</p>;

  const c = data.comparison;
  const reached = c?.within10Pct != null && c.within10Pct >= data.threshold;
  const daysLeft = daysBetween(data.today, data.decisionDate);
  const rv = data.report.revenue;

  return (
    <div className="space-y-6">
      <p className="rounded-2xl bg-slate-100 px-4 py-3 text-xs leading-snug text-slate-600">
        <strong>Simulation</strong> : le moteur maison calcule ses prix mais n&apos;envoie rien à Beds24.
        Tous les prix sont des <strong>nuits de base pour 9 personnes au plus, avant majoration du canal et
        frais</strong> : ils se comparent entre eux, pas au chiffre d&apos;affaires.
        {data.snapshotDate !== data.today && (
          <span className="mt-1 block text-amber-700">
            La photo du jour manque : données du relevé du {shortDate(data.snapshotDate)}.
          </span>
        )}
      </p>

      {/* 1. Verdict */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Verdict au {shortDate(data.snapshotDate)}</p>
        <p className={`mt-1.5 text-lg font-semibold ${reached ? "text-emerald-700" : "text-slate-900"}`}>
          Moteur à ±10 % de Beyond sur {pct(c?.within10Pct)} des nuits ordinaires
          <span className="font-normal text-slate-500"> (seuil de bascule {pct(data.threshold)})</span>
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Écart médian {signedPct(c?.medianGapPct)} · moteur plus cher sur {c?.engineHigher ?? "—"} nuits, moins cher
          sur {c?.engineLower ?? "—"} · {daysLeft > 0 ? `J-${daysLeft} avant la décision du ${shortDate(data.decisionDate)}` : "date de décision passée"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Second critère, à suivre de ton côté : au moins 3 corrections manuelles par mois dans Beyond.
        </p>
        {data.trend.filter((t) => t.within10Pct != null).length >= 2 && (
          <div className="mt-3 h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend.map((t) => ({ ...t, v: t.within10Pct == null ? null : t.within10Pct * 100 }))}>
                <YAxis domain={[0, 100]} hide />
                <ReferenceLine y={data.threshold * 100} stroke="#94a3b8" strokeDasharray="3 3" />
                <Line dataKey="v" stroke={ENGINE_COLOUR} strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* 2. Courbe des nuits */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">Les nuits à venir</h2>
          <div className="flex gap-1">
            {HORIZONS.map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  horizon === h ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {h} j
              </button>
            ))}
          </div>
        </div>
        <PricingChart nights={visible} selected={selected} onSelect={setSelected} />
        <Legend />
        <label className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          Nuit :
          <input
            type="date"
            min={data.nights[0]?.[0]}
            max={data.nights.at(-1)?.[0]}
            value={selected ?? ""}
            onChange={(e) => setSelected(e.target.value || null)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700"
          />
          <span>(ou touche la courbe)</span>
        </label>
        {selectedRow && <NightDetail row={selectedRow} reasons={data.reasons[selectedRow[0]] ?? []} />}
      </section>

      {/* 3. Cartes */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricCard
          label={`CA ${data.today.slice(0, 4)}`}
          value={euros(rv.yearOnBooks)}
          sub={`${euros(rv.ytd)} séjourné · ${Math.round((rv.yearOnBooks / rv.goal) * 100)} % de l'objectif ${euros(rv.goal)}`}
          definition="Brut hors taxe de séjour des séjours de l'année, commencés ou à venir — mesuré comme Beyond, au jour d'arrivée."
        />
        <MetricCard
          label="RevPAN 90 jours"
          value={euros(rv.revpan90)}
          definition="CA déjà réservé sur les 90 prochaines nuits, divisé par 90."
        />
        <MetricCard
          label="Coût Beyond estimé"
          value={euros(rv.beyondCostYear)}
          definition="1 % du CA réservé de l'année, y compris les contrats négociés à la main où son prix n'a joué aucun rôle."
        />
        <MetricCard
          label="Nuits vendues cette semaine"
          value={String(c?.sold.nights ?? data.report.sold.nights)}
          sub={c?.sold.nights ? `Beyond ${euros(c.sold.beyondAvg)} · moteur ${euros(c.sold.engineAvg)}` : undefined}
          definition="Prix de base affiché la veille de la vente, Beyond contre moteur : le signal le plus parlant."
        />
      </section>

      {/* 4. Événements */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-base font-semibold text-slate-900">Grands événements</h2>
        <p className="mt-1 text-xs text-slate-400">
          À 60 jours de l&apos;événement, s&apos;il n&apos;est pas vendu et que le prix dépasse 1,5 fois le réalisé 2026, on baisse.
          Touche un événement pour voir l&apos;évolution de son prix.
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {data.events.map((e) => (
            <button
              key={e.key}
              onClick={() => {
                setHistory({ from: e.firstNight, to: clampRange(e.firstNight, e.lastNight), label: e.name });
                historyRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-xl p-4 text-left ring-1 ring-slate-200 hover:bg-slate-50"
            >
              <p className="font-medium text-slate-900">
                {e.name}
                {!e.confirmed && <span className="ml-1 text-xs text-slate-400">(dates non confirmées)</span>}
              </p>
              <p className="text-xs text-slate-500">
                Nuits du {dayMonth(e.firstNight)} au {dayMonth(e.lastNight)} · {e.soldNights}/{e.totalNights} vendues
              </p>
              <p className="mt-2 text-sm">
                <span style={{ color: BEYOND_COLOUR }}>Beyond {euros(e.beyondAvg)}</span>
                {" · "}
                <span style={{ color: ENGINE_COLOUR }}>moteur {euros(e.engineAvg)}</span>
                <span className="text-slate-400"> · plancher {euros(e.floor)}</span>
                {e.monthRatio != null && <span className="text-slate-400"> · ×{e.monthRatio} la médiane du mois</span>}
              </p>
              <p className={`mt-1 text-xs ${e.overdue ? "font-semibold text-amber-700" : "text-slate-500"}`}>
                {e.status === "vendu"
                  ? "Vendu"
                  : e.overdue
                    ? `${e.status === "partiel" ? "Partiellement vendu" : "Invendu"} — J-60 dépassé (${shortDate(e.decideBy)}) : à trancher`
                    : `${e.status === "partiel" ? "Partiellement vendu" : "Invendu"} · à trancher le ${shortDate(e.decideBy)} si toujours invendu`}
              </p>
            </button>
          ))}
          {data.events.length === 0 && <p className="text-sm text-slate-500">Aucun grand événement dans l&apos;horizon.</p>}
        </div>
      </section>

      {/* 5. Évolution d'un prix */}
      <section ref={historyRef} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-2 text-base font-semibold text-slate-900">Évolution du prix affiché</h2>
        {history ? (
          <HistoryChart from={history.from} to={history.to} label={history.label} />
        ) : (
          <p className="text-sm text-slate-500">Touche un événement ou choisis une nuit.</p>
        )}
        {selected && (
          <button
            onClick={() => setHistory({ from: selected, to: selected, label: `Nuit du ${shortDate(selected)}` })}
            className="mt-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
          >
            Voir l&apos;évolution de la nuit du {dayMonth(selected)}
          </button>
        )}
      </section>

      {/* 6. Réservations de la semaine */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-base font-semibold text-slate-900">Réservations reçues cette semaine</h2>
        {data.bookings.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Aucune.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {data.bookings.map((b) => (
              <li key={b.ref} className="py-2 text-sm">
                <span className="font-medium text-slate-900">{b.channel}</span>{" "}
                <span className="text-slate-600">
                  {shortDate(b.arrival)} · {b.nights} n{b.guests ? ` · ${b.guests} pers.` : ""} · J-{b.leadDays}
                </span>
                <span className="block text-xs text-slate-500">
                  Payé {euros(b.gross)} (hors taxe de séjour)
                  {b.displayedBase != null && ` · base affichée la veille ${euros(b.displayedBase)} pour ${b.nights} n`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 7. Activité de Beyond */}
      <details className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <summary className="cursor-pointer text-base font-semibold text-slate-900">Activité de Beyond cette semaine</summary>
        <p className="mt-2 text-sm text-slate-600">
          {data.report.activity.priceChanges} prix modifiés (↑{data.report.activity.priceUps} ↓
          {data.report.activity.priceDowns}, médiane {signedPct(data.report.activity.medianChangePct)}) ·{" "}
          {data.report.activity.minStayChanges} séjours minimum modifiés · {data.report.snapshotsAvailable}/
          {data.report.snapshotsExpected} relevés disponibles.
        </p>
        <ul className="mt-2 text-xs text-slate-500">
          {data.report.activity.byLead.map((b) => (
            <li key={b.label}>
              {b.label} : {b.changes} modification(s){b.changes ? `, médiane ${signedPct(b.medianPct)}` : ""}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/** Une plage d'historique tient en 14 nuits au plus (limite de la route). */
function clampRange(from: string, to: string): string {
  return daysBetween(from, to) > 13 ? addDays(from, 13) : to;
}

function Legend() {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-0.5 w-5" style={{ background: BEYOND_COLOUR }} /> Beyond
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: ENGINE_COLOUR }} /> Moteur
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-5 bg-slate-200" /> Beyond ±10 %
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full bg-slate-900" /> vendue
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2 w-2 rounded-full border border-slate-900 bg-white" /> bloquée
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-5 bg-indigo-100" /> événement
      </span>
    </div>
  );
}

function NightDetail({ row, reasons }: { row: NightRow; reasons: string[] }) {
  const [date, beyond, engine, minB, minE, state, category] = row;
  const guests = [9, 16, 20];
  return (
    <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm">
      <p className="font-semibold text-slate-900">
        Nuit du {weekday(date)} {shortDate(date)} · {STATE_LABEL[state]}
        {category && <span className="font-normal text-slate-500"> · {category}</span>}
      </p>
      <p className="mt-1">
        <span style={{ color: BEYOND_COLOUR }}>Beyond {euros(beyond)} (min. {minB} n)</span>
        {" · "}
        <span style={{ color: ENGINE_COLOUR }}>
          moteur {euros(engine)}
          {minE != null && ` (min. ${minE} n)`}
        </span>
      </p>
      {reasons.length > 0 && (
        <p className="mt-1 text-xs text-slate-500">Moteur : {reasons.join(" · ")}</p>
      )}
      <table className="mt-3 w-full text-xs">
        <thead>
          <tr className="text-left text-slate-400">
            <th className="py-1 font-medium">Prix Beyond vu par le voyageur</th>
            {guests.map((g) => (
              <th key={g} className="py-1 text-right font-medium">{g} pers.</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CHANNEL_MULTIPLIERS.map((ch) => (
            <tr key={ch.channel} className="border-t border-slate-200">
              <td className="py-1 text-slate-600">
                {ch.channel}
                {ch.note && <span className="text-slate-400"> · {ch.note}</span>}
              </td>
              {guests.map((g) => (
                <td key={g} className="py-1 text-right text-slate-700">{euros(nightPriceFor(beyond, ch.factor, g))}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-400">
        Par nuit, avant ménage (280 €) et linge (15 €/pers.). Majorations relevées le {shortDate(CHANNEL_PRICES_AS_OF)} dans
        Beds24 : si elles y changent, cette table ne le sait pas.
      </p>
    </div>
  );
}
