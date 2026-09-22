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

/* ────────────────────────────────────────────────────────────────────────────
 * Messages déclenchables depuis le calendrier du dashboard
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Les deux seuls messages que le dashboard sait envoyer lui-même. Ce sont les deux qui
 * ont une date de déclenchement évidente, et les deux qu'on veut parfois avancer à la
 * main — le PIN quand le voyageur le réclame avant l'heure, le rappel de départ quand on
 * sait que le groupe part tôt.
 */
export type GuestMessageKind = "arrivee" | "depart";

export const GUEST_MESSAGE_KINDS = ["arrivee", "depart"] as const;

const DEPARTURE_TEMPLATES: Record<GuideLocale, (p: { name: string }) => string[]> = {
  fr: ({ name }) => [
    `Bonjour${name},`,
    "",
    "Le départ approche ! Nous espérons que vous avez passé un très bon séjour",
    "au Coliving Henri Barbusse.",
    "",
    "Sauf accord préalable, merci de libérer la maison avant 11h.",
    "",
    "Le ménage est inclus, nous vous remercions simplement de :",
    "- Mettre la vaisselle sale dans le lave-vaisselle",
    "- Vider et ranger la vaisselle propre du lave-vaisselle",
    "- Utiliser les poubelles de la cuisine",
    "- Retirer vos denrées du réfrigérateur",
    "- Remettre les espaces communs (salon, cuisine, jardin, salle de sport) en état",
    "",
    "Si vous souhaitez nous aider davantage, vous pouvez retirer les draps et",
    "serviettes et les regrouper dans les couloirs ou en bas des escaliers.",
    "",
    "Merci, et bonne route !",
    "Alexandre",
  ],
  en: ({ name }) => [
    `Hello${name},`,
    "",
    "Your departure is approaching! We hope you had a great stay",
    "at Coliving Henri Barbusse.",
    "",
    "Unless agreed otherwise, please check out before 11am.",
    "",
    "Cleaning is included, we only ask you to:",
    "- Put dirty dishes in the dishwasher",
    "- Empty and put away the clean dishes",
    "- Use the kitchen bins",
    "- Take your food out of the fridge",
    "- Leave the common areas (living room, kitchen, garden, gym) tidy",
    "",
    "If you would like to help further, you can strip the beds and gather the",
    "sheets and towels in the hallways or at the bottom of the stairs.",
    "",
    "Thank you, and safe travels!",
    "Alexandre",
  ],
  it: ({ name }) => [
    `Ciao${name},`,
    "",
    "La partenza si avvicina! Speriamo che tu abbia trascorso un ottimo soggiorno",
    "al Coliving Henri Barbusse.",
    "",
    "Salvo accordi diversi, ti chiediamo di lasciare la casa entro le 11.",
    "",
    "Le pulizie sono incluse, ti chiediamo solo di:",
    "- Mettere i piatti sporchi in lavastoviglie",
    "- Svuotare e riporre i piatti puliti",
    "- Usare i bidoni della cucina",
    "- Togliere i tuoi alimenti dal frigorifero",
    "- Lasciare in ordine gli spazi comuni (salotto, cucina, giardino, palestra)",
    "",
    "Se vuoi darci una mano in più, puoi togliere lenzuola e asciugamani e",
    "raggrupparli nei corridoi o in fondo alle scale.",
    "",
    "Grazie e buon viaggio!",
    "Alexandre",
  ],
  de: ({ name }) => [
    `Hallo${name},`,
    "",
    "Die Abreise naht! Wir hoffen, Sie hatten einen sehr schönen Aufenthalt",
    "im Coliving Henri Barbusse.",
    "",
    "Sofern nicht anders vereinbart, bitten wir Sie, das Haus bis 11 Uhr zu verlassen.",
    "",
    "Die Reinigung ist inbegriffen, wir bitten Sie lediglich:",
    "- Schmutziges Geschirr in die Spülmaschine zu stellen",
    "- Sauberes Geschirr auszuräumen und wegzuräumen",
    "- Die Mülleimer in der Küche zu benutzen",
    "- Ihre Lebensmittel aus dem Kühlschrank zu nehmen",
    "- Die Gemeinschaftsräume (Wohnzimmer, Küche, Garten, Fitnessraum) aufgeräumt zu hinterlassen",
    "",
    "Wenn Sie uns zusätzlich helfen möchten, können Sie Bettwäsche und Handtücher",
    "abziehen und in den Fluren oder am Fuß der Treppe sammeln.",
    "",
    "Vielen Dank und gute Fahrt!",
    "Alexandre",
  ],
  es: ({ name }) => [
    `Hola${name},`,
    "",
    "¡La salida se acerca! Esperamos que hayas pasado una estancia estupenda",
    "en el Coliving Henri Barbusse.",
    "",
    "Salvo acuerdo previo, te pedimos que dejes la casa antes de las 11h.",
    "",
    "La limpieza está incluida, solo te pedimos que:",
    "- Pongas los platos sucios en el lavavajillas",
    "- Vacíes y guardes los platos limpios",
    "- Uses los cubos de basura de la cocina",
    "- Retires tus alimentos del frigorífico",
    "- Dejes ordenados los espacios comunes (salón, cocina, jardín, gimnasio)",
    "",
    "Si quieres ayudarnos un poco más, puedes retirar las sábanas y toallas y",
    "agruparlas en los pasillos o al pie de las escaleras.",
    "",
    "¡Gracias y buen viaje!",
    "Alexandre",
  ],
};

export function buildDepartureMessage(
  locale: GuideLocale,
  { firstName }: { firstName?: string },
): string {
  const trimmed = firstName?.trim();
  const name = trimmed ? ` ${trimmed}` : "";
  return DEPARTURE_TEMPLATES[locale]({ name }).join("\n");
}

/**
 * Empreintes qui permettent de reconnaître, dans le fil Beds24, qu'un message d'arrivée ou
 * de départ est déjà parti.
 *
 * **Pourquoi deviner plutôt que tenir un registre local.** L'horodatage doit rester chez
 * Beds24 : c'est la seule source qui survit à un redéploiement, et surtout la seule qui voie
 * aussi les envois faits depuis Beds24 lui-même. Or les auto-actions « Before arrival - Send
 * Nuki PIN » et « Before checkout » restent actives (cohabitation assumée) : un registre
 * maison les ignorerait et le bouton resterait vert alors que le voyageur a déjà reçu le
 * message. D'où la reconnaissance par le texte.
 *
 * Chaque famille porte donc **deux jeux d'empreintes** : celles de nos propres gabarits, et
 * celles des gabarits Beds24 relevés dans le fil réel (les auto-actions envoient sans
 * accents, d'où la normalisation).
 *
 * ⚠️ **Ne jamais reprendre l'URL du guide comme empreinte.** C'était le premier choix — elle
 * figure dans nos 5 gabarits, donc une seule ligne couvrait tout. Mesuré contre le fil réel :
 * la réservation 92941610 porte un message écrit à la main (« You can check on our arrival
 * guide… » + le lien) qui passait pour un envoi d'arrivée. Or l'arrivée, c'est le PIN, pas le
 * lien : le bouton se serait grisé sans que le code soit parti. Les empreintes retenues sont
 * donc l'en-tête de bienvenue (gabarits Beds24) et le libellé du code (les nôtres) — deux
 * formules qu'on n'écrit pas à la main.
 *
 * ⚠️ Beds24 n'a de gabarit d'arrivée qu'en **FR et EN** à ce jour. En ajouter un dans une
 * autre langue oblige à poser son en-tête ici, sinon le bouton restera cliquable après
 * l'envoi automatique et le voyageur recevra deux fois le code.
 */
const SIGNATURES: Record<GuestMessageKind, readonly string[]> = {
  arrivee: [
    // Auto-actions Beds24 « Before arrival - Send Nuki PIN », relevées dans le fil.
    "bienvenue au coliving",
    "welcome to coliving",
    // Nos 5 gabarits : le libellé du code, présent seulement quand le PIN l'est.
    "votre code d'acces a la porte",
    "your door access code",
    "il tuo codice di accesso alla porta",
    "ihr turzugangscode",
    "tu codigo de acceso a la puerta",
  ],
  depart: [
    "le depart approche", // notre gabarit FR *et* l'auto-action Beds24 « Before checkout »
    "departure is approaching",
    "la partenza si avvicina",
    "die abreise naht",
    "la salida se acerca",
  ],
};

/**
 * Minuscules sans diacritiques : les auto-actions Beds24 envoient « Le depart approche »
 * là où notre gabarit écrit « Le départ approche ». Sans ce passage, la cohabitation
 * échouerait précisément sur le cas qu'elle doit couvrir.
 */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** La famille à laquelle appartient un message du fil, ou `null` s'il n'en est pas. */
export function detectGuestMessageKind(message: string): GuestMessageKind | null {
  const text = normalize(message);
  for (const kind of GUEST_MESSAGE_KINDS) {
    if (SIGNATURES[kind].some((s) => text.includes(s))) return kind;
  }
  return null;
}
