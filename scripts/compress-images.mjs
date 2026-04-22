import sharp from "sharp";
import { readdir, stat, rename, unlink } from "node:fs/promises";
import { extname, join } from "node:path";

const MAX_WIDTH = 1920;
const QUALITY = 82;
const ROOT = "public/images";
const EXTS = [".jpg", ".jpeg", ".png"];
const MIN_SIZE = 400 * 1024; // skip files already under 400 KB

function humanSize(bytes) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const path = join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}

const all = await walk(ROOT);
let totalBefore = 0;
let totalAfter = 0;
let processed = 0;
let skipped = 0;
const renames = [];

for (const path of all) {
  const ext = extname(path).toLowerCase();
  if (!EXTS.includes(ext)) continue;
  const { size: before } = await stat(path);
  totalBefore += before;
  if (before < MIN_SIZE) {
    skipped++;
    totalAfter += before;
    continue;
  }

  const tmp = path + ".tmp.jpg";
  const finalPath = ext === ".png" ? path.replace(/\.png$/i, ".jpg") : path;

  await sharp(path)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(tmp);

  const { size: after } = await stat(tmp);

  if (ext === ".png" && finalPath !== path) {
    await unlink(path);
    renames.push({ from: path, to: finalPath });
  }
  await rename(tmp, finalPath);

  totalAfter += after;
  processed++;
  const short = path.replace(ROOT + "/", "").replace(ROOT + "\\", "");
  console.log(`${short}: ${humanSize(before)} → ${humanSize(after)}`);
}

console.log(
  `\nProcessed ${processed} files (skipped ${skipped} under ${humanSize(MIN_SIZE)})`,
);
console.log(`Total: ${humanSize(totalBefore)} → ${humanSize(totalAfter)} (saved ${humanSize(totalBefore - totalAfter)})`);

if (renames.length) {
  console.log(`\n${renames.length} PNGs converted to JPG — update references in code.`);
}
