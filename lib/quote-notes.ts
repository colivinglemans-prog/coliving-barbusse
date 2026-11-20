/** Rappels affichés sous le prix, sur le devis signé (`/devis`) et la page Séjour (`/sejour`). */

/** Rappel du paiement sur le devis et la page Séjour (relevé par le test voyageur : le devis ne le disait pas). */
export const PAYMENT_NOTE: Record<string, string> = {
  fr: "Paiement : 100 % à la réservation, par carte, sur la page sécurisée Beds24.",
  en: "Payment: 100% at booking, by card, on the secure Beds24 page.",
  de: "Zahlung: 100 % bei der Buchung, per Karte, auf der sicheren Beds24-Seite.",
  es: "Pago: 100 % al reservar, con tarjeta, en la página segura de Beds24.",
  it: "Pagamento: 100% alla prenotazione, con carta, sulla pagina sicura di Beds24.",
};

/** L'accueil des jeunes enfants, rappelé sous le prix (décision de l'hôte du 2026-11-07). */
export const CHILDREN_NOTE: Record<string, string> = {
  fr: "Maison pensée pour les ados et les adultes : rien n'est aménagé pour les jeunes enfants (escaliers non protégés, tabourets hauts, salle de sport). Les moins de 10 ans sont acceptés sous la responsabilité de leurs parents.",
  en: "A house designed for teenagers and adults: nothing is set up for young children (unprotected stairs, high stools, gym). Children under 10 are welcome under their parents' responsibility.",
  de: "Ein Haus für Jugendliche und Erwachsene: Für kleine Kinder ist nichts eingerichtet (ungesicherte Treppen, hohe Hocker, Fitnessraum). Kinder unter 10 Jahren sind unter der Verantwortung ihrer Eltern willkommen.",
  es: "Una casa pensada para adolescentes y adultos: nada está preparado para niños pequeños (escaleras sin protección, taburetes altos, gimnasio). Los menores de 10 años son bienvenidos bajo la responsabilidad de sus padres.",
  it: "Una casa pensata per ragazzi e adulti: nulla è predisposto per i bambini piccoli (scale non protette, sgabelli alti, palestra). I bambini sotto i 10 anni sono accettati sotto la responsabilità dei genitori.",
};
