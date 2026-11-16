import type { CozytouchDHWMode } from "./types";

/**
 * Les commandes de l'automation du ballon, dans leur **ordre voulu** :
 * 1. boost coupé ;
 * 2. mode ;
 * 3. consigne ;
 * 4. **Absence en dernier**, qu'on la pose ou qu'on la lève (commit 8694695 : on ne sait pas si
 *    un changement de mode ou de consigne fait sortir l'ÉGÉO d'Absence, elle doit donc être la
 *    dernière commande reçue).
 *
 * Chaque commande a son propre `try` (2026-11-16) : un refus Overkiz du mode ou de la consigne
 * empêchait jusque-là de poser l'Absence, et l'appoint de 1 800 W restait actif au pic. Les échecs
 * sont collectés, jamais avalés : l'appelant les signale et ne répond plus « succès ».
 */
export type WaterHeaterCommand = "boost" | "mode" | "temperature" | "absence";

export interface WaterHeaterCommands {
  setBoostMode(on: boolean): Promise<unknown>;
  setDHWMode(mode: CozytouchDHWMode): Promise<unknown>;
  setTargetTemperature(temp: number): Promise<unknown>;
  setAbsenceMode(on: boolean): Promise<unknown>;
}

export interface CommandState {
  boostActive?: boolean | null;
  mode?: string | null;
  targetTemperature?: number | null;
  absenceActive?: boolean | null;
}

export interface CommandTarget {
  boost: boolean;
  mode: CozytouchDHWMode;
  targetTemperature: number;
  absence: boolean;
}

export interface CommandFailure {
  command: WaterHeaterCommand;
  label: string;
  error: string;
}

export async function applyWaterHeaterCommands(
  status: CommandState,
  target: CommandTarget,
  cmd: WaterHeaterCommands,
): Promise<{ applied: string[]; failures: CommandFailure[] }> {
  const applied: string[] = [];
  const failures: CommandFailure[] = [];
  const run = async (command: WaterHeaterCommand, label: string, send: () => Promise<unknown>) => {
    try {
      await send();
      applied.push(label);
    } catch (e) {
      failures.push({ command, label, error: e instanceof Error ? e.message : String(e) });
    }
  };

  if (status.boostActive && !target.boost) {
    await run("boost", "boost on → off", () => cmd.setBoostMode(false));
  }
  if (status.mode !== target.mode) {
    await run("mode", `mode ${status.mode} → ${target.mode}`, () => cmd.setDHWMode(target.mode));
  }
  if (status.targetTemperature !== target.targetTemperature) {
    await run(
      "temperature",
      `consigne ${status.targetTemperature}°C → ${target.targetTemperature}°C`,
      () => cmd.setTargetTemperature(target.targetTemperature),
    );
  }
  // Toujours tentée, même si une commande précédente a échoué : c'est elle qui coupe l'appoint.
  const absenceNow = status.absenceActive ?? false;
  if (target.absence && !absenceNow) {
    await run("absence", "absence off → on (heure de pic)", () => cmd.setAbsenceMode(true));
  } else if (!target.absence && absenceNow) {
    await run("absence", "absence on → off", () => cmd.setAbsenceMode(false));
  }
  return { applied, failures };
}
