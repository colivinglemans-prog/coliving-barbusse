/**
 * Jour de rotation : les codes des partants et des arrivants ne se chevauchent pas, et un accord
 * contredit par une réservation arrivée après coup est repéré. Réservations inventées.
 */
import { describe, expect, it } from "vitest";
import { planAccessCodes } from "@sejour/socle/lib/access-codes";
import { parisInstant } from "@sejour/socle/lib/time";
import { ACCESS_POLICY, toStay } from "@/lib/access-sync";
import { agreedConflicts, boundRotationWindows } from "@/lib/stay-hours-rules";
import type { Beds24Booking } from "@/lib/types";

const booking = (id: number, arrival: string, departure: string, status = "confirmed", pin = "45678" + (id % 10)) =>
  ({ id, propertyId: 303771, status, firstName: "Test", arrival, departure, infoItems: [{ code: "NUKI_PIN", text: pin }] }) as unknown as Beds24Booking;

const leaving = booking(1000001, "2027-01-08", "2027-01-10");
const coming = booking(1000002, "2027-01-10", "2027-01-12");

describe("boundRotationWindows", () => {
  it("départ convenu 16 h sans arrivée le même jour : code jusqu'à 17 h", () => {
    const [s] = boundRotationWindows([toStay(leaving, { 1000001: { departureHour: 16 } })], ACCESS_POLICY);
    expect(s.validUntilHour).toBe(17);
  });

  it("rotation : le code des partants est borné à l'ouverture de celui des arrivants (14 h)", () => {
    const table = { 1000001: { departureHour: 16 } };
    const stays = boundRotationWindows([toStay(leaving, table), toStay(coming, table)], ACCESS_POLICY);
    expect(stays[0].validUntilHour).toBeUndefined();
    const plan = planAccessCodes({ stays, auths: [], today: "2027-01-07", now: new Date("2027-01-07T10:00:00Z"), policy: ACCESS_POLICY });
    const created = plan.actions.filter((a) => a.kind === "create");
    const until = created.find((a) => a.bookingId === 1000001);
    const from = created.find((a) => a.bookingId === 1000002);
    expect(until && until.kind === "create" && Date.parse(until.allowedUntilDate)).toBe(parisInstant("2027-01-10", 14).getTime());
    expect(from && from.kind === "create" && Date.parse(from.allowedFromDate)).toBe(parisInstant("2027-01-10", 14).getTime());
  });

  it("une option qui arrive le même jour ne borne rien", () => {
    const option = booking(1000003, "2027-01-10", "2027-01-12", "black");
    const [s] = boundRotationWindows([toStay(leaving, { 1000001: { departureHour: 16 } }), toStay(option, {})], ACCESS_POLICY);
    expect(s.validUntilHour).toBe(17);
  });
});

describe("agreedConflicts", () => {
  it("départ convenu 18 h puis arrivée vendue le même jour : conflit signalé", () => {
    expect(agreedConflicts({ 1000001: { departureHour: 18 } }, [leaving, coming])).toEqual([
      { bookingId: 1000001, message: "Départ à 18 h impossible : une arrivée est prévue le même jour à 17 h." },
    ]);
  });

  it("rien sans voisin, ni pour un voisin non vendu, ni à égalité", () => {
    expect(agreedConflicts({ 1000001: { departureHour: 18 } }, [leaving])).toEqual([]);
    expect(agreedConflicts({ 1000001: { departureHour: 18 } }, [leaving, booking(1000003, "2027-01-10", "2027-01-12", "request")])).toEqual([]);
    expect(agreedConflicts({ 1000001: { departureHour: 17 } }, [leaving, coming])).toEqual([]);
  });
});
