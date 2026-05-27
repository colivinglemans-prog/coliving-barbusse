import type { Dictionary } from "../types";

export const es: Dictionary = {
  header: {
    rooms: "Habitaciones",
    amenities: "Servicios",
    location: "Ubicación",
    book: "Reservar",
    seminars: "Seminarios",
    blog: "Blog",
    tagline1: "Casa premium · 9 suites privadas",
    tagline2: "Cerca del Circuito de Le Mans",
  },
  propertyHeader: {
    title: "Casa premium 9 suites privadas cerca del Circuito de Le Mans",
    superhost: "Superhost",
    location: "Le Mans, Pays de la Loire, Francia",
    travelers: "18 huéspedes",
    rooms: "9 habitaciones",
    beds: "9 camas dobles",
    bathrooms: "9 baños privados",
    area: "215 m²",
  },
  highlights: {
    selfCheckIn: {
      title: "Llegada autónoma",
      description: "Acceda al alojamiento mediante una cerradura conectada. Llegada a partir de las 17:00.",
    },
    quiet: {
      title: "Tranquilo y apacible",
      description: "Zona residencial tranquila, cerca del Parc Gué de Maulny. Ideal para desconectar.",
    },
    superhost: {
      title: "Alexandre es Superhost",
      description: "Superhost en Airbnb desde abril de 2024 — los Superhosts son anfitriones experimentados y muy bien valorados, que se comprometen a ofrecer estancias excelentes.",
      reviewsLink: "Descubre más de 100 reseñas en mi perfil de Airbnb",
    },
  },
  description: {
    title: "Descripción",
    readMore: "Leer más",
    showLess: "Mostrar menos",
    body: `Nuestra casa de 215 m² ofrece un nivel de confort imposible de encontrar en otros alquileres de Le Mans.

9 habitaciones dobles, cada una con su baño privado con ducha — ¡nadie tiene que compartir el baño, ni siquiera en un grupo grande!

Ropa de cama de calidad, almacenamiento y verdadera intimidad en cada habitación. Cada suite dispone de cama doble con almacenamiento, escritorio con toma Ethernet, baño privado, smart TV, vestidor y llave individual.

La casa se distribuye en 3 plantas con un gran salón, una cocina-comedor totalmente equipada, un jardín cerrado de 90 m² y un gimnasio completo con espacio zen.

Ideal para grupos mixtos, compañeros de trabajo, amigos o familias reconstituidas. Este concepto permite que cada uno viva a su ritmo, disfrutando al mismo tiempo del placer de estar juntos.

Perfecto para eventos, escuderías, estancias de empresa y viajes de grupo durante las 24 Horas de Le Mans y los grandes eventos del circuito. Fácil acceso al Circuito Bugatti mediante el Tranvía T1 desde la estación TGV.

Hasta 18 personas.`,
  },
  sleeping: {
    title: "Dónde dormirás",
    room: "Habitación",
    doubleBed: "1 cama doble",
    features: "Baño privado · Smart TV · Escritorio · Vestidor · Llave individual",
    prevPhoto: "Foto anterior",
    nextPhoto: "Foto siguiente",
  },
  commonSpaces: {
    title: "Espacio Deportivo",
    subtitle: "Espacio privado en un anexo de la casa, de libre acceso 24/7 — sin riesgo de despertar a nadie.",
    gym: "Gimnasio",
    gymDesc: "Equipamiento fitness disponible: bicicleta elíptica, cinta de correr, mancuernas y banco de musculación.",
    zen: "Sala zen",
    zenDesc: "Un espacio relax para desconectar: yoga, meditación y relajación.",
  },
  garden: {
    title: "Jardín",
    subtitle: "Jardín privado de 90 m², totalmente cerrado y seguro, orientado al sur. 25 m² de plantas y zona con grava con mobiliario de jardín para 8 personas — ideal para aperitivos entre amigos.",
    features: [
      "Seguro y totalmente cerrado",
      "90 m² en total: 25 m² de plantas + zona con grava",
      "Orientación sur todo el día",
      "Mobiliario de jardín para 8 personas, perfecto para los aperitivos",
    ],
  },
  amenities: {
    title: "Qué ofrece este alojamiento",
    showAll: (count) => `Mostrar los ${count} servicios`,
    showLess: "Mostrar menos",
    labels: [
      "Sábanas y toallas incluidas",
      "Limpieza incluida",
      "Wi-Fi de alta velocidad",
      "Smart TV en cada habitación",
      "Espacio de trabajo dedicado en cada habitación",
      "Cafetera de grano",
      "Cocina totalmente equipada",
      "Lavadora",
      "Secadora",
      "Gimnasio privado",
      "Jardín cerrado 90 m²",
      "Cerradura en cada habitación",
      "Entrada privada",
      "Calefacción",
      "Lavavajillas",
      "Microondas",
      "Horno",
      "Frigorífico / Congelador",
      "Detector de humo",
      "Extintor",
    ],
  },
  calendar: {
    title: "Disponibilidad",
    subtitle: "Selecciona tus fechas para reservar la casa entera.",
    loading: "Cargando disponibilidad...",
    nights: (n) => `${n} noche${n > 1 ? "s" : ""}`,
    adults: "Adultos",
    teens: "Adolescentes (10-17 años)",
    teensNote: "Alojamiento no apto para niños pequeños.",
    clear: "Borrar",
    bookNow: "Reservar ahora",
    selectCheckIn: "Selecciona la fecha de llegada",
    checkInLabel: "Llegada",
    minStayNote: (n) => `(mín. ${n} noches)`,
    selectCheckOut: "Selecciona la fecha de salida",
    summary: (nights, checkIn, checkOut, adults, children) =>
      `${nights} noche${nights > 1 ? "s" : ""} — del ${checkIn} al ${checkOut} · ${adults} adulto${adults > 1 ? "s" : ""}${children > 0 ? `, ${children} niño${children > 1 ? "s" : ""}` : ""}`,
    monthNames: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    dayNames: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  },
  location: {
    title: "Dónde se encuentra el alojamiento",
    address: "42 Rue Henri Barbusse, 72100 Le Mans — Zona residencial tranquila",
    circuitTitle: "Cerca del Circuito Bugatti",
    circuitDesc: "Situada a solo 4,7 km del legendario Circuito Bugatti, nuestra casa es la base ideal para las 24 Horas de Le Mans, MotoGP, Le Mans Classic y todos los eventos del circuito. Acceso directo mediante Tranvía T1 desde la estación TGV.",
    nearby: [
      { name: "Estación TGV de Le Mans", distance: "10 min a pie", detail: "París en 54 min, conexiones a Rennes, Nantes, Angers" },
      { name: "Circuito Bugatti", distance: "4,7 km", detail: "24 Horas de Le Mans, MotoGP, Le Mans Classic. Accesible mediante Tranvía T1" },
      { name: "Zonas empresariales Sur de Le Mans", distance: "< 10 min en coche", detail: "Technopole Université, zona Sur, centros de investigación" },
      { name: "Parc Gué de Maulny", distance: "5 min a pie", detail: "Espacio verde de 10 hectáreas para relajarse" },
      { name: "Tranvía T1", distance: "En las inmediaciones", detail: "Conecta el centro de la ciudad, la estación y el circuito" },
      { name: "Cité Plantagenêt (Le Mans antiguo)", distance: "15 min en tranvía", detail: "Barrio medieval histórico, restaurantes, patrimonio" },
    ],
  },
  host: {
    title: "Tu anfitrión: Alexandre",
    superhost: "Superhost",
    experience: "años de experiencia",
    about: "Sobre Alexandre",
    aboutText: "Ingeniero, geek, deportista y manitas, soy Superhost desde hace varios años.\nMe importa ofrecer alojamientos limpios, cómodos y perfectamente funcionales.\nEsta casa de Le Mans está pensada para acoger familias, grupos de amigos o equipos profesionales, garantizando la intimidad de cada uno gracias a suites con baño privado.\nMe mantengo disponible y reactivo, dejándote al mismo tiempo gran autonomía.",
    languages: "Idiomas",
    languagesValue: "Francés, English",
    responseRate: "Tasa de respuesta",
    responseRateValue: "Respuesta rápida — generalmente en menos de una hora",
    whatsapp: "WhatsApp",
    airbnbMessage: "Mensaje Airbnb",
  },
  reviews: {
    title: "Reseñas de los viajeros",
    subtitle: "Lo que dicen nuestros huéspedes en Airbnb y Abritel",
    hostReplyLabel: "Respuesta de Alexandre",
    autoTranslated: "Traducido automáticamente",
    showOriginal: "Ver el original",
    hideOriginal: "Ocultar el original",
  },
  rules: {
    title: "Información útil",
    sections: [
      {
        title: "Normas internas",
        items: [
          "Llegada: 17:00 — 23:00",
          "Salida: antes de las 11:00",
          "18 huéspedes máximo",
          "No fumadores (en el interior)",
          "No se admiten animales",
          "Sin fiestas ni eventos ruidosos",
        ],
      },
      {
        title: "Seguridad y alojamiento",
        items: [
          "Detector de humo",
          "Extintor",
          "Cerradura en cada habitación",
          "Entrada privada con cerradura conectada",
          "Calefacción en todas las estancias",
        ],
      },
      {
        title: "Política de cancelación",
        items: [
          "Cancelación gratuita hasta 14 días antes de la llegada",
          "Depósito del 10 % al reservar",
          "Saldo íntegro antes del check-in",
          "Pago seguro con tarjeta (Visa, Mastercard)",
        ],
      },
    ],
  },
  footer: {
    navigation: "Navegación",
    contact: "Contacto",
    whatsapp: "WhatsApp",
    copyright: "Coliving Barbusse. Todos los derechos reservados.",
    paymentTitle: "Pago por transferencia",
    paymentText:
      "Pago por transferencia bancaria posible con factura. Contáctanos para una solicitud de reserva.",
  },
  gallery: {
    showPhotos: (count) => `Ver las ${count} fotos`,
    showAllPhotos: "Ver todas las fotos",
    previous: "Anterior",
    next: "Siguiente",
  },
};
