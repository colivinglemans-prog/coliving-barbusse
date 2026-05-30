export const PROPERTY_INFO = {
  address: {
    street: "42 Rue Henri Barbusse",
    postalCode: "72100",
    city: "Le Mans",
    country: "France",
    full: "42 Rue Henri Barbusse, 72100 Le Mans, France",
  },
  checkIn: {
    fr: "17h00 — 23h00",
    en: "5:00 PM — 11:00 PM",
    it: "17:00 — 23:00",
    de: "17:00 — 23:00 Uhr",
    es: "17:00 — 23:00",
  },
  checkOut: {
    fr: "avant 11h00",
    en: "before 11:00 AM",
    it: "entro le 11:00",
    de: "vor 11:00 Uhr",
    es: "antes de las 11:00",
  },
  maxGuests: 18,
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
