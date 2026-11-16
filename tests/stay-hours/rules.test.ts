import { describe, expect, it } from "vitest";
import {
  AGREED_RANGE,
  STANDARD_HOURS,
  accessHours,
  clockOf,
  formatHourFor,
  parseAgreedHours,
  rotationCheck,
  stayHours,
  validateAgreedHours,
  withAgreedHours,
} from "@/lib/stay-hours-rules";
import { ACCESS_POLICY } from "@/lib/access-sync";

/** Horaires convenus : la règle pure (`lib/stay-hours-rules.ts`). Réservations inventées. */
describe("stayHours", () => {
  it("heures standard sans accord, 17 h / 11 h", () => {
    expect(stayHours(1000001, {})).toEqual({ arrivalHour: 17, departureHour: 11, arrivalAgreed: false, departureAgreed: false });
    expect(STANDARD_HOURS).toEqual({ arrival: 17, departure: 11 });
  });

  it("l'accord prime, champ par champ", () => {
    expect(stayHours(1000001, { 1000001: { departureHour: 16 } })).toEqual({
      arrivalHour: 17,
      departureHour: 16,
      arrivalAgreed: false,
      departureAgreed: true,
    });
  });
});

describe("withAgreedHours", () => {
  const a = { id: 1000001, arrival: "2026-12-04", departure: "2026-12-06" };
  const b = { id: 1000002, arrival: "2026-12-06", departure: "2026-12-08" };

  it("une réservation sans accord ressort **identique** (même objet)", () => {
    const [ra, rb] = withAgreedHours([a, b], { 1000001: { departureHour: 16 } });
    expect(ra).toEqual({ ...a, departureHour: 16 });
    expect(rb).toBe(b);
    expect("arrivalHour" in ra).toBe(false);
  });

  it("jointure par un autre identifiant (préparation d'arrivée)", () => {
    const r = withAgreedHours([{ bookingId: 7, arrival: "x", departure: "y" }], { 7: { arrivalHour: 14 } }, (x) => x.bookingId);
    expect(r[0].arrivalHour).toBe(14);
  });
});

describe("saisie et relecture", () => {
  it("bornes : arrivée 8-16 h, départ 12-23 h, heures entières", () => {
    expect(AGREED_RANGE).toEqual({ arrival: { min: 8, max: 16 }, departure: { min: 12, max: 23 } });
    expect(validateAgreedHours({ departureHour: 16 })).toEqual({ ok: true, value: { departureHour: 16 } });
    expect(validateAgreedHours({ arrivalHour: 14, departureHour: null })).toEqual({ ok: true, value: { arrivalHour: 14 } });
    expect(validateAgreedHours({}).ok).toBe(true);
    for (const bad of [{ departureHour: 11 }, { departureHour: 24 }, { arrivalHour: 17 }, { arrivalHour: 7 }, { departureHour: 15.5 }, { departureHour: "16" }]) {
      expect(validateAgreedHours(bad).ok, JSON.stringify(bad)).toBe(false);
    }
    expect(validateAgreedHours(null).ok).toBe(false);
  });

  it("relecture tolérante : chaîne JSON ou objet, valeurs invalides écartées", () => {
    expect(parseAgreedHours('{"departureHour":16}')).toEqual({ departureHour: 16 });
    expect(parseAgreedHours({ arrivalHour: 14, departureHour: 99 })).toEqual({ arrivalHour: 14 });
    // Mêmes bornes que la saisie : une valeur posée à la main hors bornes est ignorée.
    expect(parseAgreedHours({ arrivalHour: 3, departureHour: 16 })).toEqual({ departureHour: 16 });
    expect(parseAgreedHours({ departureHour: 9 })).toBeNull();
    expect(parseAgreedHours({ arrivalHour: 17 })).toBeNull();
    expect(parseAgreedHours("pas du json")).toBeNull();
    expect(parseAgreedHours({})).toBeNull();
  });
});

describe("rotationCheck", () => {
  const leaving = { bookingId: 1000001, arrival: "2026-12-04", departure: "2026-12-06" };
  const coming = { bookingId: 1000002, arrival: "2026-12-06", departure: "2026-12-08" };

  it("départ tardif sans arrivée le même jour : ni refus ni avertissement", () => {
    expect(rotationCheck(leaving, { departureHour: 16 }, [], {})).toEqual({});
  });

  it("rotation : départ ≤ arrivée suivante accepté avec avertissement, au-delà refusé", () => {
    expect(rotationCheck(leaving, { departureHour: 16 }, [coming], {}).warning).toBe("Une arrivée est prévue le même jour à 17 h.");
    expect(rotationCheck(leaving, { departureHour: 17 }, [coming], {}).error).toBeUndefined();
    expect(rotationCheck(leaving, { departureHour: 18 }, [coming], {}).error).toMatch(/18 h impossible.*17 h/);
    // L'arrivée suivante a elle-même été avancée : la borne suit.
    expect(rotationCheck(leaving, { departureHour: 16 }, [coming], { 1000002: { arrivalHour: 14 } }).error).toMatch(/14 h/);
  });

  it("arrivée anticipée avant un départ convenu le même jour : refusée", () => {
    expect(rotationCheck(coming, { arrivalHour: 15 }, [leaving], { 1000001: { departureHour: 16 } }).error).toMatch(/15 h impossible/);
    expect(rotationCheck(coming, { arrivalHour: 12 }, [leaving], {}).warning).toBe("Un départ est prévu le même jour à 11 h.");
  });

  it("sans accord, aucune remarque même en rotation", () => {
    expect(rotationCheck(leaving, {}, [coming], {})).toEqual({});
  });
});

describe("accessHours — fenêtre du code", () => {
  it("rien sans accord : la politique (14 h → 14 h) s'applique", () => {
    expect(ACCESS_POLICY.validFromHour).toBe(14);
    expect(ACCESS_POLICY.validUntilHour).toBe(14);
    expect(accessHours({}, ACCESS_POLICY)).toEqual({});
  });

  it("départ 16 h → code jusqu'à 17 h ; départ 12 h → 14 h inchangé", () => {
    expect(accessHours({ departureHour: 16 }, ACCESS_POLICY)).toEqual({ validUntilHour: 17 });
    expect(accessHours({ departureHour: 12 }, ACCESS_POLICY)).toEqual({});
    expect(accessHours({ departureHour: 23 }, ACCESS_POLICY)).toEqual({ validUntilHour: 23 });
  });

  it("arrivée 14 h → code dès 13 h ; arrivée 16 h → 14 h inchangé", () => {
    expect(accessHours({ arrivalHour: 14 }, ACCESS_POLICY)).toEqual({ validFromHour: 13 });
    expect(accessHours({ arrivalHour: 16 }, ACCESS_POLICY)).toEqual({});
    expect(accessHours({ arrivalHour: 8 }, ACCESS_POLICY)).toEqual({ validFromHour: 7 });
  });
});

describe("formats", () => {
  it("l'heure dans la langue du voyageur, comme les textes l'écrivaient en dur", () => {
    expect(["fr", "en", "de", "es", "it"].map((l) => formatHourFor(l, 17))).toEqual(["17h", "5 pm", "17 Uhr", "17:00", "17:00"]);
    expect(["fr", "en", "de", "es", "it"].map((l) => formatHourFor(l, 11))).toEqual(["11h", "11 am", "11 Uhr", "11:00", "11:00"]);
    expect(formatHourFor("en", 12)).toBe("12 pm");
    expect(formatHourFor("en", 16)).toBe("4 pm");
  });

  it("`arrivalTime` de la préparation d'arrivée", () => {
    expect(clockOf(9)).toBe("09:00");
    expect(clockOf(14)).toBe("14:00");
  });
});
