import type { MessageTemplate } from "@sejour/socle/lib/guest-messaging/types";

/**
 * Messages automatiques de Coliving Barbusse — **la source**, versionnée.
 *
 * Ils remplacent les auto-actions Beds24, reconstituées le 2026-11-08 à partir des fils (aucun
 * texte n'était sauvegardé) : « Before arrival - Send Nuki PIN » (568440, J-5 16h), « bien
 * installé » (J+1 9h, partait en français à tout le monde), « Before checkout » (veille du départ
 * 17h), avis (lendemain du départ 10h). La **confirmation de réservation reste dans Beds24**
 * (décision de l'hôte du 2026-11-08).
 *
 * Pour faire évoluer un message : modifier le français, reporter dans les quatre autres langues,
 * **incrémenter `version`**. `tests/messages.test.ts` refuse une langue manquante, une variable
 * oubliée, un reste de syntaxe Beds24, un numéro ou un code écrit en dur (le dépôt est public).
 *
 * Ton : celui du guide d'arrivée et des anciens boutons — vouvoiement en français et en allemand,
 * tutoiement en italien et en espagnol. Signature « Alexandre ».
 *
 * Variables (fournies par `lib/messages/engine.ts`) :
 * - `prenom` (facultative) ;
 * - `code` — PIN de la serrure (`infoItems` `NUKI_PIN`), envoyé seulement s'il est **sur la serrure** ;
 * - `guide` — URL du guide d'arrivée dans la langue ;
 * - `wifiReseau`, `wifiMotDePasse` — `PROPERTY_INFO.wifi` ;
 * - `telephone` — `PROPERTY_INFO.contact` ;
 * - `avisGoogle`, `site` — fiche Google et site ;
 * - `direct` (facultative) — présente pour une réservation directe seulement : on ne propose
 *   jamais de réserver en direct par la messagerie d'une plateforme.
 */

const arrivee: MessageTemplate = {
  id: "arrivee-code",
  label: "Arrivée + code de la porte",
  version: 1,
  trigger: { anchor: "arrival", offsetDays: -5, at: "16:00" },
  // Réservation tardive : le message part dès que le code est sur la serrure, jusqu'au soir de l'arrivée.
  late: { mode: "send", until: { anchor: "arrival", offsetDays: 0, at: "23:00" } },
  conditions: { requiredInfoItem: "NUKI_PIN" },
  onAnchorChange: "resend",
  variables: ["code", "guide", "wifiReseau", "wifiMotDePasse"],
  optionalVariables: ["prenom"],
  previewVisible: ["prenom", "guide"],
  subject: {
    fr: "Votre code d'accès au Coliving Henri Barbusse",
    en: "Your access code for Coliving Henri Barbusse",
    de: "Ihr Zugangscode für das Coliving Henri Barbusse",
    es: "Tu código de acceso al Coliving Henri Barbusse",
    it: "Il tuo codice di accesso al Coliving Henri Barbusse",
  },
  body: {
    fr: `Bonjour{{#prenom}} {{prenom}}{{/prenom}},

Bienvenue au Coliving Henri Barbusse !

-------------------------------------
Votre code personnel pour la porte d'entrée, valable pendant tout votre séjour :
{{code}}
-------------------------------------

L'arrivée est autonome, à partir de 17h. Toutes les instructions (accès, stationnement, maison) sont dans le guide d'arrivée :
{{guide}}

Wi-Fi
Réseau : {{wifiReseau}}
Mot de passe : {{wifiMotDePasse}}

Très bon séjour,
Alexandre`,
    en: `Hello{{#prenom}} {{prenom}}{{/prenom}},

Welcome to Coliving Henri Barbusse!

-------------------------------------
Your personal code for the front door, valid for your whole stay:
{{code}}
-------------------------------------

Check-in is self-service, from 5 pm. All the instructions (access, parking, the house) are in the arrival guide:
{{guide}}

Wi-Fi
Network: {{wifiReseau}}
Password: {{wifiMotDePasse}}

Have a great stay,
Alexandre`,
    de: `Hallo{{#prenom}} {{prenom}}{{/prenom}},

willkommen im Coliving Henri Barbusse!

-------------------------------------
Ihr persönlicher Code für die Haustür, gültig für Ihren gesamten Aufenthalt:
{{code}}
-------------------------------------

Die Anreise erfolgt selbstständig, ab 17 Uhr. Alle Hinweise (Zugang, Parken, das Haus) finden Sie im Ankunftsguide:
{{guide}}

WLAN
Netzwerk: {{wifiReseau}}
Passwort: {{wifiMotDePasse}}

Einen schönen Aufenthalt,
Alexandre`,
    es: `Hola{{#prenom}} {{prenom}}{{/prenom}},

¡Bienvenido al Coliving Henri Barbusse!

-------------------------------------
Tu código personal para la puerta de entrada, válido durante toda tu estancia:
{{code}}
-------------------------------------

La llegada es autónoma, a partir de las 17:00. Todas las instrucciones (acceso, aparcamiento, la casa) están en la guía de llegada:
{{guide}}

Wifi
Red: {{wifiReseau}}
Contraseña: {{wifiMotDePasse}}

¡Buena estancia!
Alexandre`,
    it: `Ciao{{#prenom}} {{prenom}}{{/prenom}},

benvenuto al Coliving Henri Barbusse!

-------------------------------------
Il tuo codice personale per la porta d'ingresso, valido per tutto il soggiorno:
{{code}}
-------------------------------------

L'arrivo è autonomo, dalle 17:00. Tutte le istruzioni (accesso, parcheggio, la casa) sono nella guida all'arrivo:
{{guide}}

Wi-Fi
Rete: {{wifiReseau}}
Password: {{wifiMotDePasse}}

Buon soggiorno!
Alexandre`,
  },
  fingerprints: [
    // L'auto-action Beds24 568440 et ce modèle commencent pareil.
    "bienvenue au coliving henri barbusse",
    "welcome to coliving henri barbusse",
    "willkommen im coliving henri barbusse",
    "bienvenido al coliving henri barbusse",
    "benvenuto al coliving henri barbusse",
    // Les anciens boutons du dashboard (lib/guest-messages.ts).
    "votre code d'acces a la porte",
    "your door access code",
  ],
};

const installe: MessageTemplate = {
  id: "bien-installe",
  label: "Lendemain de l'arrivée",
  version: 1,
  trigger: { anchor: "arrival", offsetDays: 1, at: "09:00" },
  late: { mode: "skip", graceHours: 6 },
  // Sur une nuit, le lendemain de l'arrivée est le jour du départ.
  conditions: { minNights: 2 },
  onAnchorChange: "ignore",
  variables: [],
  optionalVariables: ["prenom"],
  previewVisible: ["prenom"],
  subject: {
    fr: "Bien installés ?",
    en: "All settled in?",
    de: "Gut angekommen?",
    es: "¿Todo bien instalados?",
    it: "Tutto bene con la sistemazione?",
  },
  body: {
    fr: `Bonjour{{#prenom}} {{prenom}}{{/prenom}},

J'espère que vous êtes bien installés et que vous avez trouvé vos marques. S'il vous manque quoi que ce soit, répondez simplement à ce message.

Alexandre`,
    en: `Hello{{#prenom}} {{prenom}}{{/prenom}},

I hope you are all settled in and finding your way around the house. If you need anything at all, just reply to this message.

Alexandre`,
    de: `Hallo{{#prenom}} {{prenom}}{{/prenom}},

ich hoffe, Sie haben sich gut eingelebt und finden sich im Haus zurecht. Wenn Ihnen etwas fehlt, antworten Sie einfach auf diese Nachricht.

Alexandre`,
    es: `Hola{{#prenom}} {{prenom}}{{/prenom}},

Espero que estéis bien instalados y que ya os sintáis como en casa. Si os falta cualquier cosa, responde simplemente a este mensaje.

Alexandre`,
    it: `Ciao{{#prenom}} {{prenom}}{{/prenom}},

spero che vi siate sistemati bene e che vi troviate a vostro agio. Se vi manca qualcosa, rispondi semplicemente a questo messaggio.

Alexandre`,
  },
  fingerprints: ["que vous etes bien installe", "you are all settled in"],
};

const depart: MessageTemplate = {
  id: "depart",
  label: "Veille du départ",
  version: 1,
  trigger: { anchor: "departure", offsetDays: -1, at: "17:00" },
  late: { mode: "skip", graceHours: 6 },
  onAnchorChange: "ignore",
  variables: ["telephone"],
  optionalVariables: ["prenom"],
  previewVisible: ["prenom", "telephone"],
  subject: {
    fr: "Votre départ demain",
    en: "Your departure tomorrow",
    de: "Ihre Abreise morgen",
    es: "Tu salida mañana",
    it: "La tua partenza domani",
  },
  body: {
    fr: `Bonjour{{#prenom}} {{prenom}}{{/prenom}},

Le départ approche ! Nous espérons que vous avez passé un très bon séjour au Coliving Henri Barbusse.

Sauf accord préalable, merci de libérer la maison avant 11h.

AVANT VOTRE DÉPART
Le ménage est inclus, nous vous remercions simplement de :
- mettre la vaisselle sale dans le lave-vaisselle
- vider et ranger la vaisselle propre du lave-vaisselle
- utiliser les poubelles de la cuisine
- retirer vos denrées du réfrigérateur
- remettre les espaces communs (salon, cuisine, jardin, salle de sport) dans l'état où vous les avez trouvés

REMISE DES CLÉS
- remettre les clés dans la boîte à clés (si vous les avez utilisées)
- verrouiller la serrure connectée en partant
- nous envoyer un message pour confirmer votre départ

Au plaisir de vous accueillir à nouveau,
Alexandre
{{telephone}}`,
    en: `Hello{{#prenom}} {{prenom}}{{/prenom}},

Your departure is approaching! We hope you had a great stay at Coliving Henri Barbusse.

Unless agreed otherwise, please leave the house before 11 am.

BEFORE YOU LEAVE
Cleaning is included; we simply ask you to:
- put dirty dishes in the dishwasher
- empty and put away the clean dishes from the dishwasher
- use the kitchen bins
- take your food out of the fridge
- leave the common areas (living room, kitchen, garden, gym) as you found them

KEYS
- put the keys back in the key box (if you used them)
- lock the connected door lock when you leave
- send us a message to confirm your departure

We hope to welcome you again soon,
Alexandre
{{telephone}}`,
    de: `Hallo{{#prenom}} {{prenom}}{{/prenom}},

die Abreise naht! Wir hoffen, Sie hatten einen sehr schönen Aufenthalt im Coliving Henri Barbusse.

Sofern nicht anders vereinbart, bitten wir Sie, das Haus bis 11 Uhr zu verlassen.

VOR IHRER ABREISE
Die Reinigung ist inbegriffen, wir bitten Sie lediglich:
- schmutziges Geschirr in die Spülmaschine zu stellen
- sauberes Geschirr aus der Spülmaschine auszuräumen und wegzuräumen
- die Mülleimer in der Küche zu benutzen
- Ihre Lebensmittel aus dem Kühlschrank zu nehmen
- die Gemeinschaftsräume (Wohnzimmer, Küche, Garten, Fitnessraum) so zu hinterlassen, wie Sie sie vorgefunden haben

SCHLÜSSEL
- die Schlüssel in den Schlüsselkasten zurücklegen (falls Sie sie benutzt haben)
- das elektronische Türschloss beim Gehen verriegeln
- uns eine Nachricht zur Bestätigung Ihrer Abreise senden

Wir freuen uns, Sie wieder begrüßen zu dürfen,
Alexandre
{{telephone}}`,
    es: `Hola{{#prenom}} {{prenom}}{{/prenom}},

¡La salida se acerca! Esperamos que hayas pasado una estancia estupenda en el Coliving Henri Barbusse.

Salvo acuerdo previo, te pedimos que dejes la casa antes de las 11:00.

ANTES DE IRTE
La limpieza está incluida; solo te pedimos que:
- pongas los platos sucios en el lavavajillas
- vacíes y guardes los platos limpios del lavavajillas
- uses los cubos de basura de la cocina
- retires tus alimentos del frigorífico
- dejes los espacios comunes (salón, cocina, jardín, gimnasio) como los encontraste

LLAVES
- devuelve las llaves a la caja de llaves (si las has usado)
- cierra la cerradura conectada al salir
- envíanos un mensaje para confirmar tu salida

¡Esperamos volver a recibirte pronto!
Alexandre
{{telephone}}`,
    it: `Ciao{{#prenom}} {{prenom}}{{/prenom}},

la partenza si avvicina! Speriamo che tu abbia trascorso un ottimo soggiorno al Coliving Henri Barbusse.

Salvo accordi diversi, ti chiediamo di lasciare la casa entro le 11:00.

PRIMA DI PARTIRE
Le pulizie sono incluse; ti chiediamo solo di:
- mettere i piatti sporchi in lavastoviglie
- svuotare e riporre i piatti puliti della lavastoviglie
- usare i bidoni della cucina
- togliere i tuoi alimenti dal frigorifero
- lasciare gli spazi comuni (salotto, cucina, giardino, palestra) come li hai trovati

CHIAVI
- rimetti le chiavi nella cassetta (se le hai usate)
- chiudi la serratura connessa quando esci
- mandaci un messaggio per confermare la partenza

Speriamo di riaccoglierti presto!
Alexandre
{{telephone}}`,
  },
  fingerprints: ["le depart approche", "departure is approaching", "die abreise naht", "la salida se acerca", "la partenza si avvicina"],
};

const avis: MessageTemplate = {
  id: "avis",
  label: "Lendemain du départ (avis)",
  version: 1,
  trigger: { anchor: "departure", offsetDays: 1, at: "10:00" },
  late: { mode: "skip", graceHours: 8 },
  onAnchorChange: "ignore",
  variables: ["telephone", "avisGoogle"],
  optionalVariables: ["prenom", "direct"],
  previewVisible: ["prenom", "telephone", "avisGoogle", "direct"],
  subject: {
    fr: "Merci pour votre séjour au Coliving Henri Barbusse",
    en: "Thank you for staying at Coliving Henri Barbusse",
    de: "Danke für Ihren Aufenthalt im Coliving Henri Barbusse",
    es: "Gracias por tu estancia en el Coliving Henri Barbusse",
    it: "Grazie per il tuo soggiorno al Coliving Henri Barbusse",
  },
  body: {
    fr: `Bonjour{{#prenom}} {{prenom}}{{/prenom}},

Nous espérons que vous avez passé un excellent séjour au Coliving Henri Barbusse et que vous êtes bien rentrés.

Ce fut un plaisir de vous accueillir, vous et votre groupe, au Mans.

PARTAGEZ VOTRE EXPÉRIENCE
Si votre séjour vous a plu, un avis sur la plateforme où vous avez réservé ne prend qu'une minute et compte beaucoup pour nous. Vous pouvez aussi en laisser un sur Google :
{{avisGoogle}}
{{#direct}}
VOTRE PROCHAIN SÉJOUR
Vous revenez au Mans ? Réservez directement sur notre site, au meilleur tarif :
{{direct}}
{{/direct}}
Au plaisir de vous accueillir à nouveau,
Alexandre
{{telephone}}`,
    en: `Hello{{#prenom}} {{prenom}}{{/prenom}},

We hope you had a wonderful stay at Coliving Henri Barbusse and that you got home safely.

It was a pleasure welcoming you and your group to Le Mans.

SHARE YOUR EXPERIENCE
If you enjoyed your stay, a review on the platform where you booked only takes a minute and means a lot to us. You can also leave one on Google:
{{avisGoogle}}
{{#direct}}
YOUR NEXT STAY
Coming back to Le Mans? Book directly on our website for the best rate:
{{direct}}
{{/direct}}
We hope to welcome you again soon,
Alexandre
{{telephone}}`,
    de: `Hallo{{#prenom}} {{prenom}}{{/prenom}},

wir hoffen, Sie hatten einen wunderbaren Aufenthalt im Coliving Henri Barbusse und sind gut nach Hause gekommen.

Es war uns eine Freude, Sie und Ihre Gruppe in Le Mans zu empfangen.

TEILEN SIE IHRE ERFAHRUNG
Wenn Ihnen Ihr Aufenthalt gefallen hat: Eine Bewertung auf der Plattform, auf der Sie gebucht haben, dauert nur eine Minute und bedeutet uns viel. Sie können auch eine auf Google hinterlassen:
{{avisGoogle}}
{{#direct}}
IHR NÄCHSTER AUFENTHALT
Sie kommen wieder nach Le Mans? Buchen Sie direkt auf unserer Website zum besten Preis:
{{direct}}
{{/direct}}
Wir freuen uns, Sie wieder begrüßen zu dürfen,
Alexandre
{{telephone}}`,
    es: `Hola{{#prenom}} {{prenom}}{{/prenom}},

Esperamos que hayas pasado una estancia estupenda en el Coliving Henri Barbusse y que hayáis vuelto bien a casa.

Fue un placer recibirte a ti y a tu grupo en Le Mans.

COMPARTE TU EXPERIENCIA
Si te ha gustado la estancia, una opinión en la plataforma donde reservaste solo lleva un minuto y significa mucho para nosotros. También puedes dejar una en Google:
{{avisGoogle}}
{{#direct}}
TU PRÓXIMA ESTANCIA
¿Vuelves a Le Mans? Reserva directamente en nuestra web, al mejor precio:
{{direct}}
{{/direct}}
¡Esperamos volver a recibirte pronto!
Alexandre
{{telephone}}`,
    it: `Ciao{{#prenom}} {{prenom}}{{/prenom}},

speriamo che tu abbia trascorso un soggiorno splendido al Coliving Henri Barbusse e che siate rientrati bene a casa.

È stato un piacere accogliere te e il tuo gruppo a Le Mans.

CONDIVIDI LA TUA ESPERIENZA
Se il soggiorno ti è piaciuto, una recensione sulla piattaforma dove hai prenotato richiede solo un minuto e per noi conta molto. Puoi lasciarne una anche su Google:
{{avisGoogle}}
{{#direct}}
IL TUO PROSSIMO SOGGIORNO
Torni a Le Mans? Prenota direttamente sul nostro sito, alla migliore tariffa:
{{direct}}
{{/direct}}
Speriamo di riaccoglierti presto!
Alexandre
{{telephone}}`,
  },
  fingerprints: [
    // L'auto-action Beds24 : « …excellent sejour au Coliving Henri Barbusse et que vous etes rentres… ».
    "excellent sejour au coliving henri barbusse",
    "and that you arrived home safely",
    "and that you got home safely",
  ],
};

export const TEMPLATES: readonly MessageTemplate[] = [arrivee, installe, depart, avis];
