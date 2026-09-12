import type { CalendarLabels } from "@sejour/socle/components/ReservationCalendar";
export type Locale = "fr" | "en" | "it" | "de" | "es";

export interface Dictionary {
  header: {
    rooms: string;
    amenities: string;
    location: string;
    book: string;
    seminars: string;
    blog: string;
    tagline1: string;
    tagline2: string;
  };
  propertyHeader: {
    title: string;
    superhost: string;
    location: string;
    travelers: string;
    rooms: string;
    beds: string;
    bathrooms: string;
    area: string;
  };
  highlights: {
    selfCheckIn: { title: string; description: string };
    quiet: { title: string; description: string };
    superhost: { title: string; description: string; reviewsLink: string };
  };
  description: {
    title: string;
    readMore: string;
    showLess: string;
    body: string;
  };
  sleeping: {
    title: string;
    room: string;
    doubleBed: string;
    doubleBedSofa: string;
    features: string;
    prevPhoto: string;
    nextPhoto: string;
  };
  commonSpaces: {
    title: string;
    subtitle: string;
    gym: string;
    gymDesc: string;
    zen: string;
    zenDesc: string;
  };
  garden: {
    title: string;
    subtitle: string;
    features: string[];
  };
  amenities: {
    title: string;
    showAll: (count: number) => string;
    showLess: string;
    labels: string[];
  };
  /**
   * Section du calendrier de réservation.
   *
   * **La seule section commune aux deux sites**, et elle suit le composant : sa forme
   * partagée est `CalendarLabels`, définie dans le socle avec le calendrier qui la consomme.
   * Ce qui s'y ajoute ici — titre, sous-titre, nom du compteur d'ados et sa note, invite
   * d'arrivée — reste propre au Mans et passe par d'autres props.
   *
   * `checkInLabel` n'est plus rendu par le calendrier : l'état « arrivée choisie, en attente
   * du départ » affiche l'invite de départ et un bouton d'effacement, sans répéter une date
   * déjà surlignée dans la grille. La clé reste déclarée, les cinq dictionnaires la portant.
   *
   * Toute clé retirée de `CalendarLabels` casserait la compilation des cinq dictionnaires,
   * ce qui est exactement l'effet recherché.
   */
  calendar: CalendarLabels & {
    title: string;
    subtitle: string;
    teens: string;
    teensNote: string;
    selectCheckIn: string;
    checkInLabel: string;
    /**
     * Libellés d'accessibilité du calendrier. Ils disaient « Photo précédente » avant le
     * Lot 5 : les deux chevrons empruntaient ceux de la galerie, et un lecteur d'écran
     * annonçait donc une photo sur un calendrier.
     */
    previousMonth: string;
    nextMonth: string;
    close: string;
  };
  location: {
    title: string;
    address: string;
    circuitTitle: string;
    circuitDesc: string;
    nearby: Array<{ name: string; distance: string; detail: string }>;
  };
  host: {
    title: string;
    superhost: string;
    experience: string;
    about: string;
    aboutText: string;
    languages: string;
    languagesValue: string;
    responseRate: string;
    responseRateValue: string;
    whatsapp: string;
    airbnbMessage: string;
  };
  reviews: {
    title: string;
    subtitle: string;
    hostReplyLabel: string;
    autoTranslated: string;
    showOriginal: string;
    hideOriginal: string;
  };
  rules: {
    title: string;
    sections: Array<{
      title: string;
      items: string[];
    }>;
  };
  footer: {
    navigation: string;
    contact: string;
    whatsapp: string;
    copyright: string;
    paymentTitle: string;
    paymentText: string;
  };
  gallery: {
    showPhotos: (count: number) => string;
    showAllPhotos: string;
    previous: string;
    next: string;
  };
}
