import { describe, expect, it } from "vitest";
import { longestFreeRange } from "@sejour/socle/lib/availability";
import { knownNights } from "@/lib/bookable-nights";

describe("knownNights", () => {
  it("une nuit absente de la réponse n'est pas réservable", () => {
    const dates = { "2027-12-24": true, "2027-12-25": true };
    expect(knownNights(dates, "2027-12-24", "2027-12-27")).toEqual({
      "2027-12-24": true,
      "2027-12-25": true,
      "2027-12-26": false,
    });
  });

  it("au-delà de l'horizon (réponse vide) : plus de plage libre", () => {
    expect(longestFreeRange({}, "2028-01-01", "2028-01-03")).not.toBeNull(); // le piège du socle
    expect(longestFreeRange(knownNights({}, "2028-01-01", "2028-01-03"), "2028-01-01", "2028-01-03")).toBeNull();
  });

  it("une nuit lue « prise » le reste", () => {
    expect(knownNights({ "2027-05-01": false }, "2027-05-01", "2027-05-02")).toEqual({ "2027-05-01": false });
  });
});
