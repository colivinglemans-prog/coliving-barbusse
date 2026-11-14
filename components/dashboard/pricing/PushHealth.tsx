"use client";

import { useCallback, useEffect, useState } from "react";
import type { HaltState, PushRun } from "@/lib/pricing/push";

interface State {
  mode: "off" | "dry" | "live";
  halted: boolean;
  halt: HaltState | null;
  last: PushRun | null;
  /** Instant de la lecture : le rendu reste pur, l'âge se calcule par rapport à lui. */
  loadedAt: number;
}

const MODE_LABEL = {
  off: "envoi coupé (off)",
  dry: "envoi à blanc (dry)",
  live: "envoi réel (live)",
} as const;

const OUTCOME_LABEL: Record<PushRun["outcome"], string> = {
  off: "rien (mode off)",
  halted: "bloqué par le coupe-circuit",
  rejected: "rejeté par les garde-fous",
  dry: "calculé sans envoyer",
  written: "envoyé et relu",
  nothing: "rien à changer",
  mismatch: "écart à la relecture",
  locked: "un autre envoi tournait",
};

/** « il y a 3 h » depuis un horodatage ISO complet (pas une date nue). */
function since(iso: string, now: number): string {
  const min = Math.round((now - Date.parse(iso)) / 60_000);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  return h < 48 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`;
}

/**
 * Santé de l'envoi des prix, en tête de la page Pricing : mode, dernier passage, quarantaine,
 * et le **coupe-circuit** — seule écriture de la page, vers Redis uniquement.
 */
export default function PushHealth() {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/dashboard/pricing/halt")
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body.error ?? "État indisponible");
        setState({ ...body, loadedAt: Date.now() });
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  async function toggle() {
    if (!state) return;
    const halt = !state.halted;
    const question = halt
      ? "Couper l'envoi des prix ? Les prix actuels restent figés."
      : "Lever le coupe-circuit ? Le prochain envoi reprendra.";
    if (!window.confirm(question)) return;
    setBusy(true);
    try {
      const r = await fetch("/api/dashboard/pricing/halt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ halt }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? "Échec");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>;
  if (!state) return null;

  const last = state.last;
  const stale = last != null && state.loadedAt - Date.parse(last.at) > 26 * 3600_000;
  const hasDetail =
    last != null && (last.rejections.length > 0 || last.quarantined.length > 0 || last.mismatches.length > 0);

  return (
    <section
      className={`rounded-2xl px-4 py-3 text-sm ring-1 ${
        state.halted ? "bg-red-50 ring-red-200" : "bg-white ring-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">
            Envoi des prix : {MODE_LABEL[state.mode]}
            {state.halted && <span className="ml-2 text-red-700">· coupe-circuit posé</span>}
          </p>
          {state.halted && state.halt && (
            <p className="text-xs text-red-700">
              Depuis {since(state.halt.since, state.loadedAt)} — {state.halt.reason}
            </p>
          )}
          {last ? (
            <p className={`text-xs ${stale ? "font-semibold text-amber-700" : "text-slate-500"}`}>
              Dernier passage {since(last.at, state.loadedAt)} : {OUTCOME_LABEL[last.outcome]}
              {last.writes > 0 && ` · ${last.writes} date(s)`}
              {last.quarantined.length > 0 && ` · ${last.quarantined.length} en quarantaine`}
              {last.rejections.length > 0 && ` · ${last.rejections.length} rejet(s)`}
            </p>
          ) : (
            <p className="text-xs text-slate-500">Aucun passage enregistré.</p>
          )}
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          className={`rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 ${
            state.halted ? "bg-slate-700" : "bg-red-600"
          }`}
        >
          {state.halted ? "Lever le coupe-circuit" : "Couper l'envoi"}
        </button>
      </div>
      {hasDetail && last && (
        <details className="mt-2 text-xs text-slate-600">
          <summary className="cursor-pointer">Détail du dernier passage</summary>
          <ul className="mt-1 space-y-0.5">
            {last.rejections.map((r) => (
              <li key={r}>Rejet : {r}</li>
            ))}
            {last.quarantined.map((q) => (
              <li key={q.date}>
                Quarantaine : {q.date} {q.from} € → {q.to} € ({q.changePct > 0 ? "+" : ""}
                {q.changePct} %)
              </li>
            ))}
            {last.mismatches.map((m) => (
              <li key={m}>Écart : {m}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
