import type { AgentGuardOptions } from "@sejour/socle/lib/stay-agent-guard";
import { createRedisPriceCacheStore } from "@sejour/socle/lib/stay-agent-guard";
import { createRedisLoginAttemptStore } from "@sejour/socle/lib/login-attempts";
import { getRedis, hasRedis, redisKey } from "./redis";

/**
 * Garde des outils de prix de l'agent IA (`quote`, `find`), socle v3.34.0 : cache des prix 5 min
 * et limite par IP, partagés entre instances dans Redis. Même objet pour la route REST
 * (`/api/agent/[tool]`) et le serveur MCP (`/api/mcp`), donc un seul compteur par IP.
 *
 * Préfixes propres (`agent-price`, `agent-rate`) : jamais `login-failures`, sinon le trafic des IA
 * verrouillerait la connexion au dashboard. Sans Redis : cache et limite en mémoire de l'instance.
 */
export const agentGuard: AgentGuardOptions = hasRedis()
  ? {
      priceCache: createRedisPriceCacheStore(getRedis(), redisKey("agent-price")),
      rateLimitStore: createRedisLoginAttemptStore(getRedis(), redisKey("agent-rate")),
    }
  : {};
