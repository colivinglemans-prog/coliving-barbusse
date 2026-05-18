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
