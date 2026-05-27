#!/usr/bin/env node
// Pré-traduit les avis (texte + réponse hôte) via DeepL et enrichit data/reviews.json.
// Usage:
//   DEEPL_API_KEY=xxx node scripts/translate-reviews.mjs           # incrémental
//   DEEPL_API_KEY=xxx node scripts/translate-reviews.mjs --force   # retraduit tout

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REVIEWS_PATH = join(__dirname, "..", "data", "reviews.json");

const DEEPL_KEY = process.env.DEEPL_API_KEY;
if (!DEEPL_KEY) {
  console.error("ERREUR : DEEPL_API_KEY manquant. Ex : DEEPL_API_KEY=xxx node scripts/translate-reviews.mjs");
  process.exit(1);
}

const FORCE = process.argv.includes("--force");
const LOCALES = ["fr", "en", "it", "de", "es"];
const DEEPL_TARGET = { fr: "FR", en: "EN-GB", it: "IT", de: "DE", es: "ES" };
const DEEPL_SOURCE = { FR: "fr", EN: "en", IT: "it", DE: "de", ES: "es" };

// DeepL Free vs Pro : la Free key se termine par ":fx"
const API_HOST = DEEPL_KEY.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";

let charCount = 0;
let apiCalls = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translate(text, targetLangCode, sourceLangCode = null, attempt = 1) {
  const params = new URLSearchParams();
  params.append("text", text);
  params.append("target_lang", targetLangCode);
  if (sourceLangCode) params.append("source_lang", sourceLangCode);

  const res = await fetch(`https://${API_HOST}/v2/translate`, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (res.status === 429 && attempt <= 5) {
    const wait = 2000 * attempt;
    console.log(`   · rate limit, retry dans ${wait}ms (attempt ${attempt + 1}/5)`);
    await sleep(wait);
    return translate(text, targetLangCode, sourceLangCode, attempt + 1);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepL ${res.status}: ${body}`);
  }

  const data = await res.json();
  const result = data.translations[0];
  apiCalls += 1;
  charCount += text.length;
  await sleep(300); // évite rate limit DeepL Free
  return {
    translation: result.text,
    detectedSourceLang: result.detected_source_language, // ex "FR"
  };
}

async function detectAndTranslate(review, key, translationsKey) {
  const sourceText = review[key];
  if (!sourceText) return false;

  let changed = false;
  let sourceLang = review.sourceLang;

  // Étape 1 : détection langue source si absente
  // On le fait via un premier appel vers EN-GB (auto-detect retourné dans `detected_source_language`).
  if (!sourceLang) {
    const targetForDetection = sourceText.length > 5 ? "EN-GB" : "FR";
    const { detectedSourceLang } = await translate(sourceText, targetForDetection);
    const detected = DEEPL_SOURCE[detectedSourceLang.toUpperCase()] || "fr";
    sourceLang = detected;
    review.sourceLang = sourceLang;
    changed = true;

    // Si la détection a tapé une langue cible où on aurait stocké la traduction,
    // récupère la valeur déjà obtenue plutôt que de re-payer un appel.
    const detectedTargetLocale = DEEPL_SOURCE[targetForDetection.split("-")[0]];
    if (detectedTargetLocale && detectedTargetLocale !== sourceLang) {
      review[translationsKey] = review[translationsKey] || {};
      if (!review[translationsKey][detectedTargetLocale] || FORCE) {
        // Refait l'appel proprement avec source_lang explicite pour bénéficier de la qualité
        const { translation } = await translate(
          sourceText,
          DEEPL_TARGET[detectedTargetLocale],
          sourceLang.toUpperCase(),
        );
        review[translationsKey][detectedTargetLocale] = translation;
        changed = true;
      }
    }
  }

  // Étape 2 : traduit dans toutes les autres locales
  review[translationsKey] = review[translationsKey] || {};
  for (const target of LOCALES) {
    if (target === sourceLang) continue;
    if (review[translationsKey][target] && !FORCE) continue;

    const { translation } = await translate(
      sourceText,
      DEEPL_TARGET[target],
      sourceLang.toUpperCase(),
    );
    review[translationsKey][target] = translation;
    changed = true;
  }

  // Nettoie une éventuelle entrée correspondant à la langue source
  if (review[translationsKey][sourceLang]) {
    delete review[translationsKey][sourceLang];
    changed = true;
  }

  return changed;
}

async function main() {
  const raw = await readFile(REVIEWS_PATH, "utf8");
  const reviews = JSON.parse(raw);

  console.log(`→ ${reviews.length} avis à traiter (host: ${API_HOST}, force: ${FORCE})\n`);

  let updated = 0;
  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i];
    const label = `[${i + 1}/${reviews.length}] ${r.name}`;
    try {
      const textChanged = await detectAndTranslate(r, "text", "translations");
      const replyChanged = r.hostReply
        ? await detectAndTranslate(r, "hostReply", "hostReplyTranslations")
        : false;

      if (textChanged || replyChanged) {
        updated += 1;
        console.log(`${label} ✓ (source: ${r.sourceLang})`);
        // Sauvegarde progressive pour ne rien perdre en cas de crash
        await writeFile(REVIEWS_PATH, JSON.stringify(reviews, null, 2) + "\n", "utf8");
      } else {
        console.log(`${label} = (à jour)`);
      }
    } catch (err) {
      console.error(`${label} ✗ ${err.message}`);
      throw err;
    }
  }

  await writeFile(REVIEWS_PATH, JSON.stringify(reviews, null, 2) + "\n", "utf8");

  console.log("\n--- Résumé ---");
  console.log(`Avis mis à jour : ${updated}/${reviews.length}`);
  console.log(`Appels API DeepL : ${apiCalls}`);
  console.log(`Caractères traduits : ${charCount}`);
  console.log(`Quota Free mensuel : 500 000 chars (~${((charCount / 500000) * 100).toFixed(2)}% consommé)`);
}

main().catch((err) => {
  console.error("\nERREUR FATALE:", err);
  process.exit(1);
});
