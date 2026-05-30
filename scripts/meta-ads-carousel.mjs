// Génère les visuels carrés 1080×1080 du carrousel Meta Ads dans ./meta-assets/ads/
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = "meta-assets/ads";
mkdirSync(OUT, { recursive: true });

const CARDS = [
  { src: "public/images/garden/20260528_183440.jpg", out: "1-jardin.jpg" },
  { src: "public/images/house/4-salonAI.jpg", out: "2-salon.jpg" },
  { src: "public/images/rooms/chambre-1/Chambre 1 AI (1).jpg", out: "3-suite.jpg" },
  { src: "public/images/house/2-cuisineAI.jpg", out: "4-cuisine.jpg" },
  { src: "public/images/house/circuit-bugatti.jpg", out: "5-circuit.jpg" },
];

for (const c of CARDS) {
  await sharp(c.src)
    .resize(1080, 1080, { fit: "cover", position: "centre" })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(`${OUT}/${c.out}`);
  console.log(`✓ ${c.out}`);
}
console.log(`\nCarrousel prêt dans ./${OUT}/`);
