import type { HeatzyMode, HeatzyZoneConfig } from "./types";
import { readFileSync } from "fs";
import { join } from "path";

const GIZWITS_APP_ID = "c70a66ff039d41b4a220e198b0fcc8b3";
const BASE_URL = "https://euapi.gizwits.com";

// ─── Token cache (module-level, survives within a single serverless invocation) ─

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

// ─── Authentication ─────────────────────────────────────────

async function heatzyLogin(): Promise<{ token: string; expiresAt: number }> {
  const email = process.env.HEATZY_EMAIL;
  const password = process.env.HEATZY_PASSWORD;
  if (!email || !password) {
    throw new Error("HEATZY_EMAIL and HEATZY_PASSWORD must be set");
  }

  const res = await fetch(`${BASE_URL}/app/login`, {
    method: "POST",
    headers: {
      "X-Gizwits-Application-Id": GIZWITS_APP_ID,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: email, password, lang: "en" }),
  });

  if (!res.ok) {
    throw new Error(`Heatzy login failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  // Token valid for 7 days, refresh 1 hour before expiry
  const expiresAt = Date.now() + 6 * 24 * 60 * 60 * 1000;
  return { token: data.token, expiresAt };
}

async function getHeatzyToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }
  const { token, expiresAt } = await heatzyLogin();
  cachedToken = token;
  tokenExpiresAt = expiresAt;
  return token;
}

// ─── Generic fetch wrapper ──────────────────────────────────

async function heatzyFetch<T>(
  method: "GET" | "POST",
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const token = await getHeatzyToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "X-Gizwits-Application-Id": GIZWITS_APP_ID,
      "X-Gizwits-User-token": token,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Heatzy API error: ${res.status} ${res.statusText} on ${method} ${path}`);
  }

  return res.json();
}

// ─── Device operations ──────────────────────────────────────

interface GizwitsBinding {
  did: string;
  dev_alias: string;
  is_online: boolean;
  product_name: string;
}

interface GizwitsBindingsResponse {
  devices: GizwitsBinding[];
}

export async function getDevices() {
  const data = await heatzyFetch<GizwitsBindingsResponse>(
    "GET",
    "/app/bindings?limit=30&skip=0",
  );
  return data.devices ?? [];
}

interface GizwitsDeviceData {
  attr: {
    mode?: string;
    cur_temp?: number;
    [key: string]: unknown;
  };
}

export async function getDeviceStatus(did: string) {
  const data = await heatzyFetch<GizwitsDeviceData>(
    "GET",
    `/app/devdata/${did}/latest`,
  );
  return data.attr ?? {};
}

export async function setDeviceMode(did: string, mode: HeatzyMode | string) {
  await heatzyFetch("POST", `/app/control/${did}`, {
    attrs: { mode },
  });
}

// ─── Zone operations ────────────────────────────────────────

let zoneConfigCache: HeatzyZoneConfig | null = null;

export function getZoneConfig(): HeatzyZoneConfig {
  if (zoneConfigCache) return zoneConfigCache;
  const filePath = join(process.cwd(), "data", "heatzy-zones.json");
  const raw = readFileSync(filePath, "utf-8");
  zoneConfigCache = JSON.parse(raw) as HeatzyZoneConfig;
  return zoneConfigCache;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function setZoneMode(zoneId: string, mode: HeatzyMode | string) {
  const config = getZoneConfig();
  const zone = config.zones.find((z) => z.id === zoneId);
  if (!zone) throw new Error(`Zone not found: ${zoneId}`);

  let updated = 0;
  for (const device of zone.devices) {
    await setDeviceMode(device.did, mode);
    updated++;
    if (updated < zone.devices.length) {
      await sleep(100);
    }
  }
  return updated;
}

export async function setAllDevicesMode(mode: HeatzyMode | string) {
  const config = getZoneConfig();
  let updated = 0;
  for (const zone of config.zones) {
    for (const device of zone.devices) {
      await setDeviceMode(device.did, mode);
      updated++;
      await sleep(100);
    }
  }
  return updated;
}
