#!/usr/bin/env node
/**
 * Référence de bascule (plan du 2026-11-21, B1) : lit la photo Beds24 du jour (prix publiés par
 * Beyond) dans Upstash et écrit `lib/pricing/cutover-ref.json` — nuit → [prix effectif, séjour
 * minimum]. Affiche le tableau des grands événements à faire valider par l'exploitant.
 *
 *   node --env-file=.env.local scripts/pricing-cutover-ref.mjs              # à blanc, photo du jour
 *   node --env-file=.env.local scripts/pricing-cutover-ref.mjs --date=2026-11-29
 *   node --env-file=.env.local scripts/pricing-cutover-ref.mjs --write      # le 30/11, après validation
 *
 * Aucune donnée voyageur : seulement des prix et séjours minimum publics.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const parisToday = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
const date = args.date ?? parisToday;
const write = "write" in args;

// Mêmes règles que lib/pricing/guards.ts (remises de durée) et lib/pricing/cutover.ts (validité).
const discount = (minStay) => (minStay >= 28 ? 0.7 : minStay >= 7 ? 0.9 : minStay >= 4 ? 0.92 : 1);
const BOUNDS = { min: 250, max: 3_500 };
// Blocs ancrés sur la référence (lib/pricing/overrides.ts) : à tenir alignés.
const BLOCKS = [
  { label: "24H Moto", from: "2027-04-07", to: "2027-04-11", minStay: 3, fallback: 940 },
  { label: "MotoGP", from: "2027-05-13", to: "2027-05-16", minStay: 3, fallback: 1_400 },
  { label: "Le Mans Classic", from: "2027-06-30", to: "2027-07-04", minStay: 4, fallback: 1_860 },
];

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error("KV_REST_API_URL / KV_REST_API_TOKEN absents : lancer avec --env-file=.env.local");
  process.exit(1);
}
const res = await fetch(`${url}/get/${encodeURIComponent(`pricing:snapshot:barbusse:${date}`)}`, {
  headers: { Authorization: `Bearer ${token}` },
});
const raw = (await res.json()).result;
if (!raw) {
  console.error(`Aucune photo pour le ${date}. Essayer --date=<veille>.`);
  process.exit(1);
}
const snap = typeof raw === "string" ? JSON.parse(raw) : raw;

const nights = {};
const invalid = [];
for (const [d, [price1, minStay]] of Object.entries(snap.days).sort()) {
  const eff = Math.round(price1 * discount(minStay));
  if (!(eff >= BOUNDS.min && eff <= BOUNDS.max)) invalid.push(`${d} : ${price1} € (séjour min. ${minStay})`);
  else nights[d] = [eff, minStay];
}

console.log(`Photo du ${date} (prise ${snap.takenAt}) : ${Object.keys(nights).length} nuits valides, ${invalid.length} invalides.`);
if (invalid.length) console.log(`Nuits invalides (le moteur ou le repli prendra le relais) :\n  ${invalid.join("\n  ")}`);

console.log("\nGrands événements : prix figés à la bascule (prix effectif ; price1 écrit = effectif ÷ remise de NOTRE séjour min.)");
for (const b of BLOCKS) {
  console.log(`\n${b.label} (séjour min. ${b.minStay}) :`);
  for (let d = b.from; d <= b.to; d = addDay(d)) {
    const n = nights[d];
    const eff = n ? n[0] : b.fallback;
    const price1 = Math.round(eff / discount(b.minStay));
    console.log(
      `  ${d} : ${eff} € effectif${n ? ` (Beyond, séjour min. ${n[1]})` : ` (REPLI : pas de référence valide)`}` +
        ` → price1 ${price1} €${snap.days[d]?.[2] === 0 ? " — vendue" : ""}`,
    );
  }
}

if (write) {
  const out = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "pricing", "cutover-ref.json");
  writeFileSync(
    out,
    JSON.stringify(
      { date, note: `Photo Beds24 du ${date} (prix publiés par Beyond), validée par l'exploitant.`, nights },
      null,
      0,
    ) + "\n",
  );
  console.log(`\nÉcrit : ${out}`);
} else {
  console.log("\n(À blanc : rien d'écrit. Ajouter --write après validation du tableau.)");
}

function addDay(d) {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + 1);
  return x.toISOString().slice(0, 10);
}
