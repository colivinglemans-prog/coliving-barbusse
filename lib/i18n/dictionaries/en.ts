import type { Dictionary } from "../types";

export const en: Dictionary = {
  header: {
    rooms: "Rooms",
    amenities: "Amenities",
    location: "Location",
    book: "Book",
  },
  propertyHeader: {
    title: "Premium house 9 private suites Near the Circuit Le Mans",
    superhost: "Superhost",
    location: "Le Mans, Pays de la Loire, France",
    travelers: "18 guests",
    rooms: "9 bedrooms",
    beds: "9 double beds",
    bathrooms: "9 private bathrooms",
    area: "215 m²",
  },
  highlights: {
    selfCheckIn: {
      title: "Self check-in",
      description: "Access the property with a smart lock. Check-in from 5 PM.",
    },
    quiet: {
      title: "Quiet and peaceful",
      description: "Quiet residential area, near Parc Gué de Maulny. Ideal for relaxation.",
    },
    superhost: {
      title: "Alexandre is a Superhost",
      description: "Superhost on Airbnb since April 2024 — Superhosts are experienced, highly rated hosts who are committed to providing excellent stays.",
      reviewsLink: "Discover 100+ reviews on my Airbnb profile",
    },
  },
  description: {
    title: "Description",
    readMore: "Read more",
    showLess: "Show less",
    body: `Our 215 m² house offers a level of comfort unmatched elsewhere in Le Mans rentals.

9 double bedrooms, each with its own private shower room — no one has to share a bathroom, even in a large group!

Quality bedding, storage and real privacy in every room. Each suite features a double bed with storage, a desk with Ethernet connection, a private bathroom, a smart TV, a dressing area and an individual key.

The house is spread over 3 levels with a large living room, a fully equipped dining kitchen, a 90 m² enclosed garden and a fully equipped gym with zen area.

Ideal for mixed groups, colleagues, friends or blended families. This concept allows everyone to live at their own pace while enjoying the pleasure of being together.

Perfect for events, race teams, corporate stays and group travel during the 24 Hours of Le Mans and major circuit events. Easy access to the Bugatti Circuit via Tramway T1 from the TGV station.

Sleeps up to 18 guests.`,
  },
  sleeping: {
    title: "Where you'll sleep",
    room: "Room",
    doubleBed: "1 double bed",
    features: "Private bathroom · Smart TV · Desk · Wardrobe · Individual key",
    prevPhoto: "Previous photo",
    nextPhoto: "Next photo",
  },
  commonSpaces: {
    title: "Fitness Area",
    subtitle: "Private space in an annex of the house, freely accessible 24/7 — no risk of waking anyone.",
    gym: "Gym",
    gymDesc: "Fitness equipment available: elliptical bike, treadmill, dumbbells and weight bench.",
    zen: "Zen room",
    zenDesc: "A relaxation space to recharge: yoga, meditation and relaxation.",
  },
  garden: {
    title: "Garden",
    subtitle: "90 m² private garden, fully enclosed and secure, south-facing. 25 m² of planting plus a gravelled area with 8-seater garden furniture — perfect for aperitifs with friends.",
    features: [
      "Secure, fully enclosed",
      "90 m² total: 25 m² planted + gravelled area",
      "South-facing all day",
      "8-seater garden furniture, perfect for aperitifs",
    ],
  },
  amenities: {
    title: "What this place offers",
    showAll: (count) => `Show all ${count} amenities`,
    showLess: "Show less",
    labels: [
      "Bed linen and towels provided",
      "Cleaning included",
      "High-speed Wi-Fi",
      "Smart TV in each room",
      "Dedicated workspace in each room",
      "Bean-to-cup coffee machine",
      "Fully equipped kitchen",
      "Washing machine",
      "Tumble dryer",
      "Private gym",
      "Enclosed garden 90 m²",
      "Lock on each room",
      "Private entrance",
      "Heating",
      "Dishwasher",
      "Microwave",
      "Oven",
      "Fridge / Freezer",
      "Smoke detector",
      "Fire extinguisher",
    ],
  },
  calendar: {
    title: "Availability",
    subtitle: "Select your dates to book the entire house.",
    loading: "Loading availability...",
    nights: (n) => `${n} night${n > 1 ? "s" : ""}`,
    adults: "Adults",
    teens: "Teens (10-17 yrs)",
    teensNote: "Property not suitable for young children.",
    clear: "Clear",
    bookNow: "Book now",
    selectCheckIn: "Select your check-in date",
    checkInLabel: "Check-in",
    minStayNote: (n) => `(min. ${n} nights)`,
    selectCheckOut: "Select your check-out date",
    summary: (nights, checkIn, checkOut, adults, children) =>
      `${nights} night${nights > 1 ? "s" : ""} — ${checkIn} to ${checkOut} · ${adults} adult${adults > 1 ? "s" : ""}${children > 0 ? `, ${children} child${children > 1 ? "ren" : ""}` : ""}`,
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    dayNames: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  location: {
    title: "Where you'll be",
    address: "42 Rue Henri Barbusse, 72100 Le Mans — Quiet residential area",
    circuitTitle: "Near the Bugatti Circuit",
    circuitDesc: "Located just 4.7 km from the legendary Bugatti Circuit, our house is the perfect base for the 24 Hours of Le Mans, MotoGP, Le Mans Classic and all circuit events. Direct access via Tramway T1 from the TGV station.",
    nearby: [
      { name: "Le Mans TGV Station", distance: "10 min walk", detail: "Paris in 54 min, connections to Rennes, Nantes, Angers" },
      { name: "Bugatti Circuit", distance: "4.7 km", detail: "24 Hours of Le Mans, MotoGP, Le Mans Classic. Accessible via Tramway T1" },
      { name: "South Le Mans business areas", distance: "< 10 min by car", detail: "Technopole University, South business zone, research centres" },
      { name: "Parc Gué de Maulny", distance: "5 min walk", detail: "10-hectare green space to relax" },
      { name: "Tramway T1", distance: "Nearby", detail: "Serves the city centre, station and circuit" },
      { name: "Cité Plantagenêt (Old Le Mans)", distance: "15 min by tram", detail: "Historic medieval quarter, restaurants, heritage" },
    ],
  },
  host: {
    title: "Your host: Alexandre",
    superhost: "Superhost",
    experience: "years of experience",
    about: "About Alexandre",
    aboutText: "Engineer, geek, sportsman and handyman, I've been a Superhost for several years.\nI'm committed to offering clean, comfortable and perfectly functional accommodation.\nThis house in Le Mans was designed to welcome families, groups of friends or professional teams, while guaranteeing everyone's privacy with en-suite bedrooms.\nI'm available and responsive, while giving you great autonomy.",
    languages: "Languages",
    languagesValue: "French, English",
    responseRate: "Response rate",
    responseRateValue: "Quick response — usually within an hour",
    whatsapp: "WhatsApp",
    airbnbMessage: "Airbnb message",
  },
  reviews: {
    title: "Guest reviews",
    subtitle: "What our guests say on Airbnb and Abritel",
  },
  rules: {
    title: "Things to know",
    sections: [
      {
        title: "House rules",
        items: [
          "Check-in: 5:00 PM — 11:00 PM",
          "Checkout: before 11:00 AM",
          "18 guests maximum",
          "No smoking (indoors)",
          "No pets",
          "No parties or loud events",
        ],
      },
      {
        title: "Safety & property",
        items: [
          "Smoke detector",
          "Fire extinguisher",
          "Lock on each room",
          "Private entrance with smart lock",
          "Heating in all rooms",
        ],
      },
      {
        title: "Cancellation policy",
        items: [
          "Free cancellation up to 14 days before arrival",
          "10% deposit at booking",
          "Full balance due before check-in",
          "Secure card payment (Visa, Mastercard)",
        ],
      },
    ],
  },
  footer: {
    navigation: "Navigation",
    contact: "Contact",
    whatsapp: "WhatsApp",
    copyright: "Coliving Barbusse. All rights reserved.",
    paymentTitle: "Bank transfer",
    paymentText:
      "Bank transfer accepted (with invoice). Contact us to request a reservation.",
  },
  gallery: {
    showPhotos: (count) => `View all ${count} photos`,
    showAllPhotos: "View all photos",
    previous: "Previous",
    next: "Next",
  },
};
