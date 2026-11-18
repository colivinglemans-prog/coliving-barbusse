/** Caméra du garage : un mouvement expliqué par un code de la maison (Perso…). Données inventées. */
import { describe, expect, it } from "vitest";
import { AFTER_MS, BEFORE_MS, CHAIN_MS, householdVerdict } from "@/lib/camera/household";

const t = (hhmm: string) => new Date(`2026-11-17T${hhmm}:00+01:00`).getTime();
const perso = [{ at: new Date(t("09:00")) }];

describe("householdVerdict", () => {
  it("un mouvement juste après une ouverture au code Perso : pas d'alerte", () => {
    expect(householdVerdict(t("09:05"), perso, null)).toEqual({ quiet: true, until: t("09:05") + CHAIN_MS });
  });

  it("un mouvement vu juste avant l'ouverture (la caméra voit arriver) : pas d'alerte", () => {
    expect(householdVerdict(t("09:00") - AFTER_MS + 1000, perso, null).quiet).toBe(true);
  });

  it("une journée de travail au garage : chaque mouvement prolonge la présence", () => {
    let until: number | null = null;
    for (const m of ["09:05", "09:30", "09:55", "10:20", "10:45", "11:10"]) {
      const v = householdVerdict(t(m), perso, until);
      expect(v.quiet).toBe(true);
      until = v.until;
    }
  });

  it("plus de 30 min sans mouvement : la chaîne s'arrête, le suivant alerte", () => {
    const first = householdVerdict(t("09:05"), perso, null);
    expect(householdVerdict(t("09:05") + CHAIN_MS + 60_000, perso, first.until).quiet).toBe(false);
  });

  it("aucune ouverture connue (journal illisible ou personne) : alerte", () => {
    expect(householdVerdict(t("09:05"), [], null)).toEqual({ quiet: false, until: null });
    expect(householdVerdict(t("09:00") + BEFORE_MS + 60_000, perso, null).quiet).toBe(false);
  });
});
