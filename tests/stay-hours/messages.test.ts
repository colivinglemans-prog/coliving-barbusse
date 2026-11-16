import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { renderMessage } from "@sejour/socle/lib/guest-messaging/dispatch";
import { LOCALES } from "@sejour/socle/lib/locales";
import { TEMPLATES } from "@/lib/messages/templates";
import { hourVars } from "@/lib/messages/engine";
import { buildDepartureMessage } from "@/lib/guest-messages";

/**
 * Textes voyageurs et horaires convenus (2026-11-16).
 *
 * `tests/fixtures/messages-heures-standard.json` est le rendu des gabarits **avant** l'arrivée des
 * variables `heureArrivee` / `heureDepart` (commit f7f31f4), relevé avec les valeurs inventées
 * ci-dessous. Sans horaire convenu, le rendu d'aujourd'hui doit lui être identique au caractère
 * près, dans les cinq langues.
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

const BEFORE: Record<string, Record<string, string>> = JSON.parse(
  readFileSync(fileURLToPath(new URL("../fixtures/messages-heures-standard.json", import.meta.url)), "utf-8"),
);

const render = (id: string, locale: (typeof LOCALES)[number], extra: Record<string, string | undefined>) =>
  renderMessage(TEMPLATES.find((t) => t.id === id)!, { channel: "Airbnb", locale }, { ...VARS, ...extra }).text;

describe("sans horaire convenu, les textes ne changent pas d'un caractère", () => {
  for (const id of ["confirmation", "arrivee-code", "depart"]) {
    it(`${id}, cinq langues, avec et sans prénom`, () => {
      for (const locale of LOCALES) {
        for (const prenom of ["Test", undefined]) {
          expect(render(id, locale, { prenom, ...hourVars(locale, {}) }), `${id} ${locale}`).toBe(BEFORE[id][`${locale}:${prenom ?? "-"}`]);
        }
      }
    });
  }

  it("bouton « Départ » du dashboard, cinq langues", () => {
    for (const locale of LOCALES) {
      expect(buildDepartureMessage(locale, { firstName: "Test" }), locale).toBe(BEFORE.bouton[locale]);
    }
  });

  it("bouton « Départ » sans prénom : « Bonjour, » puis le même texte", () => {
    const greeting: Record<string, string> = { fr: "Bonjour", en: "Hello", de: "Hallo", es: "Hola", it: "Ciao" };
    for (const locale of LOCALES) {
      const text = buildDepartureMessage(locale, {});
      expect(text, locale).toBe(BEFORE.bouton[locale].replace(`${greeting[locale]} Test,`, `${greeting[locale]},`));
      expect(text.startsWith(`${greeting[locale]},
`), locale).toBe(true);
      expect(buildDepartureMessage(locale, { firstName: "  " }), locale).toBe(text);
    }
  });

  it("drapeaux vides sans accord", () => {
    expect(hourVars("fr", {})).toEqual({ heureArrivee: "17h", heureDepart: "11h", arriveeConvenue: undefined, departConvenu: undefined });
  });
});

describe("avec horaires convenus", () => {
  it("départ convenu 16 h : la veille, « comme convenu, vous pouvez rester jusqu'à 16h », le reste inchangé", () => {
    const expected: Record<string, string> = {
      fr: "Votre séjour se termine demain : comme convenu, vous pouvez rester jusqu'à 16h.",
      en: "Your stay ends tomorrow: as agreed, you can stay until 4 pm.",
      de: "Ihr Aufenthalt endet morgen: Wie vereinbart können Sie bis 16 Uhr bleiben.",
      es: "Tu estancia termina mañana: como acordamos, puedes quedarte hasta las 16:00.",
      it: "il tuo soggiorno termina domani: come concordato, puoi restare fino alle 16:00.",
    };
    for (const locale of LOCALES) {
      const text = render("depart", locale, { prenom: "Test", ...hourVars(locale, { departureHour: 16 }) });
      const before = BEFORE.depart[`${locale}:Test`];
      const [beforeFirst, ...beforeRest] = before.split("\n\n");
      const [first, second, ...rest] = text.split("\n\n");
      expect(first).toBe(beforeFirst);
      expect(second, locale).toBe(expected[locale]);
      expect(rest.join("\n\n")).toBe(beforeRest.slice(1).join("\n\n"));
      // Le bouton du dashboard dit la même chose.
      expect(buildDepartureMessage(locale, { firstName: "Test", departureHour: 16 }).split("\n")[2], locale).toBe(expected[locale]);
    }
  });

  it("confirmation et arrivée : heures convenues à leur place", () => {
    expect(render("confirmation", "fr", hourVars("fr", { arrivalHour: 14, departureHour: 16 }))).toContain(
      "Arrivée : jeudi 10 décembre, à partir de 14h\nDépart : dimanche 13 décembre, avant 16h",
    );
    expect(render("confirmation", "en", hourVars("en", { arrivalHour: 14 }))).toContain("from 2 pm");
    expect(render("arrivee-code", "fr", hourVars("fr", { arrivalHour: 14 }))).toContain("L'arrivée est autonome, à partir de 14h.");
    expect(render("arrivee-code", "de", hourVars("de", { arrivalHour: 14 }))).toContain("ab 14 Uhr.");
  });

  it("versions incrémentées des trois gabarits touchés", () => {
    const v = Object.fromEntries(TEMPLATES.map((t) => [t.id, t.version]));
    expect(v).toMatchObject({ confirmation: 2, "arrivee-code": 3, depart: 4 });
  });
});
