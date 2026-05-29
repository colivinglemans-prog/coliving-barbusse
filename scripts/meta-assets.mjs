// Génère les assets de la Page Facebook (profil + couverture) dans ./meta-assets/
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = "meta-assets";
mkdirSync(OUT, { recursive: true });

// 1) Photo de profil : logo maison rose, carré 1024×1024 (FB masque en cercle → fond plein)
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#FF385C"/>
  <path d="M16 6L5 15h3v10h6v-7h4v7h6V15h3L16 6z" fill="#fff"/>
</svg>`;

await sharp(Buffer.from(logoSvg), { density: 300 })
  .png()
  .toFile(`${OUT}/profil-logo.png`);
console.log("✓ profil-logo.png (1024×1024)");

// 2) Couverture FB : façade recadrée 1640×624 (sujet centré pour le crop mobile)
await sharp("public/images/house/3-maison-AI.jpg")
  .resize(1640, 624, { fit: "cover", position: "centre" })
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(`${OUT}/couverture-fb.jpg`);
console.log("✓ couverture-fb.jpg (1640×624)");

console.log("\nAssets prêts dans ./meta-assets/");
