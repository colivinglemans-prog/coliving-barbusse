export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  excerpt: string;
  image: string;
  keywords: string[];
}

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: "hippodrome-des-hunaudieres",
    title: "Hippodrome des Hunaudières : courses, programme et événements au Mans",
    description:
      "Hippodrome des Hunaudières au Mans : 13 réunions hippiques en 2026, courses de trot et galop, soirées nocturnes. Notre maison à 20 min de l'hippodrome pour votre week-end.",
    date: "2026-04-17",
    excerpt:
      "Seul hippodrome de la Sarthe, 13 réunions dans l'année, courses de trot sur piste sable de 1 350 m. L'incontournable du monde hippique au Mans.",
    image: "/images/house/3-maison-AI.png",
    keywords: [
      "Hippodrome des Hunaudières",
      "courses hippiques Le Mans",
      "hippodrome Le Mans programme",
      "PMU Le Mans Hunaudières",
      "soirée hippique Le Mans",
    ],
  },
  {
    slug: "24-heures-rollers-le-mans",
    title: "24 Heures Rollers du Mans 2026 : guide de l'événement roller",
    description:
      "24 Heures Rollers 2026 au Circuit Bugatti les 11-12 juillet : format, inscriptions, hébergement pour équipes et clubs. Guide complet pour préparer votre week-end.",
    date: "2026-04-16",
    excerpt:
      "Patiner 24 heures sur le circuit mythique : 11-12 juillet 2026. Tout pour préparer votre venue en équipe, club ou solo.",
    image: "/images/house/3-maison-AI.png",
    keywords: [
      "24 Heures Rollers Le Mans",
      "24H Rollers 2026",
      "roller Circuit Bugatti",
      "hébergement 24h rollers",
      "équipe roller Le Mans",
    ],
  },
  {
    slug: "le-mans-classic",
    title: "Le Mans Classic : guide du rassemblement mondial des voitures anciennes",
    description:
      "Le Mans Classic, plus grand rassemblement mondial de voitures de course anciennes : dates, programme, hébergement et conseils pratiques pour les passionnés et clubs.",
    date: "2026-04-17",
    excerpt:
      "700 voitures mythiques de 1923 à 1993, 24 heures de course, 235 000 spectateurs. Préparez votre séjour pour la plus grande fête de l'automobile de collection.",
    image: "/images/blog/le-mans-classic.jpg",
    keywords: [
      "Le Mans Classic 2027",
      "Le Mans Classic hébergement",
      "rassemblement voitures anciennes Le Mans",
      "club collectionneurs Le Mans",
      "location maison Le Mans Classic",
    ],
  },
  {
    slug: "restos-bars-magasins-le-mans",
    title: "Restaurants, bars et magasins à proximité de la maison",
    description:
      "Notre sélection de restaurants, bars, supermarchés, boulangeries et bonnes adresses à quelques minutes à pied de notre coliving au Mans.",
    date: "2026-04-12",
    excerpt:
      "Tout ce qu'il faut à pied : restos traditionnels et du monde, bars conviviaux, supermarchés et boulangeries. Notre sélection testée.",
    image: "/images/blog/restos-bars.jpg",
    keywords: [
      "restaurant Le Mans",
      "bar Le Mans centre",
      "où manger Le Mans",
      "supermarché Le Mans",
      "boulangerie Le Mans",
    ],
  },
  {
    slug: "entreprises-proches-le-mans",
    title: "Coliving pro au Mans : entreprises proches et atouts pour vos séjours d'affaires",
    description:
      "Séjour d'affaires ou séminaire au Mans ? Notre maison est proche de MMA (Covéa), Renault Manufacture Louis Schweitzer, CLAAS Tractor et du technopôle Novaxis/Novaxud.",
    date: "2026-04-06",
    excerpt:
      "Novaxis, Renault, CLAAS, MMA : notre coliving est idéalement placé pour les séjours pros, séminaires et formations au Mans.",
    image: "/images/blog/entreprises.jpg",
    keywords: [
      "hébergement entreprise Le Mans",
      "séminaire Le Mans maison",
      "logement pro Le Mans",
      "Novaxis Le Mans hébergement",
      "location maison Renault Le Mans",
      "logement équipe Le Mans",
    ],
  },
  {
    slug: "ou-se-loger-24h-du-mans-2026",
    title: "Où se loger pour les 24 Heures du Mans 2026 ?",
    description:
      "Guide complet pour choisir son hébergement pendant les 24h du Mans 2026 : zones, prix, conseils pour grands groupes et familles. Notre maison de 9 suites à 15 min du circuit.",
    date: "2026-03-28",
    excerpt:
      "Où dormir pendant les 24h du Mans ? Zones, tarifs, disponibilités — tout ce qu'il faut savoir pour réserver son hébergement avant que tout soit pris.",
    image: "/images/blog/24h-du-mans.jpg",
    keywords: [
      "24 Heures du Mans 2026",
      "hébergement 24h du Mans",
      "où se loger Le Mans course",
      "location maison 24h du Mans",
      "logement proche circuit Bugatti",
    ],
  },
  {
    slug: "motogp-france-le-mans",
    title: "MotoGP France 2026 au Mans : hébergement et conseils pratiques",
    description:
      "Grand Prix de France MotoGP 2026 au Circuit Bugatti : dates, tarifs hébergement, transport, conseils pour un week-end réussi en famille ou entre amis.",
    date: "2026-03-17",
    excerpt:
      "La manche la plus fréquentée du championnat : préparez votre week-end MotoGP au Mans avec notre guide complet.",
    image: "/images/blog/motogp.jpg",
    keywords: [
      "MotoGP France 2026",
      "Grand Prix France MotoGP Le Mans",
      "hébergement MotoGP Le Mans",
      "location maison MotoGP France",
      "week-end MotoGP Circuit Bugatti",
    ],
  },
  {
    slug: "24-heures-moto-le-mans",
    title: "24 Heures Moto Le Mans : guide hébergement et parking",
    description:
      "Tout pour organiser votre week-end des 24 Heures Moto au Mans : zones d'hébergement, prix, parking moto, conseils pour groupes de motards.",
    date: "2026-03-05",
    excerpt:
      "100 000 spectateurs, une ambiance motards unique et un hébergement bien placé, c'est ce qu'il faut. Voici comment préparer votre week-end.",
    image: "/images/blog/24h-moto.png",
    keywords: [
      "24 Heures Moto Le Mans",
      "hébergement 24h moto",
      "parking moto Le Mans circuit",
      "location maison 24h moto",
      "week-end moto Le Mans",
    ],
  },
  {
    slug: "gp-explorer-le-mans",
    title: "GP Explorer au Mans : tout savoir sur l'événement de Squeezie",
    description:
      "GP Explorer de Squeezie au Circuit Bugatti : format, billetterie, hébergement, conseils pour vivre le plus grand événement Twitch francophone dans les meilleures conditions.",
    date: "2026-02-20",
    excerpt:
      "60 000 spectateurs, plus d'1 million de viewers sur Twitch : le GP Explorer est devenu l'événement incontournable du Circuit Bugatti. Voici comment préparer votre week-end.",
    image: "/images/blog/gp-explorer.jpg",
    keywords: [
      "GP Explorer",
      "GP Explorer Squeezie",
      "GP Explorer hébergement Le Mans",
      "billet GP Explorer",
      "location maison GP Explorer",
    ],
  },
  {
    slug: "que-visiter-le-mans-sarthe",
    title: "Le Mans en famille : que visiter en Sarthe ?",
    description:
      "Guide de voyage pour découvrir Le Mans et la Sarthe en famille : Cité Plantagenêt, Abbaye de l'Épau, Zoo de la Flèche, gastronomie, événements culturels.",
    date: "2026-01-22",
    excerpt:
      "Entre patrimoine médiéval, zoo réputé et gastronomie sarthoise, Le Mans offre bien plus qu'un circuit. Voici les incontournables.",
    image: "/images/blog/tourisme.jpg",
    keywords: [
      "visiter Le Mans",
      "tourisme Sarthe",
      "Cité Plantagenêt Le Mans",
      "Le Mans en famille",
      "week-end Le Mans tourisme",
    ],
  },
];

export function getPostBySlug(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
