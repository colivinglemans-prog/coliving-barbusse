import type { GuideLocale } from "@/lib/site";

export interface GuestMessageParams {
  firstName?: string;
  url: string;
  /** PIN Nuki ; absent tant que Beds24 ne l'a pas généré (~J-6). */
  code?: string;
}

/**
 * Message prêt à envoyer au voyageur, dans sa langue.
 * Le tutoiement / vouvoiement suit celui du guide d'arrivée : vous en FR et DE,
 * tutoiement en IT et ES.
 */
const TEMPLATES: Record<
  GuideLocale,
  (p: { name: string; url: string; code?: string }) => string[]
> = {
  fr: ({ name, url, code }) => [
    `Bonjour${name},`,
    "",
    "Voici le guide d'arrivée avec toutes les infos pratiques (accès, Wi-Fi, stationnement) :",
    url,
    ...(code ? ["", `Votre code d'accès à la porte : ${code}`] : []),
    "",
    "Bon séjour !",
    "Alexandre",
  ],
  en: ({ name, url, code }) => [
    `Hello${name},`,
    "",
    "Here is the welcome guide with all the practical information (access, Wi-Fi, parking):",
    url,
    ...(code ? ["", `Your door access code: ${code}`] : []),
    "",
    "Enjoy your stay!",
    "Alexandre",
  ],
  it: ({ name, url, code }) => [
    `Ciao${name},`,
    "",
    "Ecco la guida all'arrivo con tutte le informazioni pratiche (accesso, Wi-Fi, parcheggio):",
    url,
    ...(code ? ["", `Il tuo codice di accesso alla porta: ${code}`] : []),
    "",
    "Buon soggiorno!",
    "Alexandre",
  ],
  de: ({ name, url, code }) => [
    `Hallo${name},`,
    "",
    "hier ist der Ankunftsguide mit allen praktischen Informationen (Zugang, WLAN, Parken):",
    url,
    ...(code ? ["", `Ihr Türzugangscode: ${code}`] : []),
    "",
    "Einen schönen Aufenthalt!",
    "Alexandre",
  ],
  es: ({ name, url, code }) => [
    `Hola${name},`,
    "",
    "Aquí tienes la guía de llegada con toda la información práctica (acceso, wifi, aparcamiento):",
    url,
    ...(code ? ["", `Tu código de acceso a la puerta: ${code}`] : []),
    "",
    "¡Buena estancia!",
    "Alexandre",
  ],
};

export function buildGuestMessage(
  locale: GuideLocale,
  { firstName, url, code }: GuestMessageParams,
): string {
  const trimmed = firstName?.trim();
  const name = trimmed ? ` ${trimmed}` : "";
  return TEMPLATES[locale]({ name, url, code }).join("\n");
}
