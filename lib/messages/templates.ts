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
 * - `wifiReseau`, `wifiMotDePasse` — `getWifi()` (`lib/wifi.ts`, variables d'environnement : le
 *   dépôt est public) ;
 * - `telephone`, `whatsapp` — `PROPERTY_INFO.contact` ;
 * - `autour` — articles « Pendant votre séjour » du blog (`aroundUrl`), pour tout le groupe ;
 * - `avisGoogle`, `site` — fiche Google et site ;
 * - `direct` (facultative) — présente pour une réservation directe seulement : on ne propose
 *   jamais de réserver en direct par la messagerie d'une plateforme.
 *
 * Dernière minute (décision de l'hôte du 2026-11-08) : départ à partir de 2 nuits, lendemain de
 * l'arrivée à partir de 3 ; tous deux, et l'avis, sont des messages de confort (`quietHours`) qui
 * sautent si un autre message — ou la confirmation Beds24, à la création — vient de partir.
 * L'arrivée, qui porte le code, part toujours.
 *
 * Avis (règles du Lot 4 « parcours voyageur », `docs/auto-actions-beds24.md`) : jamais « si vous
 * avez aimé », jamais « 5 étoiles », aucune contrepartie.
 */

/**
 * Confirmation de réservation — **en mode test seulement** (2026-11-08) : la vraie confirmation
 * reste dans Beds24 (tableau de facture, lien de paiement des directes). Celle-ci reprend les
 * faits de l'auto-action Beds24 relevée dans les fils, corrigée : départ **avant 11h** (Beds24
 * disait 10h, contre le site et `llms.txt`). Ni code ni guide d'arrivée ici (règle du Lot 4 : le
 * guide affiche le Wi-Fi, le code part avec l'arrivée).
 */
const confirmation: MessageTemplate = {
  id: "confirmation",
  label: "Confirmation de réservation",
  version: 1,
  trigger: { anchor: "booked", delayMinutes: 0 },
  late: { mode: "skip", graceHours: 24 },
  onAnchorChange: "ignore",
  variables: ["arrivee", "depart", "nuits", "adultes", "adresse", "autour", "evenements", "whatsapp"],
  optionalVariables: ["prenom", "enfants"],
  previewVisible: ["prenom", "arrivee", "depart", "nuits", "adultes", "enfants", "adresse", "autour", "evenements", "whatsapp"],
  subject: {
    fr: "Votre réservation au Coliving Henri Barbusse est confirmée",
    en: "Your booking at Coliving Henri Barbusse is confirmed",
    de: "Ihre Buchung im Coliving Henri Barbusse ist bestätigt",
    es: "Tu reserva en el Coliving Henri Barbusse está confirmada",
    it: "La tua prenotazione al Coliving Henri Barbusse è confermata",
  },
  body: {
    fr: `Bonjour{{#prenom}} {{prenom}}{{/prenom}},

Merci pour votre réservation au Coliving Henri Barbusse, au Mans ! Votre séjour est confirmé :

Arrivée : {{arrivee}}, à partir de 17h
Départ : {{depart}}, avant 11h
Nuits : {{nuits}}
Adultes : {{adultes}}{{#enfants}}
Enfants : {{enfants}}{{/enfants}}

CE QUI EST INCLUS
- le ménage de fin de séjour
- les draps et les serviettes
- la cuisine équipée, à votre disposition (pas de petit-déjeuner)

VOTRE ARRIVÉE
L'arrivée est autonome, grâce à la serrure connectée. Vous recevrez votre code personnel et le guide d'arrivée avant votre séjour.
Une chose à nous dire : votre heure d'arrivée approximative, en répondant simplement à ce message.

PRÉPARER VOTRE SÉJOUR
Nos adresses pour tout le groupe (restos, courses, visites) :
{{autour}}
Vous venez pour un événement du circuit ? Dates, accès, conseils :
{{evenements}}

Adresse : {{adresse}}
Une question ? Répondez à ce message, ou écrivez-nous sur WhatsApp : {{whatsapp}}

À très bientôt,
Alexandre`,
    en: `Hello{{#prenom}} {{prenom}}{{/prenom}},

Thank you for booking Coliving Henri Barbusse in Le Mans! Your stay is confirmed:

Arrival: {{arrivee}}, from 5 pm
Departure: {{depart}}, before 11 am
Nights: {{nuits}}
Adults: {{adultes}}{{#enfants}}
Children: {{enfants}}{{/enfants}}

INCLUDED IN YOUR STAY
- end-of-stay cleaning
- bed linen and towels
- the fully equipped kitchen (breakfast is not provided)

YOUR ARRIVAL
Check-in is self-service, with a connected lock. You will receive your personal code and the arrival guide before your stay.
One thing to tell us: your approximate arrival time — just reply to this message.

PLANNING YOUR STAY
Our tips for the whole group (restaurants, shops, sights):
{{autour}}
Coming for an event at the circuit? Dates, access, tips:
{{evenements}}

Address: {{adresse}}
Any question? Reply to this message, or message us on WhatsApp: {{whatsapp}}

See you soon,
Alexandre`,
    de: `Hallo{{#prenom}} {{prenom}}{{/prenom}},

vielen Dank für Ihre Buchung im Coliving Henri Barbusse in Le Mans! Ihr Aufenthalt ist bestätigt:

Ankunft: {{arrivee}}, ab 17 Uhr
Abreise: {{depart}}, bis 11 Uhr
Nächte: {{nuits}}
Erwachsene: {{adultes}}{{#enfants}}
Kinder: {{enfants}}{{/enfants}}

IM AUFENTHALT INBEGRIFFEN
- die Endreinigung
- Bettwäsche und Handtücher
- die voll ausgestattete Küche (kein Frühstück)

IHRE ANKUNFT
Die Anreise erfolgt selbstständig, mit einem elektronischen Türschloss. Ihren persönlichen Code und den Ankunftsguide erhalten Sie vor Ihrem Aufenthalt.
Eine Bitte: Teilen Sie uns Ihre ungefähre Ankunftszeit mit, indem Sie einfach auf diese Nachricht antworten.

IHREN AUFENTHALT PLANEN
Unsere Tipps für die ganze Gruppe (Restaurants, Einkäufe, Ausflüge):
{{autour}}
Sie kommen zu einer Veranstaltung an der Rennstrecke? Termine, Anfahrt, Tipps:
{{evenements}}

Adresse: {{adresse}}
Eine Frage? Antworten Sie auf diese Nachricht oder schreiben Sie uns auf WhatsApp: {{whatsapp}}

Bis bald,
Alexandre`,
    es: `Hola{{#prenom}} {{prenom}}{{/prenom}},

¡Gracias por tu reserva en el Coliving Henri Barbusse, en Le Mans! Tu estancia está confirmada:

Llegada: {{arrivee}}, a partir de las 17:00
Salida: {{depart}}, antes de las 11:00
Noches: {{nuits}}
Adultos: {{adultes}}{{#enfants}}
Niños: {{enfants}}{{/enfants}}

INCLUIDO EN TU ESTANCIA
- la limpieza final
- sábanas y toallas
- la cocina equipada, a tu disposición (no incluye desayuno)

TU LLEGADA
La llegada es autónoma, con cerradura conectada. Recibirás tu código personal y la guía de llegada antes de tu estancia.
Solo una cosa: dinos tu hora aproximada de llegada respondiendo a este mensaje.

PREPARA TU ESTANCIA
Nuestras direcciones para todo el grupo (restaurantes, compras, visitas):
{{autour}}
¿Vienes para un evento del circuito? Fechas, acceso, consejos:
{{evenements}}

Dirección: {{adresse}}
¿Alguna pregunta? Responde a este mensaje o escríbenos por WhatsApp: {{whatsapp}}

¡Hasta pronto!
Alexandre`,
    it: `Ciao{{#prenom}} {{prenom}}{{/prenom}},

grazie per la tua prenotazione al Coliving Henri Barbusse, a Le Mans! Il tuo soggiorno è confermato:

Arrivo: {{arrivee}}, dalle 17:00
Partenza: {{depart}}, entro le 11:00
Notti: {{nuits}}
Adulti: {{adultes}}{{#enfants}}
Bambini: {{enfants}}{{/enfants}}

INCLUSO NEL SOGGIORNO
- le pulizie finali
- lenzuola e asciugamani
- la cucina attrezzata, a tua disposizione (colazione non inclusa)

IL TUO ARRIVO
L'arrivo è autonomo, con serratura connessa. Riceverai il tuo codice personale e la guida all'arrivo prima del soggiorno.
Solo una cosa: facci sapere l'orario approssimativo di arrivo rispondendo a questo messaggio.

PREPARA IL SOGGIORNO
I nostri indirizzi per tutto il gruppo (ristoranti, spesa, visite):
{{autour}}
Vieni per un evento del circuito? Date, accesso, consigli:
{{evenements}}

Indirizzo: {{adresse}}
Domande? Rispondi a questo messaggio o scrivici su WhatsApp: {{whatsapp}}

A presto,
Alexandre`,
  },
  // L'auto-action Beds24 (« Merci pour votre reservation au Coliving… ») et la nôtre, dans les 5 langues.
  fingerprints: [
    "merci pour votre reservation au coliving",
    "thank you for booking coliving henri barbusse",
    // Auto-action Beds24 en anglais (relevée par l'hôte le 2026-11-08).
    "thank you for booking at coliving henri barbusse",
    "vielen dank fur ihre buchung im coliving",
    "gracias por tu reserva en el coliving",
    "grazie per la tua prenotazione al coliving",
  ],
};

const arrivee: MessageTemplate = {
  id: "arrivee-code",
  label: "Arrivée + code de la porte",
  version: 2,
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
  /*
   * **Seulement les libellés du code** (chef-de-stand) : « Bienvenue au Coliving Henri Barbusse »
   * se retrouve dans un message écrit à la main, et une reconnaissance à tort signifie un voyageur
   * qui ne reçoit jamais son code. Même piège que l'URL du guide (lib/guest-messages.ts).
   */
  fingerprints: [
    // Ce modèle (FR) et l'auto-action Beds24 568440 (« …pour la duree de votre sejour »).
    "votre code personnel pour la",
    // Ce modèle, dans les quatre autres langues.
    "your personal code for the front door",
    "ihr personlicher code fur die haustur",
    "tu codigo personal para la puerta de entrada",
    "il tuo codice personale per la porta d'ingresso",
    // L'auto-action Beds24 568440 en anglais.
    "your personal access code for the main entrance",
    // Les anciens boutons du dashboard (lib/guest-messages.ts), cinq langues.
    "votre code d'acces a la porte",
    "your door access code",
    "il tuo codice di accesso alla porta",
    "ihr turzugangscode",
    "tu codigo de acceso a la puerta",
  ],
};

const installe: MessageTemplate = {
  id: "bien-installe",
  label: "Lendemain de l'arrivée",
  version: 3,
  trigger: { anchor: "arrival", offsetDays: 1, at: "09:00" },
  late: { mode: "skip", graceHours: 6 },
  // Sur deux nuits, le lendemain de l'arrivée est aussi la veille du départ : un seul message ce jour-là.
  conditions: { minNights: 3, quietHours: 12 },
  onAnchorChange: "ignore",
  variables: ["autour"],
  optionalVariables: ["prenom"],
  previewVisible: ["prenom", "autour"],
  subject: {
    fr: "Bien installés ?",
    en: "All settled in?",
    de: "Gut angekommen?",
    es: "¿Bien instalados?",
    it: "Tutto bene con la sistemazione?",
  },
  body: {
    fr: `Bonjour{{#prenom}} {{prenom}}{{/prenom}},

J'espère que vous êtes bien installés et que vous avez trouvé vos marques. S'il vous manque quoi que ce soit, répondez simplement à ce message.

Pour tout le groupe, nos adresses autour de la maison (restos, courses, balades) :
{{autour}}

Alexandre`,
    en: `Hello{{#prenom}} {{prenom}}{{/prenom}},

I hope you are all settled in and finding your way around the house. If you need anything at all, just reply to this message.

For the whole group, our tips around the house (restaurants, shops, walks):
{{autour}}

Alexandre`,
    de: `Hallo{{#prenom}} {{prenom}}{{/prenom}},

ich hoffe, Sie haben sich gut eingelebt und finden sich im Haus zurecht. Wenn Ihnen etwas fehlt, antworten Sie einfach auf diese Nachricht.

Für die ganze Gruppe finden Sie hier unsere Tipps rund um das Haus (Restaurants, Einkäufe, Spaziergänge):
{{autour}}

Alexandre`,
    es: `Hola{{#prenom}} {{prenom}}{{/prenom}},

Espero que estéis bien instalados y que ya os sintáis como en casa. Si os falta cualquier cosa, respondedme simplemente a este mensaje.

Para todo el grupo, nuestras direcciones alrededor de la casa (restaurantes, compras, paseos):
{{autour}}

Alexandre`,
    it: `Ciao{{#prenom}} {{prenom}}{{/prenom}},

spero che vi siate sistemati bene e che vi troviate a vostro agio. Se vi manca qualcosa, rispondete semplicemente a questo messaggio.

Per tutto il gruppo, i nostri indirizzi intorno alla casa (ristoranti, spesa, passeggiate):
{{autour}}

Alexandre`,
  },
  // Plus le message « Tout se passe bien à la maison ? » proposé au Lot 4, s'il a été créé dans Beds24.
  fingerprints: ["que vous etes bien installe", "you are all settled in", "tout se passe bien a la maison", "is everything going well at the house"],
};

const depart: MessageTemplate = {
  id: "depart",
  label: "Veille du départ",
  version: 2,
  trigger: { anchor: "departure", offsetDays: -1, at: "17:00" },
  late: { mode: "skip", graceHours: 6 },
  // Sur une nuit, la veille du départ est le jour de l'arrivée : le guide suffit.
  conditions: { minNights: 2, quietHours: 12 },
  onAnchorChange: "ignore",
  variables: ["telephone", "whatsapp"],
  optionalVariables: ["prenom"],
  previewVisible: ["prenom", "telephone", "whatsapp"],
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

Une remarque, une suggestion ? Dites-le-nous directement : {{whatsapp}}

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

Any comment or suggestion? Tell us directly: {{whatsapp}}

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

Eine Anmerkung, ein Vorschlag? Sagen Sie es uns direkt: {{whatsapp}}

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

¿Algún comentario o sugerencia? Dínoslo directamente: {{whatsapp}}

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

Un commento, un suggerimento? Diccelo direttamente: {{whatsapp}}

Speriamo di riaccoglierti presto!
Alexandre
{{telephone}}`,
  },
  fingerprints: ["le depart approche", "departure is approaching", "die abreise naht", "la salida se acerca", "la partenza si avvicina"],
};

const avis: MessageTemplate = {
  id: "avis",
  label: "Lendemain du départ (avis)",
  version: 2,
  trigger: { anchor: "departure", offsetDays: 1, at: "10:00" },
  late: { mode: "skip", graceHours: 8 },
  conditions: { quietHours: 12 },
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
{{^direct}}Votre avis, quel qu'il soit, nous aide. Sur la plateforme où vous avez réservé, il ne prend qu'une minute. Vous pouvez aussi en laisser un sur Google :{{/direct}}{{#direct}}Votre avis, quel qu'il soit, nous aide, et il ne prend qu'une minute sur Google :{{/direct}}
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
{{^direct}}Your feedback, whatever it is, helps us. On the platform where you booked, a review only takes a minute. You can also leave one on Google:{{/direct}}{{#direct}}Your feedback, whatever it is, helps us, and a review on Google only takes a minute:{{/direct}}
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
{{^direct}}Ihre Meinung, wie auch immer sie ausfällt, hilft uns. Auf der Plattform, auf der Sie gebucht haben, dauert eine Bewertung nur eine Minute. Sie können auch eine auf Google hinterlassen:{{/direct}}{{#direct}}Ihre Meinung, wie auch immer sie ausfällt, hilft uns – eine Bewertung auf Google dauert nur eine Minute:{{/direct}}
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
{{^direct}}Tu opinión, sea cual sea, nos ayuda. En la plataforma donde reservaste, dejarla solo lleva un minuto. También puedes dejar una en Google:{{/direct}}{{#direct}}Tu opinión, sea cual sea, nos ayuda, y dejarla en Google solo lleva un minuto:{{/direct}}
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
{{^direct}}Il tuo parere, qualunque sia, ci aiuta. Sulla piattaforma dove hai prenotato, lasciare una recensione richiede solo un minuto. Puoi lasciarne una anche su Google:{{/direct}}{{#direct}}Il tuo parere, qualunque sia, ci aiuta, e lasciare una recensione su Google richiede solo un minuto:{{/direct}}
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

export const TEMPLATES: readonly MessageTemplate[] = [confirmation, arrivee, installe, depart, avis];
