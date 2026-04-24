#!/usr/bin/env node
// Échange un invite code Beds24 contre un refreshToken.
// Usage: node scripts/beds24-setup.mjs <INVITE_CODE>

const code = process.argv[2];
if (!code) {
  console.error("Usage: node scripts/beds24-setup.mjs <INVITE_CODE>");
  process.exit(1);
}

const url = "https://api.beds24.com/v2/authentication/setup";
const res = await fetch(url, {
  headers: { code, deviceName: "coliving-barbusse-dashboard" },
});
const body = await res.text();

if (!res.ok) {
  console.error(`Erreur ${res.status}:`, body);
  process.exit(1);
}

const data = JSON.parse(body);
console.log("\n✓ Refresh token obtenu :\n");
console.log(data.refreshToken);
console.log("\nAjoute cette valeur dans Vercel :");
console.log("  npx vercel env add BEDS24_REFRESH_TOKEN production\n");
console.log("Access token (24h, juste pour test) :", data.token?.slice(0, 20) + "…");
console.log("Expires in:", data.expiresIn, "sec");
