/**
 * Contrôles post-déploiement et surveillance — `npm run test:deploy`.
 *
 * Variables lues (jamais imprimées) : `DEPLOY_LEVEL` (`vital` | `full`, défaut `full`),
 * `DEPLOY_BASE_URL` (défaut : production), `DEPLOY_ONLY`, `BEDS24_MONITOR_TOKEN`,
 * `DEPLOY_VIEWER_PASSWORD`, `VERCEL_AUTOMATION_BYPASS_SECRET`, `DEPLOY_REPORT`.
 */
import { defineDeploySuite } from "@sejour/socle/testing/deploy/vitest-suite";
import site from "./site";

defineDeploySuite(site);
