import type { Dictionary } from "../types";

export const it: Dictionary = {
  header: {
    rooms: "Camere",
    amenities: "Servizi",
    location: "Posizione",
    book: "Prenota",
    seminars: "Seminari",
    blog: "Blog",
    tagline1: "Casa premium · 9 suite private",
    tagline2: "Vicino al Circuito di Le Mans",
  },
  propertyHeader: {
    title: "Casa premium 9 suite private vicino al Circuito di Le Mans",
    superhost: "Superhost",
    location: "Le Mans, Pays de la Loire, Francia",
    travelers: "18 ospiti",
    rooms: "9 camere",
    beds: "9 letti matrimoniali",
    bathrooms: "9 bagni privati",
    area: "215 m²",
  },
  highlights: {
    selfCheckIn: {
      title: "Check-in autonomo",
      description: "Accesso all'alloggio tramite serratura connessa. Arrivo a partire dalle 17:00.",
    },
    quiet: {
      title: "Tranquillo e rilassante",
      description: "Zona residenziale tranquilla, vicino al Parc Gué de Maulny. Ideale per rigenerarsi.",
    },
    superhost: {
      title: "Alexandre è Superhost",
      description: "Superhost su Airbnb da aprile 2024 — i Superhost sono host esperti e molto apprezzati, che si impegnano a offrire soggiorni eccellenti.",
      reviewsLink: "Scopri oltre 100 recensioni sul mio profilo Airbnb",
    },
  },
  description: {
    title: "Descrizione",
    readMore: "Leggi tutto",
    showLess: "Mostra meno",
    body: `La nostra casa di 215 m² offre un livello di comfort introvabile altrove in affitto a Le Mans.

9 camere matrimoniali, ciascuna con bagno doccia privato — nessuno deve condividere il bagno, anche in un gruppo numeroso!

Biancheria di qualità, armadi e vera privacy in ogni camera. Ogni suite dispone di un letto matrimoniale con vani contenitori, una scrivania con presa Ethernet, un bagno privato, una smart TV, un guardaroba e una chiave individuale.

La casa è distribuita su 3 livelli con un grande soggiorno, una cucina-sala da pranzo completamente attrezzata, un giardino recintato di 90 m² e una palestra completa con spazio zen.

Ideale per gruppi misti, colleghi, amici o famiglie allargate. Questo concept permette a ognuno di vivere al proprio ritmo, godendo allo stesso tempo del piacere di stare insieme.

Perfetto per eventi, scuderie, soggiorni aziendali e viaggi di gruppo durante la 24 Ore di Le Mans e i grandi eventi del circuito. Accesso facile al Circuito Bugatti tramite il Tram T1 dalla stazione TGV.

Fino a 18 persone.`,
  },
  sleeping: {
    title: "Dove dormirai",
    room: "Camera",
    doubleBed: "1 letto matrimoniale",
    features: "Bagno privato · Smart TV · Scrivania · Guardaroba · Chiave individuale",
    prevPhoto: "Foto precedente",
    nextPhoto: "Foto successiva",
  },
  commonSpaces: {
    title: "Area Sport",
    subtitle: "Spazio privato in un annesso della casa, accessibile liberamente 7 giorni su 7, 24 ore su 24 — senza rischio di svegliare nessuno.",
    gym: "Palestra",
    gymDesc: "Attrezzature fitness a disposizione: bici ellittica, tapis roulant, manubri e panca pesi.",
    zen: "Sala zen",
    zenDesc: "Uno spazio relax per rigenerarsi: yoga, meditazione e rilassamento.",
  },
  garden: {
    title: "Giardino",
    subtitle: "Giardino privato di 90 m², completamente recintato e sicuro, esposto a sud. 25 m² di piantumazioni e un'area in ghiaia con salotto da giardino da 8 posti — ideale per aperitivi tra amici.",
    features: [
      "Sicuro e completamente recintato",
      "90 m² in totale: 25 m² di piantumazioni + area in ghiaia",
      "Esposizione sud tutto il giorno",
      "Salotto da giardino 8 posti, perfetto per gli aperitivi",
    ],
  },
  amenities: {
    title: "Cosa offre questo alloggio",
    showAll: (count) => `Mostra tutti i ${count} servizi`,
    showLess: "Mostra meno",
    labels: [
      "Lenzuola e asciugamani forniti",
      "Pulizie incluse",
      "Wi-Fi ad alta velocità",
      "Smart TV in ogni camera",
      "Postazione di lavoro dedicata in ogni camera",
      "Macchina del caffè a grani",
      "Cucina completamente attrezzata",
      "Lavatrice",
      "Asciugatrice",
      "Palestra privata",
      "Giardino recintato 90 m²",
      "Serratura in ogni camera",
      "Ingresso privato",
      "Riscaldamento",
      "Lavastoviglie",
      "Microonde",
      "Forno",
      "Frigorifero / Congelatore",
      "Rilevatore di fumo",
      "Estintore",
    ],
  },
  calendar: {
    title: "Disponibilità",
    subtitle: "Seleziona le date per prenotare l'intera casa.",
    loading: "Caricamento disponibilità...",
    nights: (n) => `${n} nott${n > 1 ? "i" : "e"}`,
    adults: "Adulti",
    teens: "Adolescenti (10-17 anni)",
    teensNote: "Alloggio non adatto ai bambini piccoli.",
    clear: "Cancella",
    bookNow: "Prenota ora",
    selectCheckIn: "Seleziona la data di arrivo",
    checkInLabel: "Arrivo",
    minStayNote: (n) => `(min. ${n} notti)`,
    selectCheckOut: "Seleziona la data di partenza",
    summary: (nights, checkIn, checkOut, adults, children) =>
      `${nights} nott${nights > 1 ? "i" : "e"} — dal ${checkIn} al ${checkOut} · ${adults} adult${adults > 1 ? "i" : "o"}${children > 0 ? `, ${children} bambin${children > 1 ? "i" : "o"}` : ""}`,
    monthNames: ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"],
    dayNames: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
  },
  location: {
    title: "Dove si trova l'alloggio",
    address: "42 Rue Henri Barbusse, 72100 Le Mans — Zona residenziale tranquilla",
    circuitTitle: "Vicino al Circuito Bugatti",
    circuitDesc: "Situata a soli 4,7 km dal leggendario Circuito Bugatti, la nostra casa è la base ideale per la 24 Ore di Le Mans, il MotoGP, Le Mans Classic e tutti gli eventi del circuito. Accesso diretto tramite Tram T1 dalla stazione TGV.",
    nearby: [
      { name: "Stazione TGV di Le Mans", distance: "10 min a piedi", detail: "Parigi in 54 min, collegamenti per Rennes, Nantes, Angers" },
      { name: "Circuito Bugatti", distance: "4,7 km", detail: "24 Ore di Le Mans, MotoGP, Le Mans Classic. Accessibile tramite Tram T1" },
      { name: "Zone economiche Sud Le Mans", distance: "< 10 min in auto", detail: "Technopole Université, zona Sud, centri di ricerca" },
      { name: "Parc Gué de Maulny", distance: "5 min a piedi", detail: "Spazio verde di 10 ettari per rilassarsi" },
      { name: "Tram T1", distance: "Nelle vicinanze", detail: "Serve il centro città, la stazione e il circuito" },
      { name: "Cité Plantagenêt (Vecchia Le Mans)", distance: "15 min in tram", detail: "Quartiere medievale storico, ristoranti, patrimonio" },
    ],
  },
  host: {
    title: "Il tuo host: Alexandre",
    superhost: "Superhost",
    experience: "anni di esperienza",
    about: "Su Alexandre",
    aboutText: "Ingegnere, geek, sportivo e bricoleur, sono Superhost da diversi anni.\nMi impegno a offrire alloggi puliti, confortevoli e perfettamente funzionali.\nQuesta casa a Le Mans è stata pensata per accogliere famiglie, gruppi di amici o team aziendali, garantendo al contempo la privacy di ognuno grazie a suite con bagno privato.\nResto disponibile e reattivo, lasciandoti grande autonomia.",
    languages: "Lingue",
    languagesValue: "Francese, English",
    responseRate: "Tasso di risposta",
    responseRateValue: "Risposta rapida — solitamente entro un'ora",
    whatsapp: "WhatsApp",
    airbnbMessage: "Messaggio Airbnb",
  },
  reviews: {
    title: "Recensioni dei viaggiatori",
    subtitle: "Cosa dicono i nostri ospiti su Airbnb e Abritel",
  },
  rules: {
    title: "Cose da sapere",
    sections: [
      {
        title: "Regolamento interno",
        items: [
          "Arrivo: 17:00 — 23:00",
          "Partenza: entro le 11:00",
          "Massimo 18 ospiti",
          "Vietato fumare (all'interno)",
          "Animali non ammessi",
          "Niente feste o eventi rumorosi",
        ],
      },
      {
        title: "Sicurezza e alloggio",
        items: [
          "Rilevatore di fumo",
          "Estintore",
          "Serratura in ogni camera",
          "Ingresso privato con serratura connessa",
          "Riscaldamento in tutte le stanze",
        ],
      },
      {
        title: "Condizioni di cancellazione",
        items: [
          "Cancellazione gratuita fino a 14 giorni prima dell'arrivo",
          "Acconto del 10% al momento della prenotazione",
          "Saldo completo prima del check-in",
          "Pagamento sicuro con carta (Visa, Mastercard)",
        ],
      },
    ],
  },
  footer: {
    navigation: "Navigazione",
    contact: "Contatti",
    whatsapp: "WhatsApp",
    copyright: "Coliving Barbusse. Tutti i diritti riservati.",
    paymentTitle: "Pagamento tramite bonifico",
    paymentText:
      "Pagamento tramite bonifico bancario possibile con fattura. Contattaci per una richiesta di prenotazione.",
  },
  gallery: {
    showPhotos: (count) => `Mostra le ${count} foto`,
    showAllPhotos: "Mostra tutte le foto",
    previous: "Precedente",
    next: "Successiva",
  },
};
