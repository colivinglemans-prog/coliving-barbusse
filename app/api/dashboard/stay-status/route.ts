import { NextRequest, NextResponse } from "next/server";
import { addDays } from "@sejour/socle/lib/dates";
import { countsAsSold, isExcludedStatus } from "@sejour/socle/lib/booking-status";
import { todayParis } from "@sejour/socle/lib/time";
import { auth, guard } from "@/lib/auth";
import { getBookings } from "@/lib/beds24";
import { PROPERTY_ID } from "@/lib/beds24-property";
import { readStayHours } from "@/lib/stay-hours";
import { getJson, redisKey, setJson } from "@/lib/redis";
import { departureBadge, type DepartureBadge, type DepartureState } from "@/lib/departure-detection";
import { readDepartureStates } from "@/lib/departure-observation";

/** Fenêtre lue dans Beds24 : celle du calendrier (six mois en arrière), plus une marge. */
const PAST_DAYS = 200;

/**
 * Réservations de la maison (identifiant et statut seulement), gardées 5 min dans Redis : le
 * calendrier ne relance pas Beds24 à chaque ouverture (relecture Fable, 2026-11-20). Un horaire
 * saisi sur une réservation de moins de 5 min peut attendre ce délai pour s'afficher.
 */
const HOUSE_CACHE_KEY = () => redisKey("stay-status", "house");
const HOUSE_CACHE_TTL_SECONDS = 300;

async function houseStays(): Promise<Array<{ id: number; status?: string | null }>> {
  try {
    const cached = await getJson<Array<{ id: number; status?: string | null }>>(HOUSE_CACHE_KEY());
    if (Array.isArray(cached)) return cached;
  } catch {
    // Cache illisible : Beds24.
  }
  const bookings = await getBookings({ departureFrom: addDays(todayParis(), -PAST_DAYS) });
  const stays = bookings.filter((b) => b.propertyId === PROPERTY_ID).map((b) => ({ id: b.id, status: b.status ?? null }));
  await setJson(HOUSE_CACHE_KEY(), stays, HOUSE_CACHE_TTL_SECONDS).catch(() => {});
  return stays;
}

/**
 * État des séjours pour le calendrier : les **horaires convenus** (arrivée anticipée, départ
 * tardif), et depuis la phase B (2026-11-20) l'**état du départ** (`departures` : icône de la
 * barre et ligne de la fiche, `departureBadge`), estimé par l'observation
 * (`lib/departure-observation.ts`, `barbusse:departure:<id>`, 7 jours, lus par l'index
 * `barbusse:departure-index` sans SCAN). Du départ ne sort qu'une
 * icône et une phrase toute faite (heures, « porte verrouillée ») : jamais le texte d'un message,
 * ni un nom, ni le journal de la serrure.
 *
 * **Ouverte au rôle restreint** (`viewer`), contrairement à l'écriture
 * (`/api/dashboard/bookings/[id]/stay-hours`) : la personne du ménage doit lire « Départ tardif
 * convenu à 16 h ». Ce qui sort : l'identifiant de réservation et des heures, rien d'autre —
 * aucun nom, aucune date, aucun montant — et **seulement pour les réservations de la maison
 * (303771) non annulées ni bloquées** (cerbere, 2026-11-16) : une entrée restée dans Redis pour
 * une réservation annulée ou étrangère n'est pas servie. Le **viewer** ne reçoit en plus que les
 * séjours **vendus** (`countsAsSold` : ni demandes, ni options), comme `/api/dashboard/bookings`
 * qui les lui cache (cerbere B1, 2026-11-16) ; l'admin garde tout ce qui n'est pas exclu. Beds24 illisible ⇒ `{}` (rien plutôt
 * que trop) ; table vide et aucun état de départ ⇒ aucun appel à Beds24.
 */
export async function GET(request: NextRequest) {
  const refus = await guard.deny(request, ["admin", "viewer"]);
  if (refus) return refus;

  const isAdmin = (await guard.role(request)) === auth.adminRole;
  const visible = (status: string | undefined | null) => (isAdmin ? !isExcludedStatus(status) : countsAsSold(status));

  const [table, states] = await Promise.all([
    readStayHours(),
    readDepartureStates().catch((e): Record<number, DepartureState> => {
      console.error("[stay-status] états de départ illisibles :", e instanceof Error ? e.message : e);
      return {};
    }),
  ]);
  if (Object.keys(table).length === 0 && Object.keys(states).length === 0) return NextResponse.json({ hours: {}, departures: {} });

  let house: Set<number>;
  try {
    house = new Set((await houseStays()).filter((b) => visible(b.status)).map((b) => b.id));
  } catch (e) {
    console.error("[stay-status] réservations illisibles :", e instanceof Error ? e.message : e);
    return NextResponse.json({ hours: {}, departures: {} });
  }

  const hours: Record<string, { arrivalHour?: number; departureHour?: number }> = {};
  for (const [id, h] of Object.entries(table)) {
    if (!house.has(Number(id))) continue;
    // Projection explicite : jamais plus que ces deux champs, quoi que contienne la table.
    hours[id] = {
      ...(h.arrivalHour !== undefined ? { arrivalHour: h.arrivalHour } : {}),
      ...(h.departureHour !== undefined ? { departureHour: h.departureHour } : {}),
    };
  }

  const today = todayParis();
  const departures: Record<string, DepartureBadge> = {};
  for (const [id, state] of Object.entries(states)) {
    if (!house.has(Number(id))) continue;
    const badge = departureBadge(state, today, table[Number(id)]?.departureHour);
    // Projection explicite : l'icône et la ligne, rien d'autre de l'état.
    if (badge) departures[id] = { icon: badge.icon, line: badge.line };
  }
  return NextResponse.json({ hours, departures });
}
