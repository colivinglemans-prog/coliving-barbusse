import { createAgentRoute } from "@sejour/socle/lib/stay-agent-http";
import { STAY_AGENT, stayAgentDeps } from "@/lib/agent";
import { agentGuard } from "@/lib/agent-guard";

/**
 * Les outils des IA : `/api/agent/info`, `availability`, `quote`, `find`, `openapi`.
 *
 * **Route publique**, hors du `matcher` du proxy comme `/api/availability` : elle ne rend que
 * des jours, des nombres de voyageurs et des montants publics — aucune réservation, aucun nom.
 * Voir `@sejour/socle/lib/stay-agent`.
 */
export const { GET, OPTIONS } = createAgentRoute(STAY_AGENT, stayAgentDeps, agentGuard);
