import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { formatEventWatch, watchEvents } from "@sejour/socle/lib/events-watch";
import { sendNtfy } from "@sejour/socle/lib/ntfy";
import { todayParis } from "@sejour/socle/lib/time";
import { EVENTS_WATCH, LE_MANS_EVENTS } from "@/lib/events";

/**
 * Rappelle d'aller vérifier les dates d'événements qui ne sont pas encore officielles, et
 * de remplir le calendrier de l'année suivante quand le circuit l'a publié. À appeler une
 * fois par semaine.
 *
 * Les règles et leurs limites sont dites dans `@sejour/socle/lib/events-watch` ; ici ne
 * vivent que les seuils du Mans — `EVENTS_WATCH`, à côté du catalogue — et l'envoi.
 *
 * Sans état, contrairement aux notifications de check-in : la même alerte revient chaque
 * semaine tant que `lib/events.ts` n'a pas été mis à jour, et s'éteint seule ensuite. Pas de
 * clé Redis « déjà notifié », pas de coupe-circuit — la façon d'arrêter une alerte est de
 * faire ce qu'elle demande.
 *
 * `NTFY_TOPIC` absent vaut un 500, pas un envoi ignoré : `sendNtfy` se contenterait d'un
 * `console.error` que personne ne lit, et une veille qui se tait ressemble exactement à une
 * veille qui n'a rien à dire. C'est la notification d'échec de cron-job.org qui prévient.
 *
 * `?dry=1` rend les alertes sans rien envoyer — pour lire ce que dirait la notification — et
 * accepte alors `&today=YYYY-MM-DD` pour la lire à une autre date : la veille se tait des
 * mois d'affilée, c'est le seul moyen de la voir parler avant l'heure. Hors `dry`, la date
 * est toujours celle du jour.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const dry = params.get("dry") === "1";
  const requested = params.get("today");
  const today =
    dry && requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : todayParis();
  const alerts = watchEvents(LE_MANS_EVENTS, today, EVENTS_WATCH);
  const message = formatEventWatch(alerts);

  if (alerts.length === 0 || dry) {
    return NextResponse.json({ success: true, today, alerts, message, sent: false });
  }

  if (!process.env.NTFY_TOPIC) {
    return NextResponse.json(
      { error: "NTFY_TOPIC is not set: the watch has something to say and cannot send it", alerts },
      { status: 500 },
    );
  }

  try {
    const window = alerts.find((a) => a.kind === "window");
    await sendNtfy(message, {
      title: "Veille événements — Coliving Barbusse",
      priority: 2,
      tags: ["calendar"],
      click: window?.window.url,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg, alerts }, { status: 500 });
  }

  return NextResponse.json({ success: true, today, alerts, message, sent: true });
}
