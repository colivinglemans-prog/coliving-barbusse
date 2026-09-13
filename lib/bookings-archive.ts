import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createArchive, type ArchiveFilter } from "@sejour/socle/lib/archive";
import type { Beds24Booking } from "./types";

/**
 * Historique Beds24 archivé avant suppression de propriétés.
 *
 * La propriété « Coliving Henri Barbusse » (location à la chambre, propertyId 310268) a été
 * supprimée du compte Beds24 pour réduire le coût d'abonnement. Ses réservations n'existent
 * donc plus dans l'API. On les réinjecte ici (sauvegardées via `scripts/beds24-backup.mjs`)
 * pour qu'elles restent visibles dans les dashboards et le moteur fiscal.
 *
 * **L'archive ne vit plus dans le dépôt.** Elle y a vécu du 24 juillet au 13 septembre 2026,
 * en import statique, sur la foi d'un commentaire qui disait ce dépôt privé — il est public.
 * Quarante-deux séjours avec noms, e-mails, téléphones et codes de serrure, lisibles par
 * quiconque. Le chargement suit désormais la cascade d'Albiez, dont le dépôt a toujours été
 * public : la variable d'environnement `HISTORIQUE_BARBUSSE` d'abord (le JSON minifié, gzippé,
 * en base64 — 12 Ko pour 42 séjours, là où Vercel plafonne l'ensemble des variables à 64 Ko),
 * puis le fichier local `data/bookings-archive.json`, désormais ignoré par git, puis rien.
 * Les `infoItems` ne sont plus conservés : les codes de serrure qu'ils portaient n'ouvrent
 * plus rien, et rien ne les lit.
 *
 * `origin` n'est pas décoratif : c'est ce qui permettra au dashboard de dire « archive
 * introuvable » au lieu d'afficher un historique qui commence en décembre 2025.
 *
 * Le mécanisme — filtrer comme le fait l'API, puis dédoublonner en laissant gagner le live —
 * vient de `@sejour/socle/lib/archive`. Ne restent ici que le **chargement**, la **clé** et le
 * **périmètre**.
 *
 * ⚠️ **La fusion ne se fait plus dans `getBookings()`.** Elle est passée dans
 * `lib/bookings.ts`, à la vue des appelants — c'est le placement d'Albiez, et il vaut mieux :
 * un client d'API qui réinjecte en douce des lignes qui ne viennent pas de l'API rend toute
 * mesure de ce qu'il renvoie fausse d'avance.
 */
export const ARCHIVED_PROPERTY_IDS = new Set<number>([310268]);

export type ArchiveOrigin = "variable d'environnement" | "fichier local" | "absente";

/** Accepte le JSON en clair (fichier local, ou variable posée sans compression) et le gzip+base64. */
function decode(raw: string): Beds24Booking[] {
  const trimmed = raw.trim();
  const text = trimmed.startsWith("[")
    ? trimmed
    : gunzipSync(Buffer.from(trimmed, "base64")).toString("utf8");
  return JSON.parse(text) as Beds24Booking[];
}

function load(): { items: Beds24Booking[]; origin: ArchiveOrigin } {
  const env = process.env.HISTORIQUE_BARBUSSE;
  if (env && env.trim()) {
    try {
      return { items: decode(env), origin: "variable d'environnement" };
    } catch (e) {
      console.error("HISTORIQUE_BARBUSSE est illisible (base64/gzip/JSON) :", e);
    }
  }
  try {
    return { items: decode(readFileSync("data/bookings-archive.json", "utf8")), origin: "fichier local" };
  } catch {
    console.warn(
      "Aucune archive : ni HISTORIQUE_BARBUSSE, ni data/bookings-archive.json. " +
        "Lancer `node --env-file=.env.local scripts/beds24-backup.mjs`, puis poser la variable sur Vercel.",
    );
    return { items: [], origin: "absente" };
  }
}

const archive = createArchive<Beds24Booking, ArchiveOrigin>({
  load: () => {
    const { items, origin } = load();
    return { items: items.filter((b) => ARCHIVED_PROPERTY_IDS.has(b.propertyId)), origin };
  },
  /** L'`id` numérique, que cette archive a conservé — Albiez, lui, n'en a pas et prend `ref`. */
  key: (b) => String(b.id),
  fields: {
    arrival: (b) => b.arrival,
    departure: (b) => b.departure,
    status: (b) => b.status,
  },
});

/** D'où vient l'archive servie — pour que le dashboard puisse dire quand elle manque. */
export function archiveOrigin(): ArchiveOrigin {
  return archive.origin();
}

export type { ArchiveFilter };

/**
 * Ajoute au live les réservations archivées qu'il ne porte pas déjà — dédup par `id`, **le
 * live gagne**. Le filtre réplique celui de `/bookings` (bornes de dates + statuts), en
 * comparaisons lexicographiques puisque les dates sont en ISO, comme côté API.
 *
 * Tant que la propriété existe encore dans Beds24, ses résas live écrasent les archivées
 * (zéro doublon) ; une fois supprimée, les archivées prennent le relais seules.
 *
 * `include` dit ce que l'appelant a réclamé à l'API, et sert à **retirer de l'archive ce
 * qu'il n'a pas demandé**.
 *
 * Symétrie avec l'API : ce qu'on n'a pas demandé n'est pas là. Beds24 ne renvoie `infoItems`
 * et `invoiceItems` que si on les réclame — l'archive, elle, est un JSON local qui les porte
 * toujours, et **37 de ses 42 lignes contiennent un `NUKI_PIN`**. Sans ce filtre, un appelant
 * qui n'a rien demandé reçoit quand même les codes de serrure, uniquement parce que la
 * réservation est ancienne.
 *
 * C'est la fermeture **à la source**, en amont du DTO de `/api/dashboard/bookings`. Les deux
 * existent : celui-ci empêche la donnée d'entrer dans le processus, l'autre l'empêche d'en
 * sortir.
 */
export function withArchive(
  live: Beds24Booking[],
  filter: ArchiveFilter = {},
  include: { infoItems?: boolean; invoiceItems?: boolean } = {},
): Beds24Booking[] {
  const conforme = archive.list(filter).map((b) => {
    const copie = { ...b };
    if (!include.infoItems) delete copie.infoItems;
    if (!include.invoiceItems) delete copie.invoiceItems;
    return copie;
  });
  return archive.merge(live, conforme);
}
