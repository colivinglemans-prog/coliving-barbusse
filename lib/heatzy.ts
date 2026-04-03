import type { HeatzyMode, HeatzyZone, HeatzyZoneConfig } from "./types";
import { readFileSync } from "fs";
import { join } from "path";
import { list, put } from "@vercel/blob";

// ─── Scheduling logic ───────────────────────────────────────

/**
 * Returns the mode a zone should be in given current hour and occupancy.
 * Chambres: 7h-20h presence, 20h-7h confort
 * RDC (nightMode set): 0h-5h nightMode, rest same as chambres
 */
export function getOccupiedMode(zone: HeatzyZone, hour: number): HeatzyMode {
  // Night mode override (0h-5h) for zones with nightMode (e.g. RDC)
  if (zone.nightMode && hour >= 0 && hour < 5) {
    return zone.nightMode;
  }
  // Daytime: presence (7h-20h)
  if (hour >= 7 && hour < 20) {
    return "presence";
  }
  // Evening/night: confort
  return "cft";
}

/**
 * Returns the mode for a between-reservations gap (same-day checkout+checkin).
 * Éco from 9h to 17h, otherwise hors-gel.
 */
export function getBetweenReservationsMode(hour: number): HeatzyMode {
  if (hour >= 9 && hour < 17) return "eco";
  return "fro";
}

/**
 * Returns human-readable description of current and next heating rule.
 */
export function getHeatingRules(
  occupied: boolean,
  hour: number,
  hasSameDayTurnaround: boolean,
  nextCheckIn?: string,
): { currentRule: string; nextRule: string } {
  if (!occupied && !hasSameDayTurnaround) {
    let nextRule = "Aucune réservation prochaine";
    if (nextCheckIn) {
      nextRule = `Prochain check-in : ${nextCheckIn}`;
      const today = new Date().toISOString().split("T")[0];
      if (nextCheckIn === today) {
        if (hour < 12) {
          nextRule += " — pré-chauffage éco à 12h, confort à 15h";
        } else if (hour < 15) {
          nextRule += " — confort à 15h";
        }
      }
    }
    return {
      currentRule: "Pas de réservation — Hors-gel",
      nextRule,
    };
  }

  if (hasSameDayTurnaround && !occupied) {
    const mode = hour >= 9 && hour < 17 ? "Éco (entre deux réservations)" : "Hors-gel";
    return {
      currentRule: `Entre deux réservations — ${mode}`,
      nextRule: hour < 17 ? "À 17h → Pré-chauffage confort" : "Check-in imminent",
    };
  }

  // Occupied
  if (hour >= 7 && hour < 20) {
    return {
      currentRule: "Réservation active — Présence (7h-20h)",
      nextRule: "À 20h → Confort (nuit)",
    };
  }
  if (hour >= 20) {
    return {
      currentRule: "Réservation active — Confort (nuit)",
      nextRule: "À 0h → Présence RDC / Confort chambres",
    };
  }
  // 0h-5h
  if (hour < 5) {
    return {
      currentRule: "Réservation active — Nuit (RDC présence, chambres confort)",
      nextRule: "À 5h → Confort partout",
    };
  }
  // 5h-7h
  return {
    currentRule: "Réservation active — Confort (5h-7h)",
    nextRule: "À 7h → Mode présence",
  };
}

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
  if (mode === "presence") {
    // Presence detection is controlled via derog_mode, not mode
    await heatzyFetch("POST", `/app/control/${did}`, {
      attrs: { derog_mode: 3 },
    });
  } else {
    // Send derog_mode and mode as separate commands (sending both at once is ignored by some devices)
    await heatzyFetch("POST", `/app/control/${did}`, {
      attrs: { derog_mode: 0 },
    });
    await sleep(100);
    await heatzyFetch("POST", `/app/control/${did}`, {
      attrs: { mode },
    });
  }
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

const LOCKS_BLOB_KEY = "heatzy-locked-devices.json";

export async function getLockedDevices(): Promise<Set<string>> {
  try {
    const { blobs } = await list({ prefix: LOCKS_BLOB_KEY });
    if (blobs.length > 0) {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      const res = await fetch(blobs[0].url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const arr = (await res.json()) as string[];
        return new Set(arr);
      }
    }
  } catch (e) {
    console.error("getLockedDevices blob error:", e);
  }
  // Fallback to env var
  const env = process.env.LOCKED_DEVICES ?? "";
  if (!env.trim()) return new Set();
  return new Set(env.split(",").map((s) => s.trim()).filter(Boolean));
}

export async function saveLockedDevices(devices: Set<string>) {
  await put(LOCKS_BLOB_KEY, JSON.stringify([...devices]), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
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

export async function setDeviceTemperatures(did: string, cftTemp: number, ecoTemp: number) {
  await heatzyFetch("POST", `/app/control/${did}`, {
    attrs: { cft_temp: cftTemp, eco_temp: ecoTemp },
  });
}

export async function resetZoneTemperatures(zoneId: string) {
  const config = getZoneConfig();
  const zone = config.zones.find((z) => z.id === zoneId);
  if (!zone || !zone.cftTemp || !zone.ecoTemp) return 0;

  let updated = 0;
  for (const device of zone.devices) {
    await setDeviceTemperatures(device.did, zone.cftTemp, zone.ecoTemp);
    updated++;
    if (updated < zone.devices.length) await sleep(100);
  }
  return updated;
}

export async function resetAllTemperatures() {
  const config = getZoneConfig();
  let updated = 0;
  for (const zone of config.zones) {
    if (!zone.cftTemp || !zone.ecoTemp) continue;
    for (const device of zone.devices) {
      await setDeviceTemperatures(device.did, zone.cftTemp, zone.ecoTemp);
      updated++;
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
