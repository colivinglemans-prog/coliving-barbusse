/**
 * Socle v3.26.0 : un départ convenu à 16 h recale le code déjà posé (14 h → 14 h) jusqu'à 17 h,
 * par le vrai planificateur `planAccessCodes`. Réservation, PIN et prénom inventés.
 */
import { describe, expect, it } from "vitest";
import { planAccessCodes, stayCodeName } from "@sejour/socle/lib/access-codes";
import { parisInstant } from "@sejour/socle/lib/time";
import { ACCESS_POLICY, toStay } from "@/lib/access-sync";
import type { Beds24Booking } from "@/lib/types";

const booking = {
  id: 1000001,
  propertyId: 303771,
  status: "confirmed",
  firstName: "Test",
  arrival: "2027-01-08",
  departure: "2027-01-10",
  infoItems: [{ code: "NUKI_PIN", text: "456789" }],
} as unknown as Beds24Booking;

const posed = {
  id: "auth-1",
  type: 13,
  name: stayCodeName(1000001, "Test"),
  enabled: true,
  code: 456789,
  allowedFromDate: parisInstant("2027-01-08", 14).toISOString(),
  allowedUntilDate: parisInstant("2027-01-10", 14).toISOString(),
};

const plan = (table: Record<number, { arrivalHour?: number; departureHour?: number }>) =>
  planAccessCodes({
    stays: [toStay(booking, table)],
    auths: [posed],
    today: "2027-01-07",
    now: new Date("2027-01-07T10:00:00Z"),
    policy: ACCESS_POLICY,
  });

describe("fenêtre du code par séjour (socle v3.26.0)", () => {
  it("sans accord : rien à faire, le code 14 h → 14 h est le bon", () => {
    expect(plan({}).actions).toEqual([]);
  });

  it("départ convenu 16 h : update motif `window`, jusqu'au jour du départ 17 h (Paris)", () => {
    const actions = plan({ 1000001: { departureHour: 16 } }).actions;
    expect(actions).toHaveLength(1);
    const a = actions[0];
    expect(a.kind).toBe("update");
    if (a.kind !== "update") return;
    expect(a.reasons).toEqual(["window"]);
    expect(Date.parse(a.allowedUntilDate)).toBe(parisInstant("2027-01-10", 17).getTime());
    expect(a.allowedUntilDate).toBe("2027-01-10T16:00:00.000Z");
    expect(Date.parse(a.allowedFromDate)).toBe(parisInstant("2027-01-08", 14).getTime());
  });

  it("arrivée convenue 14 h : le code ouvre dès 13 h", () => {
    const a = plan({ 1000001: { arrivalHour: 14 } }).actions[0];
    expect(a.kind === "update" && a.allowedFromDate).toBe(parisInstant("2027-01-08", 13).toISOString());
  });
});
