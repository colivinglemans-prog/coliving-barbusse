import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { shortLinkRedirect } from "@/lib/short-links";

const req = (al?: string) =>
  new NextRequest("https://www.coliving-barbusse.fr/bienvenue", {
    headers: al ? { "accept-language": al } : {},
  });

describe("raccourcis des QR imprimés", () => {
  it("307 vers la page dans la langue du téléphone, ancre conservée", () => {
    const res = shortLinkRedirect(req("de-DE,de;q=0.9"), (l) => `/${l}/guide-arrivee#sur-place`);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://www.coliving-barbusse.fr/de/guide-arrivee#sur-place");
  });

  it("jamais en cache public, et varie selon la langue", () => {
    const res = shortLinkRedirect(req("it"), (l) => `/${l}/blog#pendant-le-sejour`);
    expect(res.headers.get("vary")).toBe("Accept-Language");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
  });

  it("sans en-tête de langue : repli du socle (français)", () => {
    const res = shortLinkRedirect(req(), (l) => `/${l}/blog#pendant-le-sejour`);
    expect(res.headers.get("location")).toBe("https://www.coliving-barbusse.fr/fr/blog#pendant-le-sejour");
  });
});
