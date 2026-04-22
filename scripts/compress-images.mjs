import sharp from "sharp";
import { readdir, stat, rename, unlink } from "node:fs/promises";
import { extname, join } from "node:path";

const MAX_WIDTH = 1920;
const QUALITY = 82;
const TARGETS = [
  { dir: "public/images/garden", exts: [".jpg", ".jpeg"] },
  { dir: "public/images/blog", exts: [".jpg", ".jpeg", ".png"], minSize: 500 * 1024 },
];

function humanSize(bytes) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

let totalSaved = 0;

for (const target of TARGETS) {
  const files = await readdir(target.dir);
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (!target.exts.includes(ext)) continue;
    const path = join(target.dir, file);
    const { size: before } = await stat(path);
    if (target.minSize && before < target.minSize) continue;

    const tmp = path + ".tmp.jpg";
    const finalPath = ext === ".png" ? path.replace(/\.png$/i, ".jpg") : path;

    await sharp(path)
      .rotate() // respect EXIF orientation
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toFile(tmp);

    const { size: after } = await stat(tmp);

    if (ext === ".png" && finalPath !== path) {
      await unlink(path);
    }
    await rename(tmp, finalPath);

    const saved = before - after;
    totalSaved += saved;
    console.log(
      `${file} → ${finalPath.split(/[\\/]/).pop()}: ${humanSize(before)} → ${humanSize(after)} (-${humanSize(saved)})`,
    );
  }
}

console.log(`\nTotal saved: ${humanSize(totalSaved)}`);
