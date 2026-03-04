export type Locale = "fr" | "en";

export interface Dictionary {
  header: {
    rooms: string;
    amenities: string;
    location: string;
    book: string;
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
    superhost: { title: string; description: string };
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
  amenities: {
    title: string;
    showAll: (count: number) => string;
    showLess: string;
    labels: string[];
  };
  calendar: {
    title: string;
    subtitle: string;
    loading: string;
    nights: (n: number) => string;
    adults: string;
    teens: string;
    teensNote: string;
    clear: string;
    bookNow: string;
    selectCheckIn: string;
    checkInLabel: string;
    minStayNote: (n: number) => string;
    selectCheckOut: string;
    summary: (nights: number, checkIn: string, checkOut: string, adults: number, children: number) => string;
    monthNames: string[];
    dayNames: string[];
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
  };
  gallery: {
    showPhotos: (count: number) => string;
    showAllPhotos: string;
    previous: string;
    next: string;
  };
}
