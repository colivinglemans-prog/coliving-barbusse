import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Même alias que tsconfig.json (`@/*` → racine). Une regex, pour ne pas capturer `@sejour/…`.
    alias: [{ find: /^@\//, replacement: fileURLToPath(new URL("./", import.meta.url)) }],
  },
  test: {
    include: ["tests/**/*.test.ts"],
    // Les contrôles post-déploiement interrogent la production : jamais dans `npm test`, qui
    // tourne sans réseau en CI. Ils ont leur propre config (`vitest.deploy.config.ts`).
    exclude: ["tests/deploy/**", "node_modules/**"],
    environment: "node",
    // Le socle est publié en TypeScript source (exports `./lib/*.ts`) : Node ne sait pas le
    // charger tel quel, vitest doit le transformer comme du code du projet.
    server: { deps: { inline: ["@sejour/socle"] } },
  },
});
