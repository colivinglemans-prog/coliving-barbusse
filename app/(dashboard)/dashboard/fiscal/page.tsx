"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import type { FiscalResponse, FiscalBienDetail } from "@/app/api/dashboard/fiscal/route";
import type { Orientation, Echeance } from "@/lib/fiscal/orientations";

function formatEur(n: number, withDecimals = false): string {
  const abs = Math.abs(n);
  const formatted = withDecimals
    ? abs.toFixed(2).replace(".", ",")
    : Math.round(abs).toString();
  const withSep = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = n < 0 ? "-" : "";
  return `${sign}${withSep} €`;
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1).replace(".", ",")} %`;
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

export default function FiscalPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState<FiscalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/fiscal?year=${year}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erreur de chargement");
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les données fiscales.");
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fiscalité LMNP / LMP</h1>
            <p className="mt-1 text-sm text-gray-500">
              Estimation IR + cotisations sociales, test de bascule LMP, orientations et échéances.
            </p>
          </div>
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

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-200 border-t-rose-500" />
          </div>
        )}

        {error && !loading && (
          <div className="mt-6 rounded-2xl bg-rose-50 p-6 text-rose-600">{error}</div>
        )}

        {data && !loading && (
          <div className="mt-6 space-y-6">
            <SummaryCards data={data} />
            <AmortissementsReportesCard data={data} />
            <StatusLMNPvsLMP data={data} />
            <OrientationsAlerts orientations={data.orientations} />
            <SimulateurWhatIf data={data} />
            <DetailParBien biens={data.biens} />
            <TimelineEcheances echeances={data.echeances} />
          </div>
        )}
      </div>
    </>
  );
}

function InfoBanner() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <p className="font-semibold">Estimation indicative — LMNP au réel simplifié</p>
      <p className="mt-1">
        Les chiffres ci-dessous sont calculés à partir du CA Beds24 projeté, des charges
        et amortissements saisis dans <code className="rounded bg-amber-100 px-1">data/fiscal/{"{"}année{"}"}.json</code>,
        et des paramètres foyer (TMI, revenu, parts) en variables d&apos;environnement.
        Aucune valeur ne remplace le travail de votre expert-comptable.
      </p>
    </div>
  );
}

type KpiColor = "rose" | "teal" | "indigo" | "amber" | "sky" | "emerald";

function KpiCard({
  label,
  value,
  sub,
  color = "rose",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: KpiColor;
}) {
  const colorMap: Record<KpiColor, { bg: string; text: string }> = {
    rose: { bg: "bg-rose-50", text: "text-rose-500" },
    teal: { bg: "bg-teal-50", text: "text-teal-600" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    sky: { bg: "bg-sky-50", text: "text-sky-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
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

function SummaryCards({ data }: { data: FiscalResponse }) {
  const { totaux, ir, cotisations, impotTotal } = data;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <KpiCard
        label="Recettes totales"
        value={formatEur(totaux.recettesMeubleTourisme)}
        sub={`${data.biens.length} bien${data.biens.length > 1 ? "s" : ""}`}
        color="sky"
      />
      <KpiCard
        label="Résultat BIC"
        value={formatEur(totaux.resultat)}
        sub={`Bénéfice avant amort. ${formatEur(totaux.beneficeAvantAmort)}`}
        color={totaux.resultat >= 0 ? "emerald" : "rose"}
      />
      <KpiCard
        label="IR supplémentaire"
        value={formatEur(ir.irSupplementaire)}
        sub={`Taux effectif ${formatPct(ir.tauxEffectif)}`}
        color="indigo"
      />
      <KpiCard
        label={cotisations.regime === "LMP" ? "Cotisations SSI" : "Prélèv. sociaux"}
        value={formatEur(cotisations.total)}
        sub={`${formatPct(cotisations.tauxApplique)} × ${formatEur(cotisations.assiette)}`}
        color={cotisations.regime === "LMP" ? "amber" : "teal"}
      />
      <KpiCard
        label="Impôt total estimé"
        value={formatEur(impotTotal)}
        sub={`${cotisations.regime}`}
        color="rose"
      />
    </div>
  );
}

function AmortissementsReportesCard({ data }: { data: FiscalResponse }) {
  const { totaux } = data;
  const { ardStockEntree, amortissement, amortissementDeduit, amortissementReporte, ardImpute, ardStockSortie } =
    {
      ardStockEntree: totaux.ardStockEntree,
      amortissement: data.biens.reduce((s, b) => s + b.bic.amortissement, 0),
      amortissementDeduit: totaux.amortissementDeduit,
      amortissementReporte: totaux.amortissementReporte,
      ardImpute: totaux.ardImpute,
      ardStockSortie: totaux.ardStockSortie,
    };

  if (ardStockEntree === 0 && amortissement === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Amortissements & ARD</h2>
        <span className="text-xs text-gray-500">art. 39 C CGI — imputables sans limite de durée</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <ARDStep
          label="Stock entrée"
          value={formatEur(ardStockEntree)}
          hint="ARD au 1er janvier, hérités des exercices antérieurs"
          color="gray"
        />
        <ARDStep
          label="Amort. année"
          value={formatEur(amortissement)}
          hint={`Déduit ${formatEur(amortissementDeduit)} · Reporté ${formatEur(amortissementReporte)}`}
          color="indigo"
        />
        <ARDStep
          label="ARD imputés"
          value={formatEur(ardImpute)}
          hint="Stock mobilisé sur le bénéfice après amort. de l'année"
          color="emerald"
        />
        <ARDStep
          label="ARD reportés sortie"
          value={formatEur(ardStockSortie)}
          hint="Stock restant à imputer sur exercices futurs"
          color="amber"
        />
        <ARDStep
          label="Résultat BIC final"
          value={formatEur(totaux.resultat)}
          hint={totaux.resultat >= 0 ? "Après amort. + ARD" : "Déficit — report 10 ans sur BIC non pro"}
          color={totaux.resultat >= 0 ? "emerald" : "rose"}
        />
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Mécanique LMNP réel (art. 39 C) : l&apos;amortissement de l&apos;année est plafonné au bénéfice avant amort.
        L&apos;excédent rejoint le stock d&apos;ARD, imputable sans limite de durée sur les bénéfices futurs de la même activité.
      </p>
    </div>
  );
}

function ARDStep({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: string;
  hint: string;
  color: "gray" | "indigo" | "emerald" | "amber" | "rose";
}) {
  const colorMap = {
    gray: "border-gray-200 bg-gray-50 text-gray-800",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  } as const;
  return (
    <div className={`rounded-xl border px-4 py-3 ${colorMap[color]}`} title={hint}>
      <p className="text-[11px] uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
      <p className="mt-1 line-clamp-2 text-[10px] opacity-70">{hint}</p>
    </div>
  );
}

function StatusLMNPvsLMP({ data }: { data: FiscalResponse }) {
  const { lmpTest, constantes, foyer } = data;
  const ratioSeuil = Math.min(1, lmpTest.recettes / constantes.seuilSSIMeubleTourisme);
  const maxAutres = Math.max(lmpTest.recettes, lmpTest.autresRevenusActivite, 1);
  const ratioAutres = lmpTest.recettes / maxAutres;
  const ratioAutresRef = lmpTest.autresRevenusActivite / maxAutres;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Statut LMNP / LMP</h2>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            lmpTest.isLMP
              ? "bg-rose-100 text-rose-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {lmpTest.isLMP ? "LMP" : "LMNP"}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <GaugeBlock
          title="Condition 1 — Seuil 23 000 €"
          legend={`Recettes ${formatEur(lmpTest.recettes)} vs seuil ${formatEur(constantes.seuilSSIMeubleTourisme)}`}
          ratio={ratioSeuil}
          passed={lmpTest.condition1_seuilDepasse}
          passedLabel="Seuil dépassé (affiliation SSI obligatoire)"
          notPassedLabel={`Encore ${formatEur(Math.max(0, -lmpTest.margeSeuil))} de marge`}
        />
        <GaugeBlock
          title="Condition 2 — Recettes > autres revenus d'activité"
          legend={`Autres revenus foyer : ${formatEur(foyer.autresRevenusActiviteFoyer)}`}
          ratio={ratioAutres}
          referenceRatio={ratioAutresRef}
          passed={lmpTest.condition2_recettesSuperieuresAutresRevenus}
          passedLabel="Recettes > autres revenus"
          notPassedLabel={`Autres revenus supérieurs de ${formatEur(Math.abs(lmpTest.margeAutresRevenus))}`}
        />
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Le régime LMP est automatique lorsque <strong>les deux conditions</strong> sont remplies (art. 155-IV CGI).
        Les autres revenus d&apos;activité du foyer sont paramétrés via <code className="rounded bg-gray-100 px-1">FISCAL_AUTRES_REVENUS_ACTIVITE_FOYER</code>.
      </p>
    </div>
  );
}

function GaugeBlock({
  title,
  legend,
  ratio,
  referenceRatio,
  passed,
  passedLabel,
  notPassedLabel,
}: {
  title: string;
  legend: string;
  ratio: number;
  referenceRatio?: number;
  passed: boolean;
  passedLabel: string;
  notPassedLabel: string;
}) {
  const barColor = passed ? "bg-rose-500" : "bg-emerald-500";
  return (
    <div>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{legend}</p>
      <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
        {referenceRatio !== undefined && (
          <div
            className="absolute top-0 h-full w-0.5 bg-gray-700"
            style={{ left: `${Math.min(100, referenceRatio * 100)}%` }}
            title="Autres revenus d'activité"
          />
        )}
      </div>
      <p className={`mt-2 text-xs font-medium ${passed ? "text-rose-600" : "text-emerald-600"}`}>
        {passed ? passedLabel : notPassedLabel}
      </p>
    </div>
  );
}

function OrientationsAlerts({ orientations }: { orientations: Orientation[] }) {
  if (orientations.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-gray-900">Orientations & actions</h2>
      {orientations.map((o) => (
        <OrientationCard key={o.id} orientation={o} />
      ))}
    </div>
  );
}

function OrientationCard({ orientation }: { orientation: Orientation }) {
  const styles = {
    critical: "border-rose-300 bg-rose-50 text-rose-900",
    warning: "border-amber-300 bg-amber-50 text-amber-900",
    info: "border-sky-200 bg-sky-50 text-sky-900",
  }[orientation.severity];
  const badge = {
    critical: "bg-rose-200 text-rose-900",
    warning: "bg-amber-200 text-amber-900",
    info: "bg-sky-200 text-sky-900",
  }[orientation.severity];
  const label = {
    critical: "Action requise",
    warning: "À surveiller",
    info: "Pour information",
  }[orientation.severity];

  return (
    <div className={`rounded-2xl border p-5 ${styles}`}>
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}>
          {label}
        </span>
        <p className="font-semibold">{orientation.title}</p>
      </div>
      <p className="mt-2 text-sm">{orientation.description}</p>
      {orientation.actions.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {orientation.actions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      )}
      {orientation.links && orientation.links.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {orientation.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-white/60 px-3 py-1 text-xs font-medium underline hover:bg-white"
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function SimulateurWhatIf({ data }: { data: FiscalResponse }) {
  const initialCA = data.totaux.recettesMeubleTourisme;
  const initialCharges = data.totaux.charges;
  const initialAmort = data.biens.reduce((s, b) => s + b.bic.amortissement, 0);

  const [caSim, setCaSim] = useState(initialCA);
  const [chargesSim, setChargesSim] = useState(initialCharges);
  const [amortSim, setAmortSim] = useState(initialAmort);

  const result = useMemo(() => {
    const ardStockEntree = data.totaux.ardStockEntree;
    const beneficeAvantAmort = caSim - chargesSim;
    const amortDeduit = beneficeAvantAmort > 0 ? Math.min(amortSim, beneficeAvantAmort) : 0;
    const soldeApresAmort = Math.max(0, beneficeAvantAmort - amortDeduit);
    const ardImpute = Math.min(ardStockEntree, soldeApresAmort);
    const bic = beneficeAvantAmort - amortDeduit - ardImpute;

    const isLMP =
      caSim > data.constantes.seuilSSIMeubleTourisme &&
      caSim > data.foyer.autresRevenusActiviteFoyer;

    const cotisations = Math.max(0, bic) * (isLMP
      ? data.constantes.tauxSSIEstime
      : data.constantes.tauxPrelevementsSociaux);

    const irRatio = data.ir.tauxEffectif > 0 ? data.ir.tauxEffectif : data.foyer.tmi;
    const irSupp = Math.max(0, bic) * irRatio;

    return {
      bic,
      ardImpute,
      isLMP,
      cotisations,
      irSupp,
      total: irSupp + cotisations,
      depasseSeuil: caSim > data.constantes.seuilSSIMeubleTourisme,
    };
  }, [caSim, chargesSim, amortSim, data]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-bold text-gray-900">Simulateur what-if</h2>
      <p className="mt-1 text-xs text-gray-500">
        Ajustez les curseurs pour projeter l&apos;impact d&apos;un scénario alternatif (CA, charges, amortissement).
      </p>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <SliderInput
          label="CA annuel"
          value={caSim}
          onChange={setCaSim}
          min={0}
          max={Math.max(60000, Math.round(initialCA * 1.5))}
          step={500}
        />
        <SliderInput
          label="Charges déductibles"
          value={chargesSim}
          onChange={setChargesSim}
          min={0}
          max={Math.max(30000, Math.round(initialCharges * 2 + 5000))}
          step={100}
        />
        <SliderInput
          label="Amortissement annuel"
          value={amortSim}
          onChange={setAmortSim}
          min={0}
          max={Math.max(20000, Math.round(initialAmort * 2 + 5000))}
          step={100}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <SimResult label="ARD imputés" value={formatEur(result.ardImpute)} />
        <SimResult label="Résultat BIC" value={formatEur(result.bic)} highlight={result.bic < 0} />
        <SimResult label="Régime" value={result.isLMP ? "LMP" : "LMNP"} />
        <SimResult label="IR additionnel" value={formatEur(result.irSupp)} />
        <SimResult label={result.isLMP ? "Cotisations SSI" : "Prélèv. sociaux"} value={formatEur(result.cotisations)} />
        <SimResult label="Impôt total" value={formatEur(result.total)} highlight />
      </div>

      {result.depasseSeuil && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          Seuil 23 000 € dépassé → affiliation URSSAF / SSI requise.
        </p>
      )}
    </div>
  );
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</label>
        <span className="text-sm font-semibold text-gray-800">{formatEur(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-rose-500"
      />
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>{formatEur(min)}</span>
        <span>{formatEur(max)}</span>
      </div>
    </div>
  );
}

function SimResult({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${highlight ? "border-rose-200 bg-rose-50" : "border-gray-200 bg-gray-50"}`}>
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-base font-bold ${highlight ? "text-rose-600" : "text-gray-800"}`}>{value}</p>
    </div>
  );
}

function DetailParBien({ biens }: { biens: FiscalBienDetail[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-lg font-bold text-gray-900">Détail par bien</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Bien</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-right">CA projeté</th>
              <th className="px-4 py-3 text-right">Réalisé</th>
              <th className="px-4 py-3 text-right">Confirmé</th>
              <th className="px-4 py-3 text-right">Charges</th>
              <th className="px-4 py-3 text-right">Amort. déduit</th>
              <th className="px-4 py-3 text-right">ARD imputés</th>
              <th className="px-4 py-3 text-right">Résultat BIC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {biens.map((b) => (
              <tr key={b.bienId} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800">{b.bienNom}</div>
                  {b.vendu && <div className="text-xs text-gray-400">Vendu</div>}
                  {b.classeMeubleTourisme && (
                    <div className="text-xs text-emerald-600">Classé tourisme</div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {b.source === "beds24" ? "Beds24" : "Manuel"}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800">
                  {formatEur(b.bic.ca)}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {formatEur(b.revenus.realized)}
                </td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {formatEur(b.revenus.confirmedUpcoming)}
                </td>
                <td
                  className="px-4 py-3 text-right text-gray-700"
                  title={[
                    `Intérêts emprunt : ${formatEur(b.charges.interetsEmprunt)}`,
                    `Taxe foncière : ${formatEur(b.charges.taxeFonciere)}`,
                    `Assurance : ${formatEur(b.charges.assurance)}`,
                    `CFE : ${formatEur(b.charges.cfe)}`,
                    `Comptable : ${formatEur(b.charges.fraisComptable)}`,
                    `Entretien : ${formatEur(b.charges.entretien)}`,
                    `Charges copro : ${formatEur(b.charges.chargesCopro)}`,
                    `Autres : ${formatEur(b.charges.autres)}`,
                  ].join("\n")}
                >
                  {formatEur(b.charges.total)}
                </td>
                <td className="px-4 py-3 text-right text-gray-700">
                  {formatEur(b.bic.amortissementDeduit)}
                  {b.bic.amortissementReporte > 0 && (
                    <div
                      className="text-[10px] text-amber-600"
                      title="Amortissement non déduit (plafonné au bénéfice avant amortissement), reporté"
                    >
                      +{formatEur(b.bic.amortissementReporte)} reporté
                    </div>
                  )}
                </td>
                <td
                  className="px-4 py-3 text-right text-gray-700"
                  title={`Stock ARD entrée : ${formatEur(b.bic.ardStockEntree)}\nStock ARD sortie : ${formatEur(b.bic.ardStockSortie)}`}
                >
                  {formatEur(b.bic.ardImpute)}
                  {b.bic.ardStockSortie > 0 && (
                    <div className="text-[10px] text-gray-500">
                      stock {formatEur(b.bic.ardStockSortie)}
                    </div>
                  )}
                </td>
                <td className={`px-4 py-3 text-right font-bold ${b.bic.resultat >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                  {formatEur(b.bic.resultat)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TimelineEcheances({ echeances }: { echeances: Echeance[] }) {
  const sorted = [...echeances].sort((a, b) => a.date.localeCompare(b.date));
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-bold text-gray-900">Échéances à venir</h2>
      <ul className="mt-4 space-y-3">
        {sorted.map((e) => {
          const isPast = e.date < today;
          return (
            <li
              key={e.id}
              className={`flex items-start gap-4 rounded-xl border px-4 py-3 ${
                isPast ? "border-gray-100 bg-gray-50 opacity-60" : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
                  {new Date(e.date + "T00:00:00").getDate()}
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{e.label}</p>
                <p className="text-xs text-gray-500">{formatDate(e.date)}</p>
                <p className="mt-1 text-sm text-gray-600">{e.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
