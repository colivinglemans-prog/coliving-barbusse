import type { GuideLocale } from "@/lib/site";

export interface GuestMessageParams {
  firstName?: string;
  url: string;
  /** PIN Nuki ; absent tant que Beds24 ne l'a pas généré (~J-6). */
  code?: string;
  /** Articles « Pendant votre séjour » (`aroundUrl`), pour tout le groupe. */
  aroundUrl?: string;
}


/**
 * Message prêt à envoyer au voyageur, dans sa langue.
 * Le tutoiement / vouvoiement suit celui du guide d'arrivée : vous en FR et DE,
 * tutoiement en IT et ES.
 */
const TEMPLATES: Record<
  GuideLocale,
  (p: { name: string; url: string; code?: string; around: string[] }) => string[]
> = {
  fr: ({ name, url, code, around }) => [
    `Bonjour${name},`,
    "",
    "Voici le guide d'arrivée avec toutes les infos pratiques (accès, Wi-Fi, stationnement) :",
    url,
    ...(code ? ["", `Votre code d'accès à la porte : ${code}`] : []),
    ...around,
    "",
    "Bon séjour !",
    "Alexandre",
  ],
  en: ({ name, url, code, around }) => [
    `Hello${name},`,
    "",
    "Here is the welcome guide with all the practical information (access, Wi-Fi, parking):",
    url,
    ...(code ? ["", `Your door access code: ${code}`] : []),
    ...around,
    "",
    "Enjoy your stay!",
    "Alexandre",
  ],
  it: ({ name, url, code, around }) => [
    `Ciao${name},`,
    "",
    "Ecco la guida all'arrivo con tutte le informazioni pratiche (accesso, Wi-Fi, parcheggio):",
    url,
    ...(code ? ["", `Il tuo codice di accesso alla porta: ${code}`] : []),
    ...around,
    "",
    "Buon soggiorno!",
    "Alexandre",
  ],
  de: ({ name, url, code, around }) => [
    `Hallo${name},`,
    "",
    "hier ist der Ankunftsguide mit allen praktischen Informationen (Zugang, WLAN, Parken):",
    url,
    ...(code ? ["", `Ihr Türzugangscode: ${code}`] : []),
    ...around,
    "",
    "Einen schönen Aufenthalt!",
    "Alexandre",
  ],
  es: ({ name, url, code, around }) => [
    `Hola${name},`,
    "",
    "Aquí tienes la guía de llegada con toda la información práctica (acceso, wifi, aparcamiento):",
    url,
    ...(code ? ["", `Tu código de acceso a la puerta: ${code}`] : []),
    ...around,
    "",
    "¡Buena estancia!",
    "Alexandre",
  ],
};

/** Ligne « autour de la maison » du message d'arrivée. */
const AROUND: Record<GuideLocale, string> = {
  "fr": "Pour tout le groupe, nos adresses autour de la maison (restos, courses, balades) :",
  "en": "For the whole group, our tips around the house (restaurants, shops, walks):",
  "it": "Per tutto il gruppo, i nostri indirizzi intorno alla casa (ristoranti, spesa, passeggiate):",
  "de": "Für die ganze Gruppe finden Sie hier unsere Tipps rund um das Haus (Restaurants, Einkäufe, Spaziergänge):",
  "es": "Para todo el grupo, nuestras direcciones alrededor de la casa (restaurantes, compras, paseos):"
};

export function buildGuestMessage(
  locale: GuideLocale,
  { firstName, url, code, aroundUrl }: GuestMessageParams,
): string {
  const trimmed = firstName?.trim();
  const name = trimmed ? ` ${trimmed}` : "";
  const around = [
    ...(aroundUrl ? ["", AROUND[locale], aroundUrl] : []),
  ];
  return TEMPLATES[locale]({ name, url, code, around }).join("\n");
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
    "Votre séjour se termine demain : merci de libérer la maison avant 11h (sauf accord avec nous).",
    "",
    "Le ménage est inclus. Il vous reste seulement quelques gestes avant de partir :",
    "",
    "1. LA VAISSELLE ET LES PROVISIONS",
    "- videz le lave-vaisselle et rangez la vaisselle propre",
    "- mettez la vaisselle du petit-déjeuner dans le lave-vaisselle et lancez-le avant de partir",
    "- retirez vos aliments du réfrigérateur",
    "- vos produits non périssables, bien refermés, peuvent rester dans le tiroir sous la machine à café : les prochains voyageurs seront contents de les trouver",
    "",
    "2. LES POUBELLES",
    "Sortez les sacs dans les poubelles devant la porte du garage :",
    "- poubelle jaune : emballages recyclables",
    "- poubelle à verre : bouteilles et bocaux",
    "- poubelle tout-venant : le reste",
    "",
    "3. LES ESPACES COMMUNS",
    "Remettez le salon, la cuisine, le jardin et la salle de sport comme vous les avez trouvés.",
    "",
    "4. EN PARTANT",
    "- laissez les clés sur les portes des chambres",
    "- verrouillez la porte d'entrée avec la serrure connectée",
    "- envoyez-nous un petit message pour nous dire que vous êtes partis",
    "",
    "Facultatif, mais très apprécié : retirez les draps et les serviettes utilisés et déposez-les dans le couloir. Cela nous aide beaucoup à préparer la maison pour les voyageurs suivants.",
    "",
    "Une remarque, une suggestion ? Dites-le-nous directement : https://wa.me/33620921005",
    "",
    "Merci, et bonne route !",
    "Alexandre",
  ],
  en: ({ name }) => [
    `Hello${name},`,
    "",
    "Your stay ends tomorrow: please leave the house by 11 am (unless agreed otherwise with us).",
    "",
    "Cleaning is included. There are just a few things left to do before you go:",
    "",
    "1. DISHES AND FOOD",
    "- empty the dishwasher and put the clean dishes away",
    "- put the breakfast dishes in the dishwasher and start it before you leave",
    "- take your food out of the fridge",
    "- non-perishable food, properly closed, can stay in the drawer under the coffee machine: the next guests will be glad to find it",
    "",
    "2. BINS",
    "Take the bags out to the bins in front of the garage door:",
    "- yellow bin: recyclable packaging",
    "- glass bin: bottles and jars",
    "- general waste bin: everything else",
    "",
    "3. COMMON AREAS",
    "Leave the living room, kitchen, garden and gym as you found them.",
    "",
    "4. WHEN YOU LEAVE",
    "- leave the keys in the bedroom doors",
    "- lock the front door with the connected lock",
    "- send us a quick message to let us know you have left",
    "",
    "Optional, but much appreciated: strip the used sheets and towels and leave them in the hallway. It really helps us get the house ready for the next guests.",
    "",
    "Any comment or suggestion? Tell us directly: https://wa.me/33620921005",
    "",
    "Thank you, and safe travels!",
    "Alexandre",
  ],
  it: ({ name }) => [
    `Ciao${name},`,
    "",
    "il tuo soggiorno termina domani: ti chiediamo di lasciare la casa entro le 11:00 (salvo accordi diversi con noi).",
    "",
    "Le pulizie sono incluse. Restano solo pochi gesti prima di partire:",
    "",
    "1. STOVIGLIE E PROVVISTE",
    "- svuota la lavastoviglie e riponi le stoviglie pulite",
    "- metti le stoviglie della colazione in lavastoviglie e avviala prima di partire",
    "- togli i tuoi alimenti dal frigorifero",
    "- i prodotti non deperibili, ben chiusi, possono restare nel cassetto sotto la macchina del caffè: i prossimi ospiti saranno contenti di trovarli",
    "",
    "2. RIFIUTI",
    "Porta i sacchetti nei bidoni davanti alla porta del garage:",
    "- bidone giallo: imballaggi riciclabili",
    "- bidone del vetro: bottiglie e barattoli",
    "- bidone dell'indifferenziato: tutto il resto",
    "",
    "3. SPAZI COMUNI",
    "Lascia il salotto, la cucina, il giardino e la palestra come li hai trovati.",
    "",
    "4. QUANDO PARTI",
    "- lascia le chiavi sulle porte delle camere",
    "- chiudi la porta d'ingresso con la serratura connessa",
    "- mandaci un breve messaggio per avvisarci della partenza",
    "",
    "Facoltativo, ma molto apprezzato: togli lenzuola e asciugamani usati e lasciali nel corridoio. Ci aiuta molto a preparare la casa per i prossimi ospiti.",
    "",
    "Un commento, un suggerimento? Diccelo direttamente: https://wa.me/33620921005",
    "",
    "Grazie e buon viaggio!",
    "Alexandre",
  ],
  de: ({ name }) => [
    `Hallo${name},`,
    "",
    "Ihr Aufenthalt endet morgen: Bitte verlassen Sie das Haus bis 11 Uhr (sofern nicht anders mit uns vereinbart).",
    "",
    "Die Endreinigung ist inbegriffen. Vor der Abreise bleiben nur noch ein paar Handgriffe:",
    "",
    "1. GESCHIRR UND VORRÄTE",
    "- räumen Sie die Spülmaschine aus und stellen Sie das saubere Geschirr weg",
    "- stellen Sie das Frühstücksgeschirr in die Spülmaschine und schalten Sie sie vor der Abreise ein",
    "- nehmen Sie Ihre Lebensmittel aus dem Kühlschrank",
    "- haltbare Lebensmittel dürfen gut verschlossen in der Schublade unter der Kaffeemaschine bleiben: Die nächsten Gäste freuen sich darüber",
    "",
    "2. MÜLL",
    "Bringen Sie die Müllbeutel zu den Tonnen vor dem Garagentor:",
    "- gelbe Tonne: recycelbare Verpackungen",
    "- Glastonne: Flaschen und Gläser",
    "- Restmülltonne: alles andere",
    "",
    "3. GEMEINSCHAFTSRÄUME",
    "Hinterlassen Sie Wohnzimmer, Küche, Garten und Fitnessraum so, wie Sie sie vorgefunden haben.",
    "",
    "4. BEIM GEHEN",
    "- lassen Sie die Schlüssel in den Zimmertüren stecken",
    "- verriegeln Sie die Haustür mit dem elektronischen Schloss",
    "- schicken Sie uns eine kurze Nachricht, dass Sie abgereist sind",
    "",
    "Freiwillig, aber sehr willkommen: Ziehen Sie die benutzte Bettwäsche ab und legen Sie sie mit den Handtüchern in den Flur. Das hilft uns sehr, das Haus für die nächsten Gäste vorzubereiten.",
    "",
    "Eine Anmerkung, ein Vorschlag? Sagen Sie es uns direkt: https://wa.me/33620921005",
    "",
    "Vielen Dank und gute Heimreise!",
    "Alexandre",
  ],
  es: ({ name }) => [
    `Hola${name},`,
    "",
    "Tu estancia termina mañana: te pedimos que dejes la casa antes de las 11:00 (salvo acuerdo con nosotros).",
    "",
    "La limpieza está incluida. Solo quedan unos pocos gestos antes de irte:",
    "",
    "1. VAJILLA Y COMIDA",
    "- vacía el lavavajillas y guarda la vajilla limpia",
    "- pon la vajilla del desayuno en el lavavajillas y ponlo en marcha antes de irte",
    "- saca tus alimentos del frigorífico",
    "- los productos no perecederos, bien cerrados, pueden quedarse en el cajón debajo de la cafetera: a los próximos viajeros les encantará encontrarlos",
    "",
    "2. BASURA",
    "Saca las bolsas a los cubos que hay delante de la puerta del garaje:",
    "- cubo amarillo: envases reciclables",
    "- cubo del vidrio: botellas y tarros",
    "- cubo de resto: todo lo demás",
    "",
    "3. ZONAS COMUNES",
    "Deja el salón, la cocina, el jardín y el gimnasio como los encontraste.",
    "",
    "4. AL SALIR",
    "- deja las llaves puestas en las puertas de las habitaciones",
    "- cierra la puerta de entrada con la cerradura conectada",
    "- envíanos un mensaje rápido para avisarnos de tu salida",
    "",
    "Opcional, pero muy de agradecer: quita las sábanas y toallas usadas y déjalas en el pasillo. Nos ayuda mucho a preparar la casa para los próximos viajeros.",
    "",
    "¿Algún comentario o sugerencia? Dínoslo directamente: https://wa.me/33620921005",
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
    // Les modèles du moteur (lib/messages/templates.ts, 2026-11-08) dans les trois autres langues :
    // sans eux, le bouton resterait cliquable après un envoi automatique en DE, ES ou IT.
    "willkommen im coliving",
    "bienvenido al coliving",
    "benvenuto al coliving",
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
    // Ouverture du 2026-11-11 (consignes de départ réécrites avec l'hôte) : les anciennes
    // restent, pour les messages déjà partis et l'auto-action Beds24 « Before checkout ».
    "votre sejour se termine demain",
    "your stay ends tomorrow",
    "il tuo soggiorno termina domani",
    "ihr aufenthalt endet morgen",
    "tu estancia termina manana",
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
