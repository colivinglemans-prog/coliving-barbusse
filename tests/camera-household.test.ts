/** Caméra du garage : un mouvement expliqué par un code de la maison (Perso…). Données inventées. */
import { describe, expect, it } from "vitest";
import {
  AFTER_OPENING_MS,
  BEFORE_OPENING_MS,
  CHAIN_MS,
  MAX_AFTER_OPENING_MS,
  garagePriority,
  householdVerdict,
} from "@/lib/camera/household";

const t = (hhmm: string, day = "17") => new Date(`2026-11-${day}T${hhmm}:00+01:00`).getTime();
const perso = [{ at: new Date(t("09:00")) }];

describe("garagePriority", () => {
  it("maison vide : toujours 4 ; séjour : 4 le jour, 2 la nuit (22 h-8 h)", () => {
    expect(garagePriority(false, 23)).toBe(4);
    expect(garagePriority(true, 14)).toBe(4);
    expect(garagePriority(true, 8)).toBe(4);
    expect(garagePriority(true, 21)).toBe(4);
    expect(garagePriority(true, 22)).toBe(2);
    expect(garagePriority(true, 7)).toBe(2);
    expect(garagePriority(true, 3)).toBe(2);
  });
});

describe("householdVerdict", () => {
  it("un mouvement juste après une ouverture au code Perso : pas d'alerte, la chaîne démarre", () => {
    expect(householdVerdict(t("09:05"), perso, null, true)).toEqual({ quiet: true, until: t("09:05") + CHAIN_MS });
  });

  it("un mouvement vu juste avant l'ouverture : pas d'alerte", () => {
    expect(householdVerdict(t("09:00") - BEFORE_OPENING_MS + 1000, perso, null, true).quiet).toBe(true);
  });

  it("une journée de travail au garage : chaque vrai mouvement prolonge la présence", () => {
    let until: number | null = null;
    for (const m of ["09:05", "09:30", "09:55", "10:20", "10:45", "11:10"]) {
      const v = householdVerdict(t(m), perso, until, true);
      expect(v.quiet).toBe(true);
      until = v.until;
    }
  });

  it("du linge qui bouge ne prolonge jamais la chaîne", () => {
    const first = householdVerdict(t("09:05"), perso, null, true);
    const linge = householdVerdict(t("09:30"), perso, first.until, false);
    expect(linge).toEqual({ quiet: true, until: first.until });
    // 40 min après le dernier vrai mouvement : hors chaîne, alerte.
    expect(householdVerdict(t("09:45"), perso, linge.until, true).quiet).toBe(false);
  });

  it("la chaîne ne dépasse jamais 12 h après la dernière ouverture", () => {
    let until: number | null = null;
    for (let m = t("09:05"); m < t("09:00") + MAX_AFTER_OPENING_MS; m += 20 * 60 * 1000) {
      until = householdVerdict(m, perso, until, true).until;
    }
    expect(until).toBeLessThanOrEqual(t("09:00") + MAX_AFTER_OPENING_MS);
    expect(householdVerdict(t("09:00") + MAX_AFTER_OPENING_MS + 60_000, perso, until, true).quiet).toBe(false);
  });

  it("aucune ouverture connue (journal illisible ou personne) : alerte", () => {
    expect(householdVerdict(t("09:05"), [], null, true)).toEqual({ quiet: false, until: null });
    expect(householdVerdict(t("09:00") + AFTER_OPENING_MS + 60_000, perso, null, true).quiet).toBe(false);
  });

  it("journal illisible pendant une chaîne : silence jusqu'à l'échéance, sans la prolonger", () => {
    const first = householdVerdict(t("09:05"), perso, null, true);
    expect(householdVerdict(t("09:20"), [], first.until, true)).toEqual({ quiet: true, until: first.until });
  });
});
