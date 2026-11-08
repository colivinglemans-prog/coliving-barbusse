import { describe, expect, it } from "vitest";
import { validateTemplates } from "@sejour/socle/lib/guest-messaging/validate";
import { renderMessage } from "@sejour/socle/lib/guest-messaging/dispatch";
import { ledgerFromThread } from "@sejour/socle/lib/guest-messaging/ledger";
import { LOCALES } from "@sejour/socle/lib/locales";
import { TEMPLATES } from "@/lib/messages/templates";
import { detectGuestMessageKind } from "@/lib/guest-messages";

/**
 * Les textes des messages voyageurs : toute erreur bloque le build. Langue manquante, variable
 * oubliée dans une traduction, reste de syntaxe Beds24, numéro ou code écrit en dur (le dépôt est
 * public), trou au rendu…
 */
const VARS = {
  code: "0000",
  guide: "https://exemple.fr/guide-arrivee",
  wifiReseau: "reseau",
  wifiMotDePasse: "motdepasse",
  telephone: "+33 0 00 00 00 00",
  avisGoogle: "https://exemple.fr/avis",
};

describe("messages voyageurs de Barbusse", () => {
  const findings = validateTemplates(TEMPLATES);

  it("aucune erreur dans les textes", () => {
    expect(findings.filter((f) => f.level === "error")).toEqual([]);
  });

  it("avertissements connus seulement (liens vers Booking.com, assumés jusqu'à la mesure)", () => {
    expect(findings.filter((f) => f.level === "warning" && f.code !== "links")).toEqual([]);
  });

  it("chaque message se rend dans les cinq langues, avec et sans prénom, avec et sans bloc direct", () => {
    for (const t of TEMPLATES) for (const locale of LOCALES) for (const prenom of ["Test", undefined]) for (const direct of ["https://exemple.fr", undefined]) {
      const r = renderMessage(t, { channel: "Airbnb", locale }, { ...VARS, prenom, direct });
      expect(r.text).not.toMatch(/\{\{|\}\}|undefined/);
      if (!prenom) expect(r.text).not.toMatch(/^\S+ ,/);
    }
  });

  it("on ne propose jamais de réserver en direct sans la variable (réservée aux directes)", () => {
    const avis = TEMPLATES.find((t) => t.id === "avis")!;
    for (const locale of LOCALES) {
      expect(renderMessage(avis, { channel: "Airbnb", locale }, VARS).text).not.toContain("https://exemple.fr\n");
    }
  });

  it("les anciens boutons reconnaissent les messages du moteur (pas de double envoi pendant la bascule)", () => {
    const kinds: Record<string, "arrivee" | "depart"> = { "arrivee-code": "arrivee", depart: "depart" };
    for (const [id, kind] of Object.entries(kinds)) {
      const t = TEMPLATES.find((x) => x.id === id)!;
      for (const locale of LOCALES) {
        expect(detectGuestMessageKind(renderMessage(t, { channel: "Airbnb", locale }, VARS).text), `${id} ${locale}`).toBe(kind);
      }
    }
  });

  it("le moteur reconnaît les auto-actions Beds24 telles qu'elles sont parties (fils relevés le 2026-11-08)", () => {
    const thread = [
      { source: "host", time: "2026-11-02T15:23:26Z", message: "Bonjour Test,\n\nBienvenue au Coliving Henri Barbusse !\n\n---\nVotre code personnel" },
      { source: "host", time: "2026-11-08T08:02:30Z", message: "Bonjour Test,\n\nJ'espère que vous êtes bien installé et que vous avez trouvé vos marques.\n\nAlexandre" },
      { source: "host", time: "2026-10-30T16:19:41Z", message: "Bonjour ,\n\nLe depart approche ! Nous esperons que vous avez passe un tres bon\nsejour au Coliving Henri Barbusse." },
      { source: "host", time: "2026-11-01T09:18:24Z", message: "Bonjour ,\n\nNous esperons que vous avez passe un excellent sejour au Coliving\nHenri Barbusse et que vous etes rentres en toute securite !" },
      { source: "host", time: "2026-10-03T15:03:48Z", message: "Hello ,\n\nYour departure is approaching! We hope you had a wonderful stay\nat Coliving Henri Barbusse." },
    ];
    expect(ledgerFromThread(thread, TEMPLATES).map((e) => e.templateId)).toEqual(["arrivee-code", "bien-installe", "depart", "avis", "depart"]);
  });
});
