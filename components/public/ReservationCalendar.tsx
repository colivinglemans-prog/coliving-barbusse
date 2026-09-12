"use client";

import ReservationCalendar from "@sejour/socle/components/ReservationCalendar";
import { useTranslation } from "@/lib/i18n";

/**
 * Calendrier de réservation directe — l'enveloppe locale du composant du socle.
 *
 * Le calendrier lui-même (huit états de case, sélection arrivée/départ, séjour minimum,
 * refetch au retour d'onglet, modale Beds24) est monté dans
 * `@sejour/socle/components/ReservationCalendar` au Lot 5 : les deux sites en avaient chacun
 * leur copie, à 80 % identiques — celle d'Albiez portait en en-tête « porté de celui du
 * Mans ».
 *
 * Ne restent ici que l'identifiant Beds24 de la maison, la route de disponibilité avec ses
 * noms de paramètres, les libellés hors section commune, et la capacité.
 *
 * Trois corrections arrivent avec le socle, et elles sont réelles :
 *
 * - le `sandbox` de l'iframe de paiement autorise désormais la redirection **3-D Secure** de
 *   la banque (`allow-top-navigation-by-user-activation`), là où il n'y avait qu'un
 *   `allow="payment"` ;
 * - les compteurs sont plafonnés à la capacité : on pouvait composer 20 adultes **et** 17
 *   ados, soit 37 voyageurs, et n'apprendre le refus qu'une fois sur la page de paiement ;
 * - la mise à jour du cache de disponibilité est fonctionnelle, là où un `{...availCache}`
 *   capturé dans la closure faisait perdre la première de deux réponses qui se croisent.
 */
export default function ReservationCalendarLocal() {
  const { t, locale } = useTranslation();

  return (
    <ReservationCalendar
      propertyId={303771}
      lang={locale}
      // `mode=map` borne des jours inclus, des deux côtés.
      availabilityUrl={(from, to) => `/api/availability?mode=map&from=${from}&to=${to}`}
      labels={t.calendar}
      a11y={{
        previousMonth: t.calendar.previousMonth,
        nextMonth: t.calendar.nextMonth,
        close: t.calendar.close,
      }}
      guests={{
        // La maison compte 9 suites et accueille 20 personnes ; le compteur des ados s'arrête
        // plus bas, un groupe de mineurs sans adultes n'étant pas accepté.
        maxTotal: 20,
        maxChildren: 17,
        childrenLabel: t.calendar.teens,
        note: t.calendar.teensNote,
      }}
      heading={{ title: t.calendar.title, subtitle: t.calendar.subtitle }}
      idlePrompt={t.calendar.selectCheckIn}
      className="mx-auto max-w-6xl border-b border-border px-6 py-8"
    />
  );
}
