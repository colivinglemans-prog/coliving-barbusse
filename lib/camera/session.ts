import { AjCloud, AjCloudError, type AjCloudConfig, type AjSession } from "./ajcloud";
import { getJson, getRedis, hasRedis, redisKey, setJson } from "@/lib/redis";

/**
 * Session AJCloud réutilisée par la page « Vidéo » (`/api/dashboard/video`).
 *
 * La page se rafraîchit toutes les 30 s ; chaque appel refaisait la poignée de main complète
 * (`outer-challenge` + `signin`), soit ~120 connexions par heure d'onglet ouvert (audit du
 * 15/11). Un blocage du compte par le cloud couperait aussi la veille de mouvement
 * (`camera-watch`) et le suivi ménage, qui se connectent avec le même compte.
 *
 * La session est gardée dans Redis (`barbusse:camera:ajcloud-session`, 6 h au plus) et reprise
 * telle quelle. Si le cloud la refuse (expirée, révoquée), **une** reconnexion, puis un seul
 * nouvel essai : jamais de boucle. Sans Redis, connexion à chaque appel, comme avant.
 *
 * Les crons (`camera-watch`, `lib/cleaning/sources.ts`) gardent leur connexion propre : six par
 * heure chacun, et leur passage ne doit pas dépendre d'une session laissée par la page.
 */
export const CAMERA_SESSION_KEY = redisKey("camera", "ajcloud-session");
const SESSION_TTL_SECONDS = 6 * 3600;

export interface SessionStore {
  load(): Promise<AjSession | null>;
  save(session: AjSession): Promise<void>;
  clear(): Promise<void>;
}

const redisStore: SessionStore = {
  load: () => getJson<AjSession>(CAMERA_SESSION_KEY),
  save: (session) => setJson(CAMERA_SESSION_KEY, session, SESSION_TTL_SECONDS),
  clear: async () => {
    await getRedis().del(CAMERA_SESSION_KEY);
  },
};

const noStore: SessionStore = { load: async () => null, save: async () => {}, clear: async () => {} };

function isSession(v: unknown): v is AjSession {
  const s = v as AjSession | null;
  return Boolean(s && typeof s.accessToken === "string" && typeof s.signToken === "string" && typeof s.agentToken === "string");
}

export async function withCameraSession<T>(
  config: AjCloudConfig,
  run: (client: AjCloud) => Promise<T>,
  store: SessionStore = hasRedis() ? redisStore : noStore,
  makeClient: (config: AjCloudConfig) => AjCloud = (c) => new AjCloud(c),
): Promise<T> {
  const cached = await store.load().catch(() => null);
  if (isSession(cached)) {
    const client = makeClient(config);
    client.restore(cached);
    try {
      return await run(client);
    } catch (e) {
      // Une erreur réseau ou autre que le cloud remonte telle quelle ; un refus du cloud fait
      // oublier la session et passe à la reconnexion.
      if (!(e instanceof AjCloudError)) throw e;
      await store.clear().catch(() => {});
    }
  }
  const client = makeClient(config);
  await client.login();
  const session = client.session();
  if (session) {
    await store.save(session).catch((e) => console.error("[camera-session] enregistrement:", e instanceof Error ? e.name : "erreur"));
  }
  return run(client);
}
