import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/auth";
import { relinkEvent, unlinkEvent } from "@/lib/event-links";
import { hasRedis } from "@/lib/redis";

/**
 * Délier (`POST`) ou rétablir (`DELETE`) le rattachement d'une réservation à un événement.
 *
 * **Admin uniquement**, comme les notes : le déliement change le repère des statistiques,
 * qui ne sont visibles que de lui. Le contrôle est ici et pas seulement dans l'interface —
 * un bouton masqué n'empêche personne d'appeler la route à la main.
 *
 * `eventKey` est exigée et jamais déduite du séjour : l'heuristique qui rattache peut rendre
 * un autre événement au prochain déploiement du catalogue, et un déliement écrit d'après un
 * calcul refait côté serveur ne viserait alors plus ce que la personne avait sous les yeux.
 *
 * `POST` et `DELETE` sont idempotents : `sadd` et `srem` ne se plaignent pas d'un couple déjà
 * dans l'état demandé, et un double clic n'a donc rien à signaler.
 */
async function handle(
  req: NextRequest,
  params: Promise<{ id: string }>,
  action: (bookingId: number, eventKey: string) => Promise<void>,
) {
  const refus = await guard.denyNonAdmin(req);
  if (refus) return refus;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Identifiant de réservation invalide" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as { eventKey?: string } | null;
  const eventKey = body?.eventKey?.trim();
  if (!eventKey) {
    return NextResponse.json({ error: "eventKey manquante" }, { status: 400 });
  }

  // Sans la base de clé-valeur, l'écriture partirait sur `undefined` et échouerait en réseau :
  // mieux vaut le dire. La lecture, elle, échoue ouvert — voir `lib/event-links.ts`.
  if (!hasRedis()) {
    return NextResponse.json(
      { error: "Stockage indisponible (KV_REST_API_URL / KV_REST_API_TOKEN)" },
      { status: 503 },
    );
  }

  try {
    await action(id, eventKey);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[event-link] écriture impossible :", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Enregistrement impossible" }, { status: 500 });
  }
}

export function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(req, params, unlinkEvent);
}

export function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(req, params, relinkEvent);
}
