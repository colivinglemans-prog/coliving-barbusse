import { NextRequest, NextResponse } from "next/server";
import { projectBookings } from "@sejour/socle/lib/booking-dto";
import { getBookings } from "@/lib/beds24";
import { auth, guard } from "@/lib/auth";

/**
 * Liste des réservations du calendrier — **projetée selon le rôle, jamais brute**.
 *
 * Cette route renvoyait l'objet Beds24 intégral, 73 champs, à qui portait un cookie valide :
 * `price`, `commission`, `deposit`, `email`, `mobile`, `phone`, `address`, `stripeToken`,
 * `invoiceItems` et `infoItems`. Le masquage était purement cosmétique — le navigateur
 * recevait tout et se contentait de ne pas le peindre. Un `viewer` connecté demandant une
 * fenêtre large récupérait au passage **37 codes de serrure `NUKI_PIN`** portés par l'archive
 * locale, ce qui contournait exactement la route dédiée `bookings/[id]/nuki-code`, admin-only
 * pour cette raison.
 *
 * La projection est une **liste blanche** (`@sejour/socle/lib/booking-dto`) et non une
 * suppression de champs : Beds24 en ajoutera, et un nouveau champ sensible doit être caché
 * par défaut plutôt que découvert après coup.
 *
 * Pas de bornage des dates : la liste blanche rend la fenêtre inoffensive, et l'administrateur
 * a besoin de fenêtres larges pour la page factures.
 */
export async function GET(request: NextRequest) {
  const refus = await guard.deny(request, ["admin", "viewer"]);
  if (refus) return refus;

  const isAdmin = (await guard.role(request)) === auth.adminRole;

  try {
    const { searchParams } = request.nextUrl;
    const bookings = await getBookings({
      arrivalFrom: searchParams.get("arrivalFrom") ?? undefined,
      arrivalTo: searchParams.get("arrivalTo") ?? undefined,
      departureFrom: searchParams.get("departureFrom") ?? undefined,
      departureTo: searchParams.get("departureTo") ?? undefined,
    });

    // Le filtrage des demandes et des options pour le rôle restreint se fait ici aussi : le
    // filtre du composant client devient une seconde ceinture au lieu du seul contrôle.
    return NextResponse.json(projectBookings(bookings, isAdmin));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[bookings] échec de lecture :", message);
    // Message générique au client : le détail porte le chemin interne et un extrait de la
    // réponse Beds24, qui n'ont rien à faire dans une réponse.
    return NextResponse.json({ error: "Réservations momentanément indisponibles" }, { status: 502 });
  }
}
