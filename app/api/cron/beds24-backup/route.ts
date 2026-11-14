import { gzipSync } from "node:zlib";
import { NextRequest, NextResponse } from "next/server";
import { del, list, put } from "@vercel/blob";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { sendNtfy } from "@/lib/ntfy";
import { todayParis } from "@sejour/socle/lib/time";
import { getAllBookingsRaw } from "@/lib/beds24";

/**
 * Sauvegarde hebdomadaire de tout le compte Beds24 vers Vercel Blob, **stockage privé**.
 *
 * Beds24 est la seule source des réservations ; la dernière sauvegarde (manuelle, via
 * `scripts/beds24-backup.mjs`) datait du 2026-09-13. Ce sont des données personnelles
 * (voyageurs, coordonnées, lignes de facture) : cf. la violation RGPD de septembre 2026.
 * D'où trois règles :
 * - `access: "private"` — un blob privé ne se lit qu'avec le jeton du store ; le store doit
 *   lui-même être créé privé (contrôler, à sa création, qu'une lecture anonyme est refusée) ;
 * - rien du contenu ne sort dans la réponse HTTP, les logs ou la notification : des comptes ;
 * - rétention bornée à `KEEP` sauvegardes (minimisation) : les plus anciennes sont effacées.
 *
 * Garde-fou : une sauvegarde vide, ou tombée sous la moitié de la précédente (le nombre de
 * réservations est inscrit dans le nom du fichier), n'est pas écrite et n'efface rien — un
 * incident côté Beds24 ne doit pas, en plus, détruire les bonnes copies. Le compte est petit
 * (32 réservations vivantes au 2026-11-07, l'époque à la chambre étant archivée à part) :
 * un seuil absolu n'aurait pas de sens.
 *
 * `?dry=1` interroge Beds24 et le store, et rend les comptes sans rien écrire ni effacer.
 */
export const maxDuration = 60;

const PREFIX = "beds24-backup/";
/** 8 semaines. */
const KEEP = 8;
/** `beds24-backup/2026-11-08_32.json.gz` → 32. */
const NAME = /(d{4}-d{2}-d{2})_(d+).json.gz$/;

function previousCount(pathnames: string[]): number | null {
  const last = pathnames.filter((p) => NAME.test(p)).sort().at(-1);
  return last ? Number(last.match(NAME)![2]) : null;
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const dry = request.nextUrl.searchParams.get("dry") === "1";
  const today = todayParis();

  try {
    const bookings = await getAllBookingsRaw();
    const byProperty: Record<string, number> = {};
    for (const b of bookings) {
      const key = String(b.propertyId ?? "?");
      byProperty[key] = (byProperty[key] ?? 0) + 1;
    }
    const arrivals = bookings.map((b) => b.arrival).filter(Boolean).sort();
    const body = gzipSync(
      JSON.stringify({ takenAt: new Date().toISOString(), count: bookings.length, bookings }),
    );

    let existing: string[];
    try {
      existing = (await list({ prefix: PREFIX, limit: 1000 })).blobs.map((b) => b.pathname);
    } catch (e) {
      const why = e instanceof Error ? e.message : String(e);
      if (dry) {
        return NextResponse.json({ success: false, dry, count: bookings.length, byProperty, store: why });
      }
      throw new Error(`store Vercel Blob inaccessible (${why})`);
    }
    const previous = previousCount(existing);
    const floor = previous == null ? 1 : Math.ceil(previous / 2);
    if (dry) {
      return NextResponse.json({
        success: true,
        dry,
        count: bookings.length,
        previous,
        wouldWrite: bookings.length >= floor,
        byProperty,
        arrivals: { first: arrivals[0] ?? null, last: arrivals.at(-1) ?? null },
        gzipBytes: body.length,
        store: "ok",
        backups: existing.length,
      });
    }
    if (bookings.length < floor) {
      throw new Error(
        `${bookings.length} réservation(s) contre ${previous} à la sauvegarde précédente : ` +
          "non écrite, anciennes conservées",
      );
    }

    const pathname = `${PREFIX}${today}_${bookings.length}.json.gz`;
    await put(pathname, body, {
      access: "private",
      contentType: "application/gzip",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    // Rétention : les noms commencent par la date, l'ordre alphabétique est chronologique.
    const kept = [...new Set([...existing, pathname])].sort().reverse();
    const stale = kept.slice(KEEP);
    if (stale.length) await del(stale);

    await sendNtfy(
      `${bookings.length} réservations (${Object.entries(byProperty)
        .map(([p, n]) => `${p} : ${n}`)
        .join(", ")}), ${Math.round(body.length / 1024)} Ko. ` +
        `${Math.min(kept.length, KEEP)} sauvegarde(s) conservée(s)` +
        (stale.length ? `, ${stale.length} effacée(s).` : "."),
      { title: `Sauvegarde Beds24 du ${today}`, priority: 1, tags: ["floppy_disk"] },
    ).catch((e) => console.error("[beds24-backup] ntfy", e));

    return NextResponse.json({
      success: true,
      pathname,
      count: bookings.length,
      byProperty,
      gzipBytes: body.length,
      deleted: stale.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[beds24-backup]", message);
    await sendNtfy(`Échec : ${message}`, {
      title: `Sauvegarde Beds24 du ${today}`,
      priority: 4,
      tags: ["warning"],
    }).catch((e) => console.error("[beds24-backup] ntfy", e));
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
