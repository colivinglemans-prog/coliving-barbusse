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
  whatsapp: "https://wa.me/0",
  autour: "https://exemple.fr/blog#pendant-le-sejour",
  evenements: "https://exemple.fr/blog#evenements",
  adresse: "Rue Exemple, Ville",
  arrivee: "jeudi 10 décembre",
  depart: "dimanche 13 décembre",
  nuits: "3",
  adultes: "12",
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
      { source: "host", time: "2026-11-02T15:23:26Z", message: "Bonjour Test,\n\nBienvenue au Coliving Henri Barbusse !\n\n---\nVotre code personnel pour la duree de votre sejour" },
      { source: "host", time: "2026-11-08T08:02:30Z", message: "Bonjour Test,\n\nJ'espère que vous êtes bien installé et que vous avez trouvé vos marques.\n\nAlexandre" },
      { source: "host", time: "2026-10-30T16:19:41Z", message: "Bonjour ,\n\nLe depart approche ! Nous esperons que vous avez passe un tres bon\nsejour au Coliving Henri Barbusse." },
      { source: "host", time: "2026-11-01T09:18:24Z", message: "Bonjour ,\n\nNous esperons que vous avez passe un excellent sejour au Coliving\nHenri Barbusse et que vous etes rentres en toute securite !" },
      { source: "host", time: "2026-10-03T15:03:48Z", message: "Hello ,\n\nYour departure is approaching! We hope you had a wonderful stay\nat Coliving Henri Barbusse." },
      { source: "host", time: "2026-10-05T08:17:22Z", message: "Hello ,\n\nWe hope you had a wonderful stay at Coliving Henri Barbusse\nand that you arrived home safely!" },
      { source: "host", time: "2026-09-25T14:08:17Z", message: "Hello Test,\n\nWelcome to Coliving Henri Barbusse!\n\n---\nYour personal access code for the main entrance:\n0000" },
    ];
    expect(ledgerFromThread(thread, TEMPLATES).map((e) => e.templateId)).toEqual(["arrivee-code", "bien-installe", "depart", "avis", "depart", "avis", "arrivee-code"]);
  });

  it("un message de bienvenue sans code n'est PAS une arrivée envoyée (sinon le code ne partirait jamais)", () => {
    const thread = [{ source: "host", time: "2026-11-01T10:00:00Z", message: "Bonjour, bienvenue au Coliving Henri Barbusse ! Je vous enverrai le code avant votre arrivée." }];
    expect(ledgerFromThread(thread, TEMPLATES)).toEqual([]);
  });

  it("le moteur voit les envois des anciens boutons, dans les cinq langues", async () => {
    const { buildGuestMessage } = await import("@/lib/guest-messages");
    for (const locale of LOCALES) {
      const text = buildGuestMessage(locale, { firstName: "Test", url: "https://exemple.fr", code: "0000" });
      expect(ledgerFromThread([{ source: "host", time: "2026-11-01T10:00:00Z", message: text }], TEMPLATES).map((e) => e.templateId), locale).toEqual(["arrivee-code"]);
      // Avec la ligne « autour de la maison » (Lot 4) : toujours l'arrivée, jamais le lendemain.
      const around = buildGuestMessage(locale, { firstName: "Test", url: "https://exemple.fr", code: "0000", aroundUrl: "https://exemple.fr/blog" });
      expect(ledgerFromThread([{ source: "host", time: "2026-11-01T10:00:00Z", message: around }], TEMPLATES).map((e) => e.templateId), locale).toEqual(["arrivee-code"]);
    }
  });

  it("le moteur voit le bouton « Départ », dans les cinq langues (et pas comme un avis)", async () => {
    const { buildDepartureMessage } = await import("@/lib/guest-messages");
    for (const locale of LOCALES) {
      const text = buildDepartureMessage(locale, { firstName: "Test" });
      expect(ledgerFromThread([{ source: "host", time: "2026-11-01T10:00:00Z", message: text }], TEMPLATES).map((e) => e.templateId), locale).toEqual(["depart"]);
    }
  });

  it("le message J+1 proposé au Lot 4 (docs/auto-actions-beds24.md), s'il a été créé, vaut « bien installé »", () => {
    const thread = [
      { source: "host", time: "2026-11-02T09:00:00Z", message: "Bonjour Test,\nTout se passe bien à la maison ? Pour tout le groupe, nos adresses autour de la maison :\nhttps://exemple.fr\nAlexandre" },
      { source: "host", time: "2026-11-03T09:00:00Z", message: "Hello Test,\nIs everything going well at the house? For the whole group, our tips around the house:\nhttps://exemple.fr\nAlexandre" },
    ];
    expect(ledgerFromThread(thread, TEMPLATES).map((e) => e.templateId)).toEqual(["bien-installe", "bien-installe"]);
  });

  it("avis : jamais « si vous avez aimé », et la version directe ne parle pas de plateforme", () => {
    const avis = TEMPLATES.find((t) => t.id === "avis")!;
    for (const locale of LOCALES) {
      const platform = renderMessage(avis, { channel: "Airbnb", locale }, VARS).text;
      const direct = renderMessage(avis, { channel: "Direct", locale }, { ...VARS, direct: "https://exemple.fr" }).text;
      expect(platform, locale).not.toMatch(/vous a plu|you enjoyed|gefallen hat|te ha gustado|ti è piaciuto/i);
      expect(direct, locale).not.toMatch(/plateforme|platform|plataforma|piattaforma/i);
    }
  });

  it("dernière minute : départ à partir de 2 nuits, lendemain de l'arrivée à partir de 3, messages de confort", () => {
    const by = (id: string) => TEMPLATES.find((t) => t.id === id)!;
    expect(by("depart").conditions).toMatchObject({ minNights: 2, quietHours: 12 });
    expect(by("bien-installe").conditions).toMatchObject({ minNights: 3, quietHours: 12 });
    expect(by("avis").conditions).toMatchObject({ quietHours: 12 });
    // L'arrivée porte le code : elle part toujours.
    expect(by("arrivee-code").conditions?.quietHours).toBeUndefined();
  });
});
