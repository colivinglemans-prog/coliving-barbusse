import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { alternatesFor, openGraphLocales, seminarsPath } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

const WHATSAPP = "https://wa.me/33620921005";
const EMAIL = "contact@coliving-barbusse.fr";

type Lang = Locale;

/**
 * La page séminaires, écrite autour de **10 à 12 personnes**.
 *
 * Ce chiffre n'est pas un argument marketing, c'est la capacité réelle : onze personnes
 * dorment sans que personne partage un lit (sept chambres individuelles et deux chambres à
 * deux), et douze s'assoient autour de l'îlot de cuisine pour travailler. La version
 * précédente de cette page parlait de « 9 personnes » d'un bout à l'autre — un nombre que
 * personne ne tape dans un moteur de recherche — tout en annonçant « jusqu'à 20 » sur le
 * reste du site, c'est-à-dire le seul format où la maison ne peut pas tenir la promesse
 * d'un séminaire : au-delà de douze, les sessions de travail assises passent au jardin,
 * donc à la belle saison.
 *
 * Les listes structurées (`capRows`, `faqItems`) encodent leurs lignes avec `·` et leurs
 * colonnes avec `|`. C'est la convention déjà retenue par `whatItems` : le dictionnaire est
 * un `Record<Lang, Record<string, string>>`, il ne peut porter que des chaînes, et une
 * table de capacités reste plus lisible ici qu'éclatée en quinze clés numérotées.
 */
const T: Record<Lang, Record<string, string>> = {
  fr: {
    titleTag: "Séminaire d'entreprise au Mans — 10 à 12 personnes | Coliving Barbusse",
    desc: "Séminaire de 10 à 12 personnes au Mans dans une maison entière : 11 couchages sans partager de lit, 9 salles de bain privatives, îlot de 12 places assises, écran HDMI. À 10 min à pied de la gare TGV, Paris en 55 min.",
    heroKicker: "Séjours d'entreprise",
    heroTitle: "Votre séminaire au Mans, de 10 à 12 personnes",
    heroSub: "Une maison entière plutôt que dix chambres d'hôtel : 11 couchages sans partager de lit, 9 salles de bain privatives, 12 places assises pour travailler. Gare TGV à 10 min à pied, Paris en 55 min.",
    heroCta: "Demander un devis",
    heroCta2: "Voir le guide complet",
    reasonsTitle: "Pourquoi une maison entière plutôt qu'un hôtel",
    reason1T: "Personne ne partage un lit",
    reason1D: "7 chambres individuelles et 2 chambres à deux, soit 11 personnes logées, chacune avec sa salle de bain privative et sa clé. Une intimité que le twin d'hôtel ne donne pas.",
    reason2T: "12 places pour travailler",
    reason2D: "Îlot de cuisine de 12 places assises, salon chauffé avec grand écran smart TV et entrée HDMI — chacun branche son portable. Salle zen et jardin en renfort à la belle saison.",
    reason3T: "Team-building à 15 min",
    reason3D: "Circuit Bugatti (karting, pilotage, simulateurs), EVA Le Mans (VR), Arche de la Nature, escape games.",
    reason4T: "Installation dès 9h30",
    reason4D: "Gare TGV à 10 min à pied, installation possible dès 9h30 sous réserve de disponibilité. Le séminaire démarre le matin même, sans transfert à organiser.",
    capTitle: "Les capacités, en détail",
    capIntro: "Tous les chiffres, y compris ce qui dépend de la saison. De quoi décider sans avoir à nous appeler.",
    capCols: "Configuration|Capacité|Saison",
    capRows:
      "Couchage sans partager un lit|11 personnes — 7 chambres individuelles et 2 chambres à deux|Toute l'année·" +
      "Couchage total|20 personnes — 9 lits doubles et 2 clic-clac|Toute l'année·" +
      "Réunion assise, intérieur chauffé|12 places — îlot de cuisine|Toute l'année·" +
      "Debriefs et présentations|Salon chauffé, grand écran smart TV avec entrée HDMI|Toute l'année·" +
      "Salle zen|Espace de travail supplémentaire, non chauffé|Belle saison·" +
      "Jardin clos de 90 m², plein sud|20 places à table|Belle saison",
    capNote: "Le format le plus fréquent est de 10 à 12 participants. Au-delà de 12, la maison reste confortable pour un séjour de groupe, mais les sessions de travail assises se tiennent au jardin — donc d'avril à septembre.",
    whatTitle: "Ce qui est inclus",
    whatItems: "7 chambres individuelles et 2 chambres à deux, 9 salles de bain privatives·Îlot de cuisine, 12 places assises·Grand écran smart TV avec entrée HDMI au salon·Wi-Fi haut débit, bureau dans chaque chambre·Stationnement libre et gratuit dans la rue, sans disque ni horodateur·Cuisine entièrement équipée·Salle de sport et espace zen·Jardin clos de 90 m², exposé plein sud·Serrure connectée (self check-in)·Facture professionnelle, paiement par virement·Support WhatsApp 7j/7",
    extrasTitle: "Acteurs locaux pour compléter votre séjour",
    extrasIntro: "Nous n'organisons pas ces prestations, mais des professionnels locaux peuvent les prendre en charge directement :",
    extrasItems: "Traiteurs locaux (petit-déjeuner, déjeuner, dîner)·Taxis pour les transferts gare/circuit/maison·Prestataires d'activités team-building (karting, simulateurs, EVA…)",
    programTitle: "Programme type — 2 jours",
    day1T: "Jour 1 — Arrivée & cohésion",
    day1Body: "9h arrivée gare · 9h30 installation & café · 11h-13h session de travail autour de l'îlot · 13h déjeuner maison · 14h-17h brainstorm stratégique · 17h30-19h activité team-building (karting / simulateur F1 / EVA) · 20h dîner ensemble",
    day2T: "Jour 2 — Ateliers & clôture",
    day2Body: "8h-9h petit-déjeuner · 9h-12h ateliers (design thinking, OKR) · 12h30 déjeuner en ville · 14h-16h baptême de piste ou Musée des 24h · 16h-17h debrief final au salon · 17h départ TGV",
    pricingTitle: "Tarif indicatif",
    pricingBody: "~150-250 €/nuit/personne pour une équipe de 10 à 12, selon la saison, hors activités et restauration. À comparer à 10 chambres d'hôtel 3-4★, auxquelles il faut encore ajouter la location d'une salle de réunion.",
    faqTitle: "Questions fréquentes",
    faqItems:
      "Combien de personnes pour un séminaire ?|De 10 à 12 participants, c'est le format idéal : 11 personnes dorment sans partager de lit et 12 s'assoient autour de l'îlot de cuisine pour travailler. La maison peut coucher jusqu'à 20 personnes, mais au-delà de 12 les sessions de travail assises se tiennent au jardin, donc à la belle saison.·" +
      "Y a-t-il une salle de réunion ?|Il n'y a pas de salle de réunion dédiée. Les sessions de travail se tiennent autour de l'îlot de cuisine, 12 places assises, et le salon chauffé sert aux debriefs et aux présentations avec son grand écran smart TV et son entrée HDMI. La salle zen et le jardin offrent des espaces supplémentaires à la belle saison ; la salle zen n'est pas chauffée.·" +
      "Est-ce que chacun a sa chambre ?|7 participants ont une chambre individuelle et 2 chambres accueillent 2 personnes chacune, avec un lit double et un clic-clac une place — personne ne partage un lit. Les 9 chambres ont leur salle de bain privative, leur bureau et leur clé individuelle.·" +
      "Où se garer ?|Stationnement libre et gratuit rue Henri Barbusse et dans les rues adjacentes, sans disque ni horodateur. Plusieurs voitures peuvent stationner sans contrainte, ce qui est rare aussi près d'un centre-ville.·" +
      "Comment venir depuis Paris ?|Gare TGV du Mans à 55 min de Paris-Montparnasse, puis 10 minutes à pied jusqu'à la maison. Aucun transfert à organiser, aucun taxi à réserver.·" +
      "La restauration est-elle incluse ?|Non, mais la cuisine est entièrement équipée et des traiteurs locaux livrent petits-déjeuners, déjeuners et dîners sur place. Les restaurants du centre-ville sont accessibles à pied.·" +
      "Peut-on avoir une facture au nom de l'entreprise ?|Oui : facture professionnelle et paiement par virement. La réservation se fait en direct, sans commission de plateforme.",
    testimonialTitle: "Ils sont déjà venus",
    testimonialQuote: "Hôte super, logement au top tout était parfait pour une équipe de 9 personnes ! Je recommande à 200%. Merci pour votre accueil.",
    testimonialAuthor: "Loic",
    testimonialContext: "Séjour de quelques nuits · Avril 2026",
    ctaTitle: "Parlons de votre séminaire",
    ctaSub: "Décrivez-nous vos dates, vos objectifs, votre équipe — nous construisons ensemble un séjour sur mesure.",
    ctaWA: "Contacter sur WhatsApp",
    ctaEmail: "Écrire par email",
    guideLink: "Lire le guide détaillé",
  },
  en: {
    titleTag: "Corporate seminar in Le Mans — 10 to 12 people | Coliving Barbusse",
    desc: "Seminar for 10 to 12 people in Le Mans in a whole house: 11 guests without sharing a bed, 9 en-suite bathrooms, a 12-seat kitchen island, HDMI screen. 10 min on foot from the TGV station, Paris in 55 min.",
    heroKicker: "Corporate retreats",
    heroTitle: "Your seminar in Le Mans, for 10 to 12 people",
    heroSub: "A whole house rather than ten hotel rooms: 11 guests without sharing a bed, 9 en-suite bathrooms, 12 seats to work around. TGV station 10 min on foot, Paris in 55 min.",
    heroCta: "Request a quote",
    heroCta2: "Read the full guide",
    reasonsTitle: "Why a whole house beats a hotel",
    reason1T: "Nobody shares a bed",
    reason1D: "7 single-occupancy bedrooms and 2 twin bedrooms — 11 people, each with an en-suite bathroom and their own key. A level of privacy a hotel twin never gives.",
    reason2T: "12 seats to work around",
    reason2D: "A 12-seat kitchen island, a heated living room with a large smart TV and HDMI input — everyone plugs in their laptop. Zen room and garden as overflow in the warm season.",
    reason3T: "Team building 15 min away",
    reason3D: "Bugatti Circuit (karting, driving, simulators), EVA Le Mans (VR), Arche de la Nature, escape games.",
    reason4T: "Move in from 9.30 am",
    reason4D: "TGV station 10 min on foot, move-in from 9.30 am subject to availability. The seminar starts that same morning, with no transfer to arrange.",
    capTitle: "Capacity, in detail",
    capIntro: "Every figure, including what depends on the season. Enough to decide without calling us.",
    capCols: "Configuration|Capacity|Season",
    capRows:
      "Sleeping without sharing a bed|11 people — 7 single-occupancy bedrooms and 2 twin bedrooms|All year·" +
      "Total sleeping capacity|20 people — 9 double beds and 2 sofa beds|All year·" +
      "Seated meeting, heated indoors|12 seats — kitchen island|All year·" +
      "Debriefs and presentations|Heated living room, large smart TV with HDMI input|All year·" +
      "Zen room|Additional workspace, unheated|Warm season·" +
      "Enclosed 90 m² south-facing garden|Seats 20 at table|Warm season",
    capNote: "The most common format is 10 to 12 participants. Beyond 12 the house remains comfortable for a group stay, but seated work sessions move to the garden — so April to September.",
    whatTitle: "What's included",
    whatItems: "7 single-occupancy bedrooms and 2 twin bedrooms, 9 en-suite bathrooms·Kitchen island, 12 seats·Large smart TV with HDMI input in the living room·High-speed Wi-Fi, desk in every bedroom·Free street parking, no permit and no meter·Fully equipped kitchen·Gym and zen space·Enclosed 90 m² south-facing garden·Smart lock (self check-in)·Professional invoice, payment by bank transfer·WhatsApp support 7 days a week",
    extrasTitle: "Local providers to complete your stay",
    extrasIntro: "We do not organise these services ourselves, but local professionals can handle them directly:",
    extrasItems: "Local caterers (breakfast, lunch, dinner)·Taxis for station/circuit/house transfers·Team-building activity providers (karting, simulators, EVA…)",
    programTitle: "Sample 2-day programme",
    day1T: "Day 1 — Arrival & bonding",
    day1Body: "9 am station arrival · 9.30 am move-in & coffee · 11 am-1 pm work session around the island · 1 pm house lunch · 2-5 pm strategic brainstorm · 5.30-7 pm team-building activity (karting / F1 sim / EVA) · 8 pm dinner together",
    day2T: "Day 2 — Workshops & close",
    day2Body: "8-9 am breakfast · 9 am-12 workshops (design thinking, OKRs) · 12.30 pm lunch in town · 2-4 pm track baptism or 24 Hours Museum · 4-5 pm final debrief in the living room · 5 pm TGV departure",
    pricingTitle: "Indicative rate",
    pricingBody: "~€150-250/night/person for a team of 10 to 12, depending on season, excluding activities and catering. Compare that with 10 3-4★ hotel rooms, on top of which you still have to rent a meeting room.",
    faqTitle: "Frequently asked questions",
    faqItems:
      "How many people for a seminar?|10 to 12 participants is the ideal format: 11 people sleep without sharing a bed and 12 sit around the kitchen island to work. The house sleeps up to 20, but beyond 12 seated work sessions take place in the garden, so in the warm season.·" +
      "Is there a meeting room?|There is no dedicated meeting room. Work sessions take place around the kitchen island, which seats 12, and the heated living room hosts debriefs and presentations with its large smart TV and HDMI input. The zen room and garden provide extra space in the warm season; the zen room is unheated.·" +
      "Does everyone get their own bedroom?|7 participants get a bedroom to themselves and 2 bedrooms take 2 people each, with a double bed and a single sofa bed — nobody shares a bed. All 9 bedrooms have an en-suite bathroom, a desk and an individual key.·" +
      "Where can we park?|Free street parking on Rue Henri Barbusse and adjacent streets, with no permit and no parking meter. Several cars can park without restriction, which is rare this close to a city centre.·" +
      "How do we get there from Paris?|Le Mans TGV station is 55 min from Paris-Montparnasse, then 10 minutes on foot to the house. No transfer to arrange, no taxi to book.·" +
      "Are meals included?|No, but the kitchen is fully equipped and local caterers deliver breakfast, lunch and dinner on site. City-centre restaurants are within walking distance.·" +
      "Can we get an invoice in the company's name?|Yes: professional invoice and payment by bank transfer. Booking is direct, with no platform commission.",
    testimonialTitle: "They've already stayed with us",
    testimonialQuote: "Great host, top-notch accommodation, everything was perfect for our team of 9! Highly recommend. Thank you for the warm welcome.",
    testimonialAuthor: "Loic",
    testimonialContext: "Few-night stay · April 2026",
    ctaTitle: "Let's talk about your seminar",
    ctaSub: "Tell us your dates, goals, team — we'll build a bespoke stay together.",
    ctaWA: "Contact on WhatsApp",
    ctaEmail: "Write by email",
    guideLink: "Read the detailed guide",
  },
  it: {
    titleTag: "Seminario aziendale a Le Mans — 10-12 persone | Coliving Barbusse",
    desc: "Seminario per 10-12 persone a Le Mans in una casa intera: 11 posti letto senza condividere il letto, 9 bagni privati, isola da 12 posti a sedere, schermo HDMI. A 10 min a piedi dalla stazione TGV, Parigi in 55 min.",
    heroKicker: "Soggiorni aziendali",
    heroTitle: "Il tuo seminario a Le Mans, da 10 a 12 persone",
    heroSub: "Una casa intera invece di dieci camere d'albergo: 11 persone senza condividere il letto, 9 bagni privati, 12 posti a sedere per lavorare. Stazione TGV a 10 min a piedi, Parigi in 55 min.",
    heroCta: "Richiedi un preventivo",
    heroCta2: "Leggi la guida completa",
    reasonsTitle: "Perché una casa intera batte l'albergo",
    reason1T: "Nessuno condivide il letto",
    reason1D: "7 camere singole e 2 camere doppie, cioè 11 persone, ognuna con bagno privato e chiave personale. Una privacy che la doppia d'albergo non offre.",
    reason2T: "12 posti per lavorare",
    reason2D: "Isola della cucina da 12 posti a sedere, soggiorno riscaldato con grande smart TV e ingresso HDMI — ognuno collega il proprio portatile. Sala zen e giardino come spazi extra nella bella stagione.",
    reason3T: "Team building a 15 min",
    reason3D: "Circuito Bugatti (karting, guida, simulatori), EVA Le Mans (VR), Arche de la Nature, escape game.",
    reason4T: "Sistemazione dalle 9:30",
    reason4D: "Stazione TGV a 10 min a piedi, sistemazione possibile dalle 9:30 secondo disponibilità. Il seminario parte la mattina stessa, senza trasferimenti da organizzare.",
    capTitle: "Le capacità, nel dettaglio",
    capIntro: "Tutti i numeri, compreso ciò che dipende dalla stagione. Abbastanza per decidere senza doverci chiamare.",
    capCols: "Configurazione|Capacità|Stagione",
    capRows:
      "Posti letto senza condividere il letto|11 persone — 7 camere singole e 2 camere doppie|Tutto l'anno·" +
      "Posti letto totali|20 persone — 9 letti matrimoniali e 2 divani letto|Tutto l'anno·" +
      "Riunione seduti, interno riscaldato|12 posti — isola della cucina|Tutto l'anno·" +
      "Debrief e presentazioni|Soggiorno riscaldato, grande smart TV con ingresso HDMI|Tutto l'anno·" +
      "Sala zen|Spazio di lavoro aggiuntivo, non riscaldato|Bella stagione·" +
      "Giardino recintato di 90 m², esposto a sud|20 posti a tavola|Bella stagione",
    capNote: "Il formato più frequente è da 10 a 12 partecipanti. Oltre i 12 la casa resta comoda per un soggiorno di gruppo, ma le sessioni di lavoro sedute si spostano in giardino — quindi da aprile a settembre.",
    whatTitle: "Cosa è incluso",
    whatItems: "7 camere singole e 2 camere doppie, 9 bagni privati·Isola della cucina, 12 posti a sedere·Grande smart TV con ingresso HDMI in soggiorno·Wi-Fi ad alta velocità, scrivania in ogni camera·Parcheggio libero e gratuito in strada, senza disco né parchimetro·Cucina completamente attrezzata·Palestra e spazio zen·Giardino recintato di 90 m², esposto a sud·Serratura connessa (self check-in)·Fattura professionale, pagamento con bonifico·Supporto WhatsApp 7 giorni su 7",
    extrasTitle: "Operatori locali per completare il soggiorno",
    extrasIntro: "Non organizziamo noi questi servizi, ma professionisti locali possono occuparsene direttamente:",
    extrasItems: "Catering locali (colazione, pranzo, cena)·Taxi per i trasferimenti stazione/circuito/casa·Fornitori di attività team-building (karting, simulatori, EVA…)",
    programTitle: "Programma tipo — 2 giorni",
    day1T: "Giorno 1 — Arrivo e coesione",
    day1Body: "ore 9 arrivo in stazione · 9:30 sistemazione e caffè · 11-13 sessione di lavoro attorno all'isola · 13 pranzo in casa · 14-17 brainstorming strategico · 17:30-19 attività team-building (karting / simulatore F1 / EVA) · 20 cena insieme",
    day2T: "Giorno 2 — Workshop e chiusura",
    day2Body: "8-9 colazione · 9-12 workshop (design thinking, OKR) · 12:30 pranzo in città · 14-16 battesimo della pista o Museo 24 Ore · 16-17 debrief finale in soggiorno · 17 partenza TGV",
    pricingTitle: "Tariffa indicativa",
    pricingBody: "~150-250 €/notte/persona per un team da 10 a 12, a seconda della stagione, escluse attività e ristorazione. Da confrontare con 10 camere d'hotel 3-4★, a cui va ancora aggiunto l'affitto di una sala riunioni.",
    faqTitle: "Domande frequenti",
    faqItems:
      "Quante persone per un seminario?|Da 10 a 12 partecipanti è il formato ideale: 11 persone dormono senza condividere il letto e 12 si siedono attorno all'isola della cucina per lavorare. La casa può ospitare fino a 20 persone, ma oltre le 12 le sessioni di lavoro sedute si tengono in giardino, quindi nella bella stagione.·" +
      "C'è una sala riunioni?|Non c'è una sala riunioni dedicata. Le sessioni di lavoro si tengono attorno all'isola della cucina, 12 posti a sedere, e il soggiorno riscaldato ospita debrief e presentazioni con la sua grande smart TV e l'ingresso HDMI. Sala zen e giardino offrono spazi aggiuntivi nella bella stagione; la sala zen non è riscaldata.·" +
      "Ognuno ha la sua camera?|7 partecipanti hanno una camera singola e 2 camere accolgono 2 persone ciascuna, con letto matrimoniale e divano letto singolo — nessuno condivide il letto. Tutte le 9 camere hanno bagno privato, scrivania e chiave individuale.·" +
      "Dove si parcheggia?|Parcheggio libero e gratuito in rue Henri Barbusse e nelle vie adiacenti, senza disco né parchimetro. Più auto possono sostare senza vincoli, cosa rara così vicino a un centro città.·" +
      "Come si arriva da Parigi?|La stazione TGV di Le Mans è a 55 min da Paris-Montparnasse, poi 10 minuti a piedi fino alla casa. Nessun trasferimento da organizzare, nessun taxi da prenotare.·" +
      "La ristorazione è inclusa?|No, ma la cucina è completamente attrezzata e i catering locali consegnano colazioni, pranzi e cene sul posto. I ristoranti del centro sono raggiungibili a piedi.·" +
      "Si può avere una fattura intestata all'azienda?|Sì: fattura professionale e pagamento con bonifico. La prenotazione è diretta, senza commissioni di piattaforma.",
    testimonialTitle: "Sono già stati con noi",
    testimonialQuote: "Host fantastico, alloggio al top, tutto perfetto per un team di 9 persone! Lo consiglio al 200%. Grazie per l'accoglienza.",
    testimonialAuthor: "Loic",
    testimonialContext: "Soggiorno di alcune notti · Aprile 2026",
    ctaTitle: "Parliamo del tuo seminario",
    ctaSub: "Raccontaci le tue date, i tuoi obiettivi, il tuo team — costruiamo insieme un soggiorno su misura.",
    ctaWA: "Contatta su WhatsApp",
    ctaEmail: "Scrivi via email",
    guideLink: "Leggi la guida dettagliata",
  },
  de: {
    titleTag: "Firmenseminar in Le Mans — 10 bis 12 Personen | Coliving Barbusse",
    desc: "Seminar für 10 bis 12 Personen in Le Mans in einem ganzen Haus: 11 Schlafplätze ohne geteiltes Bett, 9 eigene Bäder, Kücheninsel mit 12 Sitzplätzen, HDMI-Bildschirm. 10 Min. zu Fuß vom TGV-Bahnhof, Paris in 55 Min.",
    heroKicker: "Firmenaufenthalte",
    heroTitle: "Ihr Seminar in Le Mans, für 10 bis 12 Personen",
    heroSub: "Ein ganzes Haus statt zehn Hotelzimmer: 11 Schlafplätze ohne geteiltes Bett, 9 eigene Bäder, 12 Sitzplätze zum Arbeiten. TGV-Bahnhof 10 Min. zu Fuß, Paris in 55 Min.",
    heroCta: "Angebot anfragen",
    heroCta2: "Den ausführlichen Guide lesen",
    reasonsTitle: "Warum ein ganzes Haus besser ist als ein Hotel",
    reason1T: "Niemand teilt sich ein Bett",
    reason1D: "7 Einzelzimmer und 2 Zweibettzimmer, also 11 Personen, jede mit eigenem Bad und eigenem Schlüssel. Eine Privatsphäre, die das Hotel-Twin nicht bietet.",
    reason2T: "12 Sitzplätze zum Arbeiten",
    reason2D: "Kücheninsel mit 12 Sitzplätzen, beheiztes Wohnzimmer mit großem Smart-TV und HDMI-Eingang — jeder schließt seinen Laptop an. Zen-Raum und Garten als Zusatzflächen in der warmen Jahreszeit.",
    reason3T: "Teambuilding 15 Min. entfernt",
    reason3D: "Rennstrecke Bugatti (Karting, Fahrtraining, Simulatoren), EVA Le Mans (VR), Arche de la Nature, Escape Games.",
    reason4T: "Bezug ab 9:30 Uhr",
    reason4D: "TGV-Bahnhof 10 Min. zu Fuß, Bezug ab 9:30 Uhr je nach Verfügbarkeit. Das Seminar startet noch am selben Morgen, ohne Transfer.",
    capTitle: "Die Kapazitäten im Detail",
    capIntro: "Alle Zahlen, auch das, was von der Jahreszeit abhängt. Genug, um ohne Anruf zu entscheiden.",
    capCols: "Konfiguration|Kapazität|Jahreszeit",
    capRows:
      "Schlafen ohne geteiltes Bett|11 Personen — 7 Einzelzimmer und 2 Zweibettzimmer|Ganzjährig·" +
      "Schlafplätze insgesamt|20 Personen — 9 Doppelbetten und 2 Schlafsofas|Ganzjährig·" +
      "Sitzung im beheizten Innenraum|12 Plätze — Kücheninsel|Ganzjährig·" +
      "Debriefings und Präsentationen|Beheiztes Wohnzimmer, großer Smart-TV mit HDMI-Eingang|Ganzjährig·" +
      "Zen-Raum|Zusätzliche Arbeitsfläche, unbeheizt|Warme Jahreszeit·" +
      "Eingezäunter Südgarten, 90 m²|20 Plätze am Tisch|Warme Jahreszeit",
    capNote: "Das häufigste Format sind 10 bis 12 Teilnehmende. Über 12 hinaus bleibt das Haus für einen Gruppenaufenthalt bequem, die Arbeitssitzungen im Sitzen finden dann aber im Garten statt — also von April bis September.",
    whatTitle: "Was inbegriffen ist",
    whatItems: "7 Einzelzimmer und 2 Zweibettzimmer, 9 eigene Bäder·Kücheninsel mit 12 Sitzplätzen·Großer Smart-TV mit HDMI-Eingang im Wohnzimmer·Highspeed-WLAN, Schreibtisch in jedem Zimmer·Kostenloses Parken auf der Straße, ohne Parkscheibe und ohne Parkuhr·Voll ausgestattete Küche·Fitnessraum und Zen-Bereich·Eingezäunter Südgarten, 90 m²·Smart Lock (Self-Check-in)·Professionelle Rechnung, Zahlung per Überweisung·WhatsApp-Support 7 Tage die Woche",
    extrasTitle: "Lokale Anbieter für Ihren Aufenthalt",
    extrasIntro: "Wir organisieren diese Leistungen nicht selbst, lokale Anbieter können sie aber direkt übernehmen:",
    extrasItems: "Lokale Caterer (Frühstück, Mittag-, Abendessen)·Taxis für Transfers Bahnhof/Rennstrecke/Haus·Teambuilding-Anbieter (Karting, Simulatoren, EVA…)",
    programTitle: "Beispielprogramm — 2 Tage",
    day1T: "Tag 1 — Ankunft & Teambuilding",
    day1Body: "9 Uhr Ankunft Bahnhof · 9:30 Uhr Bezug & Kaffee · 11-13 Uhr Arbeitssession an der Kücheninsel · 13 Uhr Mittagessen im Haus · 14-17 Uhr strategisches Brainstorming · 17:30-19 Uhr Teambuilding (Karting / F1-Simulator / EVA) · 20 Uhr gemeinsames Abendessen",
    day2T: "Tag 2 — Workshops & Abschluss",
    day2Body: "8-9 Uhr Frühstück · 9-12 Uhr Workshops (Design Thinking, OKRs) · 12:30 Uhr Mittagessen in der Stadt · 14-16 Uhr Streckenfahrt oder 24-Stunden-Museum · 16-17 Uhr Abschluss-Debriefing im Wohnzimmer · 17 Uhr TGV-Abreise",
    pricingTitle: "Richtpreis",
    pricingBody: "~150-250 €/Nacht/Person für ein Team von 10 bis 12, je nach Saison, ohne Aktivitäten und Verpflegung. Zum Vergleich: 10 Hotelzimmer der Kategorie 3-4★, zu denen noch die Miete eines Konferenzraums kommt.",
    faqTitle: "Häufige Fragen",
    faqItems:
      "Für wie viele Personen eignet sich ein Seminar?|10 bis 12 Teilnehmende sind das ideale Format: 11 Personen schlafen, ohne ein Bett zu teilen, und 12 sitzen zum Arbeiten an der Kücheninsel. Das Haus bietet bis zu 20 Schlafplätze, über 12 hinaus finden Arbeitssitzungen im Sitzen jedoch im Garten statt, also in der warmen Jahreszeit.·" +
      "Gibt es einen Konferenzraum?|Einen eigenen Konferenzraum gibt es nicht. Die Arbeitssitzungen finden an der Kücheninsel mit 12 Sitzplätzen statt, das beheizte Wohnzimmer dient mit großem Smart-TV und HDMI-Eingang für Debriefings und Präsentationen. Zen-Raum und Garten bieten in der warmen Jahreszeit zusätzliche Fläche; der Zen-Raum ist unbeheizt.·" +
      "Bekommt jede Person ein eigenes Zimmer?|7 Teilnehmende haben ein Zimmer für sich, 2 Zimmer nehmen je 2 Personen auf, mit Doppelbett und Einzel-Schlafsofa — niemand teilt sich ein Bett. Alle 9 Zimmer haben ein eigenes Bad, einen Schreibtisch und einen eigenen Schlüssel.·" +
      "Wo kann man parken?|Kostenloses Parken in der Rue Henri Barbusse und den Nebenstraßen, ohne Parkscheibe und ohne Parkuhr. Mehrere Autos können ohne Einschränkung parken, was so nah an einer Innenstadt selten ist.·" +
      "Wie kommt man von Paris aus hin?|Der TGV-Bahnhof Le Mans liegt 55 Min. von Paris-Montparnasse entfernt, dann sind es 10 Minuten zu Fuß bis zum Haus. Kein Transfer, kein Taxi nötig.·" +
      "Ist die Verpflegung inbegriffen?|Nein, aber die Küche ist voll ausgestattet und lokale Caterer liefern Frühstück, Mittag- und Abendessen ins Haus. Die Restaurants der Innenstadt sind zu Fuß erreichbar.·" +
      "Ist eine Rechnung auf die Firma möglich?|Ja: professionelle Rechnung und Zahlung per Überweisung. Die Buchung erfolgt direkt, ohne Plattformprovision.",
    testimonialTitle: "Sie waren schon bei uns",
    testimonialQuote: "Großartiger Gastgeber, top Unterkunft, alles perfekt für ein Team von 9 Personen! Absolute Empfehlung. Danke für den herzlichen Empfang.",
    testimonialAuthor: "Loic",
    testimonialContext: "Aufenthalt einige Nächte · April 2026",
    ctaTitle: "Sprechen wir über Ihr Seminar",
    ctaSub: "Nennen Sie uns Ihre Daten, Ihre Ziele, Ihr Team — wir gestalten gemeinsam einen maßgeschneiderten Aufenthalt.",
    ctaWA: "Auf WhatsApp kontaktieren",
    ctaEmail: "Per E-Mail schreiben",
    guideLink: "Den detaillierten Guide lesen",
  },
  es: {
    titleTag: "Seminario de empresa en Le Mans — 10 a 12 personas | Coliving Barbusse",
    desc: "Seminario para 10 a 12 personas en Le Mans en una casa entera: 11 plazas sin compartir cama, 9 baños privados, isla de 12 plazas sentadas, pantalla HDMI. A 10 min a pie de la estación TGV, París en 55 min.",
    heroKicker: "Estancias de empresa",
    heroTitle: "Tu seminario en Le Mans, de 10 a 12 personas",
    heroSub: "Una casa entera en lugar de diez habitaciones de hotel: 11 personas sin compartir cama, 9 baños privados, 12 plazas sentadas para trabajar. Estación TGV a 10 min a pie, París en 55 min.",
    heroCta: "Solicitar presupuesto",
    heroCta2: "Leer la guía completa",
    reasonsTitle: "Por qué una casa entera gana al hotel",
    reason1T: "Nadie comparte cama",
    reason1D: "7 habitaciones individuales y 2 habitaciones dobles, es decir 11 personas, cada una con su baño privado y su llave. Una intimidad que la habitación twin de hotel no ofrece.",
    reason2T: "12 plazas para trabajar",
    reason2D: "Isla de cocina de 12 plazas sentadas, salón con calefacción, gran smart TV y entrada HDMI — cada uno conecta su portátil. Sala zen y jardín como espacios extra en la buena estación.",
    reason3T: "Team building a 15 min",
    reason3D: "Circuito Bugatti (karting, conducción, simuladores), EVA Le Mans (VR), Arche de la Nature, escape rooms.",
    reason4T: "Instalación desde las 9:30",
    reason4D: "Estación TGV a 10 min a pie, instalación posible desde las 9:30 sujeto a disponibilidad. El seminario empieza esa misma mañana, sin traslados que organizar.",
    capTitle: "Las capacidades, en detalle",
    capIntro: "Todas las cifras, incluido lo que depende de la temporada. Suficiente para decidir sin llamarnos.",
    capCols: "Configuración|Capacidad|Temporada",
    capRows:
      "Dormir sin compartir cama|11 personas — 7 habitaciones individuales y 2 habitaciones dobles|Todo el año·" +
      "Plazas totales para dormir|20 personas — 9 camas dobles y 2 sofás cama|Todo el año·" +
      "Reunión sentados, interior con calefacción|12 plazas — isla de cocina|Todo el año·" +
      "Debriefs y presentaciones|Salón con calefacción, gran smart TV con entrada HDMI|Todo el año·" +
      "Sala zen|Espacio de trabajo adicional, sin calefacción|Buena estación·" +
      "Jardín cerrado de 90 m², orientado al sur|20 plazas en mesa|Buena estación",
    capNote: "El formato más frecuente es de 10 a 12 participantes. A partir de 12 la casa sigue siendo cómoda para una estancia de grupo, pero las sesiones de trabajo sentados se trasladan al jardín — es decir, de abril a septiembre.",
    whatTitle: "Lo que está incluido",
    whatItems: "7 habitaciones individuales y 2 habitaciones dobles, 9 baños privados·Isla de cocina, 12 plazas sentadas·Gran smart TV con entrada HDMI en el salón·Wi-Fi de alta velocidad, escritorio en cada habitación·Aparcamiento libre y gratuito en la calle, sin disco ni parquímetro·Cocina totalmente equipada·Gimnasio y espacio zen·Jardín cerrado de 90 m², orientado al sur·Cerradura conectada (self check-in)·Factura profesional, pago por transferencia·Soporte WhatsApp 7 días a la semana",
    extrasTitle: "Proveedores locales para completar tu estancia",
    extrasIntro: "No organizamos estos servicios nosotros, pero profesionales locales pueden encargarse directamente:",
    extrasItems: "Catering local (desayuno, almuerzo, cena)·Taxis para traslados estación/circuito/casa·Proveedores de actividades team-building (karting, simuladores, EVA…)",
    programTitle: "Programa tipo — 2 días",
    day1T: "Día 1 — Llegada y cohesión",
    day1Body: "9:00 llegada a la estación · 9:30 instalación y café · 11:00-13:00 sesión de trabajo en torno a la isla · 13:00 almuerzo en casa · 14:00-17:00 brainstorming estratégico · 17:30-19:00 actividad team-building (karting / simulador F1 / EVA) · 20:00 cena juntos",
    day2T: "Día 2 — Talleres y cierre",
    day2Body: "8:00-9:00 desayuno · 9:00-12:00 talleres (design thinking, OKR) · 12:30 almuerzo en la ciudad · 14:00-16:00 bautismo de pista o Museo 24 Horas · 16:00-17:00 debrief final en el salón · 17:00 salida TGV",
    pricingTitle: "Tarifa orientativa",
    pricingBody: "~150-250 €/noche/persona para un equipo de 10 a 12, según temporada, sin actividades ni restauración. Compáralo con 10 habitaciones de hotel 3-4★, a las que hay que sumar el alquiler de una sala de reuniones.",
    faqTitle: "Preguntas frecuentes",
    faqItems:
      "¿Cuántas personas para un seminario?|De 10 a 12 participantes es el formato ideal: 11 personas duermen sin compartir cama y 12 se sientan en torno a la isla de cocina para trabajar. La casa puede alojar hasta 20 personas, pero a partir de 12 las sesiones de trabajo sentados se celebran en el jardín, es decir en la buena estación.·" +
      "¿Hay sala de reuniones?|No hay una sala de reuniones dedicada. Las sesiones de trabajo se celebran en torno a la isla de cocina, de 12 plazas sentadas, y el salón con calefacción acoge los debriefs y las presentaciones con su gran smart TV y su entrada HDMI. La sala zen y el jardín ofrecen espacios adicionales en la buena estación; la sala zen no tiene calefacción.·" +
      "¿Cada uno tiene su habitación?|7 participantes tienen habitación individual y 2 habitaciones acogen a 2 personas cada una, con cama doble y sofá cama individual — nadie comparte cama. Las 9 habitaciones tienen baño privado, escritorio y llave individual.·" +
      "¿Dónde aparcar?|Aparcamiento libre y gratuito en la rue Henri Barbusse y calles adyacentes, sin disco ni parquímetro. Varios coches pueden aparcar sin restricciones, algo poco habitual tan cerca de un centro urbano.·" +
      "¿Cómo llegar desde París?|La estación TGV de Le Mans está a 55 min de Paris-Montparnasse, y luego 10 minutos a pie hasta la casa. Ningún traslado que organizar, ningún taxi que reservar.·" +
      "¿La restauración está incluida?|No, pero la cocina está totalmente equipada y los caterings locales entregan desayunos, almuerzos y cenas en la casa. Los restaurantes del centro están a poca distancia a pie.·" +
      "¿Se puede emitir factura a nombre de la empresa?|Sí: factura profesional y pago por transferencia. La reserva es directa, sin comisión de plataforma.",
    testimonialTitle: "Ya han estado con nosotros",
    testimonialQuote: "Anfitrión genial, alojamiento de primera, ¡todo perfecto para un equipo de 9 personas! Lo recomiendo al 200 %. Gracias por la acogida.",
    testimonialAuthor: "Loic",
    testimonialContext: "Estancia de unas noches · Abril de 2026",
    ctaTitle: "Hablemos de tu seminario",
    ctaSub: "Cuéntanos tus fechas, tus objetivos, tu equipo — construimos juntos una estancia a medida.",
    ctaWA: "Contactar por WhatsApp",
    ctaEmail: "Escribir por email",
    guideLink: "Leer la guía detallada",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale as Lang) in T ? (rawLocale as Lang) : "fr";
  const t = T[locale];
  const url = `${SITE_URL}${seminarsPath(locale)}`;

  return {
    title: t.titleTag,
    description: t.desc,
    alternates: alternatesFor(locale, seminarsPath),
    openGraph: {
      title: t.titleTag,
      description: t.desc,
      url,
      ...openGraphLocales(locale),
      type: "website",
    },
  };
}

export default async function Seminaires({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale as Lang) in T ? (rawLocale as Lang) : "fr";
  const t = T[locale];

  const whatItems = t.whatItems.split("·");
  const extrasItems = t.extrasItems.split("·");
  const capCols = t.capCols.split("|");
  const capRows = t.capRows.split("·").map((row) => row.split("|"));
  const faqItems = t.faqItems.split("·").map((item) => {
    const [question, ...rest] = item.split("|");
    return { question, answer: rest.join("|") };
  });

  /**
   * Deux blocs de données structurées.
   *
   * Le `LodgingBusiness` de la page d'accueil décrit la maison ; celui-ci décrit **ce
   * qu'elle permet en séminaire**, ce qui n'est pas la même chose. `maximumAttendeeCapacity`
   * vaut 12 — la capacité de travail assis en intérieur chauffé — et non les 20 couchages :
   * c'est le chiffre qu'un organisateur cherche, et c'est celui qu'on peut tenir en février.
   *
   * La `FAQPage` reprend les questions telles qu'elles se posent, avec des réponses
   * autosuffisantes : une réponse extraite de son contexte doit rester vraie toute seule.
   */
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "LodgingBusiness",
      "@id": `${SITE_URL}${seminarsPath(locale)}#lodging`,
      name: "Coliving Barbusse",
      description: t.desc,
      url: `${SITE_URL}${seminarsPath(locale)}`,
      image: `${SITE_URL}/images/blog/seminaire.jpg`,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Rue Henri Barbusse",
        addressLocality: "Le Mans",
        postalCode: "72000",
        addressCountry: "FR",
      },
      geo: { "@type": "GeoCoordinates", latitude: 47.9842, longitude: 0.1976 },
      numberOfRooms: 9,
      maximumAttendeeCapacity: 12,
      amenityFeature: [
        { "@type": "LocationFeatureSpecification", name: "Meeting space", value: true },
        { "@type": "LocationFeatureSpecification", name: "Presentation screen (smart TV, HDMI)", value: true },
        { "@type": "LocationFeatureSpecification", name: "Free street parking", value: true },
        { "@type": "LocationFeatureSpecification", name: "High-speed Wi-Fi", value: true },
        { "@type": "LocationFeatureSpecification", name: "Private bathroom in every bedroom", value: true },
        { "@type": "LocationFeatureSpecification", name: "Garden", value: true },
        { "@type": "LocationFeatureSpecification", name: "Gym", value: true },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "24",
        bestRating: "5",
      },
      inLanguage: locale,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${SITE_URL}${seminarsPath(locale)}#faq`,
      inLanguage: locale,
      mainEntity: faqItems.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl">
        <div className="relative h-[360px] w-full sm:h-[440px]">
          <Image
            src="/images/blog/seminaire.jpg"
            alt={t.heroTitle}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
              {t.heroKicker}
            </p>
            <h1 className="mt-2 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-5xl">
              {t.heroTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
              {t.heroSub}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                {t.heroCta}
              </a>
              <Link
                href={`/${locale}/blog/seminaire-entreprise-le-mans`}
                className="inline-flex items-center justify-center rounded-full border border-white/80 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                {t.heroCta2}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reasons */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">{t.reasonsTitle}</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: t.reason1T, d: t.reason1D, icon: "🛏️" },
            { t: t.reason2T, d: t.reason2D, icon: "💼" },
            { t: t.reason3T, d: t.reason3D, icon: "🏁" },
            { t: t.reason4T, d: t.reason4D, icon: "🚄" },
          ].map((r) => (
            <div key={r.t} className="rounded-xl border border-border p-5">
              <div className="text-2xl">{r.icon}</div>
              <h3 className="mt-3 font-semibold text-foreground">{r.t}</h3>
              <p className="mt-2 text-sm text-secondary">{r.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Capacités */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">{t.capTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm text-secondary">{t.capIntro}</p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                {capCols.map((col) => (
                  <th key={col} className="py-3 pr-4 font-semibold text-foreground">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {capRows.map(([config, capacity, season]) => (
                <tr key={config} className="border-b border-border/60">
                  <td className="py-3 pr-4 font-medium text-foreground">{config}</td>
                  <td className="py-3 pr-4 text-secondary">{capacity}</td>
                  <td className="whitespace-nowrap py-3 pr-4 text-secondary">{season}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 max-w-3xl rounded-xl bg-light-bg p-4 text-sm text-foreground">
          {t.capNote}
        </p>
      </section>

      {/* What / Extras */}
      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="rounded-xl bg-light-bg p-6">
          <h2 className="text-xl font-semibold text-foreground">{t.whatTitle}</h2>
          <ul className="mt-4 space-y-2 text-sm text-foreground">
            {whatItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-primary">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground">{t.extrasTitle}</h2>
          <p className="mt-2 text-sm text-secondary">{t.extrasIntro}</p>
          <ul className="mt-4 space-y-2 text-sm text-foreground">
            {extrasItems.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-0.5 text-secondary">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Program */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">{t.programTitle}</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground">{t.day1T}</h3>
            <p className="mt-2 text-sm text-secondary">{t.day1Body}</p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold text-foreground">{t.day2T}</h3>
            <p className="mt-2 text-sm text-secondary">{t.day2Body}</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="mt-12 rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground">{t.pricingTitle}</h2>
        <p className="mt-3 text-sm text-secondary">{t.pricingBody}</p>
      </section>

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">{t.faqTitle}</h2>
        <div className="mt-6 divide-y divide-border rounded-xl border border-border">
          {faqItems.map((f) => (
            <details key={f.question} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold text-foreground marker:content-none">
                <span className="inline-flex w-full items-center justify-between gap-4">
                  {f.question}
                  <span className="text-secondary transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-secondary">{f.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-foreground">{t.testimonialTitle}</h2>
        <figure className="mt-6 rounded-2xl border border-border bg-light-bg p-6 sm:p-8">
          <div className="flex gap-1 text-amber-500" aria-label="5 stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l2.9 6.9L22 9.2l-5.5 4.8L18.2 22 12 18.3 5.8 22l1.7-8L2 9.2l7.1-.3L12 2z" />
              </svg>
            ))}
          </div>
          <blockquote className="mt-4 text-base text-foreground sm:text-lg">
            « {t.testimonialQuote} »
          </blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://a0.muscache.com/im/pictures/user/User/original/43648aad-e5bc-4e6f-8c70-395fa4165e84.jpeg?im_w=240"
              alt={t.testimonialAuthor}
              className="h-10 w-10 rounded-full object-cover"
              loading="lazy"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{t.testimonialAuthor}</p>
              <p className="text-xs text-secondary">{t.testimonialContext}</p>
            </div>
          </figcaption>
        </figure>
      </section>

      {/* CTA */}
      <section className="mt-12 rounded-2xl bg-primary px-6 py-10 text-center text-white sm:px-10 sm:py-14">
        <h2 className="text-2xl font-bold sm:text-3xl">{t.ctaTitle}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
          {t.ctaSub}
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-white/90"
          >
            {t.ctaWA}
          </a>
          <a
            href={`mailto:${EMAIL}?subject=${encodeURIComponent(
              { fr: "Demande séminaire", en: "Seminar request", it: "Richiesta seminario", de: "Seminar-Anfrage", es: "Solicitud de seminario" }[locale],
            )}`}
            className="inline-flex items-center justify-center rounded-full border border-white px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {t.ctaEmail}
          </a>
        </div>
        <Link
          href={`/${locale}/blog/seminaire-entreprise-le-mans`}
          className="mt-6 inline-block text-sm text-white/90 underline underline-offset-4 hover:text-white"
        >
          {t.guideLink} →
        </Link>
      </section>
    </div>
  );
}
