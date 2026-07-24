#!/usr/bin/env node
// Sauvegarde complète des réservations Beds24 AVANT suppression d'une propriété.
//
// Aspire TOUT le compte via l'API v2 (avec invoiceItems / infoItems / guests) et écrit :
//   - data/beds24-raw-backup.json   → dump brut intégral (disaster recovery, non lu au runtime)
//   - data/bookings-archive.json    → sous-ensemble propertyId ∈ ARCHIVED_PROPERTY_IDS,
//                                      réinjecté dans les dashboards par lib/bookings-archive.ts
//
// Usage : node --env-file=.env.local scripts/beds24-backup.mjs
// Requiert BEDS24_API_TOKEN (scopes read:bookings*) dans l'environnement.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const API_URL = "https://api.beds24.com/v2";
const ARCHIVED_PROPERTY_IDS = new Set([310268]); // "Coliving Henri Barbusse" (location à la chambre)

const token = process.env.BEDS24_API_TOKEN;
if (!token) {
  console.error("✗ BEDS24_API_TOKEN manquant. Lance : node --env-file=.env.local scripts/beds24-backup.mjs");
  process.exit(1);
}

// Fenêtre historique large : bien avant la mise en service, année courante + 2 ans de futur.
const now = new Date();
const arrivalFrom = "2020-01-01";
const arrivalTo = `${now.getFullYear() + 2}-12-31`;

async function fetchAllBookings() {
  const all = [];
  let page = 1;
  // Boucle de pagination : l'API v2 renvoie pages.nextPageExists tant qu'il reste des pages.
  for (;;) {
    const url = new URL(`${API_URL}/bookings`);
    url.searchParams.set("arrivalFrom", arrivalFrom);
    url.searchParams.set("arrivalTo", arrivalTo);
    url.searchParams.set("includeInvoiceItems", "true");
    url.searchParams.set("includeInfoItems", "true");
    url.searchParams.set("includeGuests", "true");
    url.searchParams.set("page", String(page));

    const res = await fetch(url.toString(), { headers: { token } });
    const body = await res.text();
    if (!res.ok) {
      console.error(`✗ Beds24 API ${res.status} (page ${page}): ${body.slice(0, 300)}`);
      process.exit(1);
    }
    const json = JSON.parse(body);
    const data = json.data ?? [];
    all.push(...data);
    process.stdout.write(`  page ${page} → ${data.length} résas (total ${all.length})\r`);

    if (!json.pages?.nextPageExists || data.length === 0) break;
    page += 1;
  }
  process.stdout.write("\n");
  return all;
}

const bookings = await fetchAllBookings();
const archived = bookings.filter((b) => ARCHIVED_PROPERTY_IDS.has(b.propertyId));

const scriptDir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(scriptDir, "..", "data");
const rawPath = join(dataDir, "beds24-raw-backup.json");
const archivePath = join(dataDir, "bookings-archive.json");

writeFileSync(rawPath, JSON.stringify(bookings, null, 2));
writeFileSync(archivePath, JSON.stringify(archived, null, 2));

// Résumé
const dates = bookings.map((b) => b.arrival).filter(Boolean).sort();
const byProp = {};
for (const b of bookings) byProp[b.propertyId] = (byProp[b.propertyId] ?? 0) + 1;

console.log("\n✓ Sauvegarde terminée");
console.log(`  Total réservations (compte)    : ${bookings.length}`);
console.log(`  Par propertyId                 : ${JSON.stringify(byProp)}`);
console.log(`  Archivées (310268, réinjectées): ${archived.length}`);
console.log(`  Plage d'arrivées               : ${dates[0] ?? "?"} → ${dates[dates.length - 1] ?? "?"}`);
console.log(`  Avec invoiceItems (archivées)  : ${archived.filter((b) => b.invoiceItems?.length).length}`);
console.log(`\n  → ${rawPath}`);
console.log(`  → ${archivePath}`);
