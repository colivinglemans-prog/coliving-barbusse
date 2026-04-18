import type { Dictionary } from "../types";

export const fr: Dictionary = {
  header: {
    rooms: "Chambres",
    amenities: "Équipements",
    location: "Localisation",
    book: "Réserver",
  },
  propertyHeader: {
    title: "Maison premium 9 suites privatives Proche Circuit Le Mans",
    superhost: "Superhôte",
    location: "Le Mans, Pays de la Loire, France",
    travelers: "18 voyageurs",
    rooms: "9 chambres",
    beds: "9 lits doubles",
    bathrooms: "9 salles de bain privatives",
    area: "240 m²",
  },
  highlights: {
    selfCheckIn: {
      title: "Arrivée autonome",
      description: "Accédez au logement grâce à une serrure connectée. Arrivée à partir de 17h.",
    },
    quiet: {
      title: "Calme et paisible",
      description: "Quartier résidentiel calme, proche du Parc Gué de Maulny. Idéal pour se ressourcer.",
    },
    superhost: {
      title: "Alexandre est Superhôte",
      description: "Superhôte sur Airbnb depuis avril 2024 — les Superhôtes sont des hôtes expérimentés, très bien notés, qui s'engagent à offrir d'excellents séjours.",
      reviewsLink: "Découvrir plus de 100 avis sur mon profil Airbnb",
    },
  },
  description: {
    title: "Description",
    readMore: "Lire la suite",
    showLess: "Voir moins",
    body: `Notre maison de 240 m² offre un niveau de confort introuvable ailleurs en location au Mans.

9 chambres doubles, chacune avec sa salle de douche privative — personne n'a à partager la salle de bain, même dans un grand groupe !

Literie de qualité, rangements et vraie intimité dans chaque chambre. Chaque suite dispose d'un lit double avec rangements, d'un bureau avec prise Ethernet, d'une salle de bain privative, d'une smart TV, d'un dressing et d'une clé individuelle.

La maison est répartie sur 3 niveaux avec un grand salon, une cuisine-salle à manger entièrement équipée, un jardin, une terrasse et une salle de sport complète avec espace zen.

Idéal pour groupes mixtes, collaborateurs, amis ou familles recomposées. Ce concept permet à chacun de vivre à son rythme, tout en profitant du plaisir d'être ensemble.

Parfait pour les événements, les équipes de course, les séjours d'entreprise et les voyages de groupe pendant les 24 Heures du Mans et les grands événements du circuit. Accès facile au Circuit Bugatti via le Tramway T1 depuis la gare TGV.

Jusqu'à 18 personnes.`,
  },
  sleeping: {
    title: "Où vous dormirez",
    room: "Chambre",
    doubleBed: "1 lit double",
    features: "SDB privative · Smart TV · Bureau · Dressing · Clé individuelle",
    prevPhoto: "Photo précédente",
    nextPhoto: "Photo suivante",
  },
  commonSpaces: {
    title: "Espace Sport",
    subtitle: "Espace privatif dans une annexe de la maison, en accès libre 7j/7, 24h/24 — sans risque de réveiller qui que ce soit.",
    gym: "Salle de sport",
    gymDesc: "Équipements fitness à disposition : vélo elliptique, tapis de course, haltères et banc de musculation.",
    zen: "Salle zen",
    zenDesc: "Un espace détente pour se ressourcer : yoga, méditation et relaxation.",
  },
  amenities: {
    title: "Ce que propose ce logement",
    showAll: (count) => `Afficher les ${count} équipements`,
    showLess: "Voir moins",
    labels: [
      "Draps et serviettes fournis",
      "Ménage inclus",
      "Wifi haut débit",
      "Smart TV dans chaque chambre",
      "Espace de travail dédié dans chaque chambre",
      "Cafetière à grain",
      "Cuisine entièrement équipée",
      "Lave-linge",
      "Sèche-linge",
      "Salle de sport privée",
      "Jardin",
      "Terrasse / Véranda",
      "Serrure sur chaque chambre",
      "Entrée privée",
      "Chauffage",
      "Lave-vaisselle",
      "Micro-ondes",
      "Four",
      "Réfrigérateur / Congélateur",
      "Détecteur de fumée",
      "Extincteur",
    ],
  },
  calendar: {
    title: "Disponibilités",
    subtitle: "Sélectionnez vos dates pour réserver la maison entière.",
    loading: "Chargement des disponibilités...",
    nights: (n) => `${n} nuit${n > 1 ? "s" : ""}`,
    adults: "Adultes",
    teens: "Ados (10-17 ans)",
    teensNote: "Logement non adapté aux jeunes enfants.",
    clear: "Effacer",
    bookNow: "Réserver maintenant",
    selectCheckIn: "Sélectionnez votre date d'arrivée",
    checkInLabel: "Arrivée",
    minStayNote: (n) => `(min. ${n} nuits)`,
    selectCheckOut: "Sélectionnez votre date de départ",
    summary: (nights, checkIn, checkOut, adults, children) =>
      `${nights} nuit${nights > 1 ? "s" : ""} — du ${checkIn} au ${checkOut} · ${adults} adulte${adults > 1 ? "s" : ""}${children > 0 ? `, ${children} enfant${children > 1 ? "s" : ""}` : ""}`,
    monthNames: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
    dayNames: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
  },
  location: {
    title: "Où se situe le logement",
    address: "42 Rue Henri Barbusse, 72100 Le Mans — Quartier résidentiel calme",
    circuitTitle: "À proximité du Circuit Bugatti",
    circuitDesc: "Situé à seulement 4.7 km du mythique Circuit Bugatti, notre maison est le point de chute idéal pour les 24 Heures du Mans, le MotoGP, Le Mans Classic et tous les événements du circuit. Accès direct via le Tramway T1 depuis la gare TGV.",
    nearby: [
      { name: "Gare TGV du Mans", distance: "10 min à pied", detail: "Paris en 54 min, connexions vers Rennes, Nantes, Angers" },
      { name: "Circuit Bugatti", distance: "4.7 km", detail: "24 Heures du Mans, MotoGP, Le Mans Classic. Accessible via Tramway T1" },
      { name: "Zones d'emploi Sud du Mans", distance: "< 10 min en voiture", detail: "Technopole Université, ZA Sud, centres de recherche" },
      { name: "Parc Gué de Maulny", distance: "5 min à pied", detail: "Espace vert de 10 hectares pour se détendre" },
      { name: "Tramway T1", distance: "À proximité", detail: "Dessert le centre-ville, la gare et le circuit" },
      { name: "Cité Plantagenêt (Vieux Mans)", distance: "15 min en tramway", detail: "Quartier médiéval historique, restaurants, patrimoine" },
    ],
  },
  host: {
    title: "Votre hôte : Alexandre",
    superhost: "Superhôte",
    experience: "ans d'expérience",
    about: "À propos d'Alexandre",
    aboutText: "Ingénieur, geek, sportif et bricoleur, je suis superhôte depuis plusieurs années.\nJ'ai à cœur de proposer des hébergements propres, confortables et parfaitement fonctionnels.\nCette maison au Mans a été pensée pour accueillir familles, groupes d'amis ou équipes professionnelles, tout en garantissant l'intimité de chacun grâce à des suites avec salles de bain privatives.\nJe reste disponible et réactif, tout en vous laissant une grande autonomie.",
    languages: "Langues",
    languagesValue: "Français, English",
    responseRate: "Taux de réponse",
    responseRateValue: "Réponse rapide — généralement en moins d'une heure",
    whatsapp: "WhatsApp",
    airbnbMessage: "Message Airbnb",
  },
  reviews: {
    title: "Avis des voyageurs",
    subtitle: "Ce que disent nos hôtes sur Airbnb et Abritel",
  },
  rules: {
    title: "À savoir",
    sections: [
      {
        title: "Règlement intérieur",
        items: [
          "Arrivée : 17h00 — 23h00",
          "Départ : avant 11h00",
          "18 voyageurs maximum",
          "Non-fumeur (intérieur)",
          "Animaux non admis",
          "Pas de fête ni d'événement bruyant",
        ],
      },
      {
        title: "Sécurité et logement",
        items: [
          "Détecteur de fumée",
          "Extincteur",
          "Serrure sur chaque chambre",
          "Entrée privée avec serrure connectée",
          "Chauffage dans toutes les pièces",
        ],
      },
      {
        title: "Conditions d'annulation",
        items: [
          "Annulation gratuite jusqu'à 14 jours avant l'arrivée",
          "Acompte de 10% à la réservation",
          "Solde intégral avant le check-in",
          "Paiement sécurisé par carte (Visa, Mastercard)",
        ],
      },
    ],
  },
  footer: {
    navigation: "Navigation",
    contact: "Contact",
    whatsapp: "WhatsApp",
    copyright: "Coliving Barbusse. Tous droits réservés.",
    paymentTitle: "Paiement par virement",
    paymentText:
      "Paiement par virement bancaire possible avec facture. Contactez-nous pour une demande de réservation.",
  },
  gallery: {
    showPhotos: (count) => `Afficher les ${count} photos`,
    showAllPhotos: "Afficher toutes les photos",
    previous: "Précédent",
    next: "Suivant",
  },
};
