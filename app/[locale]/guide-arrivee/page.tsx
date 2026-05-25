import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { PROPERTY_INFO } from "@/lib/property-info";
import { BLOG_POSTS, getLocalizedPost } from "@/lib/blog/posts";
import WifiQRCode from "@/components/guide/WifiQRCode";

const SITE_URL = "https://www.coliving-barbusse.fr";
const HERO_IMAGE = "/images/house/3-maison-AI.jpg";
const FEATURED_BLOG_SLUGS = [
  "restos-bars-magasins-le-mans",
  "que-visiter-le-mans-sarthe",
  "entreprises-proches-le-mans",
];

type Lang = Locale;

const T = {
  fr: {
    titleTag: "Guide d'arrivée — Coliving Barbusse",
    desc: "Toutes les informations pratiques pour votre séjour au Coliving Barbusse au Mans : accès, Wi-Fi, conseils, sortir.",
    heroKicker: "Bienvenue",
    heroTitle: "Bienvenue à la maison",
    heroSub: "Voici toutes les informations pour profiter pleinement de votre séjour.",
    s1Title: "Comment venir",
    s1Address: "Adresse",
    s1Walk: "À environ 16 minutes à pied de la gare TGV du Mans. Prenez la sortie Sud en quittant la gare.",
    s1Route1T: "Raccourci nature (par beau temps)",
    s1Route1: "Passerelle piétonne au-dessus de la rivière Huisne, puis traversée du parc du Gué de Maulny.",
    s1Route2T: "Itinéraire commerces",
    s1Route2: "Boulangerie, Carrefour City et autres commerces de proximité sur le chemin.",
    s1MapsLink: "Ouvrir dans une application de navigation :",
    s2Title: "Stationnement",
    s2Body: "Pas de parking privé ni de garage à la maison. Stationnement libre et gratuit dans la rue Henri Barbusse et les rues adjacentes — pratique pour les groupes, plusieurs voitures peuvent stationner sans contrainte.",
    s3Title: "Accès à la maison",
    s3Item1T: "Serrure connectée",
    s3Item1: "L'entrée principale est équipée d'une serrure connectée avec un code d'accès personnel à 6 chiffres, valable uniquement pendant la durée de votre séjour. Le clavier se trouve à gauche de la sonnette.",
    s3Item1Note: "Le code vous a été envoyé par message — vérifiez votre boîte de réception.",
    s3Item2T: "Boîtes à clés (optionnel)",
    s3Item2: "Par défaut, toutes les chambres sont accessibles librement. Si vous le souhaitez, chaque chambre peut être fermée à clé. Demandez-nous les codes des boîtes à clés.",
    s4Title: "Verrouillage depuis l'intérieur",
    s4Step1: "Relevez fermement la poignée vers le haut.",
    s4Step2: "Tournez doucement le bouton rond vers la droite (sens horaire).",
    s4Note: "Cette action est silencieuse, mais elle active bien le verrouillage. La porte est verrouillée lorsque l'anneau lumineux est entièrement allumé. Tourner le bouton dans l'autre sens permet de déverrouiller.",
    s4OutTitle: "Verrouillage en sortant de la maison",
    s4OutStep1: "Relevez fermement la poignée vers le haut depuis l'extérieur.",
    s4OutStep2: "Appuyez sur la touche retour (la touche en bas à droite du clavier).",
    s5Title: "Wi-Fi",
    s5Sub: "Connectez tout le groupe en un instant.",
    s6Title: "Chauffage",
    s6Body: "Les radiateurs sont contrôlés par un petit boîtier de commande. Tout est automatique : le chauffage s'allume avant votre arrivée et se coupe à votre départ.",
    s6Note: "Vous pouvez ajuster la température via les boutons + / – si vous avez trop chaud ou trop froid. Merci de ne pas toucher directement aux radiateurs. En cas de besoin, je peux les piloter à distance — n'hésitez pas à m'envoyer un message.",
    s7Title: "Règles de la maison",
    s7Items: [
      `Arrivée : ${PROPERTY_INFO.checkIn.fr}`,
      `Départ : ${PROPERTY_INFO.checkOut.fr}`,
      "Non-fumeur à l'intérieur (fumer dehors uniquement)",
      "Pas de bruit après 22h — respect du voisinage",
      "Pas d'animaux",
      "Poubelle jaune (tri) et tout-venant devant la maison",
      "18 voyageurs maximum",
    ],
    s7Teens: "Adolescents 10-17 ans bienvenus. Le logement n'est pas adapté aux jeunes enfants.",
    knowMoreTitle: "En savoir plus sur la maison",
    knowMoreSub: "Pour préparer votre séjour et organiser la répartition des chambres avant l'arrivée.",
    knowMoreRoomsT: "Les 9 suites privatives",
    knowMoreRoomsD: "Photos, lits, salles de bain privatives, équipement de chaque chambre — utile pour répartir le groupe avant l'arrivée.",
    knowMoreRoomsCta: "Voir les chambres",
    knowMoreAmenitiesT: "Tous les équipements",
    knowMoreAmenitiesD: "Lave-linge, sèche-linge, salle de sport, jardin, cuisine équipée, Wi-Fi haut débit… la liste complète.",
    knowMoreAmenitiesCta: "Voir les équipements",
    knowMoreLocationT: "Le quartier & transports",
    knowMoreLocationD: "Tramway, gare TGV, Circuit Bugatti, parc à proximité — pour rayonner depuis la maison.",
    knowMoreLocationCta: "Voir la localisation",
    s8Title: "Découvrir Le Mans",
    s8Sub: "Quelques articles pour profiter pleinement de votre séjour.",
    s8ReadMore: "Lire l'article",
    s9Title: "Avant de partir",
    s9Intro: `Sauf accord préalable, merci de libérer la maison ${PROPERTY_INFO.checkOut.fr}.`,
    s9CheckoutSubT: "Le ménage est inclus, nous vous remercions de :",
    s9CheckoutItems: [
      "Mettre la vaisselle sale dans le lave-vaisselle",
      "Vider et ranger la vaisselle propre du lave-vaisselle",
      "Utiliser les poubelles de la cuisine",
      "Retirer vos denrées du réfrigérateur",
      "Remettre les espaces communs (salon, cuisine, jardin, salle de sport) dans l'état dans lequel vous les avez trouvés",
    ],
    s9KeysT: "Remise des clés",
    s9KeysItems: [
      "Remettre les clés dans la boîte à clés (si vous les avez utilisées)",
      "Verrouiller la serrure connectée en partant",
      "Nous envoyer un message pour confirmer votre départ",
    ],
    s9HelpT: "Un coup de pouce ?",
    s9Help: "Si vous souhaitez aller plus loin, vous pouvez retirer les draps et les serviettes utilisés et les déposer dans le couloir. Cela nous fait gagner un temps précieux pour préparer la maison pour les prochains voyageurs. Merci !",
    s9FeedbackT: "Vos impressions",
    s9Feedback: "Nous serions ravis d'avoir votre retour : n'hésitez pas à nous envoyer un message pour partager vos impressions et nous aider à nous améliorer.",
    s9FeedbackCta: "Nous écrire sur WhatsApp",
    s9ReviewT: "Votre avis compte 🌟",
    s9ReviewBody: "Si vous avez aimé votre séjour, votre avis Google nous aide énormément à gagner en visibilité et à accueillir d'autres voyageurs comme vous.",
    s9ReviewCta: "Laissez-nous un avis sur Google",
    s10Title: "Contact & urgences",
    s10HostT: "Votre hôte Alexandre",
    s10WA: "WhatsApp",
    s10Phone: "Téléphone",
    s10EmergencyT: "Numéros d'urgence",
    s10Emergency: [
      { label: "SAMU (urgences médicales)", num: "15" },
      { label: "Police", num: "17" },
      { label: "Pompiers", num: "18" },
      { label: "Urgence européenne", num: "112" },
    ],
    closingNote: "Bon séjour au Mans !",
  },
  en: {
    titleTag: "Welcome guide — Coliving Barbusse",
    desc: "All the practical information for your stay at Coliving Barbusse in Le Mans: access, Wi-Fi, tips, exploring.",
    heroKicker: "Welcome",
    heroTitle: "Welcome home",
    heroSub: "Everything you need to make the most of your stay.",
    s1Title: "Getting here",
    s1Address: "Address",
    s1Walk: "About 16 minutes on foot from Le Mans TGV station. Take the South exit when leaving the station.",
    s1Route1T: "Scenic shortcut (in good weather)",
    s1Route1: "Cross the pedestrian footbridge over the Huisne River, then walk through Le Gué de Maulny park.",
    s1Route2T: "Shops route",
    s1Route2: "Bakery, Carrefour City and other local shops along the way.",
    s1MapsLink: "Open in a navigation app:",
    s2Title: "Parking",
    s2Body: "No private parking or garage at the house. Free street parking on Rue Henri Barbusse and adjacent streets, no permit required — convenient for groups, several cars can park without restrictions.",
    s3Title: "Getting inside",
    s3Item1T: "Smart lock",
    s3Item1: "The main entrance is equipped with a smart lock and a personal 6-digit access code, valid only for the duration of your stay. The keypad is located to the left of the doorbell.",
    s3Item1Note: "Your code was sent to you in a message — check your inbox.",
    s3Item2T: "Bedroom lockboxes (optional)",
    s3Item2: "By default, all bedrooms are freely accessible. If you'd like, each room can be locked individually. Just ask us for the lockbox codes.",
    s4Title: "Locking the door from inside",
    s4Step1: "Lift the door handle firmly upward.",
    s4Step2: "Then gently turn the round lock to the right (clockwise).",
    s4Note: "This action is silent but engages the lock. The door is locked when the light ring is fully illuminated. Turning the lock in the opposite direction unlocks the door.",
    s4OutTitle: "Locking when leaving the house",
    s4OutStep1: "Lift the door handle firmly upward from the outside.",
    s4OutStep2: 'Press the "return key" (bottom-right key of the keypad).',
    s5Title: "Wi-Fi",
    s5Sub: "Get the whole group connected in one go.",
    s6Title: "Heating",
    s6Body: "The radiators are controlled by a small control unit. Everything is automatic: heating turns on before your arrival and off when you leave.",
    s6Note: "You can adjust the temperature using the + / – buttons if you feel too hot or too cold. Please don't touch the radiators directly. If needed, I can control them remotely — feel free to send me a message.",
    s7Title: "House rules",
    s7Items: [
      `Check-in: ${PROPERTY_INFO.checkIn.en}`,
      `Check-out: ${PROPERTY_INFO.checkOut.en}`,
      "No smoking indoors (outdoor only)",
      "No noise after 10 PM — respect the neighbours",
      "No pets",
      "Yellow bin (recycling) and general waste in front of the house",
      "18 guests maximum",
    ],
    s7Teens: "Teens aged 10-17 are welcome. The property is not suitable for young children.",
    knowMoreTitle: "Learn more about the house",
    knowMoreSub: "To prepare your stay and organise who-sleeps-where before arrival.",
    knowMoreRoomsT: "The 9 private suites",
    knowMoreRoomsD: "Photos, beds, private bathrooms, equipment of each bedroom — useful to assign rooms within the group before arrival.",
    knowMoreRoomsCta: "View bedrooms",
    knowMoreAmenitiesT: "All amenities",
    knowMoreAmenitiesD: "Washing machine, tumble dryer, gym, garden, fully equipped kitchen, high-speed Wi-Fi… the full list.",
    knowMoreAmenitiesCta: "View amenities",
    knowMoreLocationT: "Neighbourhood & transport",
    knowMoreLocationD: "Tramway, TGV station, Bugatti Circuit, nearby park — to make the most of the area.",
    knowMoreLocationCta: "View location",
    s8Title: "Discover Le Mans",
    s8Sub: "A few articles to make the most of your stay.",
    s8ReadMore: "Read the article",
    s9Title: "Before you leave",
    s9Intro: `Unless previously agreed, please vacate the house ${PROPERTY_INFO.checkOut.en}.`,
    s9CheckoutSubT: "Cleaning is included, however we kindly ask you to:",
    s9CheckoutItems: [
      "Place dirty dishes in the dishwasher",
      "Empty and put away the clean dishes from the dishwasher",
      "Use the kitchen bins for any waste",
      "Remove your food items from the refrigerator",
      "Leave the common areas (living room, kitchen, garden, gym) in the same condition as you found them",
    ],
    s9KeysT: "Key handover",
    s9KeysItems: [
      "Return the keys to the key box (if you used them)",
      "Lock the connected door lock before leaving",
      "Send us a message to confirm your departure",
    ],
    s9HelpT: "Want to go a step further?",
    s9Help: "If you'd like to help us out further, you can strip the used sheets and towels and leave them in the hallway. It saves us valuable time preparing the house for the next guests. Thank you!",
    s9FeedbackT: "Your feedback",
    s9Feedback: "We would love to hear from you! Feel free to send us a message to share your impressions and help us improve.",
    s9FeedbackCta: "Message us on WhatsApp",
    s9ReviewT: "Your review matters 🌟",
    s9ReviewBody: "If you enjoyed your stay, a Google review helps us tremendously gain visibility and welcome more travellers like you.",
    s9ReviewCta: "Leave us a Google review",
    s10Title: "Contact & emergencies",
    s10HostT: "Your host Alexandre",
    s10WA: "WhatsApp",
    s10Phone: "Phone",
    s10EmergencyT: "Emergency numbers",
    s10Emergency: [
      { label: "Medical emergencies (SAMU)", num: "15" },
      { label: "Police", num: "17" },
      { label: "Fire brigade", num: "18" },
      { label: "European emergency", num: "112" },
    ],
    closingNote: "Have a great stay in Le Mans!",
  },
  it: {
    titleTag: "Guida di benvenuto — Coliving Barbusse",
    desc: "Tutte le informazioni pratiche per il tuo soggiorno al Coliving Barbusse a Le Mans: accesso, Wi-Fi, consigli, cosa fare.",
    heroKicker: "Benvenuto",
    heroTitle: "Benvenuto a casa",
    heroSub: "Ecco tutte le informazioni per goderti al massimo il tuo soggiorno.",
    s1Title: "Come arrivare",
    s1Address: "Indirizzo",
    s1Walk: "A circa 16 minuti a piedi dalla stazione TGV di Le Mans. Prendi l'uscita Sud uscendo dalla stazione.",
    s1Route1T: "Scorciatoia nella natura (con bel tempo)",
    s1Route1: "Passerella pedonale sopra il fiume Huisne, poi attraversamento del parco du Gué de Maulny.",
    s1Route2T: "Itinerario dei negozi",
    s1Route2: "Panetteria, Carrefour City e altri negozi di vicinato lungo il percorso.",
    s1MapsLink: "Apri in un'app di navigazione:",
    s2Title: "Parcheggio",
    s2Body: "Nessun parcheggio privato né garage in casa. Parcheggio libero e gratuito in rue Henri Barbusse e nelle vie adiacenti — comodo per i gruppi, più auto possono sostare senza vincoli.",
    s3Title: "Accesso alla casa",
    s3Item1T: "Serratura connessa",
    s3Item1: "L'ingresso principale è dotato di una serratura connessa con un codice di accesso personale a 6 cifre, valido solo per la durata del tuo soggiorno. La tastiera si trova a sinistra del campanello.",
    s3Item1Note: "Il codice ti è stato inviato per messaggio — controlla la tua casella.",
    s3Item2T: "Cassette portachiavi (opzionale)",
    s3Item2: "Per impostazione predefinita, tutte le camere sono liberamente accessibili. Se lo desideri, ogni camera può essere chiusa a chiave. Chiedici i codici delle cassette portachiavi.",
    s4Title: "Chiusura dall'interno",
    s4Step1: "Alza con decisione la maniglia verso l'alto.",
    s4Step2: "Gira delicatamente il pomolo rotondo verso destra (senso orario).",
    s4Note: "Questa azione è silenziosa, ma attiva correttamente il blocco. La porta è chiusa quando l'anello luminoso è completamente acceso. Girando il pomolo nell'altro senso si sblocca.",
    s4OutTitle: "Chiusura uscendo dalla casa",
    s4OutStep1: "Alza con decisione la maniglia verso l'alto dall'esterno.",
    s4OutStep2: "Premi il tasto di ritorno (il tasto in basso a destra della tastiera).",
    s5Title: "Wi-Fi",
    s5Sub: "Collega tutto il gruppo in un istante.",
    s6Title: "Riscaldamento",
    s6Body: "I radiatori sono controllati da una piccola centralina. Tutto è automatico: il riscaldamento si accende prima del tuo arrivo e si spegne alla tua partenza.",
    s6Note: "Puoi regolare la temperatura tramite i pulsanti + / – se hai troppo caldo o troppo freddo. Per favore non toccare direttamente i radiatori. In caso di necessità, posso pilotarli a distanza — non esitare a inviarmi un messaggio.",
    s7Title: "Regole della casa",
    s7Items: [
      `Arrivo: ${PROPERTY_INFO.checkIn.it}`,
      `Partenza: ${PROPERTY_INFO.checkOut.it}`,
      "Vietato fumare all'interno (fumare solo fuori)",
      "Niente rumore dopo le 22:00 — rispetto del vicinato",
      "Niente animali",
      "Bidone giallo (riciclo) e indifferenziato davanti alla casa",
      "Massimo 18 ospiti",
    ],
    s7Teens: "Adolescenti 10-17 anni benvenuti. L'alloggio non è adatto ai bambini piccoli.",
    knowMoreTitle: "Scopri di più sulla casa",
    knowMoreSub: "Per preparare il tuo soggiorno e organizzare la distribuzione delle camere prima dell'arrivo.",
    knowMoreRoomsT: "Le 9 suite private",
    knowMoreRoomsD: "Foto, letti, bagni privati, dotazione di ogni camera — utile per assegnare le camere nel gruppo prima dell'arrivo.",
    knowMoreRoomsCta: "Vedi le camere",
    knowMoreAmenitiesT: "Tutti i servizi",
    knowMoreAmenitiesD: "Lavatrice, asciugatrice, palestra, giardino, cucina attrezzata, Wi-Fi ad alta velocità… la lista completa.",
    knowMoreAmenitiesCta: "Vedi i servizi",
    knowMoreLocationT: "Il quartiere e i trasporti",
    knowMoreLocationD: "Tram, stazione TGV, Circuito Bugatti, parco nelle vicinanze — per spostarsi dalla casa.",
    knowMoreLocationCta: "Vedi la posizione",
    s8Title: "Scopri Le Mans",
    s8Sub: "Alcuni articoli per goderti al meglio il tuo soggiorno.",
    s8ReadMore: "Leggi l'articolo",
    s9Title: "Prima di partire",
    s9Intro: `Salvo accordi diversi, ti chiediamo di liberare la casa ${PROPERTY_INFO.checkOut.it}.`,
    s9CheckoutSubT: "Le pulizie sono incluse, ti ringraziamo di:",
    s9CheckoutItems: [
      "Mettere le stoviglie sporche nella lavastoviglie",
      "Svuotare e riporre le stoviglie pulite della lavastoviglie",
      "Utilizzare i bidoni della cucina",
      "Rimuovere i tuoi alimenti dal frigorifero",
      "Rimettere gli spazi comuni (soggiorno, cucina, giardino, palestra) nello stato in cui li hai trovati",
    ],
    s9KeysT: "Restituzione delle chiavi",
    s9KeysItems: [
      "Rimettere le chiavi nella cassetta portachiavi (se le hai usate)",
      "Chiudere la serratura connessa quando esci",
      "Inviarci un messaggio per confermare la partenza",
    ],
    s9HelpT: "Una mano in più?",
    s9Help: "Se vuoi andare oltre, puoi togliere le lenzuola e gli asciugamani usati e lasciarli nel corridoio. Ci fa guadagnare tempo prezioso per preparare la casa per i prossimi viaggiatori. Grazie!",
    s9FeedbackT: "Le tue impressioni",
    s9Feedback: "Saremmo felici di avere un tuo riscontro: non esitare a inviarci un messaggio per condividere le tue impressioni e aiutarci a migliorare.",
    s9FeedbackCta: "Scrivici su WhatsApp",
    s9ReviewT: "La tua recensione conta 🌟",
    s9ReviewBody: "Se hai apprezzato il tuo soggiorno, una recensione Google ci aiuta enormemente a guadagnare visibilità e ad accogliere altri viaggiatori come te.",
    s9ReviewCta: "Lascia una recensione su Google",
    s10Title: "Contatti & emergenze",
    s10HostT: "Il tuo host Alexandre",
    s10WA: "WhatsApp",
    s10Phone: "Telefono",
    s10EmergencyT: "Numeri di emergenza",
    s10Emergency: [
      { label: "Emergenze mediche (SAMU)", num: "15" },
      { label: "Polizia", num: "17" },
      { label: "Vigili del fuoco", num: "18" },
      { label: "Emergenza europea", num: "112" },
    ],
    closingNote: "Buon soggiorno a Le Mans!",
  },
  de: {
    titleTag: "Ankunftsguide — Coliving Barbusse",
    desc: "Alle praktischen Informationen für Ihren Aufenthalt im Coliving Barbusse in Le Mans: Zugang, WLAN, Tipps, Ausgehen.",
    heroKicker: "Willkommen",
    heroTitle: "Willkommen zu Hause",
    heroSub: "Hier finden Sie alle Informationen, um Ihren Aufenthalt voll auszukosten.",
    s1Title: "Anreise",
    s1Address: "Adresse",
    s1Walk: "Etwa 16 Minuten zu Fuß vom TGV-Bahnhof Le Mans entfernt. Nehmen Sie beim Verlassen des Bahnhofs den Südausgang.",
    s1Route1T: "Naturweg (bei schönem Wetter)",
    s1Route1: "Fußgängerbrücke über den Fluss Huisne, dann Durchquerung des Parks Gué de Maulny.",
    s1Route2T: "Route mit Geschäften",
    s1Route2: "Bäckerei, Carrefour City und weitere lokale Geschäfte auf dem Weg.",
    s1MapsLink: "In einer Navigations-App öffnen:",
    s2Title: "Parken",
    s2Body: "Kein privater Parkplatz oder Garage am Haus. Kostenloses Parken auf der Straße in der Rue Henri Barbusse und den angrenzenden Straßen — praktisch für Gruppen, mehrere Autos können ohne Einschränkung parken.",
    s3Title: "Zugang zum Haus",
    s3Item1T: "Smart Lock",
    s3Item1: "Der Haupteingang ist mit einem Smart Lock und einem persönlichen 6-stelligen Zugangscode ausgestattet, der nur für die Dauer Ihres Aufenthalts gültig ist. Das Tastenfeld befindet sich links neben der Klingel.",
    s3Item1Note: "Ihr Code wurde Ihnen per Nachricht zugesandt — prüfen Sie Ihren Posteingang.",
    s3Item2T: "Schlüsselkästen (optional)",
    s3Item2: "Standardmäßig sind alle Zimmer frei zugänglich. Auf Wunsch kann jedes Zimmer abgeschlossen werden. Fragen Sie uns nach den Codes der Schlüsselkästen.",
    s4Title: "Abschließen von innen",
    s4Step1: "Heben Sie den Türgriff fest nach oben.",
    s4Step2: "Drehen Sie den runden Knopf vorsichtig nach rechts (im Uhrzeigersinn).",
    s4Note: "Diese Aktion ist geräuschlos, aktiviert aber das Schloss. Die Tür ist verriegelt, wenn der Leuchtring vollständig leuchtet. Durch Drehen des Knopfes in die andere Richtung wird entriegelt.",
    s4OutTitle: "Abschließen beim Verlassen des Hauses",
    s4OutStep1: "Heben Sie den Türgriff von außen fest nach oben.",
    s4OutStep2: "Drücken Sie die Rückkehr-Taste (die Taste unten rechts auf dem Tastenfeld).",
    s5Title: "WLAN",
    s5Sub: "Bringen Sie die ganze Gruppe im Handumdrehen ins Netz.",
    s6Title: "Heizung",
    s6Body: "Die Heizkörper werden von einem kleinen Steuergerät gesteuert. Alles läuft automatisch: Die Heizung schaltet sich vor Ihrer Ankunft ein und bei Ihrer Abreise wieder aus.",
    s6Note: "Sie können die Temperatur über die Tasten + / – anpassen, wenn Ihnen zu warm oder zu kalt ist. Bitte berühren Sie die Heizkörper nicht direkt. Bei Bedarf kann ich sie aus der Ferne steuern — schreiben Sie mir gerne eine Nachricht.",
    s7Title: "Hausregeln",
    s7Items: [
      `Anreise: ${PROPERTY_INFO.checkIn.de}`,
      `Abreise: ${PROPERTY_INFO.checkOut.de}`,
      "Nichtraucher im Innenbereich (nur draußen rauchen)",
      "Keine Lärmbelästigung nach 22 Uhr — Respekt vor den Nachbarn",
      "Keine Haustiere",
      "Gelbe Tonne (Wertstoff) und Restmüll vor dem Haus",
      "Maximal 18 Gäste",
    ],
    s7Teens: "Jugendliche von 10 bis 17 Jahren willkommen. Die Unterkunft ist nicht für Kleinkinder geeignet.",
    knowMoreTitle: "Mehr über das Haus erfahren",
    knowMoreSub: "Um Ihren Aufenthalt vorzubereiten und die Zimmerverteilung vor der Ankunft zu organisieren.",
    knowMoreRoomsT: "Die 9 privaten Suiten",
    knowMoreRoomsD: "Fotos, Betten, eigene Bäder, Ausstattung jedes Zimmers — nützlich, um die Zimmerverteilung in der Gruppe vor der Ankunft zu planen.",
    knowMoreRoomsCta: "Zimmer ansehen",
    knowMoreAmenitiesT: "Alle Ausstattungsmerkmale",
    knowMoreAmenitiesD: "Waschmaschine, Trockner, Fitnessraum, Garten, voll ausgestattete Küche, Highspeed-WLAN… die vollständige Liste.",
    knowMoreAmenitiesCta: "Ausstattung ansehen",
    knowMoreLocationT: "Das Viertel & Verkehrsanbindung",
    knowMoreLocationD: "Straßenbahn, TGV-Bahnhof, Bugatti-Rennstrecke, Park in der Nähe — um die Umgebung zu erkunden.",
    knowMoreLocationCta: "Lage ansehen",
    s8Title: "Le Mans entdecken",
    s8Sub: "Einige Artikel, um Ihren Aufenthalt voll auszukosten.",
    s8ReadMore: "Artikel lesen",
    s9Title: "Vor der Abreise",
    s9Intro: `Sofern nicht anders vereinbart, bitten wir Sie, das Haus ${PROPERTY_INFO.checkOut.de} zu verlassen.`,
    s9CheckoutSubT: "Die Reinigung ist inklusive, wir bitten Sie jedoch darum:",
    s9CheckoutItems: [
      "Schmutziges Geschirr in den Geschirrspüler stellen",
      "Sauberes Geschirr aus dem Geschirrspüler ausräumen und wegräumen",
      "Die Küchenmülleimer verwenden",
      "Ihre Lebensmittel aus dem Kühlschrank entfernen",
      "Die Gemeinschaftsräume (Wohnzimmer, Küche, Garten, Fitnessraum) in dem Zustand zu hinterlassen, in dem Sie sie vorgefunden haben",
    ],
    s9KeysT: "Schlüsselübergabe",
    s9KeysItems: [
      "Die Schlüssel in den Schlüsselkasten zurücklegen (falls Sie sie verwendet haben)",
      "Das Smart Lock beim Verlassen verriegeln",
      "Uns eine Nachricht zur Bestätigung Ihrer Abreise senden",
    ],
    s9HelpT: "Ein kleiner Gefallen?",
    s9Help: "Wenn Sie noch einen Schritt weiter gehen möchten, können Sie die benutzten Laken und Handtücher abziehen und im Flur ablegen. Das spart uns wertvolle Zeit bei der Vorbereitung des Hauses für die nächsten Reisenden. Vielen Dank!",
    s9FeedbackT: "Ihre Eindrücke",
    s9Feedback: "Wir würden uns über Ihre Rückmeldung freuen: Schreiben Sie uns gerne eine Nachricht, um Ihre Eindrücke zu teilen und uns bei der Verbesserung zu helfen.",
    s9FeedbackCta: "Auf WhatsApp schreiben",
    s9ReviewT: "Ihre Bewertung zählt 🌟",
    s9ReviewBody: "Wenn Ihnen Ihr Aufenthalt gefallen hat, hilft uns eine Google-Bewertung enorm dabei, an Sichtbarkeit zu gewinnen und weitere Reisende wie Sie willkommen zu heißen.",
    s9ReviewCta: "Hinterlassen Sie eine Google-Bewertung",
    s10Title: "Kontakt & Notfälle",
    s10HostT: "Ihr Gastgeber Alexandre",
    s10WA: "WhatsApp",
    s10Phone: "Telefon",
    s10EmergencyT: "Notrufnummern",
    s10Emergency: [
      { label: "Medizinischer Notruf (SAMU)", num: "15" },
      { label: "Polizei", num: "17" },
      { label: "Feuerwehr", num: "18" },
      { label: "Europäischer Notruf", num: "112" },
    ],
    closingNote: "Einen schönen Aufenthalt in Le Mans!",
  },
  es: {
    titleTag: "Guía de bienvenida — Coliving Barbusse",
    desc: "Toda la información práctica para tu estancia en Coliving Barbusse en Le Mans: acceso, Wi-Fi, consejos, qué hacer.",
    heroKicker: "Bienvenido",
    heroTitle: "Bienvenido a casa",
    heroSub: "Aquí tienes toda la información para disfrutar al máximo de tu estancia.",
    s1Title: "Cómo llegar",
    s1Address: "Dirección",
    s1Walk: "A unos 16 minutos a pie de la estación TGV de Le Mans. Toma la salida Sur al salir de la estación.",
    s1Route1T: "Atajo natural (con buen tiempo)",
    s1Route1: "Pasarela peatonal sobre el río Huisne, luego atravesando el parque Gué de Maulny.",
    s1Route2T: "Ruta de comercios",
    s1Route2: "Panadería, Carrefour City y otros comercios de barrio en el camino.",
    s1MapsLink: "Abrir en una app de navegación:",
    s2Title: "Aparcamiento",
    s2Body: "No hay aparcamiento privado ni garaje en la casa. Aparcamiento libre y gratuito en la rue Henri Barbusse y calles adyacentes — práctico para grupos, varios coches pueden aparcar sin restricciones.",
    s3Title: "Acceso a la casa",
    s3Item1T: "Cerradura conectada",
    s3Item1: "La entrada principal está equipada con una cerradura conectada y un código de acceso personal de 6 dígitos, válido únicamente durante la duración de tu estancia. El teclado se encuentra a la izquierda del timbre.",
    s3Item1Note: "Tu código se ha enviado por mensaje — revisa tu bandeja de entrada.",
    s3Item2T: "Cajas de llaves (opcional)",
    s3Item2: "Por defecto, todas las habitaciones son de libre acceso. Si lo deseas, cada habitación puede cerrarse con llave. Pídenos los códigos de las cajas de llaves.",
    s4Title: "Cierre desde el interior",
    s4Step1: "Levanta firmemente la manilla hacia arriba.",
    s4Step2: "Gira suavemente el pomo redondo hacia la derecha (sentido horario).",
    s4Note: "Esta acción es silenciosa, pero activa correctamente el cierre. La puerta está cerrada cuando el anillo luminoso está totalmente encendido. Girando el pomo en el otro sentido se desbloquea.",
    s4OutTitle: "Cierre al salir de la casa",
    s4OutStep1: "Levanta firmemente la manilla hacia arriba desde el exterior.",
    s4OutStep2: "Pulsa la tecla de retorno (la tecla abajo a la derecha del teclado).",
    s5Title: "Wi-Fi",
    s5Sub: "Conecta a todo el grupo en un instante.",
    s6Title: "Calefacción",
    s6Body: "Los radiadores están controlados por una pequeña centralita. Todo es automático: la calefacción se enciende antes de tu llegada y se apaga al irte.",
    s6Note: "Puedes ajustar la temperatura con los botones + / – si tienes demasiado calor o demasiado frío. Por favor, no toques directamente los radiadores. Si lo necesitas, puedo pilotarlos a distancia — no dudes en enviarme un mensaje.",
    s7Title: "Normas de la casa",
    s7Items: [
      `Llegada: ${PROPERTY_INFO.checkIn.es}`,
      `Salida: ${PROPERTY_INFO.checkOut.es}`,
      "No fumadores en el interior (fumar solo fuera)",
      "Sin ruido después de las 22:00 — respeto al vecindario",
      "No se admiten animales",
      "Contenedor amarillo (reciclaje) y resto delante de la casa",
      "18 huéspedes máximo",
    ],
    s7Teens: "Adolescentes de 10 a 17 años bienvenidos. El alojamiento no es apto para niños pequeños.",
    knowMoreTitle: "Saber más sobre la casa",
    knowMoreSub: "Para preparar tu estancia y organizar el reparto de las habitaciones antes de la llegada.",
    knowMoreRoomsT: "Las 9 suites privadas",
    knowMoreRoomsD: "Fotos, camas, baños privados, equipamiento de cada habitación — útil para repartir las habitaciones en el grupo antes de la llegada.",
    knowMoreRoomsCta: "Ver las habitaciones",
    knowMoreAmenitiesT: "Todos los servicios",
    knowMoreAmenitiesD: "Lavadora, secadora, gimnasio, jardín, cocina equipada, Wi-Fi de alta velocidad… la lista completa.",
    knowMoreAmenitiesCta: "Ver los servicios",
    knowMoreLocationT: "El barrio y los transportes",
    knowMoreLocationD: "Tranvía, estación TGV, Circuito Bugatti, parque cercano — para moverte desde la casa.",
    knowMoreLocationCta: "Ver la ubicación",
    s8Title: "Descubrir Le Mans",
    s8Sub: "Algunos artículos para aprovechar al máximo tu estancia.",
    s8ReadMore: "Leer el artículo",
    s9Title: "Antes de irte",
    s9Intro: `Salvo acuerdo previo, te pedimos liberar la casa ${PROPERTY_INFO.checkOut.es}.`,
    s9CheckoutSubT: "La limpieza está incluida, te agradecemos:",
    s9CheckoutItems: [
      "Meter la vajilla sucia en el lavavajillas",
      "Vaciar y guardar la vajilla limpia del lavavajillas",
      "Utilizar los cubos de la cocina",
      "Retirar tus alimentos del frigorífico",
      "Dejar los espacios comunes (salón, cocina, jardín, gimnasio) en el estado en que los encontraste",
    ],
    s9KeysT: "Entrega de llaves",
    s9KeysItems: [
      "Devolver las llaves a la caja de llaves (si las has usado)",
      "Cerrar la cerradura conectada al salir",
      "Enviarnos un mensaje para confirmar tu salida",
    ],
    s9HelpT: "¿Una ayudita?",
    s9Help: "Si quieres ir un paso más allá, puedes quitar las sábanas y toallas usadas y dejarlas en el pasillo. Nos ahorra un tiempo valioso para preparar la casa para los próximos viajeros. ¡Gracias!",
    s9FeedbackT: "Tus impresiones",
    s9Feedback: "Nos encantaría tener tu opinión: no dudes en enviarnos un mensaje para compartir tus impresiones y ayudarnos a mejorar.",
    s9FeedbackCta: "Escríbenos por WhatsApp",
    s9ReviewT: "Tu reseña cuenta 🌟",
    s9ReviewBody: "Si has disfrutado de tu estancia, una reseña en Google nos ayuda enormemente a ganar visibilidad y acoger a más viajeros como tú.",
    s9ReviewCta: "Déjanos una reseña en Google",
    s10Title: "Contacto y emergencias",
    s10HostT: "Tu anfitrión Alexandre",
    s10WA: "WhatsApp",
    s10Phone: "Teléfono",
    s10EmergencyT: "Números de emergencia",
    s10Emergency: [
      { label: "Emergencias médicas (SAMU)", num: "15" },
      { label: "Policía", num: "17" },
      { label: "Bomberos", num: "18" },
      { label: "Emergencia europea", num: "112" },
    ],
    closingNote: "¡Buena estancia en Le Mans!",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale as Lang) in T ? (rawLocale as Lang) : "fr";
  const t = T[locale];
  const url = `${SITE_URL}/${locale}/guide-arrivee`;

  return {
    title: t.titleTag,
    description: t.desc,
    robots: { index: false, follow: true },
    alternates: {
      canonical: url,
      languages: {
        fr: `${SITE_URL}/fr/guide-arrivee`,
        en: `${SITE_URL}/en/guide-arrivee`,
        it: `${SITE_URL}/it/guide-arrivee`,
        de: `${SITE_URL}/de/guide-arrivee`,
        es: `${SITE_URL}/es/guide-arrivee`,
        "x-default": `${SITE_URL}/fr/guide-arrivee`,
      },
    },
  };
}

export default async function GuideArrivee({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale as Lang) in T ? (rawLocale as Lang) : "fr";
  const t = T[locale];

  const featuredPosts = FEATURED_BLOG_SLUGS
    .map((slug) => BLOG_POSTS.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl">
        <div className="relative h-[280px] w-full sm:h-[360px]">
          <Image
            src={HERO_IMAGE}
            alt={t.heroTitle}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1024px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
              {t.heroKicker}
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-white sm:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
              {t.heroSub}
            </p>
          </div>
        </div>
      </section>

      {/* 1. Comment venir */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">{t.s1Title}</h2>
        <div className="mt-5 rounded-xl border border-border p-5">
          <p className="text-sm font-semibold text-foreground">{t.s1Address}</p>
          <p className="mt-1 text-sm text-secondary">{PROPERTY_INFO.address.full}</p>
          <p className="mt-3 text-xs font-medium text-secondary">{t.s1MapsLink}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { label: "Google Maps", href: PROPERTY_INFO.navigation.googleMaps },
              { label: "Waze", href: PROPERTY_INFO.navigation.waze },
              { label: "Plans (Apple)", href: PROPERTY_INFO.navigation.appleMaps },
              { label: "Mappy", href: PROPERTY_INFO.navigation.mappy },
              { label: "Roole Map", href: PROPERTY_INFO.navigation.rooleMap },
            ].map((app) => (
              <a
                key={app.label}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-border bg-light-bg px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {app.label} ↗
              </a>
            ))}
          </div>
        </div>
        <p className="mt-4 text-sm text-secondary">{t.s1Walk}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="overflow-hidden rounded-xl bg-light-bg">
            <Image
              src="/images/guide/itineraire-nature.jpg"
              alt={t.s1Route1T}
              width={720}
              height={862}
              className="h-auto w-full object-cover"
              sizes="(max-width: 640px) 100vw, 480px"
            />
            <div className="p-5">
              <h3 className="text-sm font-semibold text-foreground">🌿 {t.s1Route1T}</h3>
              <p className="mt-2 text-sm text-secondary">{t.s1Route1}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl bg-light-bg">
            <Image
              src="/images/guide/itineraire-commerces.jpg"
              alt={t.s1Route2T}
              width={720}
              height={1317}
              className="h-auto w-full object-cover"
              sizes="(max-width: 640px) 100vw, 480px"
            />
            <div className="p-5">
              <h3 className="text-sm font-semibold text-foreground">🛍️ {t.s1Route2T}</h3>
              <p className="mt-2 text-sm text-secondary">{t.s1Route2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Stationnement */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">🚗 {t.s2Title}</h2>
        <p className="mt-4 text-sm text-secondary">{t.s2Body}</p>
      </section>

      {/* 3. Accès maison */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">🔑 {t.s3Title}</h2>
        <div className="mt-5 overflow-hidden rounded-xl">
          <Image
            src="/images/guide/maison-exterieur.jpg"
            alt={PROPERTY_INFO.address.full}
            width={720}
            height={540}
            className="h-auto w-full object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
          />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-border">
            <Image
              src="/images/guide/clavier-acces.jpg"
              alt={t.s3Item1T}
              width={720}
              height={540}
              className="h-auto w-full object-cover"
              sizes="(max-width: 768px) 100vw, 448px"
            />
            <div className="p-5">
              <h3 className="text-sm font-semibold text-foreground">{t.s3Item1T}</h3>
              <p className="mt-2 text-sm text-secondary">{t.s3Item1}</p>
              <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
                💬 {t.s3Item1Note}
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground">{t.s3Item2T}</h3>
            <p className="mt-2 text-sm text-secondary">{t.s3Item2}</p>
          </div>
        </div>
      </section>

      {/* 4. Verrouillage */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">🔒 {t.s4Title}</h2>
        <ol className="mt-4 space-y-2 text-sm text-foreground">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              1
            </span>
            <span>{t.s4Step1}</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
              2
            </span>
            <span>{t.s4Step2}</span>
          </li>
        </ol>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-border">
            <Image
              src="/images/guide/verrouillage-poignee.jpg"
              alt={t.s4Step1}
              width={720}
              height={1042}
              className="h-auto w-full object-cover"
              sizes="(max-width: 640px) 100vw, 448px"
            />
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <Image
              src="/images/guide/verrouillage-bouton.png"
              alt={t.s4Step2}
              width={720}
              height={624}
              className="h-auto w-full object-cover"
              sizes="(max-width: 640px) 100vw, 448px"
            />
          </div>
        </div>
        <p className="mt-4 text-sm text-secondary">{t.s4Note}</p>
      </section>

      {/* 4.bis Verrouillage depuis l'extérieur */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">🚪 {t.s4OutTitle}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-[180px_1fr] sm:items-start">
          <div className="overflow-hidden rounded-xl border border-border bg-light-bg">
            <Image
              src="/images/guide/keypad.png"
              alt={t.s4OutTitle}
              width={225}
              height={302}
              className="h-auto w-full object-contain"
              sizes="(max-width: 640px) 100vw, 180px"
            />
          </div>
          <ol className="space-y-2 text-sm text-foreground">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                1
              </span>
              <span>{t.s4OutStep1}</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                2
              </span>
              <span>{t.s4OutStep2}</span>
            </li>
          </ol>
        </div>
      </section>

      {/* 5. WiFi */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">📶 {t.s5Title}</h2>
        <p className="mt-2 text-sm text-secondary">{t.s5Sub}</p>
        <div className="mt-5">
          <WifiQRCode locale={locale} />
        </div>
      </section>

      {/* 6. Chauffage */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">🔥 {t.s6Title}</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-[200px_1fr] sm:items-start">
          <div className="overflow-hidden rounded-xl border border-border">
            <Image
              src="/images/guide/chauffage-boitier.jpg"
              alt={t.s6Title}
              width={720}
              height={960}
              className="h-auto w-full object-cover"
              sizes="(max-width: 640px) 100vw, 200px"
            />
          </div>
          <div>
            <p className="text-sm text-secondary">{t.s6Body}</p>
            <p className="mt-3 text-sm text-secondary">{t.s6Note}</p>
          </div>
        </div>
      </section>

      {/* 7. Règles */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">📋 {t.s7Title}</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {t.s7Items.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-foreground">
              <span className="mt-0.5 text-primary">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-secondary italic">{t.s7Teens}</p>
      </section>

      {/* 7.bis En savoir plus sur la maison */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">ℹ️ {t.knowMoreTitle}</h2>
        <p className="mt-2 text-sm text-secondary">{t.knowMoreSub}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              href: `/${locale}#chambres`,
              icon: "🛏️",
              title: t.knowMoreRoomsT,
              desc: t.knowMoreRoomsD,
              cta: t.knowMoreRoomsCta,
            },
            {
              href: `/${locale}#equipements`,
              icon: "🧰",
              title: t.knowMoreAmenitiesT,
              desc: t.knowMoreAmenitiesD,
              cta: t.knowMoreAmenitiesCta,
            },
            {
              href: `/${locale}#localisation`,
              icon: "📍",
              title: t.knowMoreLocationT,
              desc: t.knowMoreLocationD,
              cta: t.knowMoreLocationCta,
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col rounded-xl border border-border p-5 transition-shadow hover:shadow-md"
            >
              <div className="text-2xl">{card.icon}</div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{card.title}</h3>
              <p className="mt-2 flex-1 text-xs text-secondary">{card.desc}</p>
              <span className="mt-3 inline-block text-xs font-medium text-primary">
                {card.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 8. Découvrir Le Mans */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">🗺️ {t.s8Title}</h2>
        <p className="mt-2 text-sm text-secondary">{t.s8Sub}</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {featuredPosts.map((post) => {
            const localized = getLocalizedPost(post, locale);
            return (
              <Link
                key={post.slug}
                href={`/${locale}/blog/${post.slug}`}
                className="group overflow-hidden rounded-xl border border-border transition-shadow hover:shadow-md"
              >
                <div className="relative h-40 w-full">
                  <Image
                    src={post.image}
                    alt={localized.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                    {localized.title}
                  </h3>
                  <p className="mt-2 text-xs text-secondary line-clamp-3">
                    {localized.excerpt}
                  </p>
                  <span className="mt-3 inline-block text-xs font-medium text-primary">
                    {t.s8ReadMore} →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 9. Avant de partir */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">👋 {t.s9Title}</h2>
        <p className="mt-3 rounded-md bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          ⏰ {t.s9Intro}
        </p>

        {/* Ménage / checkout tasks */}
        <div className="mt-6 rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground">🧹 {t.s9CheckoutSubT}</h3>
          <ul className="mt-3 space-y-2">
            {t.s9CheckoutItems.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-foreground">
                <span className="mt-0.5 text-primary">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Coup de pouce — placé avant Remise des clés et mis en valeur */}
        <div className="mt-5 rounded-xl border-2 border-rose-300 bg-rose-50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="text-3xl" aria-hidden="true">💚</div>
            <div>
              <h3 className="text-lg font-bold text-rose-900">{t.s9HelpT}</h3>
              <p className="mt-2 text-sm text-rose-900/80">{t.s9Help}</p>
            </div>
          </div>
        </div>

        {/* Remise des clés */}
        <div className="mt-5 rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground">🔑 {t.s9KeysT}</h3>
          <ul className="mt-3 space-y-2">
            {t.s9KeysItems.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-foreground">
                <span className="mt-0.5 text-primary">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Feedback privé via WhatsApp */}
        <div className="mt-5 rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground">💬 {t.s9FeedbackT}</h3>
          <p className="mt-2 text-sm text-secondary">{t.s9Feedback}</p>
          <a
            href={PROPERTY_INFO.contact.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
          >
            {t.s9FeedbackCta} →
          </a>
        </div>

        {/* CTA Google review */}
        <div className="mt-8 rounded-2xl bg-primary px-6 py-8 text-center text-white sm:px-10 sm:py-10">
          <h3 className="text-xl font-bold sm:text-2xl">{t.s9ReviewT}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/90">{t.s9ReviewBody}</p>
          <a
            href={PROPERTY_INFO.googleMaps.shortlink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-white/90"
          >
            {t.s9ReviewCta} →
          </a>
        </div>
      </section>

      {/* 10. Contact / urgence */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">📞 {t.s10Title}</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground">{t.s10HostT}</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a
                  href={PROPERTY_INFO.contact.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-dark"
                >
                  💬 {t.s10WA}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${PROPERTY_INFO.contact.phone}`}
                  className="text-foreground hover:text-primary"
                >
                  📱 {t.s10Phone} : {PROPERTY_INFO.contact.phone}
                </a>
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground">{t.s10EmergencyT}</h3>
            <ul className="mt-3 space-y-1 text-sm text-foreground">
              {t.s10Emergency.map((e) => (
                <li key={e.num} className="flex justify-between gap-3">
                  <span className="text-secondary">{e.label}</span>
                  <a href={`tel:${e.num}`} className="font-mono font-semibold text-foreground">
                    {e.num}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <p className="mt-12 text-center text-sm text-secondary">{t.closingNote}</p>
    </div>
  );
}
