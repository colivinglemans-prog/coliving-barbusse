import { describe, expect, it } from "vitest";
import { countGuests, WATER_HEATER_SWITCH_HOUR } from "@/lib/bookings";
import { getWaterHeaterProfile } from "@/lib/cozytouch";
import type { Beds24Booking } from "@/lib/types";

function stay(arrival: string, departure: string, adults: number, children = 0): Beds24Booking {
  return { arrival, departure, numAdult: adults, numChild: children } as Beds24Booking;
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);

describe("countGuests", () => {
  it("bascule à 11 h, l'heure du check-out", () => {
    expect(WATER_HEATER_SWITCH_HOUR).toBe(11);
  });

  it("jour d'arrivée : compté dès 11 h", () => {
    const b = [stay("2026-11-10", "2026-11-12", 12, 2)];
    expect(countGuests(b, "2026-11-10", 10)).toBe(0);
    expect(countGuests(b, "2026-11-10", 11)).toBe(14);
    expect(countGuests(b, "2026-11-10", 23)).toBe(14);
  });

  it("nuit pleine : compté toute la journée", () => {
    const b = [stay("2026-11-10", "2026-11-12", 14)];
    for (const h of HOURS) expect(countGuests(b, "2026-11-11", h), `${h} h`).toBe(14);
  });

  it("jour de départ : compté jusqu'à 10 h, plus à partir de 11 h", () => {
    const b = [stay("2026-11-10", "2026-11-12", 14)];
    for (const h of HOURS.filter((h) => h < 11)) expect(countGuests(b, "2026-11-12", h), `${h} h`).toBe(14);
    expect(countGuests(b, "2026-11-12", 11)).toBe(0);
  });

  it("réservations enchaînées le même jour : jamais en éco", () => {
    const b = [stay("2026-11-10", "2026-11-12", 14), stay("2026-11-12", "2026-11-14", 6)];
    for (const h of HOURS) {
      const guests = countGuests(b, "2026-11-12", h);
      expect(getWaterHeaterProfile(guests), `${h} h`).not.toBe("vacant");
      expect(guests, `${h} h`).toBe(h < 11 ? 14 : 6);
    }
  });

  it("ni la veille d'une arrivée, ni le lendemain d'un départ", () => {
    const b = [stay("2026-11-10", "2026-11-12", 14)];
    expect(countGuests(b, "2026-11-09", 15)).toBe(0);
    expect(countGuests(b, "2026-11-13", 8)).toBe(0);
  });
});
