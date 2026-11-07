import type { AlertState } from "@sejour/socle/lib/alert-state";
import { evaluateReadiness, type ReadinessMemory } from "@sejour/socle/lib/arrival-readiness/evaluate";
import {
  decideReadinessAlert,
  formatReadinessAlert,
  readinessScope,
  scrubCodes,
  type ReadinessAlert,
} from "@sejour/socle/lib/arrival-readiness/format";
import { passesAt } from "@sejour/socle/lib/arrival-readiness/schedule";
import type { ProbeKind, ReadinessBooking, ReadinessProbe } from "@sejour/socle/lib/arrival-readiness/types";
import { READINESS_POLICY, READINESS_SCHEDULE } from "./config";

/** Magasin JSON (Redis en production, mémoire en test). */
export interface ReadinessStore {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
}

export interface ReadinessDeps {
  now: Date;
  /** Calculer sans rien envoyer ni écrire. */
  dryRun: boolean;
  bookings: readonly ReadinessBooking[];
  probes: Partial<Record<ProbeKind, ReadinessProbe>>;
  store: ReadinessStore;
  /** Construit une clé `barbusse:readiness:…`. */
  key: (...parts: Array<string | number>) => string;
  /** Envoi ntfy. **Jamais appelé en `dryRun`.** */
  send: (alert: ReadinessAlert) => Promise<void>;
}

export interface PassReport {
  kind: string;
  label: string;
  bookingId: number | null;
  notify: boolean;
  catchUp?: boolean;
  turnover: boolean;
  /** Constats non verts : id, statut, gravité. L'action n'y est qu'en `dryRun` (elle peut porter un prénom). */
  findings: Array<{ id: string; status: string; severity: number; action?: string }>;
  checked: number;
  decision: string;
  send: boolean;
  sent: boolean;
  /** En `dryRun` seulement : la notification qui serait partie. */
  preview?: ReadinessAlert;
  error?: string;
}

export interface ReadinessReport {
  at: string;
  dryRun: boolean;
  passes: PassReport[];
  sent: number;
}

const STATE_TTL = 14 * 24 * 3600;
const MEMORY_TTL = 7 * 24 * 3600;

/**
 * Un passage du cron de préparation d'arrivée : passages dus (`passesAt`), sondes
 * (`evaluateReadiness`), anti-répétition (`decideReadinessAlert`), envoi.
 *
 * - **`dryRun`** : lit l'état et la mémoire, n'écrit **rien** (ni état, ni mémoire, ni dernier
 *   passage) et **n'appelle jamais `send`** — la vérification est faite ici, pas chez
 *   l'appelant.
 * - **Envoi raté** : l'état n'est pas enregistré, l'alerte repartira au passage suivant du
 *   même séjour.
 */
export async function runArrivalReadiness(deps: ReadinessDeps): Promise<ReadinessReport> {
  const { now, dryRun, store, key } = deps;
  const lastRunRaw = dryRun ? null : await store.get<string>(key("last-run"));
  const lastRunAt = lastRunRaw ? new Date(lastRunRaw) : null;
  const passes = passesAt(now, deps.bookings, READINESS_SCHEDULE, {
    lastRunAt: lastRunAt && !Number.isNaN(lastRunAt.getTime()) ? lastRunAt : null,
  });

  let memory = (await store.get<ReadinessMemory>(key("memory"))) ?? { misses: {} };
  const reports: PassReport[] = [];
  let sent = 0;

  for (const pass of passes) {
    const booking = pass.bookingId === null ? null : (deps.bookings.find((b) => b.bookingId === pass.bookingId) ?? null);
    const stateKey = key("state", readinessScope(pass));
    const prev = await store.get<AlertState>(stateKey);
    const evaluation = await evaluateReadiness({
      pass,
      booking,
      probes: deps.probes,
      ctx: { now, bookings: deps.bookings },
      policy: READINESS_POLICY,
      previous: memory,
    });
    memory = evaluation.memory;
    const decision = decideReadinessAlert(prev, pass, evaluation.findings, now);
    const alert = formatReadinessAlert(pass, booking, evaluation.findings);

    const report: PassReport = {
      kind: pass.kind,
      label: pass.label,
      bookingId: pass.bookingId,
      notify: pass.notify,
      ...(pass.catchUp ? { catchUp: true } : {}),
      turnover: pass.turnover,
      findings: evaluation.findings
        .filter((f) => f.status !== "ok")
        .map((f) => ({
          id: f.id,
          status: f.status,
          severity: f.severity,
          ...(dryRun ? { action: scrubCodes(f.action) } : {}),
        })),
      checked: evaluation.findings.length,
      decision: decision.transition.action,
      send: decision.send,
      sent: false,
      ...(dryRun ? { preview: alert } : {}),
    };

    if (!dryRun) {
      let persist = true;
      if (decision.send) {
        try {
          await deps.send(alert);
          report.sent = true;
          sent++;
        } catch (e) {
          persist = false;
          report.error = e instanceof Error ? e.message.slice(0, 200) : "envoi impossible";
        }
      }
      if (persist) await store.set(stateKey, decision.transition.state, STATE_TTL);
    }
    reports.push(report);
  }

  if (!dryRun) {
    await store.set(key("memory"), memory, MEMORY_TTL);
    await store.set(key("last-run"), now.toISOString(), STATE_TTL);
  }
  return { at: now.toISOString(), dryRun, passes: reports, sent };
}
