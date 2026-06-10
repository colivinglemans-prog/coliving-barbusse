import type { Locale } from "@/lib/i18n";

export interface LocalizedPost {
  title: string;
  description: string;
  excerpt: string;
  keywords: string[];
}

export interface BlogPostMeta {
  slug: string;
  date: string;
  image: string;
  /** Si true, affiche un bandeau "Complet — rendez-vous en {nextEdition}" + grayscale */
  soldOut?: boolean;
  /** Ex: "2027" — affiché quand soldOut=true */
  nextEdition?: string;
  locales: Record<Locale, LocalizedPost>;
}

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: "le-mans-classic",
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
    nextEdition: "2027",
  },
  {
    slug: "jardin-securise-le-mans",
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
    date: "2026-04-22",
    image: "/images/blog/mondial-karting-kz.jpg",
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
    date: "2026-04-22",
    image: "/images/blog/24h-camions.jpg",
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
    date: "2026-04-18",
    image: "/images/blog/seminaire.jpg",
    locales: {
      fr: {
        title: "Séminaire d'entreprise au Mans : team-building circuit + coliving 9 personnes",
        description:
          "Organiser un séminaire au Mans : 9 suites privatives, espaces de réunion modulables, activités team-building au Circuit Bugatti et en Sarthe. Programme type 2 jours et guide complet.",
        excerpt:
          "9 personnes, une maison entière, le circuit mythique à moins de 5 km : la formule idéale pour un séminaire qui combine productivité et cohésion.",
        keywords: [
          "séminaire entreprise Le Mans",
          "team building Le Mans",
          "séminaire Circuit Bugatti",
          "mise au vert entreprise Sarthe",
          "location maison séminaire Le Mans",
          "brainstorm équipe Le Mans",
        ],
      },
      en: {
        title: "Corporate seminar in Le Mans: circuit team-building + coliving for 9",
        description:
          "Organising a seminar in Le Mans: 9 private suites, modular meeting spaces, team-building activities at Bugatti Circuit and in the Sarthe. 2-day example programme and full guide.",
        excerpt:
          "9 people, a whole house, the legendary circuit less than 5 km away: the ideal formula for a seminar that combines productivity and bonding.",
        keywords: [
          "Le Mans corporate seminar",
          "Le Mans team building",
          "Bugatti Circuit seminar",
          "company retreat Sarthe",
          "Le Mans seminar house rental",
          "team brainstorm Le Mans",
        ],
      },
      it: {
        title: "Seminario aziendale a Le Mans: team-building al circuito + coliving 9 persone",
        description:
          "Organizzare un seminario a Le Mans: 9 suite private, sale riunioni modulari, attività di team-building al Circuit Bugatti e in Sarthe. Programma tipo di 2 giorni e guida completa.",
        excerpt:
          "9 persone, una casa intera, il circuito mitico a meno di 5 km: la formula ideale per un seminario che unisce produttività e coesione.",
        keywords: [
          "seminario aziendale Le Mans",
          "team building Le Mans",
          "seminario Circuit Bugatti",
          "ritiro aziendale Sarthe",
          "affitto casa seminario Le Mans",
          "brainstorm team Le Mans",
        ],
      },
      de: {
        title: "Firmenseminar in Le Mans: Team-Building am Circuit + Coliving für 9 Personen",
        description:
          "Seminar in Le Mans organisieren: 9 Privatsuiten, modulare Tagungsräume, Team-Building-Aktivitäten am Circuit Bugatti und im Sarthe. Beispielprogramm über 2 Tage und vollständiger Guide.",
        excerpt:
          "9 Personen, ein ganzes Haus, der legendäre Circuit weniger als 5 km entfernt: die ideale Formel für ein Seminar, das Produktivität und Zusammenhalt vereint.",
        keywords: [
          "Firmenseminar Le Mans",
          "Team Building Le Mans",
          "Seminar Circuit Bugatti",
          "Firmenausflug Sarthe",
          "Seminarhaus Le Mans mieten",
          "Team Brainstorming Le Mans",
        ],
      },
      es: {
        title: "Seminario de empresa en Le Mans: team-building en el circuito + coliving 9 personas",
        description:
          "Organizar un seminario en Le Mans: 9 suites privadas con baño, espacios de reunión modulables, actividades de team-building en el Circuito Bugatti y en Sarthe. Programa tipo de 2 días y guía completa.",
        excerpt:
          "9 personas, una casa entera, el mítico circuito a menos de 5 km: la fórmula ideal para un seminario que combina productividad y cohesión.",
        keywords: [
          "seminario empresa Le Mans",
          "team building Le Mans",
          "seminario Circuito Bugatti",
          "retiro empresa Sarthe",
          "alquiler casa seminario Le Mans",
          "brainstorming equipo Le Mans",
        ],
      },
    },
  },
  {
    slug: "hippodrome-des-hunaudieres",
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
    date: "2026-03-28",
    image: "/images/blog/24h-du-mans.jpg",
    soldOut: true,
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
    date: "2026-03-17",
    image: "/images/blog/motogp.jpg",
    soldOut: true,
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
    date: "2026-03-05",
    image: "/images/blog/24h-moto.jpg",
    soldOut: true,
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
    date: "2026-02-20",
    image: "/images/blog/gp-explorer.jpg",
    locales: {
      fr: {
        title: "GP Explorer au Mans : tout savoir sur l'événement de Squeezie",
        description:
          "GP Explorer de Squeezie au Circuit Bugatti : format, billetterie, hébergement, conseils pour vivre le plus grand événement Twitch francophone dans les meilleures conditions.",
        excerpt:
          "60 000 spectateurs, plus d'1 million de viewers sur Twitch : le GP Explorer est devenu l'événement incontournable du Circuit Bugatti. Voici comment préparer votre week-end.",
        keywords: [
          "GP Explorer",
          "GP Explorer Squeezie",
          "GP Explorer hébergement Le Mans",
          "billet GP Explorer",
          "location maison GP Explorer",
        ],
      },
      en: {
        title: "GP Explorer in Le Mans: everything about Squeezie's event",
        description:
          "Squeezie's GP Explorer at Bugatti Circuit: format, tickets, accommodation, tips to enjoy the biggest French-speaking Twitch event.",
        excerpt:
          "60,000 spectators, over 1 million Twitch viewers: GP Explorer has become a must-attend event at Bugatti Circuit. Here's how to prepare.",
        keywords: [
          "GP Explorer",
          "GP Explorer Squeezie",
          "GP Explorer accommodation Le Mans",
          "GP Explorer ticket",
          "GP Explorer house rental",
        ],
      },
      it: {
        title: "GP Explorer a Le Mans: tutto sull'evento di Squeezie",
        description:
          "GP Explorer di Squeezie al Circuit Bugatti: format, biglietteria, alloggio, consigli per vivere il più grande evento Twitch francofono nelle migliori condizioni.",
        excerpt:
          "60.000 spettatori, oltre 1 milione di viewer su Twitch: il GP Explorer è diventato l'evento imperdibile del Circuit Bugatti. Ecco come preparare il vostro weekend.",
        keywords: [
          "GP Explorer",
          "GP Explorer Squeezie",
          "alloggio GP Explorer Le Mans",
          "biglietto GP Explorer",
          "affitto casa GP Explorer",
        ],
      },
      de: {
        title: "GP Explorer in Le Mans: alles über Squeezies Event",
        description:
          "Squeezies GP Explorer auf dem Circuit Bugatti: Format, Tickets, Unterkunft, Tipps, um das größte französischsprachige Twitch-Event optimal zu erleben.",
        excerpt:
          "60.000 Zuschauer, über 1 Million Twitch-Viewer: der GP Explorer ist zum Pflichtevent des Circuit Bugatti geworden. So bereiten Sie Ihr Wochenende vor.",
        keywords: [
          "GP Explorer",
          "GP Explorer Squeezie",
          "GP Explorer Unterkunft Le Mans",
          "GP Explorer Ticket",
          "GP Explorer Haus mieten",
        ],
      },
      es: {
        title: "GP Explorer en Le Mans: todo sobre el evento de Squeezie",
        description:
          "GP Explorer de Squeezie en el Circuito Bugatti: formato, entradas, alojamiento, consejos para vivir el mayor evento de Twitch francófono en las mejores condiciones.",
        excerpt:
          "60.000 espectadores, más de 1 millón de viewers en Twitch: el GP Explorer se ha convertido en el evento ineludible del Circuito Bugatti. Así puede preparar su fin de semana.",
        keywords: [
          "GP Explorer",
          "GP Explorer Squeezie",
          "alojamiento GP Explorer Le Mans",
          "entrada GP Explorer",
          "alquiler casa GP Explorer",
        ],
      },
    },
  },
  {
    slug: "que-visiter-le-mans-sarthe",
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
