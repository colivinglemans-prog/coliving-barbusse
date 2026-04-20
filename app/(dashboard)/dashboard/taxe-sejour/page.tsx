"use client";

import { useCallback, useEffect, useState } from "react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import type {
  ChannelTotals,
  QuarterTotals,
  TaxeSejourLine,
} from "@/lib/taxe-sejour";
import type { TaxeSejourResponse } from "@/app/api/dashboard/taxe-sejour/route";

function formatEur(n: number): string {
  const [intPart, decPart] = Math.abs(n).toFixed(2).split(".");
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = n < 0 ? "-" : "";
  return `${sign}${withSep},${decPart} €`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatProvenance(line: TaxeSejourLine): string {
  if (line.provenanceDetail) return `${line.provenance} (${line.provenanceDetail})`;
  return line.provenance;
}

function buildCopyPayload(line: TaxeSejourLine): string {
  return [
    line.arrival,
    line.departure,
    line.priceHT.toFixed(2).replace(".", ","),
    line.adults,
    line.children,
    formatProvenance(line),
  ].join("\t");
}

function diffIndicator(expected: number, collected: number | null): {
  label: string;
  className: string;
  title: string;
} {
  if (collected === null) {
    return {
      label: "—",
      className: "text-gray-400",
      title: "Aucune ligne de taxe détectée dans les invoice items Beds24",
    };
  }
  const diff = collected - expected;
  const absDiff = Math.abs(diff);
  if (absDiff < 0.02) {
    return {
      label: "✓",
      className: "text-emerald-600",
      title: "Montant cohérent avec le calcul",
    };
  }
  const sign = diff > 0 ? "+" : "−";
  const label = `${sign}${absDiff.toFixed(2).replace(".", ",")} €`;
  const className = absDiff > 0.5 ? "text-rose-500 font-semibold" : "text-amber-600";
  return {
    label,
    className,
    title: `Écart de ${label} entre le perçu Beds24 et le calcul`,
  };
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

type Tab = "direct" | "collectees";

export default function TaxeSejourPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [tab, setTab] = useState<Tab>("direct");
  const [data, setData] = useState<TaxeSejourResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/taxe-sejour?year=${year}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      setData(await res.json());
    } catch {
      setError("Impossible de charger les données. Vérifiez votre token Beds24.");
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <DashboardNav />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Taxe de séjour</h1>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-500">Année</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 focus:border-rose-400 focus:outline-none"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <InfoBanner />

        <div className="mt-6 flex gap-2 border-b border-gray-200">
          <TabButton active={tab === "direct"} onClick={() => setTab("direct")}>
            Saisie manuelle (Direct)
          </TabButton>
          <TabButton active={tab === "collectees"} onClick={() => setTab("collectees")}>
            Tiers collecteur (Airbnb / Booking)
          </TabButton>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
          </div>
        )}

        {error && !loading && (
          <div className="mt-6 rounded-2xl bg-rose-50 p-6 text-rose-600">{error}</div>
        )}

        {data && !loading && (
          <div className="mt-6">
            {tab === "direct" ? (
              <DirectTab data={data} />
            ) : (
              <CollecteesTab data={data} />
            )}
          </div>
        )}
      </div>
    </>
  );
}

function InfoBanner() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <p className="font-semibold">Le Mans Métropole — Meublé de tourisme non classé</p>
      <p className="mt-1">
        Taxe = min(2,5 % × prix HT / nuit / personnes accueillies ; 4,00 €) × 1,10 × adultes assujettis × nuits.
        Mineurs (&lt; 18 ans) exonérés. La déclaration s&apos;effectue sur{" "}
        <a
          href="https://taxedesejour.lemansmetropole.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-amber-900"
        >
          taxedesejour.lemansmetropole.fr
        </a>.
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-rose-500 text-rose-500"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function KpiCard({
  label,
  value,
  sub,
  color = "rose",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: "rose" | "teal" | "indigo" | "amber" | "sky";
}) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    rose: { bg: "bg-rose-50", text: "text-rose-500" },
    teal: { bg: "bg-teal-50", text: "text-teal-600" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    sky: { bg: "bg-sky-50", text: "text-sky-600" },
  };
  const c = colorMap[color];
  return (
    <div className={`rounded-2xl ${c.bg} p-5`}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${c.text}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function DirectTab({ data }: { data: TaxeSejourResponse }) {
  const { direct, year } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <KpiCard
          label={`Total ${year}`}
          value={formatEur(direct.totalTax)}
          sub={`${direct.bookingsCount} séjour${direct.bookingsCount > 1 ? "s" : ""} · ${direct.nightsCount} nuit${direct.nightsCount > 1 ? "s" : ""}`}
          color="rose"
        />
        {direct.quarters.map((q, i) => (
          <KpiCard
            key={q.key}
            label={q.label}
            value={formatEur(q.taxTotal)}
            sub={`${q.bookingsCount} séjour${q.bookingsCount > 1 ? "s" : ""}`}
            color={(["teal", "indigo", "amber", "sky"] as const)[i]}
          />
        ))}
      </div>

      {direct.quarters.map((q) => (
        <QuarterBlock key={q.key} quarter={q} />
      ))}

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-semibold text-gray-700">Rappel pour la saisie extranet</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Provenance : déduite du pays Beds24 (France si FR, Étranger sinon, Inconnue si vide). À vérifier au cas par cas.</li>
          <li>Exonérations autres que &laquo; moins de 18 ans &raquo; (travailleurs saisonniers, hébergement urgence, loyer &lt; 5 €/j) : 0 par défaut.</li>
          <li>Unité d&apos;accueil louée : 1 par défaut (logement entier).</li>
        </ul>
      </div>
    </div>
  );
}

function QuarterBlock({ quarter }: { quarter: QuarterTotals }) {
  const [open, setOpen] = useState(quarter.bookingsCount > 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-4">
          <span className="text-base font-semibold text-gray-900">{quarter.label}</span>
          <span className="text-sm text-gray-500">
            {quarter.bookingsCount} séjour{quarter.bookingsCount > 1 ? "s" : ""} · {quarter.nightsCount} nuit{quarter.nightsCount > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-rose-500">{formatEur(quarter.taxTotal)}</span>
          <span className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}>›</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {quarter.bookingsCount === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-gray-400">
              Aucune réservation directe ce trimestre.
            </div>
          ) : (
            quarter.months.map((month) => {
              const monthLines = quarter.lines.filter((l) => l.month === month.key);
              return <MonthBlock key={month.key} month={month} lines={monthLines} />;
            })
          )}
        </div>
      )}
    </div>
  );
}

function MonthBlock({ month, lines }: { month: { key: string; label: string; bookingsCount: number; nightsCount: number; taxTotal: number }; lines: TaxeSejourLine[] }) {
  const [open, setOpen] = useState(lines.length > 0);
  const empty = lines.length === 0;

  return (
    <div className="border-t border-gray-100 first:border-t-0">
      <button
        onClick={() => !empty && setOpen(!open)}
        className={`flex w-full items-center justify-between bg-gray-50 px-5 py-3 text-left ${empty ? "cursor-default" : "hover:bg-gray-100"}`}
        disabled={empty}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-gray-700">{month.label}</span>
          <span className="text-xs text-gray-500">
            {empty
              ? "aucun séjour"
              : `${month.bookingsCount} séjour${month.bookingsCount > 1 ? "s" : ""} · ${month.nightsCount} nuit${month.nightsCount > 1 ? "s" : ""}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold ${empty ? "text-gray-400" : "text-gray-800"}`}>
            {formatEur(month.taxTotal)}
          </span>
          {!empty && (
            <span className={`text-xs text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}>›</span>
          )}
        </div>
      </button>

      {open && !empty && <TaxLineTable lines={lines} showCopy showCollected />}
    </div>
  );
}

function TaxLineTable({
  lines,
  showCopy,
  showCollected,
}: {
  lines: TaxeSejourLine[];
  showCopy?: boolean;
  showCollected?: boolean;
}) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function handleCopy(line: TaxeSejourLine) {
    try {
      await navigator.clipboard.writeText(buildCopyPayload(line));
      setCopiedId(line.bookingId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Silently ignore copy failures
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">Du</th>
            <th className="px-4 py-3 text-left">Au</th>
            <th className="px-4 py-3 text-left">Invité</th>
            <th className="px-4 py-3 text-left">Provenance</th>
            <th className="px-4 py-3 text-right">Nuits</th>
            <th className="px-4 py-3 text-right">Prix/nuit HT</th>
            <th className="px-4 py-3 text-right">Prix HT</th>
            <th className="px-4 py-3 text-right">Adultes</th>
            <th className="px-4 py-3 text-right">&lt; 18</th>
            <th className="px-4 py-3 text-right">Calculé</th>
            {showCollected && <th className="px-4 py-3 text-right">Perçu</th>}
            {showCollected && <th className="px-4 py-3 text-right">Écart</th>}
            {showCopy && <th className="px-4 py-3 text-right">Copier</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lines.map((line) => {
            const diff = showCollected ? diffIndicator(line.taxTotal, line.taxCollected) : null;
            return (
              <tr key={line.bookingId} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatDate(line.arrival)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatDate(line.departure)}</td>
                <td className="px-4 py-3 text-gray-600">{line.guestName}</td>
                <td
                  className="px-4 py-3 text-gray-600"
                  title={[
                    `Pays : ${line.country || "—"}`,
                    `Code postal : ${line.postcode || "—"}`,
                    `Tél : ${line.phone || "—"}`,
                    `Adresse : ${line.address || "—"}`,
                  ].join("\n")}
                >
                  {formatProvenance(line)}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">{line.nights}</td>
                <td className="px-4 py-3 text-right text-gray-700">{formatEur(line.pricePerNightHT)}</td>
                <td className="px-4 py-3 text-right text-gray-700">{formatEur(line.priceHT)}</td>
                <td className="px-4 py-3 text-right text-gray-700">{line.adults}</td>
                <td className="px-4 py-3 text-right text-gray-500">{line.children || "—"}</td>
                <td className="px-4 py-3 text-right font-semibold text-rose-500">{formatEur(line.taxTotal)}</td>
                {showCollected && (
                  <td
                    className="px-4 py-3 text-right text-gray-700"
                    title={
                      line.taxCollectedDetail.length > 0
                        ? `Lignes Beds24 détectées :\n${line.taxCollectedDetail.join("\n")}`
                        : "Aucune ligne 'tax' trouvée dans les invoice items Beds24"
                    }
                  >
                    {line.taxCollected !== null ? formatEur(line.taxCollected) : "—"}
                  </td>
                )}
                {showCollected && diff && (
                  <td className={`px-4 py-3 text-right ${diff.className}`} title={diff.title}>
                    {diff.label}
                  </td>
                )}
                {showCopy && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleCopy(line)}
                      className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                    >
                      {copiedId === line.bookingId ? "Copié ✓" : "Copier"}
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CollecteesTab({ data }: { data: TaxeSejourResponse }) {
  const { collectees, year } = data;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
        <p className="font-semibold">Déclaration simplifiée via tiers collecteur</p>
        <p className="mt-1">
          Airbnb et Booking.com collectent et reversent la taxe directement. Dans l&apos;extranet,
          indique simplement les périodes où le logement a été proposé sur chaque plateforme
          (1<sup>er</sup> janvier → 31 décembre {year} pour ce coliving proposé à l&apos;année).
        </p>
        <p className="mt-2">
          <strong>Colonne &laquo; Calculé &raquo;</strong> : formule Le Mans appliquée sur le prix HT Beds24.{" "}
          <strong>Colonne &laquo; Perçu &raquo;</strong> : somme des lignes &laquo; tourist tax / taxe de séjour &raquo;
          trouvées dans les invoice items Beds24. L&apos;écart permet de valider que nos calculs
          correspondent à ce que la plateforme a réellement collecté.
        </p>
      </div>

      {collectees.channels.map((c) => (
        <ChannelBlock key={c.channel} channel={c} year={year} />
      ))}

      <p className="text-xs text-gray-400">Abritel n&apos;est pas pris en compte.</p>
    </div>
  );
}

function ChannelBlock({ channel, year }: { channel: ChannelTotals; year: number }) {
  const [open, setOpen] = useState(channel.bookingsCount > 0);
  const color = channel.channel === "Airbnb" ? "text-rose-500" : "text-indigo-600";
  const periodLabel = `Du 01/01/${year} au 31/12/${year}`;

  const collectedTotal = channel.lines.reduce((sum, l) => sum + (l.taxCollected ?? 0), 0);
  const linesWithCollected = channel.lines.filter((l) => l.taxCollected !== null).length;
  const hasCollectedData = linesWithCollected > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
      >
        <div className="flex flex-col">
          <span className={`text-base font-semibold ${color}`}>{channel.channel}</span>
          <span className="text-xs text-gray-500">{periodLabel}</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm text-gray-500">
            {channel.bookingsCount} séjour{channel.bookingsCount > 1 ? "s" : ""} · {channel.nightsCount} nuit{channel.nightsCount > 1 ? "s" : ""}
          </span>
          <div className="flex flex-col items-end">
            <span className="text-lg font-bold text-gray-900" title="Taxe calculée par notre formule">
              {formatEur(channel.taxTotal)} <span className="text-xs font-normal text-gray-400">calc.</span>
            </span>
            {hasCollectedData && (
              <span className="text-xs text-gray-500" title={`Somme des lignes de taxe détectées sur ${linesWithCollected}/${channel.bookingsCount} séjours`}>
                {formatEur(collectedTotal)} perçu ({linesWithCollected}/{channel.bookingsCount})
              </span>
            )}
          </div>
          <span className={`text-gray-400 transition-transform ${open ? "rotate-90" : ""}`}>›</span>
        </div>
      </button>

      {open && channel.lines.length > 0 && (
        <div className="border-t border-gray-100">
          <TaxLineTable lines={channel.lines} showCollected />
        </div>
      )}
      {open && channel.lines.length === 0 && (
        <div className="border-t border-gray-100 px-5 py-6 text-center text-sm text-gray-400">
          Aucune réservation sur ce canal cette année.
        </div>
      )}
    </div>
  );
}
