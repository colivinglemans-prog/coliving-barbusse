/**
 * Garde-fou de la sauvegarde Beds24 (`/api/cron/beds24-backup`), sorti de la route pour être
 * testé : une sauvegarde vide, ou tombée sous la moitié de la précédente, n'est pas écrite.
 *
 * Jusqu'au 2026-11-16, l'expression du nom avait perdu ses antislash
 * (`/(d{4}-d{2}-d{2})_(d+).json.gz$/`) : elle ne reconnaissait aucun fichier, `previousCount`
 * rendait toujours `null` et le plancher retombait à 1 — le garde-fou ne protégeait que du vide.
 */

/** `beds24-backup/2026-11-08_32.json.gz` → date et nombre de réservations. */
export const BACKUP_NAME = /(\d{4}-\d{2}-\d{2})_(\d+)\.json\.gz$/;

/** Nombre de réservations de la sauvegarde la plus récente (les noms commencent par la date). */
export function previousCount(pathnames: readonly string[]): number | null {
  const last = pathnames.filter((p) => BACKUP_NAME.test(p)).sort().at(-1);
  return last ? Number(last.match(BACKUP_NAME)![2]) : null;
}

/** Nombre minimal de réservations pour écrire : 1 sans précédente, sinon la moitié (arrondie au-dessus). */
export function backupFloor(previous: number | null): number {
  return previous == null ? 1 : Math.ceil(previous / 2);
}
