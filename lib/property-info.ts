import type { CancellationPolicy, PaymentPolicy } from "@sejour/socle/config/policies";

export const PROPERTY_INFO = {
  address: {
    street: "42 Rue Henri Barbusse",
    postalCode: "72100",
    city: "Le Mans",
    country: "France",
    full: "42 Rue Henri Barbusse, 72100 Le Mans, France",
  },
  checkIn: {
    fr: "à partir de 17h00",
    en: "from 5:00 PM",
    it: "dalle 17:00",
    de: "ab 17:00 Uhr",
    es: "a partir de las 17:00",
  },
  checkOut: {
    fr: "avant 11h00",
    en: "before 11:00 AM",
    it: "entro le 11:00",
    de: "vor 11:00 Uhr",
    es: "antes de las 11:00",
  },
  maxGuests: 20,
  /** Neuf chambres, chacune avec sa salle de douche. Lu par le JSON-LD (`numberOfRooms`). */
  bedrooms: 9,
  wifi: {
    ssid: "Freebox-C1A6F7",
    password: "xccm4q2z33qz3t7wqbmvbh",
    encryption: "WPA",
  },
  contact: {
    phone: "+33620921005",
    whatsapp: "https://wa.me/33620921005",
    email: "contact@coliving-barbusse.fr",
  },
  googleMaps: {
    shortlink: "https://maps.app.goo.gl/k141gZkCRKuv3Sai7",
  },
  navigation: {
    googleMaps: "https://maps.app.goo.gl/k141gZkCRKuv3Sai7",
    waze: "https://waze.com/ul?ll=47.9880655%2C0.1923905&navigate=yes",
    appleMaps: "https://maps.apple.com/?address=42%20Rue%20Henri%20Barbusse,%2072100%20Le%20Mans",
    mappy: "https://fr.mappy.com/itineraire/?destination=42+Rue+Henri+Barbusse+72100+Le+Mans",
    rooleMap: "https://www.roole.fr/application-roole-map",
  },
} as const;

export function wifiQrPayload(): string {
  const { ssid, password, encryption } = PROPERTY_INFO.wifi;
  return `WIFI:T:${encryption};S:${ssid};P:${password};;`;
}

/**
 * Politique d'annulation des réservations directes : **Ferme**, alignée sur celle d'Airbnb
 * (validée par l'exploitant le 2026-11-07).
 *
 * - 100 % remboursé jusqu'à 30 jours avant l'arrivée ;
 * - 50 % jusqu'à 7 jours avant ;
 * - rien en deçà ;
 * - délai de grâce : 100 % dans les 48 h qui suivent la réservation, si l'arrivée est à
 *   14 jours ou plus.
 *
 * Les phrases vivent dans les dictionnaires et `public/llms.txt` ; les tests post-déploiement
 * (`llms.policies`) y cherchent ces nombres. ⚠ Au 2026-11-07, les textes publiés disent encore
 * « 14 jours / acompte de 10 % » : leur réécriture appartient à la session « réservation IA ».
 */
export const CANCELLATION_POLICY: CancellationPolicy = {
  name: "ferme",
  tiers: [
    { minDaysBefore: 30, refundPct: 100 },
    { minDaysBefore: 7, refundPct: 50 },
    { minDaysBefore: 0, refundPct: 0 },
  ],
  gracePeriod: { hoursAfterBooking: 48, minDaysBefore: 14, refundPct: 100 },
};

/**
 * Paiement : **100 % à la réservation directe**, sur la page de paiement Beds24, taxe de séjour
 * comprise ; les entreprises peuvent régler 30 % sur facture à la réservation.
 */
export const PAYMENT_POLICY: PaymentPolicy = {
  direct: { upfrontPct: 100, via: "Beds24", touristTaxIncluded: true },
  business: { depositPct: 30, via: "facture" },
};
