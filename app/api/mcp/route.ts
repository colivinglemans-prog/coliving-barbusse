import { createMcpRoute } from "@sejour/socle/lib/stay-agent-mcp";
import { STAY_AGENT, stayAgentDeps } from "@/lib/agent";

/**
 * Le connecteur MCP des assistants (Claude, ChatGPT en mode développeur, Le Chat…) :
 * `https://<site>/api/mcp`, HTTP streamable sans état. Mêmes quatre outils que `/api/agent/*`,
 * même code (`runTool`) — voir `@sejour/socle/lib/stay-agent-mcp`.
 *
 * **Route publique**, hors du `matcher` du proxy : elle ne rend que des jours, des nombres de
 * voyageurs et des montants publics.
 */
export const { GET, POST, DELETE, OPTIONS } = createMcpRoute(STAY_AGENT, stayAgentDeps);
