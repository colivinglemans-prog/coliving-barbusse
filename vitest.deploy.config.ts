import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Contrôles post-déploiement et surveillance (`npm run test:deploy`).
 *
 * Ils interrogent un site déployé — la production par défaut, une preview via
 * `DEPLOY_BASE_URL` — et ne tournent donc jamais dans `npm test`. Le moteur vient de
 * `@sejour/socle/testing/deploy` ; ce dépôt ne fournit que ses attendus (`tests/deploy/site.ts`).
 *
 * `TZ` est fixé avant tout import : « aujourd'hui », le mois courant et la veille de Noël se
 * calculent à l'heure de Paris, y compris sur un runner GitHub qui vit en UTC.
 */
process.env.TZ = "Europe/Paris";

export default defineConfig({
  resolve: {
    // Même alias que tsconfig.json (`@/*` → racine). Une regex, pour ne pas capturer `@sejour/…`.
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL("./", import.meta.url)) }],
  },
  test: {
    include: ["tests/deploy/**/*.test.ts"],
    environment: "node",
    // Le moteur parallélise lui-même ses requêtes ; un seul fichier, aucune isolation utile.
    fileParallelism: false,
    // Le socle est publié en TypeScript source : vitest doit le transformer.
    server: { deps: { inline: ["@sejour/socle"] } },
  },
});
