import { describe, expect, it } from "vitest";
import { GUIDE_LOCALES, aroundUrl, guideUrl } from "@/lib/site";
import { buildDepartureMessage, buildGuestMessage, detectGuestMessageKind } from "@/lib/guest-messages";

describe("messages aux voyageurs (Lot 4 du parcours)", () => {
  it("le message d'arrivée garde le libellé du code (signature) et ajoute le lien « autour de la maison »", () => {
    for (const l of GUIDE_LOCALES) {
      const m = buildGuestMessage(l, { firstName: "Ana", url: guideUrl(l), code: "123456", aroundUrl: aroundUrl(l) });
      expect(detectGuestMessageKind(m), l).toBe("arrivee");
      expect(m, l).toContain(aroundUrl(l));
      expect(m, l).toContain("#pendant-le-sejour");
    }
  });

  it("sans PIN, pas de signature d'arrivée (le bouton ne doit pas se griser)", () => {
    const m = buildGuestMessage("fr", { url: guideUrl("fr"), aroundUrl: aroundUrl("fr") });
    expect(detectGuestMessageKind(m)).toBeNull();
  });

  it("le message de départ garde son ouverture (signature), une remarque par WhatsApp et une ligne d'avis neutre", () => {
    for (const l of GUIDE_LOCALES) {
      const m = buildDepartureMessage(l, { firstName: "Ana" });
      expect(detectGuestMessageKind(m), l).toBe("depart");
      expect(m, l).toContain("https://wa.me/33620921005");
    }
    const fr = buildDepartureMessage("fr", {});
    expect(fr).toContain("chaque retour, positif ou critique, nous est utile");
    expect(fr).not.toMatch(/5 étoiles|si vous avez aimé/i);
  });
});
