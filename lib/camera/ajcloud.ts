import { createHash, createHmac } from "node:crypto";
import { brotliDecompressSync, gunzipSync } from "node:zlib";
import nacl from "tweetnacl";

/**
 * Client minimal de l'API cloud AJCloud (caméras Wansview / Cinnado de Barbusse).
 *
 * L'appli officielle ne donne ni RTSP ni ONVIF et son flux vidéo passe par un P2P
 * propriétaire. Mais l'API cloud qu'elle utilise, elle, est accessible : on s'y authentifie
 * avec le compte Wansview et on y lit l'état des caméras, leur image instantanée et surtout
 * **les événements de mouvement** (image + clip vidéo). C'est cette dernière lecture qui
 * alimente l'alerte de vidéosurveillance (`/api/cron/camera-watch`).
 *
 * Protocole (observé sur l'appli, recoupé avec l'intégration Home Assistant `cash83/wansview-ha`) :
 *  1. `POST uac/v3/outer-challenge` (username, action=signin) → `clientSecretKey`, `serverPubKey` ;
 *  2. le mot de passe est chiffré en NaCl Box (Curve25519 + XSalsa20-Poly1305) avec ces clés ;
 *  3. `POST uac/v1/signin` → `accessToken`, `signToken`, `uid` ;
 *  4. chaque appel signé porte un en-tête `X-UAC-Signature` = HMAC-SHA256(signToken, …).
 *
 * Rien n'est stocké en clair ni journalisé : ni mot de passe, ni jeton, ni URL d'image signée.
 */

export interface AjCloudConfig {
  email: string;
  password: string;
  /** Région du compte. Barbusse est en « eu ». */
  region?: "eu";
}

const REGIONS = {
  eu: {
    uac: "https://uac-eu.ajcloud.net/api",
  },
} as const;

const APP_VERSION = "2.0.26012704";
const AGENT_NAME = "SM-S926B";
const USER_AGENT =
  "15; en-us; SM-S926B Build/AP3A.240905.015.A2;wansview/V2.0.26012704";

export interface AjAlarmImage {
  tags: string;
  url: string;
}

export interface AjAlarm {
  did: string;
  /** Horodatage de l'événement, en millisecondes epoch (chaîne dans la réponse). */
  cts: string;
  /** Date `YYYYMMDD`. */
  cdate: string;
  /** Heure locale `YYYYMMDDHHMMSS`. */
  ctime: string;
  /** Durée en millisecondes (chaîne). */
  dur: string;
  images: AjAlarmImage[];
  avs: AjAlarmImage[];
}

export interface AjDevice {
  deviceId: string;
  name: string;
  online: boolean;
  gatewayUrl: string | null;
  emcUrl: string | null;
  snapshotUrl: string | null;
  raw: Record<string, unknown>;
}

export class AjCloudError extends Error {}

export class AjCloud {
  private readonly email: string;
  private readonly password: string;
  private readonly uac: string;
  private agentToken = randomUuid();

  private accessToken: string | null = null;
  private signToken: string | null = null;
  private uid: string | null = null;
  private countryCode = "IT";
  private continentCode = "";

  constructor(config: AjCloudConfig) {
    this.email = config.email;
    this.password = config.password;
    this.uac = REGIONS[config.region ?? "eu"].uac;
  }

  async login(): Promise<void> {
    this.agentToken = randomUuid();
    this.accessToken = null;
    this.signToken = null;

    const challenge = await this.request(
      "POST",
      `${this.uac}/v3/outer-challenge`,
      {
        data: {
          username: this.email,
          action: "signin",
          agentName: AGENT_NAME,
          agentToken: this.agentToken,
        },
      },
      false,
    );
    const ch = challenge.result as {
      clientSecretKey: string;
      serverPubKey: string;
    };

    const nonce = nacl.randomBytes(24);
    const encrypted = nacl.box(
      new TextEncoder().encode(this.password),
      nonce,
      b64ToBytes(ch.serverPubKey),
      b64ToBytes(ch.clientSecretKey),
    );
    if (!encrypted) throw new AjCloudError("Chiffrement du mot de passe impossible");

    const signin = await this.request(
      "POST",
      `${this.uac}/v1/signin`,
      {
        data: {
          username: this.email,
          password: bytesToB64(encrypted),
          nonce: bytesToB64(nonce),
          agentName: AGENT_NAME,
          modelName: AGENT_NAME,
          agentToken: this.agentToken,
          osName: "android",
          origin: "mobile phone",
          grantType: "password",
          scope: "all",
        },
      },
      false,
    );
    const r = signin.result as {
      accessToken: string;
      signToken: string;
      uid: string;
      ident?: { region?: string; continent?: string };
    };
    this.accessToken = r.accessToken;
    this.signToken = r.signToken;
    this.uid = r.uid;
    this.countryCode = (r.ident?.region ?? this.countryCode).toUpperCase();
    this.continentCode = r.ident?.continent ?? this.continentCode;
  }

  /** Liste les caméras du compte, enrichies de leur image instantanée et de leurs passerelles. */
  async devices(): Promise<AjDevice[]> {
    const list = await this.request(
      "POST",
      `${this.uac}/v3/device-list`,
      { data: {} },
      true,
    );
    const result = (list.result ?? {}) as Record<string, unknown>;
    const merged = mergeDeviceList(result);
    if (merged.length === 0) return [];

    const gatewayUrl = merged.map(contextGateway).find(Boolean) ?? null;
    const infos: Record<string, Record<string, unknown>> = {};
    if (gatewayUrl) {
      const fetched = await this.request(
        "POST",
        `${gatewayUrl}/v1/fetch-infos`,
        {
          data: {
            devices: merged.map((d) => ({
              did: String(d.deviceId),
              scopes: [],
              isShare: false,
            })),
          },
        },
        true,
      ).catch(() => null);
      const list2 = (fetched?.result as { infos?: unknown })?.infos;
      if (Array.isArray(list2)) {
        for (const it of list2 as Array<Record<string, unknown>>) {
          const did = String(it.did ?? it.deviceId ?? "");
          if (did) infos[did] = it;
        }
      }
    }

    return merged.map((d) => {
      const did = String(d.deviceId);
      const info = (infos[did]?.info ?? {}) as Record<string, unknown>;
      const base = (info.base ?? {}) as Record<string, unknown>;
      const cfg = contextConfig(d);
      return {
        deviceId: did,
        name: String(d.aliasName ?? d.deviceName ?? did).trim(),
        online: base.onlineStatus === 2 || d.conStatus === 1,
        gatewayUrl: (cfg.appGatewayUrl as string) || gatewayUrl,
        emcUrl: (cfg.appEmcUrl as string) || null,
        snapshotUrl: (base.snapshotUrl as string) || null,
        raw: { ...d, info },
      };
    });
  }

  /**
   * Événements de mouvement d'une caméra, les plus récents d'abord. Chacun porte une image et
   * un clip vidéo (URLs signées, temporaires). Lu sur le service EMC de la caméra.
   */
  async alarmsSurvey(device: AjDevice): Promise<AjAlarm[]> {
    const emc = device.emcUrl;
    if (!emc) return [];
    const res = await this.request(
      "POST",
      `${emc}/v1/alarms-survey`,
      { data: { deviceId: device.deviceId } },
      true,
      device.deviceId,
    );
    const alarms = (res.result as { alarms?: unknown })?.alarms;
    return Array.isArray(alarms) ? (alarms as AjAlarm[]) : [];
  }

  private meta(signed: boolean, deviceId?: string): Record<string, unknown> {
    const meta: Record<string, unknown> = {
      locale: "it",
      localtz: 60,
      appName: "wansview",
      appVersion: APP_VERSION,
      appVendorCode: "WVC",
      agentName: AGENT_NAME,
      appCountryCode: this.countryCode,
      appContinentCode: this.continentCode,
    };
    if (signed && this.accessToken) meta.accessToken = this.accessToken;
    if (deviceId) meta.deviceId = deviceId;
    return meta;
  }

  private signature(method: string, url: string, body: string): string {
    const ts = String(Date.now() + 1000);
    const path = "/" + url.split("://", 2)[1].split("/").slice(1).join("/");
    const bodyHash = createHash("sha256").update(body, "utf8").digest("hex");
    const signBody = `${method.toUpperCase()}\n${path}\n${bodyHash}\n`;
    const stringToSign =
      "HMAC-SHA256\n" +
      ts +
      "\n" +
      createHash("sha256").update(signBody, "utf8").digest("hex");
    const sig = createHmac("sha256", this.signToken!)
      .update(stringToSign, "utf8")
      .digest("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    return `UAC1-HMAC-SHA256;${ts};${sig}`;
  }

  private async request(
    method: string,
    url: string,
    payload: Record<string, unknown>,
    signed: boolean,
    deviceId?: string,
  ): Promise<Record<string, unknown>> {
    const built = { meta: this.meta(signed, deviceId), ...payload };
    const body = JSON.stringify(built);
    const headers: Record<string, string> = {
      "Accept-Encoding": "br,gzip",
      "Content-Type": "application/json;charset=utf-8",
      "User-Agent": USER_AGENT,
      "x-agent-token": this.agentToken,
    };
    if (signed) {
      if (!this.accessToken || !this.signToken)
        throw new AjCloudError("Jeton manquant (login requis)");
      headers.Authorization = `Bearer ${this.accessToken}`;
      headers["X-UAC-Signature"] = this.signature(method, url, body);
    }

    const res = await fetch(url, { method, body, headers, cache: "no-store" });
    const buf = Buffer.from(await res.arrayBuffer());
    const data = decodeBody(buf, res.headers.get("content-encoding") ?? "");

    if (data.status !== "ok" || ![0, "0", null, undefined].includes(data.code as never)) {
      // Jamais le corps brut : il peut contenir des URLs signées ou des identifiants.
      throw new AjCloudError(
        `AJCloud ${method} ${hostOf(url)} → ${String(data.code)} ${String(data.message ?? "")}`.trim(),
      );
    }
    return data;
  }
}

function decodeBody(buf: Buffer, encoding: string): Record<string, unknown> {
  const tryParse = (b: Buffer) => JSON.parse(b.toString("utf8")) as Record<string, unknown>;
  try {
    return tryParse(buf);
  } catch {
    // réponses compressées
  }
  if (encoding.includes("br")) return tryParse(brotliDecompressSync(buf));
  if (encoding.includes("gzip") || (buf[0] === 0x1f && buf[1] === 0x8b))
    return tryParse(gunzipSync(buf));
  throw new AjCloudError("Réponse AJCloud illisible");
}

function mergeDeviceList(result: Record<string, unknown>): Array<Record<string, unknown>> {
  const by = new Map<string, Record<string, unknown>>();
  for (const key of ["conDevices", "devGenerals", "devCmpts", "devPinners"]) {
    const items = result[key];
    if (!Array.isArray(items)) continue;
    for (const item of items as Array<Record<string, unknown>>) {
      const did = String(item.deviceId ?? item.devId ?? "");
      if (!did) continue;
      by.set(did, { ...(by.get(did) ?? {}), ...item });
    }
  }
  return [...by.values()];
}

function contextConfig(device: Record<string, unknown>): Record<string, unknown> {
  const ctx = device.context;
  const parsed =
    typeof ctx === "string"
      ? (safeJson(ctx) ?? {})
      : ((ctx as Record<string, unknown>) ?? {});
  return (parsed.config as Record<string, unknown>) ?? {};
}

function contextGateway(device: Record<string, unknown>): string | null {
  const cfg = contextConfig(device);
  return (cfg.appGatewayUrl as string) || null;
}

function safeJson(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function b64ToBytes(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, "base64"));
}
function bytesToB64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}
function randomUuid(): string {
  return (globalThis.crypto as Crypto).randomUUID();
}
