import type { PriceGridLabels } from "@sejour/socle/components/PriceGrid";
import type { GridColumn } from "@sejour/socle/lib/price-grid";
import type { Locale } from "@/lib/i18n";

/**
 * Les textes de la page « Tarifs », dans les cinq langues. Séparés de la page pour que le test
 * des longueurs (titre ≤ 65, description 120–155 : règle Bing) les lise sans rendre la page.
 *
 * Formulation : « tout compris (ménage, draps et serviettes, taxe de séjour) » — c'est vrai ici,
 * le linge est facturé avec le séjour — et jamais de pourcentage de remise : « tarif direct, moins
 * cher que sur les plateformes ». Les colonnes disent « adultes » : la taxe de séjour ne porte que
 * sur les majeurs.
 */
export interface PricesContent {
  title: string;
  metaTitle: string;
  metaDescription: string;
  /** Phrase de tête ; `from` est le plus petit prix affiché pour 10 adultes, ou `null`. */
  lead: (from: string | null) => string;
  house: string;
  /** Les séjours en semaine du lundi au vendredi, présents dans le tableau. */
  weekdays: string;
  exact: string;
  otherDates: string;
  calendarLink: string;
  noPrices: string;
  /** Intitulés des fêtes (`ENGINE_CONFIG.fixedPeriods`), par libellé du moteur de prix. */
  holidays: Record<string, string>;
  grid: PriceGridLabels;
}

const adults = (c: GridColumn) => c.parties[0].adults;

export function pricesContent(locale: Locale): PricesContent {
  switch (locale) {
    case "en":
      return {
        title: "Prices and availability",
        metaTitle: "Prices and availability — whole house in Le Mans, 20 guests",
        metaDescription:
          "Exact prices of the coming weekends, Monday–Friday weeks and holidays for our 9-suite house in Le Mans: all included, direct rate, station on foot.",
        lead: (from) =>
          from
            ? `2-night weekend from ${from} all included for 10 adults (cleaning, bed linen and towels, tourist tax). Direct rate, cheaper than on the platforms.`
            : "Exact price of each stay, all included (cleaning, bed linen and towels, tourist tax). Direct rate, cheaper than on the platforms.",
        house: "9 bedrooms with a double bed, each with its own shower room, 2 of them with a single sofa bed; TGV station 15 minutes' walk.",
        weekdays: "The table also lists weekday stays, Monday to Friday (4 nights).",
        exact: "The price is recalculated on the payment page at the time of booking: it is the one that applies.",
        otherDates: "Another group size or other dates:",
        calendarLink: "see the exact price in the calendar",
        noPrices: "Prices cannot be displayed right now. Choose your dates in the calendar to see the exact price.",
        holidays: { Noël: "Christmas", "Nouvel An": "New Year" },
        grid: {
          caption: "Exact price per stay, all included, by number of adults",
          stay: "Stay",
          nights: (n) => `${n} nights`,
          column: (c) => `${adults(c)} adults`,
          taken: "Booked",
          onRequest: "Price on the payment page",
          book: "Book these dates",
          updatedAt: (d) => `Table updated on ${d}.`,
        },
      };
    case "de":
      return {
        title: "Preise und Verfügbarkeit",
        metaTitle: "Preise und Verfügbarkeit — ganzes Haus in Le Mans, 20 Personen",
        metaDescription:
          "Genaue Preise für Wochenenden, Wochen (Mo.–Fr.) und Feiertage in unserem Haus mit 9 Suiten in Le Mans: alles inklusive, Direktpreis, Bahnhof zu Fuß.",
        lead: (from) =>
          from
            ? `Wochenende mit 2 Nächten ab ${from} alles inklusive für 10 Erwachsene (Reinigung, Bettwäsche und Handtücher, Kurtaxe). Direktpreis, günstiger als auf den Plattformen.`
            : "Genauer Preis jedes Aufenthalts, alles inklusive (Reinigung, Bettwäsche und Handtücher, Kurtaxe). Direktpreis, günstiger als auf den Plattformen.",
        house: "9 Schlafzimmer mit Doppelbett und eigenem Duschbad, 2 davon mit Einzelschlafsofa; TGV-Bahnhof 15 Minuten zu Fuß.",
        weekdays: "Die Tabelle enthält auch Aufenthalte unter der Woche, von Montag bis Freitag (4 Nächte).",
        exact: "Der Preis wird bei der Buchung auf der Zahlungsseite neu berechnet: Dieser Preis gilt.",
        otherDates: "Andere Gruppengröße oder andere Daten:",
        calendarLink: "genauer Preis im Kalender",
        noPrices: "Die Preise können gerade nicht angezeigt werden. Wählen Sie Ihre Daten im Kalender, um den genauen Preis zu sehen.",
        holidays: { Noël: "Weihnachten", "Nouvel An": "Neujahr" },
        grid: {
          caption: "Genauer Preis pro Aufenthalt, alles inklusive, nach Zahl der Erwachsenen",
          stay: "Aufenthalt",
          nights: (n) => `${n} Nächte`,
          column: (c) => `${adults(c)} Erwachsene`,
          taken: "Belegt",
          onRequest: "Preis auf der Zahlungsseite",
          book: "Diese Daten buchen",
          updatedAt: (d) => `Tabelle aktualisiert am ${d}.`,
        },
      };
    case "es":
      return {
        title: "Precios y disponibilidad",
        metaTitle: "Precios y disponibilidad — casa entera en Le Mans, 20 personas",
        metaDescription:
          "Precios exactos de fines de semana, semanas (lun.–vie.) y fiestas en nuestra casa de 9 suites en Le Mans: todo incluido, tarifa directa, estación a pie.",
        lead: (from) =>
          from
            ? `Fin de semana de 2 noches desde ${from} todo incluido para 10 adultos (limpieza, ropa de cama y toallas, tasa turística). Tarifa directa, más barata que en las plataformas.`
            : "Precio exacto de cada estancia, todo incluido (limpieza, ropa de cama y toallas, tasa turística). Tarifa directa, más barata que en las plataformas.",
        house: "9 dormitorios con cama doble y baño con ducha propio, 2 de ellos con sofá cama individual; estación TGV a 15 minutos a pie.",
        weekdays: "La tabla incluye también estancias entre semana, de lunes a viernes (4 noches).",
        exact: "El precio se recalcula en la página de pago al reservar: es el que se aplica.",
        otherDates: "Otro número de personas u otras fechas:",
        calendarLink: "precio exacto en el calendario",
        noPrices: "Los precios no se pueden mostrar en este momento. Elija sus fechas en el calendario para ver el precio exacto.",
        holidays: { Noël: "Navidad", "Nouvel An": "Año Nuevo" },
        grid: {
          caption: "Precio exacto por estancia, todo incluido, según el número de adultos",
          stay: "Estancia",
          nights: (n) => `${n} noches`,
          column: (c) => `${adults(c)} adultos`,
          taken: "Reservado",
          onRequest: "Precio en la página de pago",
          book: "Reservar estas fechas",
          updatedAt: (d) => `Tabla actualizada el ${d}.`,
        },
      };
    case "it":
      return {
        title: "Prezzi e disponibilità",
        metaTitle: "Prezzi e disponibilità — casa intera a Le Mans, 20 persone",
        metaDescription:
          "Prezzi esatti di weekend, settimane (lun.–ven.) e feste nella nostra casa con 9 suite a Le Mans: tutto incluso, tariffa diretta, stazione a piedi.",
        lead: (from) =>
          from
            ? `Weekend di 2 notti da ${from} tutto incluso per 10 adulti (pulizia, biancheria e asciugamani, tassa di soggiorno). Tariffa diretta, più conveniente che sulle piattaforme.`
            : "Prezzo esatto di ogni soggiorno, tutto incluso (pulizia, biancheria e asciugamani, tassa di soggiorno). Tariffa diretta, più conveniente che sulle piattaforme.",
        house: "9 camere con letto matrimoniale e bagno con doccia privato, 2 delle quali con divano letto singolo; stazione TGV a 15 minuti a piedi.",
        weekdays: "La tabella comprende anche i soggiorni in settimana, dal lunedì al venerdì (4 notti).",
        exact: "Il prezzo viene ricalcolato nella pagina di pagamento al momento della prenotazione: è quello che si applica.",
        otherDates: "Altro numero di persone o altre date:",
        calendarLink: "prezzo esatto nel calendario",
        noPrices: "Al momento i prezzi non possono essere mostrati. Scegli le date nel calendario per vedere il prezzo esatto.",
        holidays: { Noël: "Natale", "Nouvel An": "Capodanno" },
        grid: {
          caption: "Prezzo esatto per soggiorno, tutto incluso, secondo il numero di adulti",
          stay: "Soggiorno",
          nights: (n) => `${n} notti`,
          column: (c) => `${adults(c)} adulti`,
          taken: "Prenotato",
          onRequest: "Prezzo nella pagina di pagamento",
          book: "Prenota queste date",
          updatedAt: (d) => `Tabella aggiornata il ${d}.`,
        },
      };
    default:
      return {
        title: "Tarifs et disponibilités",
        metaTitle: "Tarifs et disponibilités — maison entière au Mans, 20 pers.",
        metaDescription:
          "Prix exacts des week-ends, semaines (lun.-ven.) et fêtes pour notre maison de 9 suites au Mans : tout compris, tarif direct, gare TGV à 15 min à pied.",
        lead: (from) =>
          from
            ? `Week-end de 2 nuits à partir de ${from} tout compris pour 10 adultes (ménage, draps et serviettes, taxe de séjour). Tarif direct, moins cher que sur les plateformes.`
            : "Prix exact de chaque séjour, tout compris (ménage, draps et serviettes, taxe de séjour). Tarif direct, moins cher que sur les plateformes.",
        house: "9 chambres à lit double, chacune avec sa salle de douche, dont 2 avec un clic-clac une place ; gare TGV à 15 minutes à pied.",
        weekdays: "Le tableau donne aussi les séjours en semaine, du lundi au vendredi (4 nuits).",
        exact: "Le prix est recalculé sur la page de paiement au moment de la réservation : c'est lui qui s'applique.",
        otherDates: "Autre effectif ou autres dates :",
        calendarLink: "prix exact dans le calendrier",
        noPrices: "Les prix ne peuvent pas être affichés pour le moment. Choisissez vos dates dans le calendrier pour voir le prix exact.",
        holidays: { Noël: "Noël", "Nouvel An": "Nouvel An" },
        grid: {
          caption: "Prix exact par séjour, tout compris, selon le nombre d'adultes",
          stay: "Séjour",
          nights: (n) => `${n} nuits`,
          column: (c) => `${adults(c)} adultes`,
          taken: "Réservé",
          onRequest: "Prix sur la page de paiement",
          book: "Réserver ces dates",
          updatedAt: (d) => `Tableau mis à jour le ${d}.`,
        },
      };
  }
}
