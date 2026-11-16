/**
 * Commandes du ballon : ordre voulu (boost, mode, consigne, Absence en dernier) et isolement — un
 * refus du mode ou de la consigne n'empêche plus de poser l'Absence au pic. Données inventées.
 */
import { describe, expect, it } from "vitest";
import { applyWaterHeaterCommands, type WaterHeaterCommands } from "@/lib/water-heater-commands";

function recorder(refuse: Array<keyof WaterHeaterCommands> = []) {
  const calls: string[] = [];
  const make =
    (name: keyof WaterHeaterCommands) =>
    async (arg: unknown): Promise<void> => {
      calls.push(`${name}(${String(arg)})`);
      if (refuse.includes(name)) throw new Error(`Overkiz 400 : ${name} refusé`);
    };
  const cmd: WaterHeaterCommands = {
    setBoostMode: make("setBoostMode"),
    setDHWMode: make("setDHWMode"),
    setTargetTemperature: make("setTargetTemperature"),
    setAbsenceMode: make("setAbsenceMode"),
  };
  return { calls, cmd };
}

const PEAK = { boost: false, mode: "manualEcoActive", targetTemperature: 55, absence: true } as const;
const DRIFTED = { boostActive: true, mode: "autoMode", targetTemperature: 60, absenceActive: false };

describe("commandes du ballon", () => {
  it("ordre : boost, mode, consigne, Absence en dernier", async () => {
    const { calls, cmd } = recorder();
    const r = await applyWaterHeaterCommands(DRIFTED, PEAK, cmd);
    expect(calls).toEqual(["setBoostMode(false)", "setDHWMode(manualEcoActive)", "setTargetTemperature(55)", "setAbsenceMode(true)"]);
    expect(r.failures).toEqual([]);
    expect(r.applied).toHaveLength(4);
  });

  it("un refus du mode n'empêche pas l'Absence ; l'échec est rendu", async () => {
    const { calls, cmd } = recorder(["setDHWMode"]);
    const r = await applyWaterHeaterCommands(DRIFTED, PEAK, cmd);
    expect(calls.at(-1)).toBe("setAbsenceMode(true)");
    expect(calls).toContain("setTargetTemperature(55)");
    expect(r.failures.map((f) => f.command)).toEqual(["mode"]);
    expect(r.applied).toContain("absence off → on (heure de pic)");
  });

  it("tout refusé : quatre échecs, l'Absence tentée quand même", async () => {
    const { calls, cmd } = recorder(["setBoostMode", "setDHWMode", "setTargetTemperature", "setAbsenceMode"]);
    const r = await applyWaterHeaterCommands(DRIFTED, PEAK, cmd);
    expect(calls).toHaveLength(4);
    expect(r.failures.map((f) => f.command)).toEqual(["boost", "mode", "temperature", "absence"]);
  });

  it("hors pic : l'Absence est levée, toujours en dernier", async () => {
    const { calls, cmd } = recorder(["setTargetTemperature"]);
    await applyWaterHeaterCommands({ ...DRIFTED, boostActive: false, absenceActive: true }, { ...PEAK, absence: false }, cmd);
    expect(calls).toEqual(["setDHWMode(manualEcoActive)", "setTargetTemperature(55)", "setAbsenceMode(false)"]);
  });

  it("réglages déjà bons : aucune commande", async () => {
    const { calls, cmd } = recorder();
    await applyWaterHeaterCommands({ boostActive: false, mode: "manualEcoActive", targetTemperature: 55, absenceActive: true }, PEAK, cmd);
    expect(calls).toEqual([]);
  });
});
