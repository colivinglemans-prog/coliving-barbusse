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
  locales: {
    fr: LocalizedPost;
    en: LocalizedPost;
  };
}

export const BLOG_POSTS: BlogPostMeta[] = [
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
    },
  },
  {
    slug: "le-mans-classic",
    date: "2026-04-17",
    image: "/images/blog/le-mans-classic.jpg",
    soldOut: true,
    nextEdition: "2027",
    locales: {
      fr: {
        title: "Le Mans Classic : guide du rassemblement mondial des voitures anciennes",
        description:
          "Le Mans Classic, plus grand rassemblement mondial de voitures de course anciennes : dates, programme, hébergement et conseils pratiques pour les passionnés et clubs.",
        excerpt:
          "700 voitures mythiques de 1923 à 1993, 24 heures de course, 235 000 spectateurs. Préparez votre séjour pour la plus grande fête de l'automobile de collection.",
        keywords: [
          "Le Mans Classic 2027",
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
          "Le Mans Classic 2027",
          "Le Mans Classic accommodation",
          "vintage car gathering Le Mans",
          "collector club Le Mans",
          "house rental Le Mans Classic",
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
    },
  },
];

export function getPostBySlug(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getLocalizedPost(post: BlogPostMeta, locale: Locale): LocalizedPost {
  return post.locales[locale] ?? post.locales.fr;
}
