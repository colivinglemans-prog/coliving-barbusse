import { describe, expect, it } from "vitest";
import { longestFreeRange } from "@sejour/socle/lib/availability";

// Socle v3.34.0 : une nuit absente de la réponse n'est pas réservable (auparavant, lue « libre » ;
// Barbusse le corrigeait localement dans `lib/bookable-nights.ts`, retiré).
describe("longestFreeRange — nuits absentes", () => {
  it("au-delà de l'horizon (réponse vide) : aucune plage libre", () => {
    expect(longestFreeRange({}, "2028-01-01", "2028-01-03")).toBeNull();
  });

  it("une nuit absente coupe la plage", () => {
    const r = longestFreeRange({ "2027-12-24": true, "2027-12-25": true }, "2027-12-24", "2027-12-27");
    expect(r?.nights).toBe(2);
  });

  it("une nuit lue « prise » le reste", () => {
    expect(longestFreeRange({ "2027-05-01": false }, "2027-05-01", "2027-05-02")).toBeNull();
  });
});
