import type { Locale } from "@/lib/i18n";
import type { Journey } from "./journey";

export interface LocalizedPost {
  title: string;
  description: string;
  excerpt: string;
  keywords: string[];
}

export interface BlogPostMeta {
  slug: string;
  date: string;
  /**
   * Étapes du parcours voyageur (`lib/blog/journey.ts`) : au moins une, sans `null` qui
   * voudrait dire « partout » (la leçon du filtre de saison d'Albiez). Lues par les pastilles
   * de la liste, l'ordre de la liste, l'accueil et le guide d'arrivée.
   */
  journey: readonly [Journey, ...Journey[]];
  image: string;
  /** Si true, affiche un bandeau "Complet — rendez-vous en {nextEdition}" + grayscale */
  soldOut?: boolean;
  /** Ex: "2027" — affiché quand soldOut=true */
  nextEdition?: string;
  /** Slug de l'édition suivante : bandeau de renvoi + noindex sur l'archive */
  supersededBy?: string;
  /**
   * Crédit photo, obligatoire pour les images sous licence à attribution
   * (CC BY / CC BY-SA). Rendu en légende sous la photo de l'article.
   */
  imageCredit?: {
    /** Nom de l'auteur tel qu'il doit apparaître */
    author: string;
    /** Page source de l'image (Wikimedia Commons, etc.) */
    sourceUrl: string;
    /** Nom court de la licence, ex "CC BY-SA 4.0" */
    license: string;
    /** URL du texte de licence */
    licenseUrl: string;
  };
  /**
   * **Clé** d'un événement de `LE_MANS_EVENTS` (`lib/events.ts`), et non son nom : un nom
   * est de l'affichage, il se corrige et finira par se traduire, il n'a rien à faire en
   * clé étrangère.
   *
   * Quand elle est présente et que l'événement est à venir, l'article affiche un bloc de
   * réservation avec la disponibilité réelle et les dates pré-remplies, et émet le nœud
   * JSON-LD `Event` si — et seulement si — les dates sont officielles (`confirmed`).
   */
  event?: string;
  /**
   * Affiche en fin d'article la liste des prochaines dates de fêtes en famille, avec leur
   * disponibilité réelle (`components/public/FamilyDates.tsx`).
   */
  familyDates?: boolean;
  /**
   * **Clés** de plusieurs événements de `LE_MANS_EVENTS`, pour un article qui en couvre
   * plusieurs (ex. exposants et écuries) : liste des prochaines dates avec la disponibilité
   * réelle de chacune (`components/public/EventDates.tsx`). Pas de JSON-LD `Event` — c'est
   * le rôle de `event`, pour l'article consacré à un seul événement.
   */
  events?: string[];
  /**
   * Série d'articles apparentés (ex. `salle-de-sport`) : l'accueil n'en montre qu'un à la fois
   * parmi les séjours de groupe, pour qu'une série ne prenne pas toute la place.
   */
  series?: string;
  /** L'article qui représente sa série sur l'accueil (un seul par série). */
  seriesLead?: boolean;
  /** Listé dans le bloc « La salle de sport » du guide d'arrivée (séances à faire sur place). */
  inArrivalGuide?: boolean;
  locales: Record<Locale, LocalizedPost>;
}

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: "preparation-physique-karting-le-mans",
    journey: ["sport"],
    date: "2026-11-17",
    image: "/images/blog/salle-de-sport/couvertures/preparation-physique-karting-le-mans.jpg",
    imageCredit: {
      author: "KrisMizdrak27 + Coliving Barbusse (montage)",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:KartingNSKC.jpg",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    series: "salle-de-sport",
    locales: {
      fr: {
          "title": "Préparation physique karting : cou, poigne et cardio",
          "description": "Cou, avant-bras, gainage, cardio : la préparation physique des pilotes de karting au circuit international du Mans, jeunes pilotes compris.",
          "excerpt": "Ni direction assistée ni suspension : la séance du pilote de karting, l'activation du matin de course et les règles pour les jeunes pilotes.",
          "keywords": [
            "préparation physique karting",
            "musculation cou pilote karting",
            "entraînement pilote karting",
            "hébergement équipe karting Le Mans",
            "SWS Karting Finals logement"
          ]
        },
      en: {
          "title": "Karting Fitness Training: Neck, Grip and Cardio",
          "description": "Neck, forearms, core, cardio: fitness training for karting drivers at the Le Mans international karting circuit, young drivers included.",
          "excerpt": "No power steering, no suspension: the karting driver's session, the race-morning activation and the rules for young drivers.",
          "keywords": [
            "karting fitness training",
            "neck exercises for karting",
            "kart driver workout",
            "karting team accommodation le mans",
            "sws karting finals accommodation"
          ]
        },
      it: {
          "title": "Preparazione atletica kart: collo, presa e cardio",
          "description": "Collo, avambracci, core, cardio: la preparazione atletica dei piloti di kart al circuito internazionale di Le Mans, giovani piloti compresi.",
          "excerpt": "Né servosterzo né sospensioni: l'allenamento del pilota di kart, l'attivazione della mattina di gara e le regole per i giovani piloti.",
          "keywords": [
            "preparazione atletica kart",
            "allenamento collo pilota kart",
            "esercizi per piloti di kart",
            "palestra per kartisti",
            "alloggio squadra kart Le Mans"
          ]
        },
      de: {
          "title": "Fitnesstraining Kartsport: Nacken, Griffkraft, Ausdauer",
          "description": "Nacken, Unterarme, Rumpf, Ausdauer: das Athletiktraining für Kartfahrer auf der internationalen Kartbahn von Le Mans, junge Fahrer inklusive.",
          "excerpt": "Weder Servolenkung noch Federung: die Einheit für Kartfahrer, die Aktivierung am Rennmorgen und die Regeln für junge Fahrer.",
          "keywords": [
            "Fitnesstraining Kartfahrer",
            "Nackentraining Kart",
            "Training Kartsport",
            "Unterkunft Kartteam Le Mans",
            "SWS Karting Finals Unterkunft"
          ]
        },
      es: {
          "title": "Preparación física para karting: cuello, agarre y cardio",
          "description": "Cuello, antebrazos, core, cardio: la preparación física de los pilotos de karting en el circuito internacional de Le Mans, pilotos jóvenes incluidos.",
          "excerpt": "Sin dirección asistida ni suspensión: la sesión del piloto de karting, la activación de la mañana de carrera y las normas para los pilotos jóvenes.",
          "keywords": [
            "preparación física karting",
            "ejercicios de cuello karting",
            "entrenamiento piloto de karting",
            "alojamiento equipo karting Le Mans",
            "alojamiento SWS Karting Finals"
          ]
        },
    },
  },
  {
    slug: "preparation-physique-handball-le-mans",
    journey: ["sport"],
    date: "2026-11-16",
    image: "/images/blog/salle-de-sport/couvertures/preparation-physique-handball-le-mans.jpg",
    imageCredit: {
      author: "Kryštof Zajíček + Coliving Barbusse (montage)",
      sourceUrl: "https://unsplash.com/photos/YN2xypsV_cM",
      license: "Unsplash License",
      licenseUrl: "https://unsplash.com/license",
    },
    series: "salle-de-sport",
    locales: {
      fr: {
          "title": "Préparation physique handball : explosivité et prévention",
          "description": "Explosivité, genoux, épaule du tireur, circuit d'équipe : la préparation physique d'une équipe de handball en tournoi ou en stage au Mans.",
          "excerpt": "Sprints, duels, tirs en suspension : la séance de force et d'explosivité, la prévention avant chaque séance, et le week-end de tournoi à la maison.",
          "keywords": [
            "préparation physique handball",
            "musculation handballeur",
            "prévention blessures handball",
            "hébergement équipe handball Le Mans",
            "stage handball Le Mans logement"
          ]
        },
      en: {
          "title": "Handball Fitness Training: Power and Injury Prevention",
          "description": "Explosive power, knees, the throwing shoulder, team circuit: fitness training for a handball team at a tournament or camp in Le Mans.",
          "excerpt": "Sprints, duels, jump shots: the strength and power session, the prehab before every session, and a tournament weekend at the house.",
          "keywords": [
            "handball strength and conditioning",
            "handball gym workout",
            "handball injury prevention",
            "handball team accommodation le mans",
            "handball training camp france"
          ]
        },
      it: {
          "title": "Preparazione atletica pallamano: esplosività e prevenzione",
          "description": "Esplosività, ginocchia, spalla del tiratore, circuito di squadra: la preparazione atletica di una squadra di pallamano in torneo o ritiro a Le Mans.",
          "excerpt": "Scatti, duelli, tiri in sospensione: l'allenamento di forza ed esplosività, la prevenzione prima di ogni seduta e il weekend di torneo in casa.",
          "keywords": [
            "preparazione atletica pallamano",
            "esercizi palestra pallamano",
            "prevenzione infortuni pallamano",
            "allenamento esplosività",
            "alloggio squadra pallamano Le Mans"
          ]
        },
      de: {
          "title": "Fitnesstraining Handball: Explosivität und Prävention",
          "description": "Explosivität, Knie, Wurfschulter, Teamzirkel: das Athletiktraining einer Handballmannschaft beim Turnier oder im Trainingslager in Le Mans.",
          "excerpt": "Sprints, Zweikämpfe, Sprungwürfe: die Kraft- und Explosivitätseinheit, die Prävention vor jeder Einheit und das Turnierwochenende im Haus.",
          "keywords": [
            "Athletiktraining Handball",
            "Krafttraining Handball",
            "Verletzungsprävention Handball",
            "Unterkunft Handballteam Le Mans",
            "Trainingslager Handball Frankreich"
          ]
        },
      es: {
          "title": "Preparación física para balonmano: explosividad y prevención",
          "description": "Explosividad, rodillas, hombro de lanzador, circuito de equipo: la preparación física de un equipo de balonmano en torneo o concentración en Le Mans.",
          "excerpt": "Sprints, duelos, lanzamientos en suspensión: la sesión de fuerza y explosividad, la prevención antes de cada sesión y el fin de semana de torneo en la casa.",
          "keywords": [
            "preparación física balonmano",
            "gimnasio para jugadores de balonmano",
            "prevención lesiones balonmano",
            "alojamiento equipo balonmano Le Mans",
            "concentración balonmano Francia alojamiento"
          ]
        },
    },
  },
  {
    slug: "preparation-physique-equitation-le-mans",
    journey: ["sport"],
    date: "2026-11-15",
    image: "/images/blog/salle-de-sport/couvertures/preparation-physique-equitation-le-mans.jpg",
    imageCredit: {
      author: "Danny Zelck + Coliving Barbusse (montage)",
      sourceUrl: "https://unsplash.com/photos/stLCEVtTyKc",
      license: "Unsplash License",
      licenseUrl: "https://unsplash.com/license",
    },
    series: "salle-de-sport",
    locales: {
      fr: {
          "title": "Préparation physique du cavalier : gainage et posture",
          "description": "Gainage, adducteurs, mobilité du bassin, posture : la préparation physique des cavaliers en concours, près du Pôle européen du cheval.",
          "excerpt": "Un cavalier tient une posture pendant des heures : la séance pour monter mieux et ménager son dos, et la routine du jour de concours.",
          "keywords": [
            "préparation physique cavalier",
            "renforcement musculaire équitation",
            "gainage cavalier",
            "hébergement cavaliers Pôle européen du cheval",
            "logement concours équestre Le Mans"
          ]
        },
      en: {
          "title": "Fitness Training for Riders: Core and Posture",
          "description": "Core, adductors, pelvic mobility, posture: fitness training for riders at competitions, near the Pôle Européen du Cheval.",
          "excerpt": "A rider holds a posture for hours: the session to ride better and look after your back, and the competition-day routine.",
          "keywords": [
            "fitness training for horse riders",
            "exercises for equestrians",
            "core workout for riders",
            "accommodation near pole europeen du cheval",
            "equestrian competition accommodation le mans"
          ]
        },
      it: {
          "title": "Preparazione atletica del cavaliere: core e postura",
          "description": "Core, adduttori, mobilità del bacino, postura: la preparazione atletica dei cavalieri in concorso, vicino al Pôle européen du cheval.",
          "excerpt": "Un cavaliere mantiene una postura per ore: l'allenamento per montare meglio e risparmiare la schiena, e la routine del giorno di concorso.",
          "keywords": [
            "preparazione atletica equitazione",
            "esercizi per cavalieri",
            "rinforzo muscolare equitazione",
            "core stability cavaliere",
            "alloggio concorso Pôle européen du cheval"
          ]
        },
      de: {
          "title": "Fitnesstraining für Reiter: Rumpf und Haltung",
          "description": "Rumpfstabilität, Adduktoren, Beckenmobilität, Haltung: das Athletiktraining für Reiter auf Turnieren, nahe dem Pôle Européen du Cheval.",
          "excerpt": "Ein Reiter hält stundenlang eine Haltung: die Einheit, um besser zu reiten und den Rücken zu schonen, und die Routine am Turniertag.",
          "keywords": [
            "Fitnesstraining für Reiter",
            "Krafttraining Reiten",
            "Rumpftraining Reiter",
            "Unterkunft Pôle Européen du Cheval",
            "Unterkunft Reitturnier Le Mans"
          ]
        },
      es: {
          "title": "Preparación física del jinete: core y postura",
          "description": "Core, aductores, movilidad de pelvis, postura: la preparación física de los jinetes de concurso, cerca del Pôle européen du cheval.",
          "excerpt": "Un jinete mantiene una postura durante horas: la sesión para montar mejor y cuidar la espalda, y la rutina del día de concurso.",
          "keywords": [
            "preparación física jinete",
            "ejercicios para jinetes",
            "core para equitación",
            "alojamiento jinetes Pôle européen du cheval",
            "alojamiento concurso hípico Le Mans"
          ]
        },
    },
  },
  {
    slug: "preparation-physique-volley-ball-le-mans",
    journey: ["sport"],
    date: "2026-11-14",
    image: "/images/blog/salle-de-sport/couvertures/preparation-physique-volley-ball-le-mans.jpg",
    imageCredit: {
      author: "Daniil Kazorin + Coliving Barbusse (montage)",
      sourceUrl: "https://unsplash.com/photos/zcFVqlOcslk",
      license: "Unsplash License",
      licenseUrl: "https://unsplash.com/license",
    },
    series: "salle-de-sport",
    locales: {
      fr: {
          "title": "Préparation physique volley-ball : détente et épaules",
          "description": "Box jumps, squat, prévention des épaules, circuit d'équipe : la préparation physique d'une équipe de volley en tournoi au Mans.",
          "excerpt": "Détente, réceptions, épaules de l'attaquant : les séances à faire avant et pendant un tournoi de volley, dans la salle de sport de la maison.",
          "keywords": [
            "préparation physique volley-ball",
            "travail de détente volley",
            "prévention épaule volleyeur",
            "hébergement équipe volley Le Mans",
            "tournoi volley Le Mans logement"
          ]
        },
      en: {
          "title": "Volleyball Fitness Training: Vertical Jump and Shoulders",
          "description": "Box jumps, squats, shoulder prehab, team circuit: fitness training for a volleyball team at a tournament in Le Mans.",
          "excerpt": "Vertical jump, landings, the attacker's shoulders: the sessions to do before and during a volleyball tournament, in the house gym.",
          "keywords": [
            "volleyball strength training",
            "vertical jump training volleyball",
            "volleyball shoulder injury prevention",
            "volleyball team accommodation le mans",
            "volleyball tournament le mans"
          ]
        },
      it: {
          "title": "Preparazione atletica pallavolo: elevazione e spalle",
          "description": "Box jump, squat, prevenzione per le spalle, circuito di squadra: la preparazione atletica di una squadra di pallavolo in torneo a Le Mans.",
          "excerpt": "Elevazione, atterraggi, spalle dell'attaccante: gli allenamenti da fare prima e durante un torneo di pallavolo, nella palestra della casa.",
          "keywords": [
            "preparazione atletica pallavolo",
            "esercizi per elevazione pallavolo",
            "prevenzione spalla pallavolo",
            "allenamento salto verticale",
            "alloggio squadra pallavolo torneo Francia"
          ]
        },
      de: {
          "title": "Fitnesstraining Volleyball: Sprungkraft und Schultern",
          "description": "Box Jumps, Kniebeuge, Schulterprävention, Teamzirkel: das Athletiktraining einer Volleyballmannschaft beim Turnier in Le Mans.",
          "excerpt": "Sprungkraft, Landungen, die Schultern des Angreifers: die Einheiten vor und während eines Volleyballturniers, im Fitnessraum des Hauses.",
          "keywords": [
            "Athletiktraining Volleyball",
            "Sprungkrafttraining Volleyball",
            "Schulterprävention Volleyball",
            "Unterkunft Volleyballteam Le Mans",
            "Volleyballturnier Le Mans Unterkunft"
          ]
        },
      es: {
          "title": "Preparación física para voleibol: salto y hombros",
          "description": "Box jumps, sentadilla, prevención de hombro, circuito de equipo: la preparación física de un equipo de voleibol en torneo en Le Mans.",
          "excerpt": "Salto, aterrizajes, hombros del atacante: las sesiones para antes y durante un torneo de voleibol, en el gimnasio de la casa.",
          "keywords": [
            "preparación física voleibol",
            "ejercicios para saltar más voleibol",
            "prevención lesiones hombro voleibol",
            "alojamiento equipo voleibol Le Mans",
            "torneo voleibol Le Mans alojamiento"
          ]
        },
    },
  },
  {
    slug: "preparation-physique-roller-le-mans",
    journey: ["sport"],
    date: "2026-11-13",
    image: "/images/blog/salle-de-sport/couvertures/preparation-physique-roller-le-mans.jpg",
    imageCredit: {
      author: "Joao Viegas + Coliving Barbusse (montage)",
      sourceUrl: "https://unsplash.com/photos/v8SAatAAKJQ",
      license: "Unsplash License",
      licenseUrl: "https://unsplash.com/license",
    },
    series: "salle-de-sport",
    locales: {
      fr: {
          "title": "Préparation physique roller : 24 Heures Rollers",
          "description": "Fessiers, adducteurs, équilibre, endurance sur l'elliptique : la préparation physique des patineurs et des équipes des 24 Heures Rollers du Mans.",
          "excerpt": "En roller, tout part des hanches : la séance du rolleur, l'endurance sans rouler, et l'organisation d'une équipe en relais aux 24 Heures Rollers.",
          "keywords": [
            "préparation physique roller",
            "musculation roller vitesse",
            "24 Heures Rollers hébergement équipe",
            "renforcement patineur",
            "logement 24h rollers Le Mans"
          ]
        },
      en: {
          "title": "Inline Skating Fitness: the 24 Heures Rollers",
          "description": "Glutes, adductors, balance, endurance on the elliptical: fitness training for skaters and teams at the 24 Heures Rollers in Le Mans.",
          "excerpt": "In inline skating, everything starts from the hips: the skater's session, endurance without skating, and how a relay team gets organised for the 24 Heures Rollers.",
          "keywords": [
            "inline skating fitness training",
            "speed skating strength workout",
            "24 heures rollers team accommodation",
            "dryland training for skaters",
            "24h rollers le mans accommodation"
          ]
        },
      it: {
          "title": "Preparazione atletica pattinaggio: 24 Heures Rollers",
          "description": "Glutei, adduttori, equilibrio, resistenza sull'ellittica: la preparazione atletica dei pattinatori e delle squadre della 24 Heures Rollers di Le Mans.",
          "excerpt": "Nel pattinaggio in linea tutto parte dalle anche: l'allenamento del pattinatore, la resistenza senza pattinare e una squadra a staffetta alla 24 Heures Rollers.",
          "keywords": [
            "preparazione atletica pattinaggio in linea",
            "esercizi pattinaggio di velocità",
            "allenamento palestra pattinatori",
            "24 Heures Rollers Le Mans",
            "alloggio squadra pattinaggio Le Mans"
          ]
        },
      de: {
          "title": "Fitnesstraining Inlineskaten: 24 Heures Rollers",
          "description": "Gesäß, Adduktoren, Gleichgewicht, Ausdauer auf dem Crosstrainer: das Athletiktraining für Skater und Teams der 24 Heures Rollers in Le Mans.",
          "excerpt": "Beim Inlineskaten geht alles von den Hüften aus: die Einheit für Skater, Ausdauer ohne Skates und die Organisation eines Staffelteams bei den 24 Heures Rollers.",
          "keywords": [
            "Krafttraining Inlineskaten",
            "Speedskating Training",
            "24 Stunden Inline Le Mans Unterkunft",
            "Athletiktraining Skater",
            "Unterkunft 24h Rollers Le Mans"
          ]
        },
      es: {
          "title": "Preparación física para patinaje: 24 Horas Rollers",
          "description": "Glúteos, aductores, equilibrio, resistencia en la elíptica: la preparación física de patinadores y equipos de las 24 Horas Rollers de Le Mans.",
          "excerpt": "En patinaje, todo sale de las caderas: la sesión del patinador, la resistencia sin patinar y la organización de un equipo de relevos en las 24 Horas Rollers.",
          "keywords": [
            "preparación física patinaje",
            "ejercicios patinaje de velocidad",
            "alojamiento equipo 24 Horas Rollers",
            "fortalecimiento para patinadores",
            "alojamiento 24h Rollers Le Mans"
          ]
        },
    },
  },
  {
    slug: "preparation-physique-cyclisme-le-mans",
    journey: ["sport"],
    date: "2026-11-12",
    image: "/images/blog/salle-de-sport/couvertures/preparation-physique-cyclisme-le-mans.jpg",
    imageCredit: {
      author: "Roy Egloff + Coliving Barbusse (montage)",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:CH.ZH.Affoltern-am-Albis_2024-03-30_road-bike-racing.jpg",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    series: "salle-de-sport",
    locales: {
      fr: {
          "title": "Musculation du cycliste : se préparer au Mans",
          "description": "Squat, gainage, rameur : la préparation physique des cyclistes et des équipes des 24 Heures Vélo, dans la salle de sport de notre maison au Mans.",
          "excerpt": "Des jambes plus fortes, un tronc qui tient la position : la séance de force du cycliste, et l'organisation d'une équipe en relais aux 24 Heures Vélo.",
          "keywords": [
            "musculation cycliste",
            "préparation physique 24 Heures Vélo",
            "hébergement équipe cyclisme Le Mans",
            "renforcement musculaire vélo",
            "logement 24h vélo Le Mans"
          ]
        },
      en: {
          "title": "Strength Training for Cyclists: Preparing in Le Mans",
          "description": "Squats, core, rowing: fitness training for cyclists and 24 Heures Vélo teams, in the gym of our house in Le Mans.",
          "excerpt": "Stronger legs and a core that holds the position: the cyclist's strength session, and how a relay team gets organised for the 24 Heures Vélo.",
          "keywords": [
            "strength training for cyclists",
            "24 heures velo le mans",
            "cycling team accommodation le mans",
            "gym workout for cyclists",
            "24h velo le mans accommodation"
          ]
        },
      it: {
          "title": "Palestra per ciclisti: prepararsi a Le Mans",
          "description": "Squat, core, vogatore: la preparazione atletica dei ciclisti e delle squadre della 24 Heures Vélo, nella palestra della nostra casa a Le Mans.",
          "excerpt": "Gambe più forti, un tronco che tiene la posizione: l'allenamento di forza del ciclista e l'organizzazione di una squadra a staffetta alla 24 Heures Vélo.",
          "keywords": [
            "palestra per ciclisti",
            "esercizi pesi ciclismo",
            "preparazione atletica ciclismo",
            "allenamento forza ciclista",
            "alloggio 24 Heures Vélo Le Mans"
          ]
        },
      de: {
          "title": "Krafttraining für Radfahrer: Vorbereitung in Le Mans",
          "description": "Kniebeuge, Rumpf, Rudergerät: das Athletiktraining für Radfahrer und Teams der 24 Heures Vélo, im Fitnessraum unseres Hauses in Le Mans.",
          "excerpt": "Stärkere Beine, ein Rumpf, der die Position hält: die Krafteinheit für Radfahrer und die Organisation eines Staffelteams bei den 24 Heures Vélo.",
          "keywords": [
            "Krafttraining Radfahrer",
            "24 Stunden Radrennen Le Mans",
            "Unterkunft Radteam Le Mans",
            "Krafttraining Rennrad",
            "Unterkunft 24h Vélo Le Mans"
          ]
        },
      es: {
          "title": "Musculación para ciclistas: prepararse en Le Mans",
          "description": "Sentadilla, core, remo: la preparación física de los ciclistas y de los equipos de las 24 Heures Vélo, en el gimnasio de nuestra casa en Le Mans.",
          "excerpt": "Piernas más fuertes, un tronco que aguanta la posición: la sesión de fuerza del ciclista y la organización de un equipo de relevos en las 24 Heures Vélo.",
          "keywords": [
            "gimnasio para ciclistas",
            "preparación física 24 Heures Vélo",
            "alojamiento equipo ciclista Le Mans",
            "fuerza para ciclismo",
            "alojamiento 24 horas ciclismo Le Mans"
          ]
        },
    },
  },
  {
    slug: "recuperation-apres-effort-le-mans",
    journey: ["sport"],
    date: "2026-11-11",
    image: "/images/blog/salle-de-sport/couvertures/recuperation-apres-effort-le-mans.jpg",
    imageCredit: {
      author: "Alora Griffiths + Coliving Barbusse (montage)",
      sourceUrl: "https://unsplash.com/photos/WX7FSaiYxK8",
      license: "Unsplash License",
      licenseUrl: "https://unsplash.com/license",
    },
    series: "salle-de-sport",
    inArrivalGuide: true,
    locales: {
      fr: {
          "title": "Récupérer après l'effort : la routine à la maison",
          "description": "Retour au calme, mobilité, repas d'équipe, sommeil au noir complet : la routine de récupération après un match, une course ou un stage au Mans.",
          "excerpt": "Ce que vous faites dans les heures qui suivent un match ou une course compte autant que l'effort : une routine simple avec la salle de sport et la salle zen.",
          "keywords": [
            "récupération après effort",
            "routine mobilité après match",
            "récupération sportive équipe",
            "étirements après course",
            "hébergement équipe sportive Le Mans"
          ]
        },
      en: {
          "title": "Post-Exercise Recovery: Your Routine at the House",
          "description": "Cool-down, mobility, team meal, sleep in total darkness: the recovery routine after a match, a race or a training camp in Le Mans.",
          "excerpt": "What you do in the hours after a match or a race matters as much as the effort itself: a simple routine using the gym and the zen room.",
          "keywords": [
            "post workout recovery routine",
            "mobility routine after a match",
            "sports team recovery",
            "stretching after a race",
            "sports team accommodation le mans"
          ]
        },
      it: {
          "title": "Recupero dopo lo sforzo: la routine in casa",
          "description": "Defaticamento, mobilità, pasto di squadra, sonno al buio completo: la routine di recupero dopo una partita, una gara o un ritiro a Le Mans.",
          "excerpt": "Quello che fate nelle ore dopo una partita o una gara conta quanto lo sforzo: una routine semplice con la palestra e la sala zen.",
          "keywords": [
            "recupero dopo allenamento",
            "routine di mobilità dopo la partita",
            "recupero muscolare dopo gara",
            "stretching dopo lo sforzo",
            "recupero tra due partite torneo"
          ]
        },
      de: {
          "title": "Regeneration nach der Belastung: die Routine im Haus",
          "description": "Cool-down, Mobilität, Teamessen, Schlaf in völliger Dunkelheit: die Regenerationsroutine nach einem Spiel, Rennen oder Trainingslager in Le Mans.",
          "excerpt": "Was Sie in den Stunden nach einem Spiel oder Rennen tun, zählt so viel wie die Belastung selbst: eine einfache Routine mit Fitnessraum und Zen-Raum.",
          "keywords": [
            "Regeneration nach dem Sport",
            "Mobilitätsroutine nach dem Spiel",
            "Regeneration Sportmannschaft",
            "Dehnen nach dem Laufen",
            "Unterkunft Sportteam Le Mans"
          ]
        },
      es: {
          "title": "Recuperar después del esfuerzo: la rutina en la casa",
          "description": "Vuelta a la calma, movilidad, comida de equipo, sueño a oscuras: la rutina de recuperación tras un partido, una carrera o una concentración en Le Mans.",
          "excerpt": "Lo que hace en las horas siguientes a un partido o una carrera cuenta tanto como el esfuerzo: una rutina sencilla con el gimnasio y la sala zen.",
          "keywords": [
            "recuperación después del ejercicio",
            "rutina de movilidad después del partido",
            "recuperación deportiva en equipo",
            "estiramientos después de correr",
            "alojamiento equipo deportivo Le Mans"
          ]
        },
    },
  },
  {
    slug: "preparation-physique-course-automobile-le-mans",
    journey: ["sport"],
    date: "2026-11-10",
    image: "/images/blog/salle-de-sport/couvertures/preparation-physique-course-automobile-le-mans.jpg",
    imageCredit: {
      author: "Mickael Le rouzic + Coliving Barbusse (montage)",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:2024_24_Hours_of_Le_Mans_(54093434907).jpg",
      license: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    },
    series: "salle-de-sport",
    locales: {
      fr: {
          "title": "Préparation physique du pilote automobile au Mans",
          "description": "Cou, gainage, avant-bras, cardio : la préparation physique des pilotes et des mécaniciens pour les 24 Heures du Mans et les courses du circuit.",
          "excerpt": "Pilotes et mécaniciens logés à la maison pendant une course au Mans : la séance type, la veille, l'activation du matin de course et la récupération.",
          "keywords": [
            "préparation physique pilote automobile",
            "musculation cou pilote",
            "hébergement écurie 24 Heures du Mans",
            "entraînement pilote endurance",
            "logement pilotes Le Mans Classic"
          ]
        },
      en: {
          "title": "Racing Driver Fitness Training in Le Mans",
          "description": "Neck, core, forearms, cardio: fitness training for drivers and mechanics during the 24 Hours of Le Mans and other races at the circuit.",
          "excerpt": "Drivers and mechanics staying at the house during a race in Le Mans: the typical session, the day before, the race-morning activation and recovery.",
          "keywords": [
            "racing driver fitness training",
            "neck training for racing drivers",
            "24 hours of le mans team accommodation",
            "endurance racing driver workout",
            "le mans classic driver accommodation"
          ]
        },
      it: {
          "title": "Preparazione atletica del pilota automobilistico a Le Mans",
          "description": "Collo, core, avambracci, cardio: la preparazione atletica di piloti e meccanici per la 24 Ore di Le Mans e le gare del circuito.",
          "excerpt": "Piloti e meccanici ospiti della casa durante una gara a Le Mans: l'allenamento tipo, la vigilia, l'attivazione della mattina di gara e il recupero.",
          "keywords": [
            "preparazione atletica pilota automobilistico",
            "allenamento collo pilota",
            "esercizi collo per piloti",
            "allenamento pilota endurance",
            "alloggio team 24 Ore di Le Mans"
          ]
        },
      de: {
          "title": "Fitnesstraining für Rennfahrer in Le Mans",
          "description": "Nacken, Rumpf, Unterarme, Ausdauer: das Athletiktraining für Fahrer und Mechaniker bei den 24 Stunden von Le Mans und den Rennen an der Strecke.",
          "excerpt": "Fahrer und Mechaniker im Haus während eines Rennens in Le Mans: die typische Einheit, der Vortag, die Aktivierung am Rennmorgen und die Regeneration.",
          "keywords": [
            "Fitnesstraining Rennfahrer",
            "Nackentraining Rennfahrer",
            "Unterkunft Rennteam 24h Le Mans",
            "Training Langstreckenfahrer",
            "Unterkunft Fahrer Le Mans Classic"
          ]
        },
      es: {
          "title": "Preparación física del piloto de carreras en Le Mans",
          "description": "Cuello, core, antebrazos, cardio: la preparación física de pilotos y mecánicos para las 24 Horas de Le Mans y las carreras del circuito.",
          "excerpt": "Pilotos y mecánicos alojados en la casa durante una carrera en Le Mans: la sesión tipo, la víspera, la activación de la mañana de carrera y la recuperación.",
          "keywords": [
            "preparación física piloto de carreras",
            "ejercicios de cuello para pilotos",
            "alojamiento escudería 24 Horas de Le Mans",
            "entrenamiento piloto de resistencia",
            "alojamiento pilotos Le Mans Classic"
          ]
        },
    },
  },
  {
    slug: "entrainements-salle-de-sport-le-mans",
    journey: ["sport"],
    date: "2026-11-09",
    image: "/images/blog/entrainement-salle-de-sport.jpg",
    series: "salle-de-sport",
    inArrivalGuide: true,
    locales: {
      fr: {
          "title": "Séances de sport à la maison : seul ou à plusieurs",
          "description": "Force, prise de muscle, cardio, perte de poids, circuit d'équipe, relais au rameur : des séances prêtes à suivre dans la salle de sport de la maison.",
          "excerpt": "Des séances de 20 à 60 minutes, seul ou en groupe, pour la force, le muscle, le cardio ou la remise en route, avec les points clés de chaque exercice.",
          "keywords": [
            "programme musculation salle de sport",
            "séance cross-training en groupe",
            "entraînement rameur fractionné",
            "circuit training en équipe",
            "séance de sport en déplacement"
          ]
        },
      en: {
          "title": "Gym Workouts at the House: Solo or as a Group",
          "description": "Strength, muscle gain, cardio, weight loss, team circuit, rowing relay: ready-made sessions to follow in the house gym in Le Mans.",
          "excerpt": "Sessions of 20 to 60 minutes, solo or as a group, for strength, muscle, cardio or getting back into it, with the key points for every exercise.",
          "keywords": [
            "gym workout plan",
            "group cross-training workout",
            "rowing machine interval workout",
            "team circuit training",
            "workout while travelling"
          ]
        },
      it: {
          "title": "Allenamenti in palestra a casa: da soli o in gruppo",
          "description": "Forza, massa muscolare, cardio, dimagrimento, circuito di squadra, staffetta al vogatore: allenamenti pronti da seguire nella palestra della casa.",
          "excerpt": "Allenamenti da 20 a 60 minuti, da soli o in gruppo, per forza, massa, cardio o ripresa, con i punti chiave di ogni esercizio.",
          "keywords": [
            "scheda allenamento palestra",
            "allenamento cross training di gruppo",
            "allenamento in viaggio palestra",
            "circuito a stazioni di squadra",
            "allenamento vogatore Concept2"
          ]
        },
      de: {
          "title": "Training im Haus: Einheiten allein oder in der Gruppe",
          "description": "Kraft, Muskelaufbau, Cardio, Abnehmen, Teamzirkel, Staffel auf dem Rudergerät: fertige Trainingseinheiten für den Fitnessraum des Hauses.",
          "excerpt": "Einheiten von 20 bis 60 Minuten, allein oder in der Gruppe, für Kraft, Muskeln, Ausdauer oder den Wiedereinstieg, mit den wichtigsten Punkten jeder Übung.",
          "keywords": [
            "Trainingsplan Fitnessstudio",
            "Cross-Training Workout Gruppe",
            "Rudergerät Intervalltraining",
            "Zirkeltraining im Team",
            "Training auf Reisen"
          ]
        },
      es: {
          "title": "Entrenamientos en el gimnasio de la casa: solo o en grupo",
          "description": "Fuerza, hipertrofia, cardio, pérdida de peso, circuito en equipo, relevos en el remo: sesiones listas para seguir en el gimnasio de la casa en Le Mans.",
          "excerpt": "Sesiones de 20 a 60 minutos, solo o en grupo, para la fuerza, el músculo, el cardio o volver a entrenar, con los puntos clave de cada ejercicio.",
          "keywords": [
            "rutina de gimnasio",
            "entrenamiento cross-training en grupo",
            "series en remo ergómetro",
            "circuito de entrenamiento en equipo",
            "entrenar de viaje"
          ]
        },
    },
  },
  {
    slug: "concours-salons-le-mans",
    journey: ["groupe"],
    date: "2026-11-08",
    image: "/images/blog/antares-le-mans.jpg",
    imageCredit: {
      author: "Le Mans",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Antar%C3%A8s_Le_Mans.JPG",
      license: "CC BY 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0/deed.fr",
    },
    locales: {
      fr: {
        "title": "Loger un groupe pour un concours ou un salon au Mans",
        "description": "Concours d’apprentis, salon ou congrès au Mans : 9 chambres avec salle de douche, jusqu’à 20 couchages, gare TGV à 15 min à pied, tram à la gare.",
        "excerpt": "Apprentis, formateurs et modèles sous le même toit, une salle de douche par chambre pour se préparer sans file d’attente : comment loger un groupe venu pour un concours, un salon ou un congrès au Mans.",
        "keywords": [
          "hébergement groupe concours Le Mans",
          "Hair Artist Awards Le Mans",
          "logement apprentis concours coiffure",
          "hébergement salon parc des expositions Le Mans",
          "location maison groupe congrès Le Mans"
        ]
      },
      en: {
        "title": "Competitions and Trade Shows in Le Mans: Group Accommodation",
        "description": "Hair Artist Awards, trade shows, conferences in Le Mans: house apprentices, trainers and models together. 9 shower-room bedrooms, 15 min from the station.",
        "excerpt": "Coming to Le Mans for an apprentice competition, a trade show or a conference? Here is how our house sleeps a whole group the night before, as it did for 14 people at the 2026 Hair Artist Awards.",
        "keywords": [
          "hair artist awards le mans accommodation",
          "le mans exhibition centre hotel",
          "group accommodation le mans trade show",
          "antares le mans where to stay",
          "apprentice competition accommodation le mans"
        ]
      },
      it: {
        "title": "Concorsi e fiere a Le Mans: alloggio per gruppi e scuole",
        "description": "Hair Artist Awards, concorsi per apprendisti, fiere: una casa intera a Le Mans per scuole ed espositori, 9 camere con doccia, a 15 minuti dalla stazione.",
        "excerpt": "Concorso per apprendisti, fiera o congresso a Le Mans? Una casa intera per alloggiare insieme apprendisti, modelli e formatori la sera prima, a 15 minuti a piedi dalla stazione.",
        "keywords": [
          "alloggio gruppo fiera Le Mans",
          "Hair Artist Awards Le Mans",
          "dove dormire Centre des expositions Le Mans",
          "alloggio scuola concorso Le Mans",
          "casa per gruppi vicino Antarès Le Mans"
        ]
      },
      de: {
        "title": "Wettbewerb oder Messe in Le Mans: Gruppenunterkunft bis 20 Personen",
        "description": "Hair Artist Awards, Fachmesse oder Kongress in Le Mans: 9 Zimmer mit eigenem Duschbad für Azubis, Ausbilder und Modelle, 15 Gehminuten vom Bahnhof.",
        "excerpt": "Im November 2026 hat ein Friseursalon aus der Ariège 14 Personen für die Hair Artist Awards bei uns untergebracht. So organisiert sich das Haus für Schulen, Ausbildungszentren und Aussteller bei Wettbewerben und Messen in Le Mans.",
        "keywords": [
          "Unterkunft Messe Le Mans",
          "Hair Artist Awards Le Mans",
          "Gruppenunterkunft Le Mans Auszubildende",
          "Centre des expositions Le Mans Unterkunft",
          "Unterkunft Antarès Le Mans"
        ]
      },
      es: {
        "title": "Concursos y ferias en Le Mans: alojar a su grupo la víspera",
        "description": "Hair Artist Awards, ferias y congresos en Le Mans: una casa para 20 con 9 habitaciones con ducha, a 15 min a pie de la estación y del tranvía a Antarès.",
        "excerpt": "Concurso de aprendices, feria profesional o congreso en Le Mans: cómo alojar juntos a alumnos, formadores y modelos la víspera, en una casa con un baño con ducha por habitación.",
        "keywords": [
          "alojamiento grupo feria Le Mans",
          "Hair Artist Awards Le Mans",
          "alojamiento Centre des expositions Le Mans",
          "alojamiento cerca de Antarès Le Mans",
          "casa para grupos Le Mans concurso"
        ]
      },
    },
  },
  {
    slug: "salle-de-sport-privee-le-mans",
    journey: ["sport"],
    date: "2026-11-07",
    image: "/images/blog/salle-de-sport-le-mans.jpg",
    series: "salle-de-sport",
    seriesLead: true,
    locales: {
      fr: {
          "title": "Une salle de sport privée dans la maison, au Mans",
          "description": "Cage à squat, barre olympique et 185 kg de bumpers, poulie, rameur Concept2, elliptique : la salle de sport privée de notre maison de groupe au Mans.",
          "excerpt": "Au fond du jardin, une vraie salle de musculation et de cross-training réservée à votre groupe : l'équipement zone par zone, ce qu'on peut y faire, et pour qui.",
          "keywords": [
            "location maison avec salle de sport Le Mans",
            "hébergement groupe salle de musculation Le Mans",
            "gîte avec salle de sport Sarthe",
            "logement équipe sportive avec salle de sport",
            "maison de groupe rameur Concept2"
          ]
        },
      en: {
          "title": "A Private Gym in Our Group House in Le Mans",
          "description": "Squat rack, Olympic bar and 185 kg of bumpers, cable pulley, Concept2 rower, elliptical: the private gym in our group house in Le Mans.",
          "excerpt": "At the bottom of the garden, a proper strength and cross-training gym reserved for your group: the equipment zone by zone, what you can do there, and who it's for.",
          "keywords": [
            "house rental with gym le mans",
            "group accommodation with gym le mans",
            "holiday home with gym france",
            "sports team accommodation with gym",
            "accommodation with concept2 rower"
          ]
        },
      it: {
          "title": "Una palestra privata nella casa, a Le Mans",
          "description": "Rack per squat, bilanciere olimpico e 185 kg di bumper, cavo, vogatore Concept2, ellittica: la palestra privata della nostra casa per gruppi a Le Mans.",
          "excerpt": "In fondo al giardino, una vera sala pesi e di cross training riservata al vostro gruppo: l'attrezzatura zona per zona, cosa ci si può fare e per chi.",
          "keywords": [
            "casa vacanze con palestra Le Mans",
            "alloggio con palestra privata Francia",
            "casa per gruppi con palestra Le Mans",
            "affitto casa intera con sala pesi",
            "alloggio squadra sportiva con palestra Le Mans"
          ]
        },
      de: {
          "title": "Ein privater Fitnessraum im Haus, in Le Mans",
          "description": "Squat-Rack, Olympiastange, 185 kg Bumper Plates, Kabelzug, Concept2-Rudergerät, Crosstrainer: der private Fitnessraum unseres Gruppenhauses in Le Mans.",
          "excerpt": "Am Ende des Gartens ein echter Kraft- und Cross-Training-Raum nur für Ihre Gruppe: die Ausstattung Bereich für Bereich, was man dort machen kann und für wen.",
          "keywords": [
            "Ferienhaus mit Fitnessraum Le Mans",
            "Gruppenunterkunft mit Kraftraum Frankreich",
            "Ferienhaus mit Gym Sarthe",
            "Unterkunft Sportmannschaft mit Fitnessraum",
            "Gruppenhaus Concept2 Rudergerät"
          ]
        },
      es: {
          "title": "Casa con gimnasio privado en Le Mans",
          "description": "Jaula de sentadillas, barra olímpica y 185 kg de bumpers, polea, remo Concept2, elíptica: el gimnasio privado de nuestra casa para grupos en Le Mans.",
          "excerpt": "Al fondo del jardín, un auténtico gimnasio de musculación y cross-training reservado a su grupo: el equipamiento zona por zona, qué se puede hacer y para quién.",
          "keywords": [
            "casa con gimnasio Le Mans",
            "alojamiento grupo con gimnasio Francia",
            "casa rural con gimnasio Sarthe",
            "alojamiento equipo deportivo con gimnasio",
            "alquiler casa grupo con gimnasio privado"
          ]
        },
    },
  },
  {
    slug: "fetes-fin-annee-le-mans",
    journey: ["groupe"],
    date: "2026-11-06",
    image: "/images/blog/fetes-fin-annee-le-mans.jpg",
    familyDates: true,
    locales: {
      fr: {
        "title": "Fêter la fin d’année au Mans : Noël en avance, entre les fêtes ou en équipe",
        "description": "Noël avant le 24, retrouvailles entre les fêtes, repas d’équipe : une maison entière au Mans pour 20, table de 16 à 20 places, 9 chambres avec douche.",
        "excerpt": "Le 24 et le 31, chacun est pris ailleurs. Alors on se retrouve autour des fêtes : le week-end d’avant Noël, entre Noël et le Nouvel An, ou pour le repas d’équipe.",
        "keywords": [
          "location maison Noël Le Mans",
          "maison 20 personnes Nouvel An Sarthe",
          "Noël entre amis grande maison",
          "repas de fin d’année entreprise Le Mans",
          "location fêtes de fin d’année Le Mans"
        ]
      },
      en: {
        "title": "Celebrating the festive season in Le Mans: early Christmas or team dinner",
        "description": "An early Christmas, a reunion between the holidays, a year-end team dinner: a whole house in Le Mans for 20, a table for 16 to 20, 9 en-suite bedrooms.",
        "excerpt": "On the 24th and 31st, everyone is busy elsewhere. So groups get together around the festive season: the weekend before Christmas, between the holidays, or for the team dinner.",
        "keywords": [
          "Christmas house rental Le Mans",
          "house for 20 people New Year France",
          "large holiday home Christmas with friends",
          "end-of-year team dinner venue Le Mans",
          "festive season group accommodation Sarthe"
        ]
      },
      it: {
        "title": "Festeggiare Natale e Capodanno a Le Mans in una casa per 20",
        "description": "Natale in anticipo, tra Natale e Capodanno o cena aziendale: una casa intera a Le Mans per 20, tavolo da 16 a 20 posti, 9 camere con doccia privata.",
        "excerpt": "Il 24 e il 31 dicembre ognuno è spesso impegnato altrove: così sempre più gruppi si ritrovano attorno alle feste. Una casa intera a Le Mans per 20 persone, con un tavolo all'altezza, è fatta proprio per questo.",
        "keywords": [
          "casa per Natale in gruppo Le Mans",
          "affitto casa Capodanno 20 persone Francia",
          "casa vacanze feste di fine anno Sarthe",
          "cena aziendale di fine anno Le Mans",
          "casa per grandi gruppi Natale Francia"
        ]
      },
      de: {
        "title": "Jahresende in Le Mans feiern: Weihnachten vorab, zwischen den Jahren",
        "description": "Weihnachten vor dem 24., Treffen zwischen den Jahren, Teamfeier: ein ganzes Haus in Le Mans für 20, Tisch für 16 bis 20, 9 Zimmer mit Duschbad.",
        "excerpt": "Am 24. und 31. sind die meisten anderweitig verplant. Also trifft man sich rund um die Feiertage: am Wochenende vor Weihnachten, zwischen den Jahren oder zur Jahresabschlussfeier im Team.",
        "keywords": [
          "Ferienhaus Weihnachten Le Mans",
          "Haus für 20 Personen Silvester Frankreich",
          "Weihnachten mit Freunden großes Ferienhaus",
          "Weihnachtsfeier Firma Unterkunft Le Mans",
          "Ferienhaus zwischen den Jahren Frankreich"
        ]
      },
      es: {
        "title": "Celebrar el fin de año en Le Mans: Navidad, Año Nuevo o con el equipo",
        "description": "Navidad antes del 24, reencuentros entre fiestas, comida de empresa: una casa entera en Le Mans para 20, mesa de 16 a 20 plazas y 9 habitaciones con ducha.",
        "excerpt": "El 24 y el 31 cada uno tiene ya sus compromisos, así que cada vez más grupos se reúnen alrededor de las fiestas. Una casa entera en Le Mans para 20, con una mesa a la altura.",
        "keywords": [
          "casa para Navidad en grupo Francia",
          "alquiler casa Fin de Año 20 personas",
          "casa grande Navidad Le Mans",
          "comida de empresa Navidad Le Mans",
          "casa rural grupos Navidad Sarthe"
        ]
      },
    },
  },
  {
    slug: "preparation-physique-course-a-pied-le-mans",
    journey: ["sport"],
    date: "2026-11-05",
    image: "/images/blog/salle-de-sport/couvertures/preparation-physique-course-a-pied-le-mans.jpg",
    imageCredit: {
      author: "Mārtiņš Zemlickis + Coliving Barbusse (montage)",
      sourceUrl: "https://unsplash.com/photos/NPFu4GfFZ7E",
      license: "Unsplash License",
      licenseUrl: "https://unsplash.com/license",
    },
    series: "salle-de-sport",
    locales: {
      fr: {
          "title": "Renforcement musculaire du coureur, au Mans",
          "description": "Squat, mollets, hanches, gainage, séance croisée sans impact : le renforcement du coureur, avec le parc du Gué de Maulny à 5 minutes à pied.",
          "excerpt": "Courir plus longtemps sans se blesser : la séance de renforcement, la séance croisée sans impact et un week-end de stage type pour un club de course.",
          "keywords": [
            "renforcement musculaire course à pied",
            "musculation coureur",
            "stage course à pied Le Mans",
            "hébergement club de running Le Mans",
            "préparation marathon musculation"
          ]
        },
      en: {
          "title": "Strength Training for Runners, in Le Mans",
          "description": "Squats, calves, hips, core, low-impact cross-training: strength work for runners, with Gué de Maulny park a 5-minute walk away.",
          "excerpt": "Run for longer without getting injured: the strength session, the low-impact cross-training session and a typical training-camp weekend for a running club.",
          "keywords": [
            "strength training for runners",
            "gym workout for runners",
            "running training camp france",
            "running club accommodation le mans",
            "marathon strength training"
          ]
        },
      it: {
          "title": "Rinforzo muscolare per la corsa, a Le Mans",
          "description": "Squat, polpacci, anche, core, allenamento incrociato senza impatto: il rinforzo del runner, con il parco del Gué de Maulny a 5 minuti a piedi.",
          "excerpt": "Correre più a lungo senza infortuni: l'allenamento di rinforzo, l'allenamento incrociato senza impatto e un weekend di ritiro tipo per un club di corsa.",
          "keywords": [
            "esercizi di rinforzo per la corsa",
            "palestra per runner",
            "forza per podisti",
            "prevenzione infortuni corsa",
            "ritiro club di corsa Francia"
          ]
        },
      de: {
          "title": "Krafttraining für Läufer, in Le Mans",
          "description": "Kniebeuge, Waden, Hüften, Rumpf, Alternativtraining ohne Stoßbelastung: Krafttraining für Läufer, mit dem Park Gué de Maulny 5 Gehminuten entfernt.",
          "excerpt": "Länger laufen ohne Verletzungen: die Krafteinheit, das Alternativtraining ohne Stoßbelastung und ein typisches Trainingslager-Wochenende für einen Laufverein.",
          "keywords": [
            "Krafttraining für Läufer",
            "Kraftübungen Laufen",
            "Trainingslager Laufen Frankreich",
            "Unterkunft Lauftreff Le Mans",
            "Krafttraining Marathonvorbereitung"
          ]
        },
      es: {
          "title": "Fuerza para corredores, en Le Mans",
          "description": "Sentadilla, gemelos, caderas, core, sesión cruzada sin impacto: el fortalecimiento del corredor, con el parque del Gué de Maulny a 5 minutos a pie.",
          "excerpt": "Correr más tiempo sin lesionarse: la sesión de fortalecimiento, la sesión cruzada sin impacto y un fin de semana de concentración tipo para un club de running.",
          "keywords": [
            "ejercicios de fuerza para corredores",
            "gimnasio para runners",
            "concentración running Francia",
            "alojamiento club de running Le Mans",
            "musculación para maratón"
          ]
        },
    },
  },
  {
    slug: "reunion-famille-le-mans",
    journey: ["groupe"],
    date: "2026-11-04",
    image: "/images/blog/reunion-famille-le-mans.jpg",
    familyDates: true,
    locales: {
      fr: {
        title: "Réunir toute la famille au Mans : une maison avec une table de 16 à 20 places",
        description:
          "Noël, anniversaire, mariage, baptême : une maison entière au Mans pour réunir jusqu'à 20 proches, avec une grande table de 16 places (20 avec la véranda) et 9 chambres avec salle de douche privative.",
        excerpt:
          "Nous avons rallongé la table : 16 places assises, 20 avec les mini-tables de la véranda. De quoi réunir toute la famille autour du même repas, et loger tout le monde sur place.",
        keywords: [
          "location maison réunion de famille Le Mans",
          "maison 20 personnes Le Mans",
          "gîte grand groupe Sarthe",
          "location maison Noël en famille Le Mans",
          "hébergement mariage anniversaire Le Mans",
        ],
      },
      en: {
        title: "Bringing the whole family together in Le Mans: a house with a table for 16 to 20",
        description:
          "Christmas, birthday, wedding, christening: a whole house in Le Mans to gather up to 20 relatives, with a 16-seat table (20 with the veranda) and 9 bedrooms with en-suite shower rooms.",
        excerpt:
          "We have extended the table: 16 seats, 20 with the veranda bistro tables. Enough to gather the whole family around one meal, and sleep everyone under the same roof.",
        keywords: [
          "family reunion house rental Le Mans",
          "house for 20 people Le Mans",
          "large group holiday home Sarthe",
          "family Christmas house rental France",
          "wedding guest accommodation Le Mans",
        ],
      },
      it: {
        title: "Riunire tutta la famiglia a Le Mans: una casa con un tavolo da 16 a 20 posti",
        description:
          "Natale, compleanno, matrimonio, battesimo: una casa intera a Le Mans per riunire fino a 20 persone, con un grande tavolo da 16 posti (20 con la veranda) e 9 camere con doccia privata.",
        excerpt:
          "Abbiamo allungato il tavolo: 16 posti a sedere, 20 con i tavolini della veranda. Per riunire tutta la famiglia attorno allo stesso pasto, e dormire tutti sotto lo stesso tetto.",
        keywords: [
          "casa per riunione di famiglia Le Mans",
          "casa 20 persone Le Mans",
          "casa vacanze grandi gruppi Sarthe",
          "affitto casa Natale in famiglia Francia",
          "alloggio invitati matrimonio Le Mans",
        ],
      },
      de: {
        title: "Die ganze Familie in Le Mans vereinen: ein Haus mit einem Tisch für 16 bis 20",
        description:
          "Weihnachten, Geburtstag, Hochzeit, Taufe: ein ganzes Haus in Le Mans für bis zu 20 Angehörige, mit einem großen Tisch für 16 (20 mit dem Wintergarten) und 9 Zimmern mit eigenem Duschbad.",
        excerpt:
          "Wir haben den Tisch verlängert: 16 Sitzplätze, 20 mit den Stehtischen des Wintergartens. Genug, um die ganze Familie an einem Tisch zu versammeln und alle unter einem Dach unterzubringen.",
        keywords: [
          "Ferienhaus Familientreffen Le Mans",
          "Haus für 20 Personen Le Mans",
          "Gruppenhaus Sarthe",
          "Ferienhaus Weihnachten mit Familie Frankreich",
          "Unterkunft Hochzeitsgäste Le Mans",
        ],
      },
      es: {
        title: "Reunir a toda la familia en Le Mans: una casa con una mesa de 16 a 20 plazas",
        description:
          "Navidad, cumpleaños, boda, bautizo: una casa entera en Le Mans para reunir hasta 20 personas, con una gran mesa de 16 plazas (20 con la galería) y 9 habitaciones con ducha privada.",
        excerpt:
          "Hemos alargado la mesa: 16 plazas sentadas, 20 con las mesitas de la galería. Para reunir a toda la familia en torno a la misma comida, y alojar a todos bajo el mismo techo.",
        keywords: [
          "casa para reunión familiar Le Mans",
          "casa 20 personas Le Mans",
          "casa rural grupos grandes Sarthe",
          "alquiler casa Navidad en familia Francia",
          "alojamiento invitados boda Le Mans",
        ],
      },
    },
  },
  {
    slug: "24-heures-velo-le-mans-2027",
    journey: ["evenement"],
    date: "2026-11-03",
    image: "/images/blog/24h-velo.jpg",
    imageCredit: {
      author: "Peter Trimming",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Olympic_Games_2012_-_Men%27s_Road_Race_(7663272188).jpg",
      license: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0/deed.fr",
    },
    event: "24h-velo-2027",
    locales: {
      fr: {
        "title": "24 Heures Vélo du Mans 2027 : dates, format et où loger l’équipe",
        "description": "24 Heures Vélo les 28 et 29 août 2027 au circuit Bugatti : solo, duo ou équipes de 4 à 8, programme, inscriptions et une maison de 9 chambres pour vous.",
        "excerpt": "Course cycliste de 24 heures sur le circuit Bugatti, en solo ou en relais. Dates 2027, format, inscriptions, et comment loger une équipe de relayeurs qui dort par tranches.",
        "keywords": [
          "24 heures vélo 2027",
          "24h vélo Le Mans",
          "hébergement 24 heures vélo",
          "circuit Bugatti vélo",
          "logement équipe cycliste Le Mans"
        ]
      },
      en: {
        "title": "24 Heures Vélo Le Mans 2027: Dates, Format and Team Accommodation",
        "description": "24 Heures Vélo on 28–29 August 2027 at the Bugatti circuit: format, 2026 times and prices, entries, and a house for relay teams 4.7 km from the track.",
        "excerpt": "The 24 Heures Vélo returns to the Bugatti circuit on 28 and 29 August 2027. Everything to know about the format, entries and programme, and how to house a relay team that never sleeps at the same time.",
        "keywords": [
          "24 heures velo le mans 2027",
          "24 hour cycling race le mans",
          "24h velo le mans accommodation",
          "bugatti circuit cycling relay",
          "where to stay 24 heures velo"
        ]
      },
      it: {
        "title": "24 Heures Vélo Le Mans 2027: date, iscrizioni e alloggio",
        "description": "24 Heures Vélo 2027 il 28 e 29 agosto sul circuito Bugatti: formato, programma, iscrizioni e una casa per squadre a 4,7 km dal circuito.",
        "excerpt": "La 24 Heures Vélo torna il 28 e 29 agosto 2027 sul circuito Bugatti. Formato, orari, iscrizioni e come ospitare una squadra di staffettisti che dorme a turni.",
        "keywords": [
          "24 Heures Vélo Le Mans 2027",
          "24 ore in bici Le Mans",
          "gara ciclistica 24 ore Le Mans iscrizioni",
          "alloggio 24 Heures Vélo Le Mans",
          "dove dormire circuito Bugatti"
        ]
      },
      de: {
        "title": "24 Heures Vélo 2027 in Le Mans: Termine, Format und Unterkunft",
        "description": "24 Heures Vélo am 28. und 29. August 2027 auf dem Circuit Bugatti: Format, Ablauf, Anmeldung und ein Haus mit 9 Zimmern für Ihr Team, 4,7 km entfernt.",
        "excerpt": "Die 24 Heures Vélo finden am 28. und 29. August 2027 auf dem Circuit Bugatti statt. Alles zu Format, Anmeldung und Ablauf, und wie Sie ein Staffelteam unterbringen, das nie gleichzeitig schläft.",
        "keywords": [
          "24 Heures Vélo 2027",
          "24 Stunden Radrennen Le Mans",
          "24h Radrennen Le Mans Unterkunft",
          "Circuit Bugatti Radrennen 2027",
          "Unterkunft Radteam Le Mans"
        ]
      },
      es: {
        "title": "24 Heures Vélo Le Mans 2027: fechas, inscripción y alojamiento",
        "description": "24 Heures Vélo 2027 en el circuito Bugatti, 28 y 29 de agosto: formato, inscripciones, horarios y una casa para 20 relevistas a 4,7 km del circuito.",
        "excerpt": "Las 24 Heures Vélo vuelven al circuito Bugatti el 28 y 29 de agosto de 2027. Formato, inscripciones y cómo alojar a un equipo de relevistas que nunca duerme a la vez.",
        "keywords": [
          "24 Heures Vélo Le Mans 2027",
          "24 horas ciclismo Le Mans",
          "inscripción 24 Heures Vélo",
          "alojamiento 24 Heures Vélo Le Mans",
          "carrera ciclista 24 horas circuito Bugatti"
        ]
      },
    },
  },
  {
    slug: "cross-training-le-mans",
    journey: ["sport"],
    date: "2026-11-02",
    image: "/images/blog/salle-de-sport/couvertures/cross-training-le-mans.jpg",
    imageCredit: {
      author: "Mariah Krafft + Coliving Barbusse (montage)",
      sourceUrl: "https://unsplash.com/photos/KaxVB5xh4Nw",
      license: "Unsplash License",
      licenseUrl: "https://unsplash.com/license",
    },
    series: "salle-de-sport",
    inArrivalGuide: true,
    locales: {
      fr: {
          "title": "Cross-training au Mans : six WOD dans la salle de la maison",
          "description": "Barre olympique, bumpers, sol amortissant, rameur Concept2, médecine-ball, box : six WOD de cross-training, seul ou en équipe, dans notre maison au Mans.",
          "excerpt": "Tout le matériel d'une box dans la salle de la maison : six WOD pensés pour cette salle, du « for time » au team WOD, et les bonnes pratiques.",
          "keywords": [
            "cross-training Le Mans",
            "WOD à la maison",
            "location maison avec salle CrossFit",
            "séjour box cross-training",
            "team WOD"
          ]
        },
      en: {
          "title": "Cross-Training in Le Mans: Six WODs in the House Gym",
          "description": "Olympic bar, bumpers, rubber floor, Concept2 rower, medicine ball, plyo box: six cross-training WODs, solo or as a team, in our house in Le Mans.",
          "excerpt": "All the equipment of a box in the house gym: six WODs designed for this gym, from “for time” to a team WOD, plus good practice.",
          "keywords": [
            "crossfit le mans",
            "home gym wod",
            "house rental with crossfit gym",
            "crossfit trip france",
            "team wod ideas"
          ]
        },
      it: {
          "title": "Cross training a Le Mans: sei WOD nella palestra della casa",
          "description": "Bilanciere olimpico, bumper, pavimento antishock, vogatore Concept2, palla medica, box: sei WOD di cross training, da soli o in squadra, a Le Mans.",
          "excerpt": "Tutta l'attrezzatura di un box nella palestra della casa: sei WOD pensati per questa palestra, dal «for time» al team WOD, e le buone pratiche.",
          "keywords": [
            "cross training Le Mans",
            "WOD da fare a casa",
            "allenamento CrossFit in vacanza",
            "team WOD in squadra",
            "box CrossFit Le Mans"
          ]
        },
      de: {
          "title": "Cross-Training in Le Mans: sechs WODs im Fitnessraum",
          "description": "Olympiastange, Bumper Plates, Dämpfungsboden, Concept2-Rudergerät, Medizinball, Box: sechs WODs, allein oder im Team, in unserem Haus in Le Mans.",
          "excerpt": "Die ganze Ausstattung einer Box im Fitnessraum des Hauses: sechs WODs für diesen Raum, von „For Time“ bis zum Team-WOD, und die wichtigsten Regeln.",
          "keywords": [
            "CrossFit Le Mans",
            "WOD ohne Box",
            "Ferienhaus mit CrossFit Gym",
            "Cross-Training Urlaub Frankreich",
            "Team WOD"
          ]
        },
      es: {
          "title": "Cross-training en Le Mans: seis WOD en el gimnasio de la casa",
          "description": "Barra olímpica, bumpers, suelo amortiguador, remo Concept2, balón medicinal, cajón: seis WOD de cross-training, solo o en equipo, en nuestra casa en Le Mans.",
          "excerpt": "Todo el material de un box en el gimnasio de la casa: seis WOD pensados para este espacio, del «for time» al team WOD, y las buenas prácticas.",
          "keywords": [
            "cross-training Le Mans",
            "WOD en casa",
            "casa con box de CrossFit",
            "WOD sin kettlebell",
            "team WOD"
          ]
        },
    },
  },
  {
    slug: "decrassage-lendemain-de-soiree-le-mans",
    journey: ["sport"],
    date: "2026-10-31",
    image: "/images/blog/salle-de-sport/couvertures/decrassage-lendemain-de-soiree-le-mans.jpg",
    imageCredit: {
      author: "Carrie Borden + Coliving Barbusse (montage)",
      sourceUrl: "https://unsplash.com/photos/hiZPxDI7WCg",
      license: "Unsplash License",
      licenseUrl: "https://unsplash.com/license",
    },
    series: "salle-de-sport",
    inArrivalGuide: true,
    locales: {
      fr: {
          "title": "Le lendemain d'une soirée : la séance de décrassage",
          "description": "Mariage, anniversaire, soirée en ville : une séance de décrassage douce le lendemain, à l'elliptique, sur le tapis ou en marchant au parc voisin.",
          "excerpt": "Jambes lourdes et tête aussi ? Une séance douce de 30 minutes pour se remettre en route le lendemain d'une soirée, seul ou en groupe, et ce qu'elle ne fait pas.",
          "keywords": [
            "séance décrassage lendemain de soirée",
            "sport lendemain de mariage",
            "récupération après une soirée",
            "hébergement invités mariage Le Mans",
            "décrassage en groupe"
          ]
        },
      en: {
          "title": "The Morning After a Party: A Gentle Recovery Session",
          "description": "Wedding, birthday, night out in town: a gentle recovery session the next day, on the elliptical, on the mat or with a walk in the nearby park.",
          "excerpt": "Heavy legs and a heavy head? A gentle 30-minute session to get going again the morning after a party, solo or as a group, and what it can't do.",
          "keywords": [
            "workout the morning after drinking",
            "exercise after a wedding",
            "hangover recovery workout",
            "wedding guest accommodation le mans",
            "group recovery session"
          ]
        },
      it: {
          "title": "Il giorno dopo una festa: la seduta di defaticamento",
          "description": "Matrimonio, compleanno, serata in città: una seduta di defaticamento leggera il giorno dopo, all'ellittica, sul tappetino o camminando nel parco vicino.",
          "excerpt": "Gambe pesanti e testa pure? Una seduta leggera di 30 minuti per rimettersi in moto il giorno dopo una serata, da soli o in gruppo, e cosa non fa.",
          "keywords": [
            "allenamento il giorno dopo una festa",
            "sport dopo un matrimonio",
            "defaticamento dopo una serata",
            "allenamento leggero dopo una sbornia",
            "camminata di recupero mattina dopo"
          ]
        },
      de: {
          "title": "Am Morgen nach der Feier: die Auflockerungseinheit",
          "description": "Hochzeit, Geburtstag, Abend in der Stadt: eine sanfte Auflockerungseinheit am nächsten Morgen, auf dem Crosstrainer, auf der Matte oder im nahen Park.",
          "excerpt": "Schwere Beine und schwerer Kopf? Eine sanfte 30-minütige Einheit, um am Morgen nach der Feier wieder in Gang zu kommen, allein oder in der Gruppe, und was sie nicht kann.",
          "keywords": [
            "Sport nach dem Feiern",
            "Sport am Tag nach der Hochzeit",
            "Regeneration nach einer Party",
            "Unterkunft Hochzeitsgäste Le Mans",
            "Training mit Kater"
          ]
        },
      es: {
          "title": "El día después de una fiesta: la sesión regenerativa",
          "description": "Boda, cumpleaños, noche en la ciudad: una sesión regenerativa suave al día siguiente, en la elíptica, en la esterilla o caminando por el parque cercano.",
          "excerpt": "¿Piernas pesadas y cabeza también? Una sesión suave de 30 minutos para ponerse en marcha el día después de una fiesta, solo o en grupo, y lo que no hace.",
          "keywords": [
            "ejercicio después de una fiesta",
            "deporte con resaca",
            "recuperarse después de una boda",
            "alojamiento invitados boda Le Mans",
            "entrenamiento regenerativo en grupo"
          ]
        },
    },
  },
  {
    slug: "concours-equestre-pole-europeen-du-cheval",
    journey: ["groupe"],
    date: "2026-11-01",
    image: "/images/blog/hippodrome.jpg",
    locales: {
      fr: {
        "title": "Concours équestre au Pôle Européen du Cheval : où loger cavaliers, grooms et familles",
        "description": "Concours au Pôle Européen du Cheval : une maison entière au Mans pour toute l’équipe, 9 chambres avec salle de douche, grande table, lave-linge, à 20 min.",
        "excerpt": "Un week-end de concours, c’est toute une équipe à loger : cavaliers, coachs, grooms, parents. Comment la maison s’organise autour du rythme d’un concours équestre.",
        "keywords": [
          "hébergement concours équestre Le Mans",
          "logement Pôle Européen du Cheval",
          "où dormir Yvré-l’Évêque concours",
          "gîte cavaliers Sarthe",
          "hébergement club équitation Le Mans"
        ]
      },
      en: {
        "title": "Horse show at the Pôle Européen du Cheval: a house for your team",
        "description": "Competing at the Pôle Européen du Cheval near Le Mans? A whole house for riders, coaches and grooms: 9 bedrooms with en-suite shower rooms, a table for 20.",
        "excerpt": "Riders, coaches, grooms, parents: a show weekend means a whole team to put up. How the house works for a competition at the Pôle Européen du Cheval, 20 minutes away.",
        "keywords": [
          "Pôle Européen du Cheval accommodation",
          "horse show accommodation Le Mans",
          "equestrian team house rental Sarthe",
          "where to stay Yvré-l'Évêque",
          "riding club group accommodation France"
        ]
      },
      it: {
        "title": "Concorso ippico al Pôle Européen du Cheval: dove alloggiare",
        "description": "Dove alloggiare per un concorso al Pôle Européen du Cheval: casa intera a Le Mans per cavalieri, istruttori e famiglie, 9 camere con doccia privata.",
        "excerpt": "Un weekend di concorso significa spesso un'intera squadra da alloggiare: cavalieri, istruttori, groom, genitori. Ecco come si organizza la casa per un concorso ippico al Pôle Européen du Cheval.",
        "keywords": [
          "alloggio concorso ippico Le Mans",
          "Pôle Européen du Cheval dove dormire",
          "alloggio Yvré-l'Évêque equitazione",
          "casa per squadra di equitazione Francia",
          "alloggio gruppo giovani cavalieri Sarthe"
        ]
      },
      de: {
        "title": "Reitturnier am Pôle Européen du Cheval: ein Haus für Ihr Team",
        "description": "Turnier am Pôle Européen du Cheval: ein ganzes Haus in Le Mans für Reiter, Trainer und Eltern, 9 Zimmer mit Duschbad, großer Tisch, Waschmaschine.",
        "excerpt": "Der Pôle Européen du Cheval richtet rund vierzig Turniere pro Jahr aus. So organisiert sich das Haus für ein Vereinsteam am Wochenende oder eine Gruppe junger Reiter für eine ganze Woche.",
        "keywords": [
          "Unterkunft Reitturnier Le Mans",
          "Pôle Européen du Cheval Unterkunft",
          "Ferienhaus Reitverein Gruppe Frankreich",
          "Unterkunft Springturnier Sarthe",
          "Gruppenhaus Reiter Le Mans"
        ]
      },
      es: {
        "title": "Concurso hípico en el Pôle Européen du Cheval: dónde alojarse en Le Mans",
        "description": "Concurso en el Pôle Européen du Cheval: una casa entera en Le Mans para todo el equipo, 9 habitaciones con ducha, gran mesa y lavadora, a unos 20 min.",
        "excerpt": "Un fin de semana de concurso supone alojar a todo un equipo: jinetes, entrenadores, mozos de cuadra, padres. Así se organiza la casa al ritmo de un concurso hípico.",
        "keywords": [
          "alojamiento concurso hípico Le Mans",
          "dónde dormir Pôle Européen du Cheval",
          "alojamiento jinetes Francia",
          "casa para equipo de hípica Le Mans",
          "alojamiento club hípico Sarthe"
        ]
      },
    },
  },
  {
    slug: "equipe-de-nuit-le-mans",
    journey: ["groupe"],
    date: "2026-10-20",
    image: "/images/blog/entreprises.jpg",
    locales: {
      fr: {
        "title": "Loger une équipe de nuit au Mans : une maison pour dormir le jour",
        "description": "Mission de nuit au Mans : 9 chambres avec salle de douche et volets roulants pour dormir le jour, rue calme, salle de sport, gare à 15 min à pied.",
        "excerpt": "Quand on travaille de nuit, le vrai sujet est de dormir en plein jour. Une chambre noire par personne, le calme, et de quoi occuper ceux qui dorment peu sans réveiller les autres.",
        "keywords": [
          "logement équipe de nuit Le Mans",
          "hébergement travailleurs de nuit Le Mans",
          "logement chantier gare du Mans",
          "hébergement ouvriers en déplacement Le Mans",
          "maison pour équipe en mission Le Mans"
        ]
      },
      en: {
        "title": "Night shift crew in Le Mans: a house where you can sleep by day",
        "description": "Night work near Le Mans station: a whole house with 9 bedrooms, each with its own shower room and roller shutters, a gym, a kitchen and company invoicing.",
        "excerpt": "When you work nights, the challenge is sleeping in broad daylight. A bedroom and shower room each, roller shutters and a quiet street: why the house suits night crews.",
        "keywords": [
          "night shift accommodation Le Mans",
          "contractor accommodation Le Mans",
          "workforce housing near Le Mans station",
          "group accommodation for work crews France",
          "house for 9 workers Le Mans"
        ]
      },
      it: {
        "title": "Alloggio per squadre notturne a Le Mans: dormire bene di giorno",
        "description": "Squadra di notte a Le Mans? Casa intera, 9 camere con doccia privata e tapparelle, palestra, cucina, stazione a 15 min a piedi. Fattura all'azienda.",
        "excerpt": "Quando si lavora di notte, il vero problema è dormire in pieno giorno. Una camera a testa, il buio totale e la quiete: ecco perché la casa si presta alle squadre notturne a Le Mans.",
        "keywords": [
          "alloggio squadra notturna Le Mans",
          "alloggio trasferta lavoro Le Mans",
          "casa per operai in trasferta Francia",
          "alloggio aziendale vicino stazione Le Mans",
          "casa intera per squadra di lavoro Sarthe"
        ]
      },
      de: {
        "title": "Unterkunft für Nachtschichtteams in Le Mans: tagsüber gut schlafen",
        "description": "Haus in Le Mans für Nachtschichtteams: 9 Zimmer mit Duschbad und Rollläden, ruhiges Viertel, Küche, Fitnessraum, Bahnhof 15 Min. zu Fuß, Firmenrechnung.",
        "excerpt": "Wer nachts arbeitet, muss am helllichten Tag schlafen können. Im Oktober 2026 hat ein Nachtschichtteam bei uns gewohnt: Darum eignet sich das Haus dafür, und darauf sollten Sie vor der Buchung achten.",
        "keywords": [
          "Monteurunterkunft Le Mans",
          "Unterkunft Nachtschicht Team Frankreich",
          "Monteurhaus Le Mans Bahnhof",
          "Gruppenunterkunft Arbeiter Sarthe",
          "Firmenunterkunft Le Mans mit Rechnung"
        ]
      },
      es: {
        "title": "Alojar a un equipo de noche en Le Mans: una casa para dormir de día",
        "description": "Misión nocturna en Le Mans: 9 habitaciones con ducha privada y persianas para dormir de día, calle tranquila, gimnasio y cocina, estación a 15 min a pie.",
        "excerpt": "Cuando se trabaja de noche, lo importante es poder dormir de día. Una habitación a oscuras por persona, tranquilidad y con qué entretener a quienes duermen poco sin despertar a los demás.",
        "keywords": [
          "alojamiento trabajadores Le Mans",
          "alojamiento equipo de trabajo Francia",
          "casa para trabajadores desplazados Le Mans",
          "alojamiento cerca estación Le Mans",
          "alquiler casa empresa Le Mans"
        ]
      },
    },
  },
  {
    slug: "exposants-ecuries-circuit-le-mans",
    journey: ["evenement", "groupe"],
    date: "2026-10-10",
    image: "/images/blog/village-exposants-le-mans.jpg",
    imageCredit: {
      author: "Kevin Decherf",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Village_-_Stand_Toyota_-_VR_(41157055540).jpg",
      license: "CC BY-SA 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/deed.fr",
    },
    events: ["24h-moto-2027", "motogp-2027", "24h-mans-2027", "classic-2027"],
    locales: {
      fr: {
        "title": "Loger son équipe d’exposant ou d’écurie au circuit du Mans",
        "description": "Exposants, écuries, prestataires : logez toute votre équipe pendant les 24 Heures, le MotoGP ou Le Mans Classic. 9 chambres avec clé, à 4,7 km du circuit.",
        "excerpt": "Montage tôt, démontage tard, journées sans fin : comment loger une équipe d’exposant, d’écurie ou de prestataire sous le même toit pendant les grands événements du circuit du Mans.",
        "keywords": [
          "hébergement exposant 24 Heures du Mans",
          "logement écurie Le Mans",
          "hébergement équipe MotoGP Le Mans",
          "logement prestataire circuit du Mans",
          "maison groupe professionnel Le Mans"
        ]
      },
      en: {
        "title": "Exhibitors and Race Teams at Le Mans: House Your Whole Crew",
        "description": "Stand, racing team or contractor at the Le Mans circuit? 9 lockable bedrooms with shower rooms, long stays from set-up to take-down, company invoice.",
        "excerpt": "Exhibitors, racing teams and contractors live the Le Mans events differently: early set-up, long days, late take-down. Here is how to house your whole team under one roof, 4.7 km from the circuit, with 2027 dates to block out now.",
        "keywords": [
          "le mans 24 hours team accommodation",
          "race team house rental le mans",
          "exhibitor accommodation le mans circuit",
          "le mans classic 2027 accommodation",
          "motogp le mans 2027 group accommodation"
        ]
      },
      it: {
        "title": "Alloggio per espositori e team al circuito di Le Mans",
        "description": "Espositori, team e fornitori: una casa intera a 4,7 km dal circuito di Le Mans, 9 camere con chiave e doccia privata, fattura all'azienda. Date 2027.",
        "excerpt": "Allestimento, giornate lunghe, smontaggio: una casa intera a 4,7 km dal circuito per alloggiare tutta la squadra, con fattura intestata all'azienda e le date 2027 da bloccare.",
        "keywords": [
          "alloggio team 24 Ore di Le Mans",
          "alloggio espositori MotoGP Le Mans",
          "casa per squadra Le Mans Classic",
          "dove dormire staff circuito Le Mans",
          "alloggio aziendale Le Mans fattura"
        ]
      },
      de: {
        "title": "Unterkunft für Aussteller und Rennställe an der Strecke Le Mans",
        "description": "24 Stunden, MotoGP, Le Mans Classic 2027: ganzes Haus mit 9 abschließbaren Zimmern für Ihr Team, 4,7 km von der Strecke, Rechnung auf Ihr Unternehmen.",
        "excerpt": "Aussteller, Rennställe und Dienstleister bleiben vom Aufbau bis zum Abbau. So bringen Sie Ihr ganzes Team 4,7 km von der Rennstrecke von Le Mans unter einem Dach unter, mit den Terminen 2027.",
        "keywords": [
          "Unterkunft Rennstall Le Mans",
          "Unterkunft Aussteller 24h Le Mans",
          "Teamunterkunft 24 Stunden von Le Mans 2027",
          "Unterkunft MotoGP Le Mans Team",
          "Ferienhaus Le Mans Firmenrechnung"
        ]
      },
      es: {
        "title": "Expositores y escuderías: alojar a su equipo en Le Mans",
        "description": "Montaje, carrera y desmontaje en el circuito de Le Mans: casa para 20, 9 habitaciones con llave y ducha, factura a la empresa, a 4,7 km del circuito.",
        "excerpt": "Expositores, escuderías y proveedores del circuito de Le Mans: una casa entera para todo su equipo, del montaje al desmontaje, con factura a nombre de la empresa.",
        "keywords": [
          "alojamiento equipo 24 Horas de Le Mans",
          "alojamiento escudería Le Mans",
          "alojamiento expositores MotoGP Le Mans",
          "casa grupo Le Mans Classic 2027",
          "alojamiento empresa circuito Le Mans"
        ]
      },
    },
  },
  {
    slug: "24-heures-moto-le-mans-2027",
    journey: ["evenement"],
    date: "2026-10-01",
    image: "/images/blog/24h-moto.jpg",
    event: "24h-moto-2027",
    locales: {
      fr: {
        title: "24 Heures Moto 2027 (8-11 avril) : hébergement au Mans",
        description:
          "Tout pour organiser votre week-end des 24 Heures Moto 2027 au Mans, 50ᵉ édition du 8 au 11 avril : zones d'hébergement, prix, parking moto, conseils pour groupes de motards.",
        excerpt:
          "100 000 spectateurs, une ambiance motards unique et un hébergement bien placé, c'est ce qu'il faut. Voici comment préparer votre week-end.",
        keywords: [
          "24 Heures Moto Le Mans 2027",
          "hébergement 24h moto",
          "parking moto Le Mans circuit",
          "location maison 24h moto",
          "week-end moto Le Mans",
        ],
      },
      en: {
        title: "Le Mans 24 Hours Motorcycle 2027 (8-11 April): where to stay",
        description:
          "Everything to plan your 24 Hours Motorcycle 2027 weekend in Le Mans, 50th edition on 8-11 April: accommodation areas, prices, motorcycle parking, tips for biker groups.",
        excerpt:
          "100,000 spectators, a unique biker vibe and a well-located place to stay — here's how to prepare your weekend.",
        keywords: [
          "24 Hours Motorcycle Le Mans 2027",
          "24h moto accommodation",
          "motorcycle parking Le Mans circuit",
          "house rental 24h moto",
          "motorcycle weekend Le Mans",
        ],
      },
      it: {
        title: "24 Ore Moto Le Mans 2027 (8-11 aprile): dove alloggiare",
        description:
          "Tutto per organizzare il vostro weekend della 24 Ore Moto 2027 a Le Mans, 50ª edizione dall'8 all'11 aprile: zone di alloggio, prezzi, parcheggio moto, consigli per gruppi di motociclisti.",
        excerpt:
          "100.000 spettatori, un'atmosfera motociclistica unica e un alloggio ben posizionato, ecco quello che serve. Ecco come preparare il vostro weekend.",
        keywords: [
          "24 Ore Moto Le Mans 2027",
          "alloggio 24h moto",
          "parcheggio moto circuito Le Mans",
          "affitto casa 24h moto",
          "weekend moto Le Mans",
        ],
      },
      de: {
        title: "24 Stunden Motorrad Le Mans 2027 (8.–11. April): Unterkunft",
        description:
          "Alles, um Ihr 24-Stunden-Motorrad-Wochenende 2027 in Le Mans zu organisieren, 50. Ausgabe vom 8. bis 11. April: Unterkunftszonen, Preise, Motorradparken, Tipps für Bikergruppen.",
        excerpt:
          "100.000 Zuschauer, eine einzigartige Biker-Atmosphäre und eine gut gelegene Unterkunft — so bereiten Sie Ihr Wochenende vor.",
        keywords: [
          "24 Stunden Motorrad Le Mans 2027",
          "Unterkunft 24h Moto",
          "Motorradparken Le Mans Circuit",
          "Haus mieten 24h Moto",
          "Motorrad-Wochenende Le Mans",
        ],
      },
      es: {
        title: "24 Horas Moto Le Mans 2027 (8-11 de abril): dónde alojarse",
        description:
          "Todo para organizar su fin de semana de las 24 Horas Moto 2027 en Le Mans, 50ª edición del 8 al 11 de abril: zonas de alojamiento, precios, parking moto, consejos para grupos de moteros.",
        excerpt:
          "100.000 espectadores, un ambiente motero único y un alojamiento bien ubicado: eso es lo que necesita. Así puede preparar su fin de semana.",
        keywords: [
          "24 Horas Moto Le Mans 2027",
          "alojamiento 24h moto",
          "parking moto circuito Le Mans",
          "alquiler casa 24h moto",
          "fin de semana moto Le Mans",
        ],
      },
    },
  },
  {
    slug: "le-mans-classic-2027",
    journey: ["evenement"],
    date: "2026-09-01",
    image: "/images/blog/le-mans-classic.jpg",
    event: "classic-2027",
    locales: {
      fr: {
        title: "Le Mans Classic Heritage 2027 (1-4 juillet) : où loger",
        description:
          "Le Mans Classic Heritage 2027, du 1ᵉʳ au 4 juillet : plus grand rassemblement mondial de voitures de course anciennes. Dates, programme, hébergement et conseils pratiques pour les passionnés et clubs.",
        excerpt:
          "700 voitures mythiques de 1923 à 1993, 24 heures de course, 235 000 spectateurs. Préparez votre séjour pour la plus grande fête de l'automobile de collection.",
        keywords: [
          "Le Mans Classic Heritage 2027",
          "Le Mans Classic hébergement",
          "rassemblement voitures anciennes Le Mans",
          "club collectionneurs Le Mans",
          "location maison Le Mans Classic",
        ],
      },
      en: {
        title: "Le Mans Classic Heritage 2027 (1-4 July): where to stay",
        description:
          "Le Mans Classic Heritage 2027, from 1 to 4 July: the world's largest gathering of vintage racing cars. Dates, schedule, accommodation and practical tips for enthusiasts and clubs.",
        excerpt:
          "700 legendary cars from 1923 to 1993, 24 hours of racing, 235,000 spectators. Plan your stay for the greatest vintage motoring celebration.",
        keywords: [
          "Le Mans Classic Heritage 2027",
          "Le Mans Classic accommodation",
          "vintage car gathering Le Mans",
          "collector club Le Mans",
          "house rental Le Mans Classic",
        ],
      },
      it: {
        title: "Le Mans Classic Heritage 2027 (1-4 luglio): dove alloggiare",
        description:
          "Le Mans Classic Heritage 2027, dal 1º al 4 luglio: il più grande raduno mondiale di auto da corsa d'epoca. Date, programma, alloggio e consigli pratici per appassionati e club.",
        excerpt:
          "700 vetture mitiche dal 1923 al 1993, 24 ore di corsa, 235.000 spettatori. Preparate il vostro soggiorno per la più grande festa dell'automobile d'epoca.",
        keywords: [
          "Le Mans Classic Heritage 2027",
          "alloggio Le Mans Classic",
          "raduno auto d'epoca Le Mans",
          "club collezionisti Le Mans",
          "affitto casa Le Mans Classic",
        ],
      },
      de: {
        title: "Le Mans Classic Heritage 2027 (1.–4. Juli): Unterkunft",
        description:
          "Le Mans Classic Heritage 2027, vom 1. bis 4. Juli: das weltgrößte Treffen historischer Rennwagen. Daten, Programm, Unterkunft und praktische Tipps für Enthusiasten und Clubs.",
        excerpt:
          "700 legendäre Fahrzeuge von 1923 bis 1993, 24 Stunden Rennen, 235.000 Zuschauer. Planen Sie Ihren Aufenthalt für das größte Fest des klassischen Automobilsports.",
        keywords: [
          "Le Mans Classic Heritage 2027",
          "Le Mans Classic Unterkunft",
          "Oldtimer-Treffen Le Mans",
          "Sammlerclub Le Mans",
          "Haus mieten Le Mans Classic",
        ],
      },
      es: {
        title: "Le Mans Classic Heritage 2027 (1-4 de julio): dónde alojarse",
        description:
          "Le Mans Classic Heritage 2027, del 1 al 4 de julio: el mayor encuentro mundial de coches de carreras clásicos. Fechas, programa, alojamiento y consejos prácticos para aficionados y clubes.",
        excerpt:
          "700 coches míticos de 1923 a 1993, 24 horas de carrera, 235.000 espectadores. Prepare su estancia para la mayor fiesta del automovilismo de colección.",
        keywords: [
          "Le Mans Classic Heritage 2027",
          "alojamiento Le Mans Classic",
          "encuentro coches clásicos Le Mans",
          "club coleccionistas Le Mans",
          "alquiler casa Le Mans Classic",
        ],
      },
    },
  },
  {
    slug: "ou-se-loger-24h-du-mans-2027",
    journey: ["evenement"],
    date: "2026-09-01",
    image: "/images/blog/24h-du-mans.jpg",
    event: "24h-mans-2027",
    locales: {
      fr: {
        title: "Où se loger pour les 24 Heures du Mans 2027 ?",
        description:
          "Guide complet pour choisir son hébergement pendant les 24h du Mans 2027, 95ᵉ édition les 12-13 juin : zones, prix, conseils pour grands groupes et familles. Notre maison de 9 suites à moins de 5 km du circuit.",
        excerpt:
          "Où dormir pendant les 24h du Mans ? Zones, tarifs, disponibilités — tout ce qu'il faut savoir pour réserver son hébergement avant que tout soit pris.",
        keywords: [
          "24 Heures du Mans 2027",
          "hébergement 24h du Mans",
          "où se loger Le Mans course",
          "location maison 24h du Mans",
          "logement proche circuit Bugatti",
        ],
      },
      en: {
        title: "Where to stay for the 24 Hours of Le Mans 2027?",
        description:
          "Complete guide to choosing your accommodation for the 24 Hours of Le Mans 2027, 95th edition on 12-13 June: areas, prices, tips for large groups and families. Our 9-suite house less than 5 km from the circuit.",
        excerpt:
          "Where to sleep during the 24 Hours of Le Mans? Areas, prices, availability — everything you need to book before it's all taken.",
        keywords: [
          "24 Hours of Le Mans 2027",
          "24h Le Mans accommodation",
          "where to stay Le Mans race",
          "house rental 24h Le Mans",
          "lodging near Bugatti circuit",
        ],
      },
      it: {
        title: "Dove alloggiare per la 24 Ore di Le Mans 2027?",
        description:
          "Guida completa per scegliere il proprio alloggio durante la 24h di Le Mans 2027, 95ª edizione il 12-13 giugno: zone, prezzi, consigli per grandi gruppi e famiglie. La nostra casa con 9 suite a meno di 5 km dal circuito.",
        excerpt:
          "Dove dormire durante la 24h di Le Mans? Zone, tariffe, disponibilità — tutto quello che c'è da sapere per prenotare prima che sia tutto esaurito.",
        keywords: [
          "24 Ore di Le Mans 2027",
          "alloggio 24h di Le Mans",
          "dove alloggiare Le Mans gara",
          "affitto casa 24h di Le Mans",
          "alloggio vicino Circuit Bugatti",
        ],
      },
      de: {
        title: "Wo wohnen für die 24 Stunden von Le Mans 2027?",
        description:
          "Kompletter Guide zur Wahl Ihrer Unterkunft während der 24 Stunden von Le Mans 2027, 95. Ausgabe am 12.-13. Juni: Zonen, Preise, Tipps für Gruppen und Familien. Unser Haus mit 9 Suiten weniger als 5 km vom Circuit.",
        excerpt:
          "Wo schlafen während der 24 Stunden von Le Mans? Zonen, Preise, Verfügbarkeit — alles was Sie wissen müssen, um zu buchen, bevor alles weg ist.",
        keywords: [
          "24 Stunden von Le Mans 2027",
          "Unterkunft 24h Le Mans",
          "wo wohnen Le Mans Rennen",
          "Haus mieten 24h Le Mans",
          "Unterkunft nahe Circuit Bugatti",
        ],
      },
      es: {
        title: "¿Dónde alojarse para las 24 Horas de Le Mans 2027?",
        description:
          "Guía completa para elegir su alojamiento durante las 24 Horas de Le Mans 2027, 95ª edición los 12-13 de junio: zonas, precios, consejos para grupos grandes y familias. Nuestra casa de 9 suites a menos de 5 km del circuito.",
        excerpt:
          "¿Dónde dormir durante las 24 Horas de Le Mans? Zonas, tarifas, disponibilidad: todo lo que hay que saber para reservar antes de que se agote.",
        keywords: [
          "24 Horas de Le Mans 2027",
          "alojamiento 24h de Le Mans",
          "dónde alojarse Le Mans carrera",
          "alquiler casa 24h de Le Mans",
          "alojamiento cerca Circuito Bugatti",
        ],
      },
    },
  },
  {
    slug: "motogp-france-le-mans-2027",
    journey: ["evenement"],
    date: "2026-10-01",
    image: "/images/blog/motogp.jpg",
    event: "motogp-2027",
    locales: {
      fr: {
        title: "MotoGP France 2027 au Mans : hébergement et conseils pratiques",
        description:
          "Grand Prix de France MotoGP 2027 au Circuit Bugatti (14-16 mai), tarifs hébergement, transport, conseils pour un week-end réussi en famille ou entre amis.",
        excerpt:
          "La manche la plus fréquentée du championnat : préparez votre week-end MotoGP au Mans avec notre guide complet.",
        keywords: [
          "MotoGP France 2027",
          "Grand Prix France MotoGP Le Mans",
          "hébergement MotoGP Le Mans",
          "location maison MotoGP France",
          "week-end MotoGP Circuit Bugatti",
        ],
      },
      en: {
        title: "MotoGP France 2027 in Le Mans: accommodation and practical tips",
        description:
          "French MotoGP 2027 at the Bugatti Circuit (14-16 May), accommodation rates, transport, tips for a great weekend with family or friends.",
        excerpt:
          "The most attended round of the championship: plan your MotoGP weekend in Le Mans with our complete guide.",
        keywords: [
          "French MotoGP 2027",
          "French Grand Prix MotoGP Le Mans",
          "MotoGP Le Mans accommodation",
          "house rental French MotoGP",
          "MotoGP Bugatti Circuit weekend",
        ],
      },
      it: {
        title: "MotoGP Francia 2027 a Le Mans: alloggio e consigli pratici",
        description:
          "Gran Premio di Francia MotoGP 2027 al Circuit Bugatti (14-16 maggio), tariffe alloggio, trasporti, consigli per un weekend riuscito in famiglia o tra amici.",
        excerpt:
          "La gara più frequentata del campionato: preparate il vostro weekend MotoGP a Le Mans con la nostra guida completa.",
        keywords: [
          "MotoGP Francia 2027",
          "Gran Premio Francia MotoGP Le Mans",
          "alloggio MotoGP Le Mans",
          "affitto casa MotoGP Francia",
          "weekend MotoGP Circuit Bugatti",
        ],
      },
      de: {
        title: "MotoGP Frankreich 2027 in Le Mans: Unterkunft und praktische Tipps",
        description:
          "Frankreich-Grand-Prix MotoGP 2027 auf dem Circuit Bugatti (14.-16. Mai), Unterkunftspreise, Anreise, Tipps für ein gelungenes Wochenende mit Familie oder Freunden.",
        excerpt:
          "Der meistbesuchte Lauf der Meisterschaft: Planen Sie Ihr MotoGP-Wochenende in Le Mans mit unserem kompletten Guide.",
        keywords: [
          "MotoGP Frankreich 2027",
          "Großer Preis Frankreich MotoGP Le Mans",
          "MotoGP Le Mans Unterkunft",
          "Haus mieten MotoGP Frankreich",
          "MotoGP-Wochenende Circuit Bugatti",
        ],
      },
      es: {
        title: "MotoGP de Francia 2027 en Le Mans: alojamiento y consejos prácticos",
        description:
          "Gran Premio de Francia MotoGP 2027 en el Circuito Bugatti (14-16 de mayo), tarifas de alojamiento, transporte, consejos para un fin de semana logrado en familia o entre amigos.",
        excerpt:
          "La cita más concurrida del campeonato: prepare su fin de semana de MotoGP en Le Mans con nuestra guía completa.",
        keywords: [
          "MotoGP Francia 2027",
          "Gran Premio Francia MotoGP Le Mans",
          "alojamiento MotoGP Le Mans",
          "alquiler casa MotoGP Francia",
          "fin de semana MotoGP Circuito Bugatti",
        ],
      },
    },
  },
  {
    slug: "equipe-sportive-le-mans",
    journey: ["groupe"],
    date: "2026-09-29",
    image: "/images/blog/equipe-sportive-handball.jpg",
    locales: {
      fr: {
        "title": "Loger une équipe sportive au Mans : une maison pour tout le club",
        "description": "Tournoi, match à l’extérieur ou stage au Mans : 9 chambres avec salle de douche, table de 16 à 20 places, lave-linge, salle de sport. Jusqu’à 20 personnes.",
        "excerpt": "Joueurs, coachs et staff sous le même toit : une chambre avec salle de douche par joueur ou par binôme, repas d’équipe, maillots lavés sur place et vidéo d’avant-match sur grand écran.",
        "keywords": [
          "hébergement équipe sportive Le Mans",
          "logement club sportif Le Mans",
          "tournoi Le Mans hébergement groupe",
          "stage sportif Le Mans maison",
          "gîte équipe 20 personnes Le Mans"
        ]
      },
      en: {
        "title": "Sports Team Accommodation in Le Mans: A Whole House for 20",
        "description": "Away match, tournament or training camp in Le Mans? 9 bedrooms with shower rooms, a table for 20, kit washing, a private gym, 15 min from the station.",
        "excerpt": "For a sports team in Le Mans, a whole house beats a hotel: 9 bedrooms with private shower rooms, team meals around one big table and kit washed on site. Handball, karting and cycling teams stayed with us in 2026.",
        "keywords": [
          "sports team accommodation le mans",
          "group accommodation le mans",
          "where to stay le mans tournament",
          "large group house le mans",
          "team training camp accommodation france"
        ]
      },
      it: {
        "title": "Alloggio per squadre sportive a Le Mans: casa intera fino a 20 posti",
        "description": "Casa intera a Le Mans per squadre sportive: 9 camere con doccia privata, tavolo da 20, lavatrice, palestra. Vicino ad Antarès, stadio e circuito kart.",
        "excerpt": "Torneo, trasferta o ritiro a Le Mans? Una casa intera con 9 camere e bagno privato con doccia, un grande tavolo per i pasti di squadra e tutto per lavare le divise e recuperare.",
        "keywords": [
          "alloggio squadra sportiva Le Mans",
          "casa per gruppi Le Mans",
          "dove dormire torneo Le Mans",
          "alloggio squadra kart Le Mans",
          "casa vacanze 20 persone Le Mans"
        ]
      },
      de: {
        "title": "Unterkunft für Sportteams in Le Mans: ganzes Haus bis 20 Personen",
        "description": "Turnier, Spiel oder Trainingslager in Le Mans: 9 Zimmer mit eigenem Duschbad, Tisch für 20, Waschmaschine, Fitnessraum. Rechnung für Vereine möglich.",
        "excerpt": "Eine Handballmannschaft, ein Kartteam aus Singapur und eine Radsportgruppe haben 2026 bei uns gewohnt. Warum ein ganzes Haus zu einer Sportmannschaft passt und was Sie vor der Buchung wissen sollten.",
        "keywords": [
          "Unterkunft Sportmannschaft Le Mans",
          "Gruppenunterkunft Le Mans Verein",
          "Ferienhaus Le Mans 20 Personen",
          "Unterkunft Turnier Le Mans",
          "Kartteam Unterkunft Le Mans"
        ]
      },
      es: {
        "title": "Alojamiento para equipos deportivos en Le Mans: casa entera hasta 20",
        "description": "Casa entera en Le Mans para equipos deportivos: 9 habitaciones con ducha, mesa para 20, lavadora, gimnasio privado y tranvía a Antarès y al estadio.",
        "excerpt": "Un torneo, una concentración o un partido en Le Mans: una casa entera con 9 habitaciones con baño con ducha, una gran mesa y lavadora para alojar a todo el equipo bajo el mismo techo.",
        "keywords": [
          "alojamiento equipo deportivo Le Mans",
          "casa grupo Le Mans 20 personas",
          "alojamiento torneo Le Mans",
          "dónde dormir equipo balonmano Francia",
          "alojamiento karting Le Mans"
        ]
      },
    },
  },
  {
    slug: "porsche-sprint-challenge-le-mans",
    journey: ["evenement"],
    event: "porsche-sprint-2026",
    date: "2026-09-02",
    image: "/images/blog/porsche-sprint-challenge.jpg",
    imageCredit: {
      author: "Sebring12Hrs",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Paddock_Carrera_Cup_Le_Mans_2014_7.jpg",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
    },
    locales: {
      fr: {
        title: "Porsche Sprint Challenge au Mans : où se loger avec son équipage ?",
        description:
          "Porsche Sprint Challenge France sur le circuit Bugatti du Mans : format monotype, profil des équipages, où se loger. Maison entière de 9 suites pour 20 personnes à 20 min du circuit.",
        excerpt:
          "Un plateau 100 % Porsche sur le circuit Bugatti, des équipages de 3 à 6 personnes par voiture engagée. Le guide hébergement pour votre week-end de course.",
        keywords: [
          "Porsche Sprint Challenge Le Mans",
          "hébergement équipage Porsche Le Mans",
          "circuit Bugatti Le Mans logement",
          "maison entière sport auto Le Mans",
          "Porsche Sprint Challenge France 2027",
          "location maison week-end course Le Mans",
        ],
      },
      en: {
        title: "Porsche Sprint Challenge at Le Mans: where to stay with your crew",
        description:
          "Porsche Sprint Challenge France on the Le Mans Bugatti circuit: one-make format, who the crews are, where to stay. Whole house with 9 en-suite bedrooms for 20 people, 20 min from the track.",
        excerpt:
          "An all-Porsche grid on the Bugatti circuit, with 3 to 6 people per entered car. The accommodation guide for your race weekend.",
        keywords: [
          "Porsche Sprint Challenge Le Mans",
          "Porsche crew accommodation Le Mans",
          "Bugatti circuit Le Mans stay",
          "whole house motorsport Le Mans",
          "Porsche Sprint Challenge France 2027",
          "house rental race weekend Le Mans",
        ],
      },
      it: {
        title: "Porsche Sprint Challenge a Le Mans: dove alloggiare con l'equipaggio",
        description:
          "Porsche Sprint Challenge France sul circuito Bugatti di Le Mans: format monomarca, profilo degli equipaggi, dove alloggiare. Casa intera di 9 suite per 20 persone a 20 min dal circuito.",
        excerpt:
          "Uno schieramento 100 % Porsche sul circuito Bugatti, con 3 a 6 persone per vettura iscritta. La guida all'alloggio per il vostro weekend di gara.",
        keywords: [
          "Porsche Sprint Challenge Le Mans",
          "alloggio equipaggio Porsche Le Mans",
          "circuito Bugatti Le Mans alloggio",
          "casa intera sport auto Le Mans",
          "Porsche Sprint Challenge France 2027",
          "affitto casa weekend gara Le Mans",
        ],
      },
      de: {
        title: "Porsche Sprint Challenge in Le Mans: wo wohnen mit der Mannschaft?",
        description:
          "Porsche Sprint Challenge France auf dem Bugatti-Circuit in Le Mans: Markenpokal-Format, Profil der Mannschaften, Unterkunft. Ganzes Haus mit 9 Suiten für 20 Personen, 20 Min. von der Strecke.",
        excerpt:
          "Ein reines Porsche-Feld auf dem Bugatti-Circuit, mit 3 bis 6 Personen pro gemeldetem Auto. Der Unterkunfts-Leitfaden für Ihr Rennwochenende.",
        keywords: [
          "Porsche Sprint Challenge Le Mans",
          "Unterkunft Porsche Mannschaft Le Mans",
          "Bugatti Circuit Le Mans Unterkunft",
          "ganzes Haus Motorsport Le Mans",
          "Porsche Sprint Challenge France 2027",
          "Haus mieten Rennwochenende Le Mans",
        ],
      },
      es: {
        title: "Porsche Sprint Challenge en Le Mans: dónde alojarse con su equipo",
        description:
          "Porsche Sprint Challenge France en el circuito Bugatti de Le Mans: formato monomarca, perfil de los equipos, dónde alojarse. Casa entera de 9 suites para 20 personas a 20 min del circuito.",
        excerpt:
          "Una parrilla 100 % Porsche en el circuito Bugatti, con 3 a 6 personas por coche inscrito. La guía de alojamiento para su fin de semana de carrera.",
        keywords: [
          "Porsche Sprint Challenge Le Mans",
          "alojamiento equipo Porsche Le Mans",
          "circuito Bugatti Le Mans alojamiento",
          "casa entera automovilismo Le Mans",
          "Porsche Sprint Challenge France 2027",
          "alquiler casa fin de semana carrera Le Mans",
        ],
      },
    },
  },
  {
    slug: "le-mans-classic",
    journey: ["evenement"],
    date: "2026-05-27",
    image: "/images/blog/le-mans-classic.jpg",
    locales: {
      fr: {
        title: "Le Mans Classic : guide du rassemblement mondial des voitures anciennes",
        description:
          "Le Mans Classic, plus grand rassemblement mondial de voitures de course anciennes : dates, programme, hébergement et conseils pratiques pour les passionnés et clubs.",
        excerpt:
          "700 voitures mythiques de 1923 à 1993, 24 heures de course, 235 000 spectateurs. Préparez votre séjour pour la plus grande fête de l'automobile de collection.",
        keywords: [
          "Le Mans Classic 2026",
          "Le Mans Classic hébergement",
          "rassemblement voitures anciennes Le Mans",
          "club collectionneurs Le Mans",
          "location maison Le Mans Classic",
        ],
      },
      en: {
        title: "Le Mans Classic: a guide to the world's largest vintage racing gathering",
        description:
          "Le Mans Classic, the world's largest gathering of vintage racing cars: dates, schedule, accommodation and practical tips for enthusiasts and clubs.",
        excerpt:
          "700 legendary cars from 1923 to 1993, 24 hours of racing, 235,000 spectators. Plan your stay for the greatest vintage motoring celebration.",
        keywords: [
          "Le Mans Classic 2026",
          "Le Mans Classic accommodation",
          "vintage car gathering Le Mans",
          "collector club Le Mans",
          "house rental Le Mans Classic",
        ],
      },
      it: {
        title: "Le Mans Classic: guida al più grande raduno mondiale di auto d'epoca",
        description:
          "Le Mans Classic, il più grande raduno mondiale di auto da corsa d'epoca: date, programma, alloggio e consigli pratici per appassionati e club.",
        excerpt:
          "700 vetture mitiche dal 1923 al 1993, 24 ore di corsa, 235.000 spettatori. Preparate il vostro soggiorno per la più grande festa dell'automobile d'epoca.",
        keywords: [
          "Le Mans Classic 2026",
          "alloggio Le Mans Classic",
          "raduno auto d'epoca Le Mans",
          "club collezionisti Le Mans",
          "affitto casa Le Mans Classic",
        ],
      },
      de: {
        title: "Le Mans Classic: Guide zum weltgrößten Oldtimer-Rennsporttreffen",
        description:
          "Le Mans Classic, das weltgrößte Treffen historischer Rennwagen: Daten, Programm, Unterkunft und praktische Tipps für Enthusiasten und Clubs.",
        excerpt:
          "700 legendäre Fahrzeuge von 1923 bis 1993, 24 Stunden Rennen, 235.000 Zuschauer. Planen Sie Ihren Aufenthalt für das größte Fest des klassischen Automobilsports.",
        keywords: [
          "Le Mans Classic 2026",
          "Le Mans Classic Unterkunft",
          "Oldtimer-Treffen Le Mans",
          "Sammlerclub Le Mans",
          "Haus mieten Le Mans Classic",
        ],
      },
      es: {
        title: "Le Mans Classic: guía del mayor encuentro mundial de coches clásicos de carreras",
        description:
          "Le Mans Classic, el mayor encuentro mundial de coches de carreras clásicos: fechas, programa, alojamiento y consejos prácticos para aficionados y clubes.",
        excerpt:
          "700 coches míticos de 1923 a 1993, 24 horas de carrera, 235.000 espectadores. Prepare su estancia para la mayor fiesta del automovilismo de colección.",
        keywords: [
          "Le Mans Classic 2026",
          "alojamiento Le Mans Classic",
          "encuentro coches clásicos Le Mans",
          "club coleccionistas Le Mans",
          "alquiler casa Le Mans Classic",
        ],
      },
    },
    soldOut: true,
    supersededBy: "le-mans-classic-2027",
    nextEdition: "2027",
  },
  {
    slug: "jardin-securise-le-mans",
    journey: ["groupe", "preparer"],
    date: "2026-05-29",
    image: "/images/blog/jardin-securise-le-mans.jpg",
    locales: {
      fr: {
        title: "Jardin clos et sécurisé au Mans : un espace extérieur pour vos séjours en groupe",
        description:
          "Profitez de notre jardin privatif de 90 m², clos et sécurisé, en plein cœur du Mans : salon de jardin 8 places, grandes tables pour 20 personnes, exposition plein sud.",
        excerpt:
          "Avec la belle saison, le jardin est prêt à vous recevoir : 90 m² clos et sécurisés, salon 8 places et grandes tables pour manger dehors jusqu'à 20 personnes.",
        keywords: [
          "jardin Le Mans",
          "location maison avec jardin Le Mans",
          "jardin clos sécurisé Le Mans",
          "espace extérieur groupe Le Mans",
          "maison avec jardin Le Mans",
        ],
      },
      en: {
        title: "Enclosed, secure garden in Le Mans: an outdoor space for group stays",
        description:
          "Enjoy our 90 m² private garden, fully enclosed and secure, in the heart of Le Mans: 8-seater lounge, large tables for 20, south-facing all day long.",
        excerpt:
          "As the warm season returns, the garden is ready to welcome you: 90 m² enclosed and secure, 8-seater lounge and large tables to dine outside for up to 20.",
        keywords: [
          "garden Le Mans",
          "house with garden Le Mans",
          "enclosed secure garden Le Mans",
          "outdoor space group Le Mans",
          "holiday house garden Le Mans",
        ],
      },
      it: {
        title: "Giardino recintato e sicuro a Le Mans: uno spazio esterno per soggiorni di gruppo",
        description:
          "Godetevi il nostro giardino privato di 90 m², recintato e sicuro, nel cuore di Le Mans: salotto da 8 posti, grandi tavoli per 20 persone, esposizione a sud.",
        excerpt:
          "Con la bella stagione, il giardino è pronto ad accogliervi: 90 m² recintati e sicuri, salotto da 8 posti e grandi tavoli per mangiare all'aperto fino a 20 persone.",
        keywords: [
          "giardino Le Mans",
          "casa con giardino Le Mans",
          "giardino recintato sicuro Le Mans",
          "spazio esterno gruppo Le Mans",
          "casa vacanze con giardino Le Mans",
        ],
      },
      de: {
        title: "Umschlossener, sicherer Garten in Le Mans: ein Außenbereich für Gruppenaufenthalte",
        description:
          "Genießen Sie unseren 90 m² großen Privatgarten, umschlossen und gesichert, im Herzen von Le Mans: Gartensofa für 8, große Tische für 20, südausgerichtet.",
        excerpt:
          "Mit der schönen Jahreszeit ist der Garten bereit: 90 m² umschlossen und gesichert, Gartensofa für 8 und große Tische zum Essen im Freien für bis zu 20 Personen.",
        keywords: [
          "Garten Le Mans",
          "Haus mit Garten Le Mans",
          "umschlossener sicherer Garten Le Mans",
          "Außenbereich Gruppe Le Mans",
          "Ferienhaus mit Garten Le Mans",
        ],
      },
      es: {
        title: "Jardín cerrado y seguro en Le Mans: un espacio exterior para estancias en grupo",
        description:
          "Disfrute de nuestro jardín privado de 90 m², cerrado y seguro, en pleno corazón de Le Mans: salón de 8 plazas, grandes mesas para 20 personas, orientación sur.",
        excerpt:
          "Con la buena estación, el jardín está listo para recibirle: 90 m² cerrados y seguros, salón de 8 plazas y grandes mesas para comer fuera hasta 20 personas.",
        keywords: [
          "jardín Le Mans",
          "casa con jardín Le Mans",
          "jardín cerrado seguro Le Mans",
          "espacio exterior grupo Le Mans",
          "casa vacaciones con jardín Le Mans",
        ],
      },
    },
  },
  {
    slug: "championnat-monde-karting-kz-le-mans",
    journey: ["evenement"],
    date: "2026-04-22",
    image: "/images/blog/mondial-karting-kz.jpg",
    event: "mondial-karting-2026",
    locales: {
      fr: {
        title: "Championnat du Monde de Karting KZ 2026 au Mans : guide complet",
        description:
          "Mondial Karting KZ 2026 au Le Mans International Karting Circuit (16-20 sept) : catégorie reine, format, hébergement pour teams internationales. Notre maison à moins de 5 km du circuit.",
        excerpt:
          "Les meilleurs pilotes de karting de la planète se retrouvent au Mans du 16 au 20 septembre 2026. Guide complet pour teams et accompagnants.",
        keywords: [
          "Championnat du Monde Karting KZ 2026",
          "Mondial Karting Le Mans",
          "Le Mans International Karting Circuit",
          "hébergement team karting Le Mans",
          "CIK-FIA KZ World Championship",
          "karting boîte Le Mans",
        ],
      },
      en: {
        title: "KZ World Karting Championship 2026 in Le Mans: full guide",
        description:
          "KZ World Karting Championship 2026 at Le Mans International Karting Circuit (16-20 Sept): flagship category, format, accommodation for international teams. House less than 5 km from the track.",
        excerpt:
          "The best karting drivers in the world gather in Le Mans from 16 to 20 September 2026. Complete guide for teams and support staff.",
        keywords: [
          "KZ World Karting Championship 2026",
          "World Karting Le Mans",
          "Le Mans International Karting Circuit",
          "karting team accommodation Le Mans",
          "CIK-FIA KZ World Championship",
          "gearbox karting Le Mans",
        ],
      },
      it: {
        title: "Campionato Mondiale di Karting KZ 2026 a Le Mans: guida completa",
        description:
          "Mondiale Karting KZ 2026 al Le Mans International Karting Circuit (16-20 sett): categoria regina, format, alloggio per team internazionali. La nostra casa a meno di 5 km dal circuito.",
        excerpt:
          "I migliori piloti di karting del pianeta si ritrovano a Le Mans dal 16 al 20 settembre 2026. Guida completa per team e accompagnatori.",
        keywords: [
          "Campionato Mondiale Karting KZ 2026",
          "Mondiale Karting Le Mans",
          "Le Mans International Karting Circuit",
          "alloggio team karting Le Mans",
          "CIK-FIA KZ World Championship",
          "karting marce Le Mans",
        ],
      },
      de: {
        title: "KZ Kart-Weltmeisterschaft 2026 in Le Mans: kompletter Guide",
        description:
          "Kart-WM KZ 2026 auf dem Le Mans International Karting Circuit (16.-20. Sept): Königsklasse, Format, Unterkunft für internationale Teams. Unser Haus weniger als 5 km vom Circuit.",
        excerpt:
          "Die besten Kartfahrer der Welt treffen sich vom 16. bis 20. September 2026 in Le Mans. Kompletter Guide für Teams und Begleitpersonen.",
        keywords: [
          "Kart-Weltmeisterschaft KZ 2026",
          "Weltmeisterschaft Karting Le Mans",
          "Le Mans International Karting Circuit",
          "Unterkunft Kart-Team Le Mans",
          "CIK-FIA KZ World Championship",
          "Schaltkart Le Mans",
        ],
      },
      es: {
        title: "Campeonato del Mundo de Karting KZ 2026 en Le Mans: guía completa",
        description:
          "Mundial de Karting KZ 2026 en el Le Mans International Karting Circuit (16-20 sept): categoría reina, formato, alojamiento para equipos internacionales. Nuestra casa a menos de 5 km del circuito.",
        excerpt:
          "Los mejores pilotos de karting del planeta se reúnen en Le Mans del 16 al 20 de septiembre de 2026. Guía completa para equipos y acompañantes.",
        keywords: [
          "Campeonato del Mundo Karting KZ 2026",
          "Mundial Karting Le Mans",
          "Le Mans International Karting Circuit",
          "alojamiento equipo karting Le Mans",
          "CIK-FIA KZ World Championship",
          "karting con cambio Le Mans",
        ],
      },
    },
  },
  {
    slug: "24-heures-camions-le-mans",
    journey: ["evenement"],
    date: "2026-04-22",
    image: "/images/blog/24h-camions.jpg",
    event: "24h-camions-2026",
    soldOut: true,
    nextEdition: "2027",
    locales: {
      fr: {
        title: "24 Heures Camions 2026 au Mans : guide du week-end",
        description:
          "24 Heures Camions 2026 au Circuit Bugatti les 26-27 septembre : programme, tarifs, animations, hébergement en famille ou entre amis. Notre maison à moins de 5 km du circuit.",
        excerpt:
          "Un spectacle accessible, familial et bon marché : les 24h Camions au Mans sont le week-end idéal en famille. Dates, programme et conseils pratiques.",
        keywords: [
          "24 Heures Camions Le Mans",
          "24H Camions 2026",
          "camion course Circuit Bugatti",
          "hébergement 24h camions",
          "week-end famille Le Mans camions",
          "truck racing Le Mans",
        ],
      },
      en: {
        title: "24 Hours Truck Race 2026 in Le Mans: weekend guide",
        description:
          "24 Hours Truck Race 2026 at Bugatti Circuit on 26-27 September: schedule, prices, entertainment, accommodation for families and friends. House less than 5 km from the circuit.",
        excerpt:
          "An accessible, family-friendly and affordable spectacle: the 24h Truck Race in Le Mans is the ideal family weekend. Dates, schedule and practical tips.",
        keywords: [
          "24 Hours Truck Race Le Mans",
          "24H Truck 2026",
          "truck racing Bugatti circuit",
          "24h truck accommodation",
          "family weekend Le Mans truck",
          "truck racing Le Mans",
        ],
      },
      it: {
        title: "24 Ore Camion 2026 a Le Mans: guida al weekend",
        description:
          "24 Ore Camion 2026 al Circuit Bugatti il 26-27 settembre: programma, prezzi, animazioni, alloggio in famiglia o tra amici. La nostra casa a meno di 5 km dal circuito.",
        excerpt:
          "Uno spettacolo accessibile, familiare ed economico: le 24h Camion a Le Mans sono il weekend ideale in famiglia. Date, programma e consigli pratici.",
        keywords: [
          "24 Ore Camion Le Mans",
          "24H Camion 2026",
          "corsa camion Circuit Bugatti",
          "alloggio 24h camion",
          "weekend famiglia Le Mans camion",
          "truck racing Le Mans",
        ],
      },
      de: {
        title: "24-Stunden-Truck-Rennen 2026 in Le Mans: Wochenend-Guide",
        description:
          "24-Stunden-Truck-Rennen 2026 auf dem Circuit Bugatti am 26.-27. September: Programm, Preise, Animationen, Unterkunft für Familie oder Freunde. Unser Haus weniger als 5 km vom Circuit.",
        excerpt:
          "Ein zugängliches, familienfreundliches und günstiges Spektakel: das 24h-Truck-Rennen in Le Mans ist das ideale Familienwochenende. Daten, Programm und praktische Tipps.",
        keywords: [
          "24-Stunden-Truck Le Mans",
          "24H Truck 2026",
          "Truck-Rennen Circuit Bugatti",
          "Unterkunft 24h Truck",
          "Familienwochenende Le Mans Truck",
          "Truck Racing Le Mans",
        ],
      },
      es: {
        title: "24 Horas de Camiones 2026 en Le Mans: guía del fin de semana",
        description:
          "24 Horas de Camiones 2026 en el Circuito Bugatti los 26-27 de septiembre: programa, precios, animaciones, alojamiento en familia o entre amigos. Nuestra casa a menos de 5 km del circuito.",
        excerpt:
          "Un espectáculo accesible, familiar y económico: las 24 Horas de Camiones de Le Mans son el fin de semana ideal en familia. Fechas, programa y consejos prácticos.",
        keywords: [
          "24 Horas de Camiones Le Mans",
          "24H Camiones 2026",
          "carrera camiones Circuito Bugatti",
          "alojamiento 24h camiones",
          "fin de semana familia Le Mans camiones",
          "truck racing Le Mans",
        ],
      },
    },
  },
  {
    slug: "sws-karting-finals-le-mans",
    journey: ["evenement"],
    event: "sws-karting-2026",
    date: "2026-04-20",
    image: "/images/blog/sws-karting.jpg",
    soldOut: true,
    nextEdition: "2027",
    locales: {
      fr: {
        title: "Où se loger pour les SWS Karting Finals au Mans (20-23 mai 2026) ?",
        description:
          "SWS International Finals 2026 au Le Mans Karting Circuit : dates, format (dont 24h endurance inédite), hébergement pour équipes. Notre maison à moins de 5 km du circuit.",
        excerpt:
          "Le plus grand rendez-vous du karting amateur débarque au Mans du 20 au 23 mai 2026 avec une 24h endurance inédite. Voici comment préparer votre séjour.",
        keywords: [
          "SWS Karting Finals 2026",
          "Le Mans International Karting Circuit",
          "hébergement SWS Le Mans",
          "karting endurance 24h Le Mans",
          "team karting Le Mans logement",
          "Sodikart SWS Finals",
        ],
      },
      en: {
        title: "Where to stay for the SWS Karting Finals in Le Mans (20-23 May 2026)?",
        description:
          "SWS International Finals 2026 at Le Mans Karting Circuit: dates, format (including a new 24h endurance race), accommodation for teams. Our house less than 5 km from the circuit.",
        excerpt:
          "Europe's biggest amateur karting event lands in Le Mans on 20-23 May 2026 with a new 24-hour endurance race. Here's how to plan your stay.",
        keywords: [
          "SWS Karting Finals 2026",
          "Le Mans International Karting Circuit",
          "SWS Le Mans accommodation",
          "24h endurance karting Le Mans",
          "karting team Le Mans stay",
          "Sodikart SWS Finals",
        ],
      },
      it: {
        title: "Dove alloggiare per le SWS Karting Finals a Le Mans (20-23 mag 2026)?",
        description:
          "SWS International Finals 2026 al Le Mans Karting Circuit: date, format (inclusa una 24h endurance inedita), alloggio per i team. La nostra casa a meno di 5 km dal circuito.",
        excerpt:
          "Il più grande appuntamento del karting amatoriale arriva a Le Mans dal 20 al 23 maggio 2026 con una 24h endurance inedita. Ecco come preparare il vostro soggiorno.",
        keywords: [
          "SWS Karting Finals 2026",
          "Le Mans International Karting Circuit",
          "alloggio SWS Le Mans",
          "karting endurance 24h Le Mans",
          "team karting Le Mans alloggio",
          "Sodikart SWS Finals",
        ],
      },
      de: {
        title: "Wo wohnen für die SWS Karting Finals in Le Mans (20.-23. Mai 2026)?",
        description:
          "SWS International Finals 2026 auf dem Le Mans Karting Circuit: Daten, Format (inklusive eines neuen 24h-Langstreckenrennens), Unterkunft für Teams. Unser Haus weniger als 5 km vom Circuit.",
        excerpt:
          "Europas größtes Amateur-Kart-Event kommt vom 20. bis 23. Mai 2026 nach Le Mans mit einem neuen 24-Stunden-Langstreckenrennen. So planen Sie Ihren Aufenthalt.",
        keywords: [
          "SWS Karting Finals 2026",
          "Le Mans International Karting Circuit",
          "SWS Le Mans Unterkunft",
          "24h Langstrecken-Kart Le Mans",
          "Kart-Team Le Mans Aufenthalt",
          "Sodikart SWS Finals",
        ],
      },
      es: {
        title: "¿Dónde alojarse para las SWS Karting Finals en Le Mans (20-23 may 2026)?",
        description:
          "SWS International Finals 2026 en el Le Mans Karting Circuit: fechas, formato (incluida una 24h de resistencia inédita), alojamiento para equipos. Nuestra casa a menos de 5 km del circuito.",
        excerpt:
          "La mayor cita del karting amateur llega a Le Mans del 20 al 23 de mayo de 2026 con una 24h de resistencia inédita. Así puede preparar su estancia.",
        keywords: [
          "SWS Karting Finals 2026",
          "Le Mans International Karting Circuit",
          "alojamiento SWS Le Mans",
          "karting resistencia 24h Le Mans",
          "equipo karting Le Mans alojamiento",
          "Sodikart SWS Finals",
        ],
      },
    },
  },
  {
    slug: "seminaire-entreprise-le-mans",
    journey: ["groupe"],
    date: "2026-04-18",
    image: "/images/blog/seminaire.jpg",
    locales: {
      fr: {
        title: "Séminaire d'entreprise au Mans : maison entière pour 10 à 20 personnes",
        description:
          "Organiser un séminaire de 10 à 20 personnes au Mans : 9 chambres avec salle de douche privative, 11 couchages sans partager de lit, grande table de 16 à 20 places, écran HDMI, team-building au Circuit Bugatti. Programme type 2 jours et budget.",
        excerpt:
          "10 à 20 personnes, une maison entière, le circuit mythique à moins de 5 km : 11 participants logés sans partager de lit et jusqu'à 20 places assises pour travailler.",
        keywords: [
          "séminaire entreprise Le Mans",
          "séminaire 10 personnes Le Mans",
          "séminaire 20 personnes Le Mans",
          "location maison séminaire Le Mans",
          "team building Le Mans",
          "séminaire Circuit Bugatti",
          "mise au vert entreprise Sarthe",
        ],
      },
      en: {
        title: "Corporate seminar in Le Mans: a whole house for 10 to 20 people",
        description:
          "Organising a seminar for 10 to 20 people in Le Mans: 9 bedrooms with en-suite shower rooms, 11 guests without sharing a bed, a 16-to-20-seat table, HDMI screen, team-building at Bugatti Circuit. 2-day programme and budget.",
        excerpt:
          "10 to 20 people, a whole house, the legendary circuit less than 5 km away: 11 guests housed without sharing a bed and up to 20 seats to work around.",
        keywords: [
          "Le Mans corporate seminar",
          "seminar for 10 people Le Mans",
          "seminar for 20 people Le Mans",
          "Le Mans seminar house rental",
          "Le Mans team building",
          "Bugatti Circuit seminar",
          "company retreat Sarthe",
        ],
      },
      it: {
        title: "Seminario aziendale a Le Mans: una casa intera per 10-20 persone",
        description:
          "Organizzare un seminario per 10-20 persone a Le Mans: 9 camere con doccia privata, 11 posti letto senza condividere il letto, grande tavolo da 16 a 20 posti, schermo HDMI, team-building al Circuit Bugatti. Programma di 2 giorni e budget.",
        excerpt:
          "10-20 persone, una casa intera, il circuito mitico a meno di 5 km: 11 partecipanti alloggiati senza condividere il letto e fino a 20 posti a sedere per lavorare.",
        keywords: [
          "seminario aziendale Le Mans",
          "seminario 10 persone Le Mans",
          "seminario 20 persone Le Mans",
          "affitto casa seminario Le Mans",
          "team building Le Mans",
          "seminario Circuit Bugatti",
          "ritiro aziendale Sarthe",
        ],
      },
      de: {
        title: "Firmenseminar in Le Mans: ein ganzes Haus für 10 bis 20 Personen",
        description:
          "Seminar für 10 bis 20 Personen in Le Mans organisieren: 9 Zimmer mit eigenem Duschbad, 11 Schlafplätze ohne geteiltes Bett, großer Tisch mit 16 bis 20 Plätzen, HDMI-Bildschirm, Team-Building am Circuit Bugatti. 2-Tages-Programm und Budget.",
        excerpt:
          "10 bis 20 Personen, ein ganzes Haus, der legendäre Circuit weniger als 5 km entfernt: 11 Teilnehmende ohne geteiltes Bett und bis zu 20 Sitzplätze zum Arbeiten.",
        keywords: [
          "Firmenseminar Le Mans",
          "Seminar 10 Personen Le Mans",
          "Seminar 20 Personen Le Mans",
          "Seminarhaus Le Mans mieten",
          "Team Building Le Mans",
          "Seminar Circuit Bugatti",
          "Firmenausflug Sarthe",
        ],
      },
      es: {
        title: "Seminario de empresa en Le Mans: una casa entera para 10 a 20 personas",
        description:
          "Organizar un seminario para 10 a 20 personas en Le Mans: 9 habitaciones con ducha privada, 11 plazas sin compartir cama, gran mesa de 16 a 20 plazas, pantalla HDMI, team-building en el Circuito Bugatti. Programa de 2 días y presupuesto.",
        excerpt:
          "10 a 20 personas, una casa entera, el mítico circuito a menos de 5 km: 11 participantes alojados sin compartir cama y hasta 20 plazas sentadas para trabajar.",
        keywords: [
          "seminario empresa Le Mans",
          "seminario 10 personas Le Mans",
          "seminario 20 personas Le Mans",
          "alquiler casa seminario Le Mans",
          "team building Le Mans",
          "seminario Circuito Bugatti",
          "retiro empresa Sarthe",
        ],
      },
    },
  },
  {
    slug: "hippodrome-des-hunaudieres",
    journey: ["sur-place", "evenement"],
    date: "2026-04-17",
    image: "/images/blog/hippodrome.jpg",
    locales: {
      fr: {
        title: "Hippodrome des Hunaudières : courses, programme et événements au Mans",
        description:
          "Hippodrome des Hunaudières au Mans : 13 réunions hippiques en 2026, courses de trot et galop, soirées nocturnes. Notre maison à 20 min de l'hippodrome pour votre week-end.",
        excerpt:
          "Seul hippodrome de la Sarthe, 13 réunions dans l'année, courses de trot sur piste sable de 1 350 m. L'incontournable du monde hippique au Mans.",
        keywords: [
          "Hippodrome des Hunaudières",
          "courses hippiques Le Mans",
          "hippodrome Le Mans programme",
          "PMU Le Mans Hunaudières",
          "soirée hippique Le Mans",
        ],
      },
      en: {
        title: "Hunaudières Racecourse: races, schedule and events in Le Mans",
        description:
          "Hunaudières Racecourse in Le Mans: 13 race meetings in 2026, trotting and flat racing, evening events. Our house 20 min from the racecourse for your weekend.",
        excerpt:
          "Sarthe's only racecourse, 13 meetings per year, 1,350 m sand trotting track. A must-see in the Le Mans horse racing scene.",
        keywords: [
          "Hunaudières Racecourse",
          "Le Mans horse racing",
          "horse race Le Mans",
          "trotting Le Mans",
          "evening racing Le Mans",
        ],
      },
      it: {
        title: "Ippodromo des Hunaudières: corse, programma ed eventi a Le Mans",
        description:
          "Ippodromo des Hunaudières a Le Mans: 13 riunioni ippiche nel 2026, corse al trotto e al galoppo, serate notturne. La nostra casa a 20 min dall'ippodromo per il vostro weekend.",
        excerpt:
          "Unico ippodromo della Sarthe, 13 riunioni all'anno, corse al trotto su pista in sabbia da 1.350 m. L'imperdibile del mondo ippico a Le Mans.",
        keywords: [
          "Ippodromo des Hunaudières",
          "corse ippiche Le Mans",
          "ippodromo Le Mans programma",
          "trotto Le Mans",
          "serata ippica Le Mans",
        ],
      },
      de: {
        title: "Pferderennbahn Hunaudières: Rennen, Programm und Events in Le Mans",
        description:
          "Pferderennbahn Hunaudières in Le Mans: 13 Renntage 2026, Trab- und Galopprennen, Abendveranstaltungen. Unser Haus 20 Min von der Rennbahn für Ihr Wochenende.",
        excerpt:
          "Einzige Rennbahn der Sarthe, 13 Renntage pro Jahr, 1.350 m Sand-Trabrennbahn. Ein Muss der Pferderennen-Szene in Le Mans.",
        keywords: [
          "Pferderennbahn Hunaudières",
          "Pferderennen Le Mans",
          "Rennbahn Le Mans Programm",
          "Trabrennen Le Mans",
          "Abendrennen Le Mans",
        ],
      },
      es: {
        title: "Hippodrome des Hunaudières: carreras, programa y eventos en Le Mans",
        description:
          "Hippodrome des Hunaudières en Le Mans: 13 reuniones hípicas en 2026, carreras al trote y al galope, veladas nocturnas. Nuestra casa a 20 min del hipódromo para su fin de semana.",
        excerpt:
          "Único hipódromo de la Sarthe, 13 reuniones al año, carreras al trote en pista de arena de 1.350 m. La cita imprescindible del mundo hípico en Le Mans.",
        keywords: [
          "Hippodrome des Hunaudières",
          "carreras hípicas Le Mans",
          "hipódromo Le Mans programa",
          "trote Le Mans",
          "velada hípica Le Mans",
        ],
      },
    },
  },
  {
    slug: "24-heures-rollers-le-mans",
    journey: ["evenement"],
    event: "24h-rollers-2026",
    date: "2026-04-16",
    image: "/images/blog/24h-rollers.jpg",
    soldOut: false,

    nextEdition: "2027",
    locales: {
      fr: {
        title: "24 Heures Rollers du Mans 2026 : guide de l'événement roller",
        description:
          "24 Heures Rollers 2026 au Circuit Bugatti les 11-12 juillet : format, inscriptions, hébergement pour équipes et clubs. Guide complet pour préparer votre week-end.",
        excerpt:
          "Patiner 24 heures sur le circuit mythique : 11-12 juillet 2026. Tout pour préparer votre venue en équipe, club ou solo.",
        keywords: [
          "24 Heures Rollers Le Mans",
          "24H Rollers 2026",
          "roller Circuit Bugatti",
          "hébergement 24h rollers",
          "équipe roller Le Mans",
        ],
      },
      en: {
        title: "24 Hours Rollers Le Mans 2026: a guide to the roller event",
        description:
          "24 Hours Rollers 2026 at Circuit Bugatti on 11-12 July: format, registrations, accommodation for teams and clubs. Full guide to prepare your weekend.",
        excerpt:
          "Skating 24 hours on the legendary circuit: 11-12 July 2026. Everything to prepare your trip as a team, club or solo.",
        keywords: [
          "24 Hours Rollers Le Mans",
          "24H Rollers 2026",
          "roller race Bugatti circuit",
          "accommodation 24h rollers",
          "roller team Le Mans",
        ],
      },
      it: {
        title: "24 Ore Rollers di Le Mans 2026: guida all'evento di pattinaggio",
        description:
          "24 Ore Rollers 2026 al Circuit Bugatti l'11-12 luglio: format, iscrizioni, alloggio per squadre e club. Guida completa per preparare il vostro weekend.",
        excerpt:
          "Pattinare 24 ore sul circuito mitico: 11-12 luglio 2026. Tutto per preparare la vostra venuta in squadra, club o in solitaria.",
        keywords: [
          "24 Ore Rollers Le Mans",
          "24H Rollers 2026",
          "pattinaggio Circuit Bugatti",
          "alloggio 24h rollers",
          "squadra roller Le Mans",
        ],
      },
      de: {
        title: "24-Stunden-Rollers Le Mans 2026: Guide zum Inliner-Event",
        description:
          "24-Stunden-Rollers 2026 auf dem Circuit Bugatti am 11.-12. Juli: Format, Anmeldungen, Unterkunft für Teams und Clubs. Kompletter Guide für Ihr Wochenende.",
        excerpt:
          "24 Stunden Inlineskaten auf dem legendären Circuit: 11.-12. Juli 2026. Alles für Ihre Anreise als Team, Club oder Solo.",
        keywords: [
          "24-Stunden-Rollers Le Mans",
          "24H Rollers 2026",
          "Inliner-Rennen Circuit Bugatti",
          "Unterkunft 24h Rollers",
          "Inliner-Team Le Mans",
        ],
      },
      es: {
        title: "24 Horas Rollers de Le Mans 2026: guía del evento de patinaje",
        description:
          "24 Horas Rollers 2026 en el Circuito Bugatti los 11-12 de julio: formato, inscripciones, alojamiento para equipos y clubes. Guía completa para preparar su fin de semana.",
        excerpt:
          "Patinar 24 horas sobre el mítico circuito: 11-12 de julio de 2026. Todo para preparar su llegada en equipo, club o en solitario.",
        keywords: [
          "24 Horas Rollers Le Mans",
          "24H Rollers 2026",
          "patinaje Circuito Bugatti",
          "alojamiento 24h rollers",
          "equipo patinaje Le Mans",
        ],
      },
    },
  },
  {
    slug: "restos-bars-magasins-le-mans",
    journey: ["sur-place", "preparer"],
    date: "2026-04-12",
    image: "/images/blog/restos-bars.jpg",
    locales: {
      fr: {
        title: "Restaurants, bars et magasins à proximité de la maison",
        description:
          "Notre sélection de restaurants, bars, supermarchés, boulangeries et bonnes adresses à quelques minutes à pied de notre coliving au Mans.",
        excerpt:
          "Tout ce qu'il faut à pied : restos traditionnels et du monde, bars conviviaux, supermarchés et boulangeries. Notre sélection testée.",
        keywords: [
          "restaurant Le Mans",
          "bar Le Mans centre",
          "où manger Le Mans",
          "supermarché Le Mans",
          "boulangerie Le Mans",
        ],
      },
      en: {
        title: "Restaurants, bars and shops near the house",
        description:
          "Our selection of restaurants, bars, supermarkets, bakeries and great spots within walking distance of our Le Mans coliving.",
        excerpt:
          "Everything within walking distance: traditional and international restaurants, friendly bars, supermarkets and bakeries. Our tested picks.",
        keywords: [
          "restaurants Le Mans",
          "Le Mans city bars",
          "where to eat Le Mans",
          "Le Mans supermarket",
          "Le Mans bakery",
        ],
      },
      it: {
        title: "Ristoranti, bar e negozi vicino alla casa",
        description:
          "La nostra selezione di ristoranti, bar, supermercati, panetterie e buoni indirizzi a pochi minuti a piedi dal nostro coliving a Le Mans.",
        excerpt:
          "Tutto a portata di piedi: ristoranti tradizionali e dal mondo, bar conviviali, supermercati e panetterie. La nostra selezione testata.",
        keywords: [
          "ristoranti Le Mans",
          "bar Le Mans centro",
          "dove mangiare Le Mans",
          "supermercato Le Mans",
          "panetteria Le Mans",
        ],
      },
      de: {
        title: "Restaurants, Bars und Geschäfte in der Nähe des Hauses",
        description:
          "Unsere Auswahl an Restaurants, Bars, Supermärkten, Bäckereien und guten Adressen wenige Gehminuten von unserem Coliving in Le Mans entfernt.",
        excerpt:
          "Alles fußläufig erreichbar: traditionelle und internationale Restaurants, gemütliche Bars, Supermärkte und Bäckereien. Unsere getesteten Empfehlungen.",
        keywords: [
          "Restaurants Le Mans",
          "Bars Le Mans Zentrum",
          "wo essen Le Mans",
          "Supermarkt Le Mans",
          "Bäckerei Le Mans",
        ],
      },
      es: {
        title: "Restaurantes, bares y tiendas cerca de la casa",
        description:
          "Nuestra selección de restaurantes, bares, supermercados, panaderías y buenas direcciones a pocos minutos a pie de nuestro coliving en Le Mans.",
        excerpt:
          "Todo lo necesario a pie: restaurantes tradicionales y del mundo, bares acogedores, supermercados y panaderías. Nuestra selección probada.",
        keywords: [
          "restaurantes Le Mans",
          "bares Le Mans centro",
          "dónde comer Le Mans",
          "supermercado Le Mans",
          "panadería Le Mans",
        ],
      },
    },
  },
  {
    slug: "entreprises-proches-le-mans",
    journey: ["groupe"],
    date: "2026-04-06",
    image: "/images/blog/entreprises.jpg",
    locales: {
      fr: {
        title: "Coliving pro au Mans : entreprises proches et atouts pour vos séjours d'affaires",
        description:
          "Séjour d'affaires ou séminaire au Mans ? Notre maison est proche de MMA (Covéa), Renault Manufacture Louis Schweitzer, CLAAS Tractor et du technopôle Novaxis/Novaxud.",
        excerpt:
          "Novaxis, Renault, CLAAS, MMA : notre coliving est idéalement placé pour les séjours pros, séminaires et formations au Mans.",
        keywords: [
          "hébergement entreprise Le Mans",
          "séminaire Le Mans maison",
          "logement pro Le Mans",
          "Novaxis Le Mans hébergement",
          "location maison Renault Le Mans",
          "logement équipe Le Mans",
        ],
      },
      en: {
        title: "Business coliving in Le Mans: nearby companies and highlights for corporate stays",
        description:
          "Business trip or seminar in Le Mans? Our house is close to MMA (Covéa), Renault Manufacture Louis Schweitzer, CLAAS Tractor and the Novaxis/Novaxud business park.",
        excerpt:
          "Novaxis, Renault, CLAAS, MMA: our coliving is ideally located for business trips, seminars and training sessions in Le Mans.",
        keywords: [
          "Le Mans corporate accommodation",
          "Le Mans seminar house",
          "business stay Le Mans",
          "Novaxis Le Mans accommodation",
          "Renault Le Mans house rental",
          "team accommodation Le Mans",
        ],
      },
      it: {
        title: "Coliving business a Le Mans: aziende vicine e vantaggi per i soggiorni di lavoro",
        description:
          "Trasferta di lavoro o seminario a Le Mans? La nostra casa è vicina a MMA (Covéa), Renault Manufacture Louis Schweitzer, CLAAS Tractor e al polo tecnologico Novaxis/Novaxud.",
        excerpt:
          "Novaxis, Renault, CLAAS, MMA: il nostro coliving è idealmente posizionato per soggiorni di lavoro, seminari e formazioni a Le Mans.",
        keywords: [
          "alloggio aziendale Le Mans",
          "seminario Le Mans casa",
          "soggiorno business Le Mans",
          "alloggio Novaxis Le Mans",
          "affitto casa Renault Le Mans",
          "alloggio team Le Mans",
        ],
      },
      de: {
        title: "Business-Coliving in Le Mans: nahe Unternehmen und Vorzüge für Geschäftsreisen",
        description:
          "Geschäftsreise oder Seminar in Le Mans? Unser Haus liegt nahe MMA (Covéa), Renault Manufacture Louis Schweitzer, CLAAS Tractor und dem Technologiepark Novaxis/Novaxud.",
        excerpt:
          "Novaxis, Renault, CLAAS, MMA: unser Coliving ist ideal gelegen für Geschäftsreisen, Seminare und Schulungen in Le Mans.",
        keywords: [
          "Firmenunterkunft Le Mans",
          "Seminarhaus Le Mans",
          "Geschäftsreise Le Mans",
          "Unterkunft Novaxis Le Mans",
          "Haus mieten Renault Le Mans",
          "Team-Unterkunft Le Mans",
        ],
      },
      es: {
        title: "Coliving profesional en Le Mans: empresas cercanas y ventajas para sus viajes de negocios",
        description:
          "¿Viaje de negocios o seminario en Le Mans? Nuestra casa está cerca de MMA (Covéa), Renault Manufacture Louis Schweitzer, CLAAS Tractor y del tecnopolo Novaxis/Novaxud.",
        excerpt:
          "Novaxis, Renault, CLAAS, MMA: nuestro coliving está idealmente ubicado para estancias profesionales, seminarios y formaciones en Le Mans.",
        keywords: [
          "alojamiento empresa Le Mans",
          "seminario Le Mans casa",
          "estancia profesional Le Mans",
          "alojamiento Novaxis Le Mans",
          "alquiler casa Renault Le Mans",
          "alojamiento equipo Le Mans",
        ],
      },
    },
  },
  {
    slug: "ou-se-loger-24h-du-mans-2026",
    journey: ["evenement"],
    date: "2026-03-28",
    image: "/images/blog/24h-du-mans.jpg",
    soldOut: true,
    supersededBy: "ou-se-loger-24h-du-mans-2027",
    nextEdition: "2027",
    locales: {
      fr: {
        title: "Où se loger pour les 24 Heures du Mans 2026 ?",
        description:
          "Guide complet pour choisir son hébergement pendant les 24h du Mans 2026 : zones, prix, conseils pour grands groupes et familles. Notre maison de 9 suites à moins de 5 km du circuit.",
        excerpt:
          "Où dormir pendant les 24h du Mans ? Zones, tarifs, disponibilités — tout ce qu'il faut savoir pour réserver son hébergement avant que tout soit pris.",
        keywords: [
          "24 Heures du Mans 2026",
          "hébergement 24h du Mans",
          "où se loger Le Mans course",
          "location maison 24h du Mans",
          "logement proche circuit Bugatti",
        ],
      },
      en: {
        title: "Where to stay for the 24 Hours of Le Mans 2026?",
        description:
          "Complete guide to choosing your accommodation for the 24 Hours of Le Mans 2026: areas, prices, tips for large groups and families. Our 9-suite house less than 5 km from the circuit.",
        excerpt:
          "Where to sleep during the 24 Hours of Le Mans? Areas, prices, availability — everything you need to book before it's all taken.",
        keywords: [
          "24 Hours of Le Mans 2026",
          "24h Le Mans accommodation",
          "where to stay Le Mans race",
          "house rental 24h Le Mans",
          "lodging near Bugatti circuit",
        ],
      },
      it: {
        title: "Dove alloggiare per la 24 Ore di Le Mans 2026?",
        description:
          "Guida completa per scegliere il proprio alloggio durante la 24h di Le Mans 2026: zone, prezzi, consigli per grandi gruppi e famiglie. La nostra casa con 9 suite a meno di 5 km dal circuito.",
        excerpt:
          "Dove dormire durante la 24h di Le Mans? Zone, tariffe, disponibilità — tutto quello che c'è da sapere per prenotare prima che sia tutto esaurito.",
        keywords: [
          "24 Ore di Le Mans 2026",
          "alloggio 24h di Le Mans",
          "dove alloggiare Le Mans gara",
          "affitto casa 24h di Le Mans",
          "alloggio vicino Circuit Bugatti",
        ],
      },
      de: {
        title: "Wo wohnen für die 24 Stunden von Le Mans 2026?",
        description:
          "Kompletter Guide zur Wahl Ihrer Unterkunft während der 24 Stunden von Le Mans 2026: Zonen, Preise, Tipps für Gruppen und Familien. Unser Haus mit 9 Suiten weniger als 5 km vom Circuit.",
        excerpt:
          "Wo schlafen während der 24 Stunden von Le Mans? Zonen, Preise, Verfügbarkeit — alles was Sie wissen müssen, um zu buchen, bevor alles weg ist.",
        keywords: [
          "24 Stunden von Le Mans 2026",
          "Unterkunft 24h Le Mans",
          "wo wohnen Le Mans Rennen",
          "Haus mieten 24h Le Mans",
          "Unterkunft nahe Circuit Bugatti",
        ],
      },
      es: {
        title: "¿Dónde alojarse para las 24 Horas de Le Mans 2026?",
        description:
          "Guía completa para elegir su alojamiento durante las 24 Horas de Le Mans 2026: zonas, precios, consejos para grupos grandes y familias. Nuestra casa de 9 suites a menos de 5 km del circuito.",
        excerpt:
          "¿Dónde dormir durante las 24 Horas de Le Mans? Zonas, tarifas, disponibilidad: todo lo que hay que saber para reservar antes de que se agote.",
        keywords: [
          "24 Horas de Le Mans 2026",
          "alojamiento 24h de Le Mans",
          "dónde alojarse Le Mans carrera",
          "alquiler casa 24h de Le Mans",
          "alojamiento cerca Circuito Bugatti",
        ],
      },
    },
  },
  {
    slug: "motogp-france-le-mans",
    journey: ["evenement"],
    date: "2026-03-17",
    image: "/images/blog/motogp.jpg",
    soldOut: true,
    supersededBy: "motogp-france-le-mans-2027",
    nextEdition: "2027",
    locales: {
      fr: {
        title: "MotoGP France 2026 au Mans : hébergement et conseils pratiques",
        description:
          "Grand Prix de France MotoGP 2026 au Circuit Bugatti : dates, tarifs hébergement, transport, conseils pour un week-end réussi en famille ou entre amis.",
        excerpt:
          "La manche la plus fréquentée du championnat : préparez votre week-end MotoGP au Mans avec notre guide complet.",
        keywords: [
          "MotoGP France 2026",
          "Grand Prix France MotoGP Le Mans",
          "hébergement MotoGP Le Mans",
          "location maison MotoGP France",
          "week-end MotoGP Circuit Bugatti",
        ],
      },
      en: {
        title: "MotoGP France 2026 in Le Mans: accommodation and practical tips",
        description:
          "French MotoGP 2026 at the Bugatti Circuit: dates, accommodation rates, transport, tips for a great weekend with family or friends.",
        excerpt:
          "The most attended round of the championship: plan your MotoGP weekend in Le Mans with our complete guide.",
        keywords: [
          "French MotoGP 2026",
          "French Grand Prix MotoGP Le Mans",
          "MotoGP Le Mans accommodation",
          "house rental French MotoGP",
          "MotoGP Bugatti Circuit weekend",
        ],
      },
      it: {
        title: "MotoGP Francia 2026 a Le Mans: alloggio e consigli pratici",
        description:
          "Gran Premio di Francia MotoGP 2026 al Circuit Bugatti: date, tariffe alloggio, trasporti, consigli per un weekend riuscito in famiglia o tra amici.",
        excerpt:
          "La gara più frequentata del campionato: preparate il vostro weekend MotoGP a Le Mans con la nostra guida completa.",
        keywords: [
          "MotoGP Francia 2026",
          "Gran Premio Francia MotoGP Le Mans",
          "alloggio MotoGP Le Mans",
          "affitto casa MotoGP Francia",
          "weekend MotoGP Circuit Bugatti",
        ],
      },
      de: {
        title: "MotoGP Frankreich 2026 in Le Mans: Unterkunft und praktische Tipps",
        description:
          "Frankreich-Grand-Prix MotoGP 2026 auf dem Circuit Bugatti: Daten, Unterkunftspreise, Anreise, Tipps für ein gelungenes Wochenende mit Familie oder Freunden.",
        excerpt:
          "Der meistbesuchte Lauf der Meisterschaft: Planen Sie Ihr MotoGP-Wochenende in Le Mans mit unserem kompletten Guide.",
        keywords: [
          "MotoGP Frankreich 2026",
          "Großer Preis Frankreich MotoGP Le Mans",
          "MotoGP Le Mans Unterkunft",
          "Haus mieten MotoGP Frankreich",
          "MotoGP-Wochenende Circuit Bugatti",
        ],
      },
      es: {
        title: "MotoGP de Francia 2026 en Le Mans: alojamiento y consejos prácticos",
        description:
          "Gran Premio de Francia MotoGP 2026 en el Circuito Bugatti: fechas, tarifas de alojamiento, transporte, consejos para un fin de semana logrado en familia o entre amigos.",
        excerpt:
          "La cita más concurrida del campeonato: prepare su fin de semana de MotoGP en Le Mans con nuestra guía completa.",
        keywords: [
          "MotoGP Francia 2026",
          "Gran Premio Francia MotoGP Le Mans",
          "alojamiento MotoGP Le Mans",
          "alquiler casa MotoGP Francia",
          "fin de semana MotoGP Circuito Bugatti",
        ],
      },
    },
  },
  {
    slug: "24-heures-moto-le-mans",
    journey: ["evenement"],
    date: "2026-03-05",
    image: "/images/blog/24h-moto.jpg",
    soldOut: true,
    supersededBy: "24-heures-moto-le-mans-2027",
    nextEdition: "2027",
    locales: {
      fr: {
        title: "24 Heures Moto Le Mans : guide hébergement et parking",
        description:
          "Tout pour organiser votre week-end des 24 Heures Moto au Mans : zones d'hébergement, prix, parking moto, conseils pour groupes de motards.",
        excerpt:
          "100 000 spectateurs, une ambiance motards unique et un hébergement bien placé, c'est ce qu'il faut. Voici comment préparer votre week-end.",
        keywords: [
          "24 Heures Moto Le Mans",
          "hébergement 24h moto",
          "parking moto Le Mans circuit",
          "location maison 24h moto",
          "week-end moto Le Mans",
        ],
      },
      en: {
        title: "24 Hours Motorcycle Le Mans: accommodation and parking guide",
        description:
          "Everything to plan your 24 Hours Motorcycle weekend in Le Mans: accommodation areas, prices, motorcycle parking, tips for biker groups.",
        excerpt:
          "100,000 spectators, a unique biker vibe and a well-located place to stay — here's how to prepare your weekend.",
        keywords: [
          "24 Hours Motorcycle Le Mans",
          "24h moto accommodation",
          "motorcycle parking Le Mans circuit",
          "house rental 24h moto",
          "motorcycle weekend Le Mans",
        ],
      },
      it: {
        title: "24 Ore Moto Le Mans: guida ad alloggio e parcheggio",
        description:
          "Tutto per organizzare il vostro weekend della 24 Ore Moto a Le Mans: zone di alloggio, prezzi, parcheggio moto, consigli per gruppi di motociclisti.",
        excerpt:
          "100.000 spettatori, un'atmosfera motociclistica unica e un alloggio ben posizionato, ecco quello che serve. Ecco come preparare il vostro weekend.",
        keywords: [
          "24 Ore Moto Le Mans",
          "alloggio 24h moto",
          "parcheggio moto circuito Le Mans",
          "affitto casa 24h moto",
          "weekend moto Le Mans",
        ],
      },
      de: {
        title: "24 Stunden Motorrad Le Mans: Guide für Unterkunft und Parken",
        description:
          "Alles, um Ihr 24-Stunden-Motorrad-Wochenende in Le Mans zu organisieren: Unterkunftszonen, Preise, Motorradparken, Tipps für Bikergruppen.",
        excerpt:
          "100.000 Zuschauer, eine einzigartige Biker-Atmosphäre und eine gut gelegene Unterkunft — so bereiten Sie Ihr Wochenende vor.",
        keywords: [
          "24 Stunden Motorrad Le Mans",
          "Unterkunft 24h Moto",
          "Motorradparken Le Mans Circuit",
          "Haus mieten 24h Moto",
          "Motorrad-Wochenende Le Mans",
        ],
      },
      es: {
        title: "24 Horas Moto Le Mans: guía de alojamiento y parking",
        description:
          "Todo para organizar su fin de semana de las 24 Horas Moto en Le Mans: zonas de alojamiento, precios, parking moto, consejos para grupos de moteros.",
        excerpt:
          "100.000 espectadores, un ambiente motero único y un alojamiento bien ubicado: eso es lo que necesita. Así puede preparar su fin de semana.",
        keywords: [
          "24 Horas Moto Le Mans",
          "alojamiento 24h moto",
          "parking moto circuito Le Mans",
          "alquiler casa 24h moto",
          "fin de semana moto Le Mans",
        ],
      },
    },
  },
  {
    slug: "gp-explorer-le-mans",
    journey: ["evenement"],
    date: "2026-09-08",
    image: "/images/blog/gp-explorer.jpg",
    locales: {
      fr: {
        title: "GP Explorer : c'est terminé après The Last Race 2025",
        description:
          "Le GP Explorer de Squeezie s'est arrêté après sa troisième édition, The Last Race (3-5 octobre 2025 au Circuit Bugatti). Retour sur les trois éditions et sur les événements qui continuent au Mans.",
        excerpt:
          "Pas d'édition 2026 : la troisième, The Last Race, était la dernière. Retour sur l'aventure GP Explorer et sur ce qui fait encore vivre le Circuit Bugatti.",
        keywords: [
          "GP Explorer",
          "GP Explorer 2026",
          "GP Explorer The Last Race",
          "GP Explorer dernière édition",
          "GP Explorer Squeezie",
        ],
      },
      en: {
        title: "GP Explorer: it's over after The Last Race 2025",
        description:
          "Squeezie's GP Explorer ended after its third edition, The Last Race (3-5 October 2025 at the Bugatti Circuit). A look back at the three editions and at the events that carry on in Le Mans.",
        excerpt:
          "No 2026 edition: the third one, The Last Race, was the last. A look back at GP Explorer and at what still fills the Bugatti Circuit.",
        keywords: [
          "GP Explorer",
          "GP Explorer 2026",
          "GP Explorer The Last Race",
          "GP Explorer last edition",
          "GP Explorer Squeezie",
        ],
      },
      it: {
        title: "GP Explorer: è finito dopo The Last Race 2025",
        description:
          "Il GP Explorer di Squeezie si è fermato dopo la terza edizione, The Last Race (3-5 ottobre 2025 al Circuit Bugatti). Bilancio delle tre edizioni e degli eventi che continuano a Le Mans.",
        excerpt:
          "Nessuna edizione 2026: la terza, The Last Race, era l'ultima. Bilancio dell'avventura GP Explorer e di ciò che anima ancora il Circuit Bugatti.",
        keywords: [
          "GP Explorer",
          "GP Explorer 2026",
          "GP Explorer The Last Race",
          "GP Explorer ultima edizione",
          "GP Explorer Squeezie",
        ],
      },
      de: {
        title: "GP Explorer: nach The Last Race 2025 ist Schluss",
        description:
          "Squeezies GP Explorer endete nach der dritten Ausgabe, The Last Race (3.-5. Oktober 2025 auf dem Circuit Bugatti). Rückblick auf die drei Ausgaben und auf die Events, die in Le Mans weitergehen.",
        excerpt:
          "Keine Ausgabe 2026: Die dritte, The Last Race, war die letzte. Rückblick auf den GP Explorer und darauf, was den Circuit Bugatti weiterhin füllt.",
        keywords: [
          "GP Explorer",
          "GP Explorer 2026",
          "GP Explorer The Last Race",
          "GP Explorer letzte Ausgabe",
          "GP Explorer Squeezie",
        ],
      },
      es: {
        title: "GP Explorer: se acabó tras The Last Race 2025",
        description:
          "El GP Explorer de Squeezie se detuvo tras su tercera edición, The Last Race (3-5 de octubre de 2025 en el Circuito Bugatti). Repaso de las tres ediciones y de los eventos que continúan en Le Mans.",
        excerpt:
          "Sin edición 2026: la tercera, The Last Race, fue la última. Repaso de la aventura GP Explorer y de lo que sigue llenando el Circuito Bugatti.",
        keywords: [
          "GP Explorer",
          "GP Explorer 2026",
          "GP Explorer The Last Race",
          "GP Explorer última edición",
          "GP Explorer Squeezie",
        ],
      },
    },
  },
  {
    slug: "que-visiter-le-mans-sarthe",
    journey: ["sur-place", "preparer"],
    date: "2026-01-22",
    image: "/images/blog/tourisme.jpg",
    locales: {
      fr: {
        title: "Le Mans en famille : que visiter en Sarthe ?",
        description:
          "Guide de voyage pour découvrir Le Mans et la Sarthe en famille : Cité Plantagenêt, Abbaye de l'Épau, Zoo de la Flèche, gastronomie, événements culturels.",
        excerpt:
          "Entre patrimoine médiéval, zoo réputé et gastronomie sarthoise, Le Mans offre bien plus qu'un circuit. Voici les incontournables.",
        keywords: [
          "visiter Le Mans",
          "tourisme Sarthe",
          "Cité Plantagenêt Le Mans",
          "Le Mans en famille",
          "week-end Le Mans tourisme",
        ],
      },
      en: {
        title: "Le Mans with family: what to visit in the Sarthe?",
        description:
          "Travel guide to discover Le Mans and the Sarthe with your family: Plantagenet City, Épau Abbey, La Flèche Zoo, gastronomy, cultural events.",
        excerpt:
          "Between medieval heritage, a renowned zoo and Sarthe cuisine, Le Mans offers much more than a race track. Here are the must-sees.",
        keywords: [
          "visit Le Mans",
          "Sarthe tourism",
          "Plantagenet City Le Mans",
          "Le Mans family",
          "Le Mans tourism weekend",
        ],
      },
      it: {
        title: "Le Mans in famiglia: cosa visitare in Sarthe?",
        description:
          "Guida di viaggio per scoprire Le Mans e la Sarthe in famiglia: Cité Plantagenêt, Abbazia dell'Épau, Zoo de la Flèche, gastronomia, eventi culturali.",
        excerpt:
          "Tra patrimonio medievale, zoo rinomato e gastronomia della Sarthe, Le Mans offre molto più di un circuito. Ecco gli imperdibili.",
        keywords: [
          "visitare Le Mans",
          "turismo Sarthe",
          "Cité Plantagenêt Le Mans",
          "Le Mans in famiglia",
          "weekend Le Mans turismo",
        ],
      },
      de: {
        title: "Le Mans mit der Familie: was kann man im Sarthe besichtigen?",
        description:
          "Reiseführer zur Entdeckung von Le Mans und dem Sarthe mit der Familie: Cité Plantagenêt, Abtei von Épau, Zoo von La Flèche, Gastronomie, kulturelle Veranstaltungen.",
        excerpt:
          "Zwischen mittelalterlichem Erbe, renommiertem Zoo und Sarthe-Gastronomie bietet Le Mans weit mehr als eine Rennstrecke. Hier sind die Highlights.",
        keywords: [
          "Le Mans besichtigen",
          "Tourismus Sarthe",
          "Cité Plantagenêt Le Mans",
          "Le Mans mit Familie",
          "Wochenende Le Mans Tourismus",
        ],
      },
      es: {
        title: "Le Mans en familia: ¿qué visitar en Sarthe?",
        description:
          "Guía de viaje para descubrir Le Mans y Sarthe en familia: Cité Plantagenêt, Abadía de Épau, Zoo de la Flèche, gastronomía, eventos culturales.",
        excerpt:
          "Entre patrimonio medieval, zoo de renombre y gastronomía sartesa, Le Mans ofrece mucho más que un circuito. Estos son los imprescindibles.",
        keywords: [
          "visitar Le Mans",
          "turismo Sarthe",
          "Cité Plantagenêt Le Mans",
          "Le Mans en familia",
          "fin de semana Le Mans turismo",
        ],
      },
    },
  },
];

export function getPostBySlug(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getLocalizedPost(post: BlogPostMeta, locale: Locale): LocalizedPost {
  return post.locales[locale] ?? post.locales.fr;
}
