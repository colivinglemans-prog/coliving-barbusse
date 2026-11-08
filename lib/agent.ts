/**
 * Ce que Barbusse déclare aux IA : la configuration de `@sejour/socle/lib/stay-agent` et ses
 * branchements (disponibilités Beds24, prix `getroomprice`, ntfy, secrets de devis).
 *
 * Les valeurs viennent de `lib/property-info.ts` (adresse, contact, capacité, politiques) et de
 * `lib/beds24-property.ts` (identifiants) — seuls les textes destinés aux IA sont écrits ici.
 */
import { monthlyAvailability } from "@sejour/socle/lib/availability";
import { sendNtfy } from "@sejour/socle/lib/ntfy";
import { DEFAULT_LOCALE, LOCALES } from "@sejour/socle/lib/locales";
import { quoteKeysFromEnv } from "@sejour/socle/lib/quote-token";
import { fetchRoomPrice } from "@sejour/socle/lib/stay-price";
import type { PropertyFacts, StayAgentConfig, StayAgentDeps } from "@sejour/socle/lib/stay-agent";
import type { StayQuoteConfig } from "@sejour/socle/lib/stay-quote";
import { todayParis } from "@sejour/socle/lib/time";
import { getAvailability, getMinStay } from "@/lib/beds24";
import { PROPERTY_ID, ROOM_ID } from "@/lib/beds24-property";
import { CANCELLATION_POLICY, PAYMENT_POLICY, PROPERTY_INFO } from "@/lib/property-info";
import { SITE_URL } from "@/lib/site";

/** `+33620921005` → `+33 6 20 92 10 05`, dérivé du contact plutôt que recopié. */
const PHONE = PROPERTY_INFO.contact.phone.replace(/^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/, "+33 $1 $2 $3 $4 $5");

/** Les lignes du détail du prix, par langue. */
const LINE_LABELS: Record<
  string,
  { nights: (n: number) => string; cleaning: string; linen: (g: number) => string; tax: (adults: number) => string }
> = {
  fr: {
    nights: (n) => `${n} nuit${n > 1 ? "s" : ""}, remise directe de 7 % incluse`,
    cleaning: "Ménage de fin de séjour",
    linen: (g) => `Draps et serviettes (${g} pers.)`,
    tax: (a) => `Taxe de séjour (${a} adulte${a > 1 ? "s" : ""} ; mineurs exonérés)`,
  },
  en: {
    nights: (n) => `${n} night${n > 1 ? "s" : ""}, 7% direct-booking discount included`,
    cleaning: "End-of-stay cleaning",
    linen: (g) => `Bed linen and towels (${g} guests)`,
    tax: (a) => `Tourist tax (${a} adult${a > 1 ? "s" : ""}; minors exempt)`,
  },
  de: {
    nights: (n) => `${n > 1 ? `${n} Nächte` : "1 Nacht"}, inkl. 7 % Direktbuchungsrabatt`,
    cleaning: "Endreinigung",
    linen: (g) => `Bettwäsche und Handtücher (${g} Pers.)`,
    tax: (a) => `Kurtaxe (${a} ${a > 1 ? "Erwachsene" : "Erwachsener"}; Minderjährige befreit)`,
  },
  es: {
    nights: (n) => `${n} noche${n > 1 ? "s" : ""}, descuento directo del 7 % incluido`,
    cleaning: "Limpieza final",
    linen: (g) => `Ropa de cama y toallas (${g} pers.)`,
    tax: (a) => `Tasa turística (${a} adulto${a > 1 ? "s" : ""}; menores exentos)`,
  },
  it: {
    nights: (n) => `${n} nott${n > 1 ? "i" : "e"}, sconto diretto del 7 % incluso`,
    cleaning: "Pulizia finale",
    linen: (g) => `Biancheria e asciugamani (${g} pers.)`,
    tax: (a) => `Tassa di soggiorno (${a} adult${a > 1 ? "i" : "o"}; minori esenti)`,
  },
};

export const STAY_QUOTE: StayQuoteConfig = {
  roomId: ROOM_ID,
  // Le second compteur du calendrier est « Ados (10-17 ans) » : jusqu'à 17, avec au moins un adulte.
  capacity: { maxTotal: PROPERTY_INFO.maxGuests, maxChildren: PROPERTY_INFO.maxGuests - 3 },
  defaultMinStay: 2,
  maxHorizonDays: 400,
  // Grille Beds24 relevée le 2026-11-07, au centime : nuits −7 % (direct), ménage 280 €,
  // linge 15 € par voyageur, taxe de séjour 2,20 € par **adulte** et par nuit (mineurs
  // exonérés : 14 adultes + 4 enfants = 1 657,85 € du 18 au 20/12/2026). Un écart bloque le prix
  // et prévient l'hôte — Beyond ou un réglage Beds24 qui change la grille se voit tout de suite.
  // Ce détail est montré au voyageur (devis, page de devis) et sa somme sert de garde-fou.
  breakdown: ({ nightly, adults, children, nights, lang }) => {
    const t = LINE_LABELS[lang] ?? LINE_LABELS.fr;
    return [
      { id: "nights", label: t.nights(nights), amount: nightly.reduce((s, n) => s + n, 0) * 0.93 },
      { id: "cleaning", label: t.cleaning, amount: 280 },
      { id: "linen", label: t.linen(adults + children), amount: 15 * (adults + children) },
      { id: "tax", label: t.tax(adults), amount: 2.2 * adults * nights },
    ];
  },
  lastMinute: {
    withinDays: 0,
    notice: {
      fr: `Arrivée aujourd'hui : appelez l'hôte ou écrivez-lui sur WhatsApp au ${PHONE} avant de réserver, pour vérifier que la maison est prête.`,
      en: `Arriving today: call the host or message them on WhatsApp at ${PHONE} before booking, to check the house is ready.`,
      de: `Anreise heute: Rufen Sie den Gastgeber vor der Buchung an oder schreiben Sie per WhatsApp an ${PHONE}, um zu prüfen, ob das Haus bereit ist.`,
      es: `Llegada hoy: llame al anfitrión o escríbale por WhatsApp al ${PHONE} antes de reservar, para comprobar que la casa está lista.`,
      it: `Arrivo oggi: chiamate l'host o scrivetegli su WhatsApp al ${PHONE} prima di prenotare, per verificare che la casa sia pronta.`,
    },
  },
};

function pages(lang: string): Record<string, string> {
  const l = (LOCALES as readonly string[]).includes(lang) ? lang : DEFAULT_LOCALE;
  const fr = lang === "fr";
  return {
    [`/${l}`]: fr ? "Accueil, photos et calendrier de réservation" : "Home, photos and booking calendar",
    [`/${l}/chambres`]: fr ? "Les 9 chambres" : "The 9 bedrooms",
    [`/${l}/seminaires`]: fr ? "Séminaires et équipes" : "Seminars and teams",
    [`/${l}/blog`]: fr ? "Blog : événements du circuit, Le Mans" : "Blog: circuit events, Le Mans",
  };
}

const FACTS_FR: Omit<PropertyFacts, "pages"> = {
  name: "Coliving Barbusse — maison entière au Mans",
  summary:
    "Maison entière de 215 m² au Mans : 9 chambres, chacune avec sa salle de douche privative, pour 10 à 20 personnes. À 10 min à pied de la gare TGV (Paris en 55 min environ, liaisons directes vers Nantes, Rennes, Angers) et à 4,7 km du circuit des 24 Heures. Réunions de famille, équipes de course, équipes professionnelles, séminaires, équipes sportives.",
  address: PROPERTY_INFO.address.full,
  capacity: {
    max: PROPERTY_INFO.maxGuests,
    note: "9 chambres à lit double (2 avec un clic-clac une place) : 9 personnes sans partager de chambre, 11 sans partager de lit, 20 au maximum en partageant les lits doubles",
  },
  checkIn: `Autonome par serrure connectée, ${PROPERTY_INFO.checkIn.fr}, à toute heure`,
  checkOut: PROPERTY_INFO.checkOut.fr,
  includes: ["Draps et serviettes", "Ménage de fin de séjour", "Taxe de séjour", "Fibre et Wi-Fi", "Salle de sport privée et salle zen"],
  rules: [
    "Animaux non autorisés",
    "Non-fumeur à l'intérieur",
    "Pas de fête ni d'événement bruyant (les repas de famille sont bienvenus)",
    "Maison pensée pour les ados et les adultes : rien n'est aménagé pour les jeunes enfants (escaliers non protégés, tabourets hauts, TV dans les chambres, salle de sport dans une annexe). Les moins de 10 ans sont acceptés sous la responsabilité de leurs parents",
    "Stationnement gratuit dans la rue, sans place réservée",
  ],
  contact: { phone: PROPERTY_INFO.contact.phone, whatsapp: PROPERTY_INFO.contact.whatsapp, email: PROPERTY_INFO.contact.email },
};

const FACTS_EN: Omit<PropertyFacts, "pages"> = {
  ...FACTS_FR,
  name: "Coliving Barbusse — entire house in Le Mans",
  summary:
    "215 m² entire house in Le Mans, France: 9 bedrooms, each with its own private shower room, for 10 to 20 guests. A 10-minute walk from the TGV station (Paris in about 55 min, direct trains to Nantes, Rennes, Angers) and 4.7 km from the 24 Hours circuit. Family gatherings, racing teams, work teams, seminars, sports teams.",
  capacity: {
    max: PROPERTY_INFO.maxGuests,
    note: "9 double-bed bedrooms (2 with an extra single sofa bed): 9 guests without sharing a room, 11 without sharing a bed, 20 at most when sharing double beds",
  },
  checkIn: `Self check-in with a smart lock, ${PROPERTY_INFO.checkIn.en}, at any hour`,
  checkOut: PROPERTY_INFO.checkOut.en,
  includes: ["Bed linen and towels", "End-of-stay cleaning", "Tourist tax", "Fibre and Wi-Fi", "Private gym and zen room"],
  rules: [
    "No pets",
    "No smoking indoors",
    "No parties or noisy events (family meals are welcome)",
    "A house designed for teens and adults: nothing is set up for young children (unguarded stairs, high stools, TV in every bedroom, gym in a separate annex). Children under 10 are welcome under their parents' responsibility",
    "Free street parking, no reserved space",
  ],
};

export const STAY_AGENT: StayAgentConfig = {
  propertyId: PROPERTY_ID,
  siteUrl: SITE_URL,
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  quote: STAY_QUOTE,
  cancellation: CANCELLATION_POLICY,
  payment: PAYMENT_POLICY,
  facts: (lang) => ({ ...(lang === "fr" ? FACTS_FR : FACTS_EN), pages: pages(lang) }),
  quotePagePath: (lang, token) => `/${lang}/devis/${token}`,
  calendarPath: (lang) => `/${lang}#disponibilite`,
  instantBooking: true,
  childrenDescription:
    "mineurs de 0 à 17 ans (exonérés de taxe de séjour). Maison pensée pour les ados et les adultes : rien n'est aménagé pour les jeunes enfants (escaliers non protégés, tabourets hauts, TV dans les chambres, salle de sport dans une annexe). Les moins de 10 ans sont acceptés sous la responsabilité de leurs parents.",
};

/** Les branchements réels, recalculés à chaque requête (`today` change à minuit). */
export function stayAgentDeps(): StayAgentDeps {
  return {
    today: todayParis(),
    // Par mois entiers : une route publique ne doit pas multiplier les URL Beds24 (quota partagé
    // avec le calendrier du site, le dashboard et la synchro de la serrure).
    availability: monthlyAvailability(async (from, to) => {
      const [dates, minStay] = await Promise.all([getAvailability(PROPERTY_ID, from, to), getMinStay(PROPERTY_ID, from, to)]);
      return { dates, minStay };
    }),
    price: (req) => fetchRoomPrice(req),
    onAnomaly: (message) => sendNtfy(message, { title: "Devis IA Barbusse", priority: 4, tags: ["warning"] }),
    keys: () => quoteKeysFromEnv(),
  };
}
