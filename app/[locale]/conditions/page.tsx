import type { Metadata } from "next";
import { cancellationText } from "@sejour/socle/lib/quote-labels";
import { isLocale, type Locale } from "@/lib/i18n";
import { CANCELLATION_POLICY, PAYMENT_POLICY, PROPERTY_INFO } from "@/lib/property-info";
import { alternatesFor, conditionsPath, pageOpenGraph, pageTwitter } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

/**
 * Conditions de réservation : la page que citent `llms.txt`, la page de devis et le profil
 * Stripe (« politiques de la boutique »). Les nombres viennent de `lib/property-info.ts` — les
 * constantes que contrôle la surveillance (`llms.policies`) et que sert l'API des IA —, les
 * phrases sont ici, dans les cinq langues.
 */
interface Content {
  title: string;
  intro: string;
  /** Meta description, quand l'intro sort des 120-155 caractères recommandés par Bing. */
  metaDesc?: string;
  sections: { title: string; items: string[] }[];
}

const upfront = PAYMENT_POLICY.direct.upfrontPct;
const deposit = PAYMENT_POLICY.business?.depositPct ?? 30;
const max = PROPERTY_INFO.maxGuests;
const rooms = PROPERTY_INFO.bedrooms;
const email = PROPERTY_INFO.contact.email;

function content(locale: Locale): Content {
  const cancel = cancellationText(CANCELLATION_POLICY, locale);
  const checkIn = PROPERTY_INFO.checkIn[locale] ?? PROPERTY_INFO.checkIn.fr;
  const checkOut = PROPERTY_INFO.checkOut[locale] ?? PROPERTY_INFO.checkOut.fr;
  switch (locale) {
    case "en":
      return {
        title: "Booking conditions",
        intro: "These conditions apply to direct bookings made on this website. The cancellation policy is the same as on Airbnb.",
        metaDesc: "These conditions apply to direct bookings of the whole house in Le Mans made on this website. The cancellation policy is the same as on Airbnb.",
        sections: [
          { title: "Payment", items: [
            `Online booking: ${upfront}% paid at booking, by card, on the secure Beds24 payment page. Tourist tax included.`,
            `Companies (on invoice): ${deposit}% deposit at booking, balance before arrival, by bank transfer or card.`,
            "Booking is instant: dates are confirmed as soon as the payment is made. A quote does not hold the dates.",
          ] },
          { title: "Cancellation", items: [cancel, "Bookings made on Airbnb, Booking.com or Abritel follow the conditions shown on that platform."] },
          { title: "Arrival and departure", items: [`Self check-in with a smart lock, ${checkIn}, at any hour.`, `Departure ${checkOut}.`, "Minimum stay: 2 nights, 3 nights over the Christmas and New Year holidays."] },
          { title: "Included", items: ["Bed linen and towels, end-of-stay cleaning and tourist tax are included in the price.", "Cleaning during the stay and change of sheets on request, at extra cost."] },
          { title: "Capacity and house rules", items: [
            `Entire house, ${rooms} bedrooms each with a private shower room, ${max} guests maximum.`,
            "Designed for teenagers and adults: nothing is set up for young children (unprotected stairs, high stools, gym). Children under 10 are welcome under their parents' responsibility.",
            "No pets. No smoking indoors. No parties or noisy events (family meals are welcome).",
            "Free street parking, no reserved space.",
          ] },
          { title: "Personal data", items: [
            `The data needed for the booking (name, contact details, dates, payment) is used only to manage the booking and the stay. It is processed by Beds24 (booking software) and its payment provider; the first name is passed to the smart-lock provider (Nuki) to create the door code; the site and its management tools are hosted by Vercel and Upstash. Nothing is sold or used for advertising.`,
            `To access, correct or delete your data: ${email}.`,
          ] },
        ],
      };
    case "de":
      return {
        title: "Buchungsbedingungen",
        intro: "Diese Bedingungen gelten für Direktbuchungen auf dieser Website. Die Stornierungsbedingungen sind dieselben wie bei Airbnb.",
        sections: [
          { title: "Zahlung", items: [
            `Online-Buchung: ${upfront} % bei der Buchung, per Karte, auf der sicheren Zahlungsseite von Beds24. Kurtaxe inklusive.`,
            `Unternehmen (auf Rechnung): ${deposit} % Anzahlung bei der Buchung, Restzahlung vor der Anreise, per Überweisung oder Karte.`,
            "Die Buchung ist sofort verbindlich: Die Daten sind mit der Zahlung bestätigt. Ein Angebot reserviert keine Daten.",
          ] },
          { title: "Stornierung", items: [cancel, "Buchungen über Airbnb, Booking.com oder Abritel folgen den Bedingungen der jeweiligen Plattform."] },
          { title: "Anreise und Abreise", items: [`Selbstständige Anreise mit Smart Lock, ${checkIn}, zu jeder Uhrzeit.`, `Abreise ${checkOut}.`, "Mindestaufenthalt: 2 Nächte, über Weihnachten und Neujahr 3 Nächte."] },
          { title: "Inklusive", items: ["Bettwäsche und Handtücher, Endreinigung und Kurtaxe sind im Preis enthalten.", "Reinigung während des Aufenthalts und Bettwäschewechsel auf Anfrage, gegen Aufpreis."] },
          { title: "Kapazität und Hausregeln", items: [
            `Ganzes Haus, ${rooms} Zimmer mit eigenem Duschbad, maximal ${max} Gäste.`,
            "Für Jugendliche und Erwachsene gedacht: Nichts ist für kleine Kinder eingerichtet (ungesicherte Treppen, Barhocker, Fitnessraum). Kinder unter 10 Jahren sind unter der Verantwortung ihrer Eltern willkommen.",
            "Keine Haustiere. Rauchen im Haus verboten. Keine Partys oder lauten Veranstaltungen (Familienessen sind willkommen).",
            "Kostenloses Parken auf der Straße, kein reservierter Stellplatz.",
          ] },
          { title: "Personenbezogene Daten", items: [
            `Die für die Buchung nötigen Daten (Name, Kontaktdaten, Daten, Zahlung) dienen nur der Verwaltung der Buchung und des Aufenthalts. Sie werden von Beds24 (Buchungssoftware) und deren Zahlungsdienstleister verarbeitet; der Vorname wird an den Anbieter des smarten Schlosses (Nuki) übermittelt, um den Türcode zu erstellen; Website und Verwaltungswerkzeuge werden bei Vercel und Upstash gehostet. Nichts wird verkauft oder für Werbung genutzt.`,
            `Auskunft, Berichtigung oder Löschung: ${email}.`,
          ] },
        ],
      };
    case "es":
      return {
        title: "Condiciones de reserva",
        intro: "Estas condiciones se aplican a las reservas directas en este sitio. La política de cancelación es la misma que en Airbnb.",
        sections: [
          { title: "Pago", items: [
            `Reserva en línea: ${upfront} % al reservar, con tarjeta, en la página de pago segura de Beds24. Tasa turística incluida.`,
            `Empresas (con factura): depósito del ${deposit} % al reservar, saldo antes de la llegada, por transferencia o con tarjeta.`,
            "La reserva es inmediata: las fechas se confirman con el pago. Un presupuesto no bloquea las fechas.",
          ] },
          { title: "Cancelación", items: [cancel, "Las reservas hechas en Airbnb, Booking.com o Abritel siguen las condiciones de esa plataforma."] },
          { title: "Llegada y salida", items: [`Llegada autónoma con cerradura conectada, ${checkIn}, a cualquier hora.`, `Salida ${checkOut}.`, "Estancia mínima: 2 noches, 3 noches durante las fiestas de Navidad y Año Nuevo."] },
          { title: "Incluido", items: ["Ropa de cama y toallas, limpieza final y tasa turística incluidas en el precio.", "Limpieza durante la estancia y cambio de sábanas bajo petición, con suplemento."] },
          { title: "Capacidad y normas", items: [
            `Casa entera, ${rooms} habitaciones con baño privado, ${max} personas como máximo.`,
            "Pensada para adolescentes y adultos: nada está adaptado a niños pequeños (escaleras sin protección, taburetes altos, gimnasio). Los menores de 10 años son bienvenidos bajo la responsabilidad de sus padres.",
            "No se admiten mascotas. Prohibido fumar en el interior. Sin fiestas ni eventos ruidosos (las comidas familiares son bienvenidas).",
            "Aparcamiento gratuito en la calle, sin plaza reservada.",
          ] },
          { title: "Datos personales", items: [
            `Los datos necesarios para la reserva (nombre, contacto, fechas, pago) solo se usan para gestionar la reserva y la estancia. Los tratan Beds24 (software de reservas) y su proveedor de pago; el nombre de pila se transmite al proveedor de la cerradura inteligente (Nuki) para crear el código de la puerta; el sitio y sus herramientas de gestión están alojados en Vercel y Upstash. Nada se vende ni se usa con fines publicitarios.`,
            `Para consultar, corregir o borrar sus datos: ${email}.`,
          ] },
        ],
      };
    case "it":
      return {
        title: "Condizioni di prenotazione",
        intro: "Queste condizioni valgono per le prenotazioni dirette su questo sito. La politica di cancellazione è la stessa di Airbnb.",
        sections: [
          { title: "Pagamento", items: [
            `Prenotazione online: ${upfront}% alla prenotazione, con carta, sulla pagina di pagamento sicura di Beds24. Tassa di soggiorno inclusa.`,
            `Aziende (con fattura): acconto del ${deposit}% alla prenotazione, saldo prima dell'arrivo, con bonifico o carta.`,
            "La prenotazione è immediata: le date sono confermate al pagamento. Un preventivo non blocca le date.",
          ] },
          { title: "Cancellazione", items: [cancel, "Le prenotazioni su Airbnb, Booking.com o Abritel seguono le condizioni di quella piattaforma."] },
          { title: "Arrivo e partenza", items: [`Arrivo in autonomia con serratura connessa, ${checkIn}, a qualsiasi ora.`, `Partenza ${checkOut}.`, "Soggiorno minimo: 2 notti, 3 notti durante le feste di Natale e Capodanno."] },
          { title: "Incluso", items: ["Biancheria da letto e asciugamani, pulizia finale e tassa di soggiorno inclusi nel prezzo.", "Pulizia durante il soggiorno e cambio lenzuola su richiesta, a pagamento."] },
          { title: "Capienza e regole", items: [
            `Casa intera, ${rooms} camere con bagno privato, massimo ${max} ospiti.`,
            "Pensata per ragazzi e adulti: nulla è attrezzato per i bambini piccoli (scale non protette, sgabelli alti, palestra). I bambini sotto i 10 anni sono accettati sotto la responsabilità dei genitori.",
            "Animali non ammessi. Vietato fumare all'interno. Niente feste o eventi rumorosi (i pasti in famiglia sono benvenuti).",
            "Parcheggio gratuito in strada, senza posto riservato.",
          ] },
          { title: "Dati personali", items: [
            `I dati necessari alla prenotazione (nome, recapiti, date, pagamento) servono solo a gestire la prenotazione e il soggiorno. Sono trattati da Beds24 (software di prenotazione) e dal suo fornitore di pagamento; il nome viene trasmesso al fornitore della serratura connessa (Nuki) per creare il codice della porta; il sito e i suoi strumenti di gestione sono ospitati da Vercel e Upstash. Nulla viene venduto né usato per pubblicità.`,
            `Per consultare, correggere o cancellare i dati: ${email}.`,
          ] },
        ],
      };
    default:
      return {
        title: "Conditions de réservation",
        intro: "Ces conditions s'appliquent aux réservations directes faites sur ce site. La politique d'annulation est la même que sur Airbnb.",
        sections: [
          { title: "Paiement", items: [
            `Réservation en ligne : ${upfront} % à la réservation, par carte, sur la page de paiement sécurisée Beds24. Taxe de séjour comprise.`,
            `Entreprises (sur facture) : acompte de ${deposit} % à la réservation, solde avant l'arrivée, par virement ou carte.`,
            "La réservation est instantanée : les dates sont confirmées dès le paiement. Un devis ne bloque pas les dates.",
          ] },
          { title: "Annulation", items: [cancel, "Une réservation faite sur Airbnb, Booking.com ou Abritel suit les conditions affichées sur cette plateforme."] },
          { title: "Arrivée et départ", items: [`Arrivée autonome par serrure connectée, ${checkIn}, à toute heure.`, `Départ ${checkOut}.`, "Séjour minimum : 2 nuits, 3 nuits pendant les fêtes de fin d'année."] },
          { title: "Compris", items: ["Draps et serviettes, ménage de fin de séjour et taxe de séjour sont compris dans le prix.", "Ménage en cours de séjour et changement des draps sur demande, en supplément."] },
          { title: "Capacité et règles", items: [
            `Maison entière, ${rooms} chambres avec chacune sa salle de douche, ${max} personnes au maximum.`,
            "Maison pensée pour les ados et les adultes : rien n'est aménagé pour les jeunes enfants (escaliers non protégés, tabourets hauts, salle de sport). Les moins de 10 ans sont acceptés sous la responsabilité de leurs parents.",
            "Animaux non autorisés. Non-fumeur à l'intérieur. Pas de fête ni d'événement bruyant (les repas de famille sont bienvenus).",
            "Stationnement gratuit dans la rue, sans place réservée.",
          ] },
          { title: "Données personnelles", items: [
            `Les données nécessaires à la réservation (nom, coordonnées, dates, paiement) servent uniquement à gérer la réservation et le séjour. Elles sont traitées par Beds24 (logiciel de réservation) et son prestataire de paiement ; le prénom est transmis au fournisseur de la serrure connectée (Nuki) pour créer le code de la porte ; le site et ses outils de gestion sont hébergés par Vercel et Upstash. Rien n'est vendu ni utilisé à des fins publicitaires.`,
            `Pour consulter, corriger ou supprimer vos données : ${email}.`,
          ] },
        ],
      };
  }
}

const asLocale = (raw: string): Locale => (isLocale(raw) ? raw : "fr");

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = asLocale(raw);
  const c = content(locale);
  const title = `${c.title} — Coliving Barbusse`;
  const description = c.metaDesc ?? c.intro;
  return {
    title,
    description,
    alternates: alternatesFor(locale, conditionsPath),
    openGraph: pageOpenGraph(locale, { title, description, url: `${SITE_URL}${conditionsPath(locale)}` }),
    twitter: pageTwitter({ title, description }),
  };
}

export default async function ConditionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const c = content(asLocale(raw));
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-foreground">{c.title}</h1>
      <p className="mt-2 mb-10 text-sm text-secondary">{c.intro}</p>
      {c.sections.map((s) => (
        <section key={s.title} className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-foreground">{s.title}</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-secondary">
            {s.items.filter(Boolean).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
