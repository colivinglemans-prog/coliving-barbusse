import type { Dictionary } from "../types";

export const de: Dictionary = {
  header: {
    rooms: "Zimmer",
    amenities: "Ausstattung",
    location: "Lage",
    book: "Buchen",
    seminars: "Seminare",
    blog: "Blog",
    tagline1: "Premium-Haus · 9 private Suiten",
    tagline2: "Nahe der Rennstrecke Le Mans",
  },
  propertyHeader: {
    title: "Premium-Haus mit 9 privaten Suiten in der Nähe der Rennstrecke Le Mans",
    superhost: "Superhost",
    location: "Le Mans, Pays de la Loire, Frankreich",
    travelers: "18 Gäste",
    rooms: "9 Schlafzimmer",
    beds: "9 Doppelbetten",
    bathrooms: "9 private Bäder",
    area: "215 m²",
  },
  highlights: {
    selfCheckIn: {
      title: "Selbstständiges Einchecken",
      description: "Zugang zur Unterkunft über ein Smart Lock. Anreise ab 17 Uhr.",
    },
    quiet: {
      title: "Ruhig und friedlich",
      description: "Ruhige Wohngegend, in der Nähe des Parc Gué de Maulny. Ideal zum Erholen.",
    },
    superhost: {
      title: "Alexandre ist Superhost",
      description: "Superhost auf Airbnb seit April 2024 — Superhosts sind erfahrene, hoch bewertete Gastgeber, die sich für hervorragende Aufenthalte engagieren.",
      reviewsLink: "Über 100 Bewertungen auf meinem Airbnb-Profil entdecken",
    },
  },
  description: {
    title: "Beschreibung",
    readMore: "Mehr lesen",
    showLess: "Weniger anzeigen",
    body: `Unser 215 m² großes Haus bietet einen Komfort, den man in Le Mans bei Ferienvermietungen sonst nicht findet.

9 Doppelzimmer, jedes mit eigenem Duschbad — niemand muss das Bad teilen, auch nicht in großen Gruppen!

Hochwertige Bettwäsche, Stauraum und echte Privatsphäre in jedem Zimmer. Jede Suite verfügt über ein Doppelbett mit Stauraum, einen Schreibtisch mit Ethernet-Anschluss, ein eigenes Bad, einen Smart-TV, einen Kleiderbereich und einen individuellen Schlüssel.

Das Haus erstreckt sich über 3 Etagen mit einem großen Wohnzimmer, einer voll ausgestatteten Wohnküche, einem 90 m² großen, eingezäunten Garten und einem voll ausgestatteten Fitnessraum mit Zen-Bereich.

Ideal für gemischte Gruppen, Kollegen, Freunde oder Patchwork-Familien. Dieses Konzept ermöglicht es jedem, in seinem eigenen Rhythmus zu leben und gleichzeitig das Vergnügen des Zusammenseins zu genießen.

Perfekt für Events, Rennteams, Firmenaufenthalte und Gruppenreisen während der 24 Stunden von Le Mans und der großen Veranstaltungen der Rennstrecke. Einfacher Zugang zur Rennstrecke Bugatti über die Straßenbahn T1 vom TGV-Bahnhof.

Bis zu 18 Personen.`,
  },
  sleeping: {
    title: "Wo Sie schlafen werden",
    room: "Zimmer",
    doubleBed: "1 Doppelbett",
    features: "Privates Bad · Smart TV · Schreibtisch · Kleiderschrank · Eigener Schlüssel",
    prevPhoto: "Vorheriges Foto",
    nextPhoto: "Nächstes Foto",
  },
  commonSpaces: {
    title: "Sportbereich",
    subtitle: "Privater Bereich in einem Anbau des Hauses, rund um die Uhr frei zugänglich — ohne Gefahr, jemanden zu wecken.",
    gym: "Fitnessraum",
    gymDesc: "Fitnessgeräte verfügbar: Crosstrainer, Laufband, Hanteln und Hantelbank.",
    zen: "Zen-Raum",
    zenDesc: "Ein Erholungsbereich zum Auftanken: Yoga, Meditation und Entspannung.",
  },
  garden: {
    title: "Garten",
    subtitle: "90 m² Privatgarten, vollständig umschlossen und gesichert, südausgerichtet. Gartensofa für 8 Personen für Aperitifs und große Tische zum Essen im Freien für bis zu 20 Personen — ideal mit Freunden oder in der Gruppe.",
    features: [
      "Sicher und vollständig umschlossen",
      "90 m² insgesamt: 25 m² Bepflanzung + Kiesbereich",
      "Den ganzen Tag Südausrichtung",
      "Gartensofa für 8 Personen, perfekt für Aperitifs",
      "Große Tische zum Essen im Freien für bis zu 20 Personen",
    ],
  },
  amenities: {
    title: "Was diese Unterkunft bietet",
    showAll: (count) => `Alle ${count} Ausstattungsmerkmale anzeigen`,
    showLess: "Weniger anzeigen",
    labels: [
      "Bettwäsche und Handtücher gestellt",
      "Reinigung inklusive",
      "Highspeed-WLAN",
      "Smart-TV in jedem Zimmer",
      "Dedizierter Arbeitsplatz in jedem Zimmer",
      "Kaffeevollautomat",
      "Voll ausgestattete Küche",
      "Waschmaschine",
      "Trockner",
      "Privater Fitnessraum",
      "Eingezäunter Garten 90 m²",
      "Schloss an jedem Zimmer",
      "Privater Eingang",
      "Heizung",
      "Geschirrspüler",
      "Mikrowelle",
      "Backofen",
      "Kühlschrank / Gefrierschrank",
      "Rauchmelder",
      "Feuerlöscher",
    ],
  },
  calendar: {
    title: "Verfügbarkeit",
    subtitle: "Wählen Sie Ihre Daten, um das gesamte Haus zu buchen.",
    loading: "Verfügbarkeit wird geladen...",
    nights: (n) => `${n} Nacht${n > 1 ? "e" : ""}`,
    adults: "Erwachsene",
    teens: "Jugendliche (10-17 Jahre)",
    teensNote: "Unterkunft nicht für Kleinkinder geeignet.",
    clear: "Löschen",
    bookNow: "Jetzt buchen",
    selectCheckIn: "Wählen Sie Ihr Anreisedatum",
    checkInLabel: "Anreise",
    minStayNote: (n) => `(min. ${n} Nächte)`,
    selectCheckOut: "Wählen Sie Ihr Abreisedatum",
    summary: (nights, checkIn, checkOut, adults, children) =>
      `${nights} Nacht${nights > 1 ? "e" : ""} — vom ${checkIn} bis ${checkOut} · ${adults} Erwachsene${adults > 1 ? "" : "r"}${children > 0 ? `, ${children} Kind${children > 1 ? "er" : ""}` : ""}`,
    monthNames: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    dayNames: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
  },
  location: {
    title: "Wo Sie sein werden",
    address: "42 Rue Henri Barbusse, 72100 Le Mans — Ruhige Wohngegend",
    circuitTitle: "In der Nähe der Bugatti-Rennstrecke",
    circuitDesc: "Nur 4,7 km von der legendären Bugatti-Rennstrecke entfernt, ist unser Haus die ideale Basis für die 24 Stunden von Le Mans, MotoGP, Le Mans Classic und alle Events der Rennstrecke. Direkter Zugang über die Straßenbahn T1 vom TGV-Bahnhof.",
    nearby: [
      { name: "TGV-Bahnhof Le Mans", distance: "10 Min. zu Fuß", detail: "Paris in 54 Min., Verbindungen nach Rennes, Nantes, Angers" },
      { name: "Bugatti-Rennstrecke", distance: "4,7 km", detail: "24 Stunden von Le Mans, MotoGP, Le Mans Classic. Erreichbar über Straßenbahn T1" },
      { name: "Gewerbegebiete Süd-Le Mans", distance: "< 10 Min. mit dem Auto", detail: "Technopole Universität, Gewerbezone Süd, Forschungszentren" },
      { name: "Parc Gué de Maulny", distance: "5 Min. zu Fuß", detail: "10 Hektar Grünfläche zum Entspannen" },
      { name: "Straßenbahn T1", distance: "In der Nähe", detail: "Bedient die Innenstadt, den Bahnhof und die Rennstrecke" },
      { name: "Cité Plantagenêt (Altstadt Le Mans)", distance: "15 Min. mit der Straßenbahn", detail: "Historisches mittelalterliches Viertel, Restaurants, Kulturerbe" },
    ],
  },
  host: {
    title: "Ihr Gastgeber: Alexandre",
    superhost: "Superhost",
    experience: "Jahre Erfahrung",
    about: "Über Alexandre",
    aboutText: "Ingenieur, Geek, Sportler und Heimwerker — ich bin seit mehreren Jahren Superhost.\nMir ist es wichtig, saubere, komfortable und perfekt funktionierende Unterkünfte anzubieten.\nDieses Haus in Le Mans wurde konzipiert, um Familien, Freundesgruppen oder Geschäftsteams aufzunehmen, wobei dank der Suiten mit eigenem Bad die Privatsphäre jedes Einzelnen gewahrt bleibt.\nIch bleibe verfügbar und reaktionsschnell, lasse Ihnen aber gleichzeitig viel Autonomie.",
    languages: "Sprachen",
    languagesValue: "Französisch, English",
    responseRate: "Antwortrate",
    responseRateValue: "Schnelle Antwort — meist innerhalb einer Stunde",
    whatsapp: "WhatsApp",
    airbnbMessage: "Airbnb-Nachricht",
  },
  reviews: {
    title: "Gästebewertungen",
    subtitle: "Was unsere Gäste auf Airbnb und Abritel sagen",
    hostReplyLabel: "Antwort von Alexandre",
    autoTranslated: "Automatisch übersetzt",
    showOriginal: "Original anzeigen",
    hideOriginal: "Original ausblenden",
  },
  rules: {
    title: "Wissenswertes",
    sections: [
      {
        title: "Hausordnung",
        items: [
          "Anreise: 17:00 — 23:00 Uhr",
          "Abreise: vor 11:00 Uhr",
          "Maximal 18 Gäste",
          "Nichtraucher (im Innenbereich)",
          "Keine Haustiere erlaubt",
          "Keine Partys oder laute Veranstaltungen",
        ],
      },
      {
        title: "Sicherheit & Unterkunft",
        items: [
          "Rauchmelder",
          "Feuerlöscher",
          "Schloss an jedem Zimmer",
          "Privater Eingang mit Smart Lock",
          "Heizung in allen Räumen",
        ],
      },
      {
        title: "Stornierungsbedingungen",
        items: [
          "Kostenlose Stornierung bis 14 Tage vor Anreise",
          "10 % Anzahlung bei Buchung",
          "Restbetrag vor dem Check-in",
          "Sichere Kartenzahlung (Visa, Mastercard)",
        ],
      },
    ],
  },
  footer: {
    navigation: "Navigation",
    contact: "Kontakt",
    whatsapp: "WhatsApp",
    copyright: "Coliving Barbusse. Alle Rechte vorbehalten.",
    paymentTitle: "Zahlung per Überweisung",
    paymentText:
      "Zahlung per Banküberweisung mit Rechnung möglich. Kontaktieren Sie uns für eine Reservierungsanfrage.",
  },
  gallery: {
    showPhotos: (count) => `Alle ${count} Fotos anzeigen`,
    showAllPhotos: "Alle Fotos anzeigen",
    previous: "Zurück",
    next: "Weiter",
  },
};
