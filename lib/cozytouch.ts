import { Redis } from "@upstash/redis";
import type { CozytouchDHWMode, CozytouchWaterHeaterStatus } from "./types";

// ─── Constants ──────────────────────────────────────────────

const ATLANTIC_TOKEN_URL = "https://apis.groupe-atlantic.com/token";
const ATLANTIC_JWT_URL = "https://apis.groupe-atlantic.com/magellan/accounts/jwt";
const OVERKIZ_BASE = "https://ha110-1.overkiz.com/enduser-mobile-web/enduserAPI";
const COZYTOUCH_CLIENT_ID =
  "Q3RfMUpWeVRtSUxYOEllZkE3YVVOQmpGblpVYToyRWNORHpfZHkzNDJVSnFvMlo3cFNKTnZVdjBh";

const SESSION_KEY = "cozytouch:session";
const DEVICE_URL_KEY = "cozytouch:device-url";
const SENSOR_URL_KEY = "cozytouch:sensor-url";
const SESSION_TTL = 8 * 60 * 60; // 8 hours in seconds

// ─── Redis client (reuse from heatzy) ──────────────────────

let redisClient: Redis | null = null;
function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return redisClient;
}

// ─── In-memory cache ────────────────────────────────────────

const cache = new Map<string, { value: unknown; expires: number }>();
const CACHE_TTL = 60_000;

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (entry && entry.expires > Date.now()) return entry.value as T;
  return undefined;
}

function setCached(key: string, value: unknown) {
  cache.set(key, { value, expires: Date.now() + CACHE_TTL });
}

function invalidateCache(key: string) {
  cache.delete(key);
}

// ─── Authentication (3-step flow) ───────────────────────────

async function cozytouchLogin(): Promise<string> {
  const email = process.env.COZYTOUCH_EMAIL?.trim();
  const password = process.env.COZYTOUCH_PASSWORD?.trim();
  if (!email || !password) {
    throw new Error("COZYTOUCH_EMAIL and COZYTOUCH_PASSWORD must be set");
  }

  // Step 1: Get Atlantic access token
  const tokenRes = await fetch(ATLANTIC_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${COZYTOUCH_CLIENT_ID}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "password",
      username: `GA-PRIVATEPERSON/${email}`,
      password,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Cozytouch token failed: ${tokenRes.status} ${text}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // Step 2: Exchange for JWT
  const jwtRes = await fetch(ATLANTIC_JWT_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!jwtRes.ok) {
    throw new Error(`Cozytouch JWT failed: ${jwtRes.status}`);
  }

  const jwt = (await jwtRes.text()).replace(/"/g, "").trim();

  // Step 3: Login to Overkiz with JWT
  const loginRes = await fetch(`${OVERKIZ_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ jwt }),
    redirect: "manual",
  });

  // Extract JSESSIONID from Set-Cookie header
  const setCookie = loginRes.headers.get("set-cookie") ?? "";
  const match = setCookie.match(/JSESSIONID=([^;]+)/);
  if (!match) {
    throw new Error("Cozytouch login: no JSESSIONID in response");
  }

  return `JSESSIONID=${match[1]}`;
}

async function getSession(): Promise<string> {
  // Check in-memory cache
  const cached = getCached<string>(SESSION_KEY);
  if (cached) return cached;

  // Check Redis
  try {
    const stored = await getRedis().get<string>(SESSION_KEY);
    if (stored) {
      setCached(SESSION_KEY, stored);
      return stored;
    }
  } catch (e) {
    console.error("Cozytouch Redis get session error:", e);
  }

  // Login
  const session = await cozytouchLogin();
  try {
    await getRedis().set(SESSION_KEY, session, { ex: SESSION_TTL });
  } catch (e) {
    console.error("Cozytouch Redis set session error:", e);
  }
  setCached(SESSION_KEY, session);
  return session;
}

function invalidateSession() {
  invalidateCache(SESSION_KEY);
  getRedis().del(SESSION_KEY).catch(() => {});
}

// ─── Generic fetch wrapper ──────────────────────────────────

async function cozytouchFetch<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  retry = true,
): Promise<T> {
  const session = await getSession();

  const res = await fetch(`${OVERKIZ_BASE}${path}`, {
    method,
    headers: {
      Cookie: session,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (res.status === 401 && retry) {
    invalidateSession();
    return cozytouchFetch<T>(method, path, body, false);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cozytouch API error: ${res.status} on ${method} ${path} — ${text}`);
  }

  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text);
}

// ─── Device discovery ───────────────────────────────────────

interface OverkizDevice {
  deviceURL: string;
  label: string;
  controllableName: string;
  available: boolean;
  states: { name: string; type: number; value: unknown }[];
}

interface DeviceURLs {
  deviceURL: string;
  sensorURL?: string;
}

export async function getDeviceURLs(): Promise<DeviceURLs> {
  // Check in-memory cache
  const cachedDevice = getCached<string>(DEVICE_URL_KEY);
  const cachedSensor = getCached<string>(SENSOR_URL_KEY);
  if (cachedDevice) return { deviceURL: cachedDevice, sensorURL: cachedSensor ?? undefined };

  // Check Redis
  try {
    const [storedDevice, storedSensor] = await Promise.all([
      getRedis().get<string>(DEVICE_URL_KEY),
      getRedis().get<string>(SENSOR_URL_KEY),
    ]);
    if (storedDevice) {
      setCached(DEVICE_URL_KEY, storedDevice);
      if (storedSensor) setCached(SENSOR_URL_KEY, storedSensor);
      return { deviceURL: storedDevice, sensorURL: storedSensor ?? undefined };
    }
  } catch (e) {
    console.error("Cozytouch Redis get device URL error:", e);
  }

  // Discover
  const devices = await cozytouchFetch<OverkizDevice[]>("GET", "/setup/devices");
  const dhw = devices.find((d) =>
    d.controllableName.includes("DomesticHotWaterProduction"),
  );
  if (!dhw) throw new Error("No Cozytouch water heater found");

  const sensor = devices.find((d) =>
    d.controllableName.includes("CumulatedElectricalEnergyConsumption"),
  );

  // Cache in Redis (24h)
  try {
    await getRedis().set(DEVICE_URL_KEY, dhw.deviceURL, { ex: 86400 });
    if (sensor) await getRedis().set(SENSOR_URL_KEY, sensor.deviceURL, { ex: 86400 });
  } catch (e) {
    console.error("Cozytouch Redis set device URL error:", e);
  }
  setCached(DEVICE_URL_KEY, dhw.deviceURL);
  if (sensor) setCached(SENSOR_URL_KEY, sensor.deviceURL);

  return { deviceURL: dhw.deviceURL, sensorURL: sensor?.deviceURL };
}

// ─── Device state ───────────────────────────────────────────

interface OverkizState {
  name: string;
  type: number;
  value: unknown;
}

function findState<T>(states: OverkizState[], name: string): T | undefined {
  const s = states.find((st) => st.name === name);
  return s?.value as T | undefined;
}

export async function getRawStates(deviceURL: string): Promise<OverkizState[]> {
  const encodedURL = encodeURIComponent(deviceURL);
  return cozytouchFetch<OverkizState[]>("GET", `/setup/devices/${encodedURL}/states`);
}

export async function getWaterHeaterStatus(): Promise<CozytouchWaterHeaterStatus> {
  const { deviceURL, sensorURL } = await getDeviceURLs();
  const states = await getRawStates(deviceURL);

  const bottomTemp = findState<number>(states, "core:BottomTankWaterTemperatureState") ?? 0;
  const middleTemp = findState<number>(states, "modbuslink:MiddleWaterTemperatureState");
  const targetTemp = findState<number>(states, "core:TargetDHWTemperatureState") ?? 55;
  const dhwMode = (findState<string>(states, "modbuslink:DHWModeState") ?? "autoMode") as CozytouchDHWMode;
  const boostMode = findState<string>(states, "modbuslink:DHWBoostModeState");
  const heatingStatus = findState<string>(states, "core:HeatingStatusState");
  const remainingHotWater = findState<number>(states, "core:RemainingHotWaterState");
  const showersRemaining = findState<number>(states, "core:NumberOfShowerRemainingState");
  const capacity = findState<number>(states, "modbuslink:DHWCapacityState");
  const powerHeatPump = findState<number>(states, "modbuslink:PowerHeatPumpState");
  const powerElectric = findState<number>(states, "modbuslink:PowerHeatElectricalState");

  // Energy consumption from sensor
  let energyConsumption: number | undefined;
  if (sensorURL) {
    try {
      const sensorStates = await getRawStates(sensorURL);
      energyConsumption = findState<number>(sensorStates, "core:ElectricEnergyConsumptionState");
    } catch {
      // Sensor read failure is non-critical
    }
  }

  return {
    bottomTemperature: Math.round(bottomTemp * 10) / 10,
    middleTemperature: middleTemp != null ? Math.round(middleTemp) : undefined,
    targetTemperature: Math.round(targetTemp),
    mode: dhwMode,
    isHeating: heatingStatus === "Heating",
    boostActive: boostMode === "on",
    remainingHotWater: remainingHotWater != null ? Math.round(remainingHotWater) : undefined,
    showersRemaining: showersRemaining != null ? showersRemaining : undefined,
    capacity: capacity != null ? Math.round(capacity) : undefined,
    powerHeatPump: powerHeatPump != null ? powerHeatPump : undefined,
    powerElectric: powerElectric != null ? powerElectric : undefined,
    isAvailable: states.length > 0,
    energyConsumption: energyConsumption != null ? Math.round(energyConsumption) : undefined,
  };
}

// ─── Commands ───────────────────────────────────────────────

async function executeCommand(deviceURL: string, name: string, params: unknown[]) {
  await cozytouchFetch("POST", "/exec/apply", {
    label: "coliving-barbusse",
    actions: [
      {
        deviceURL,
        commands: [{ name, parameters: params }],
      },
    ],
  });
}

export async function setDHWMode(mode: CozytouchDHWMode) {
  const { deviceURL } = await getDeviceURLs();
  await executeCommand(deviceURL, "setDHWMode", [mode]);
}

export async function setBoostModeDuration(duration: number) {
  const { deviceURL } = await getDeviceURLs();
  await executeCommand(deviceURL, "setBoostModeDuration", [duration]);
}

export async function setTargetTemperature(temp: number) {
  const { deviceURL } = await getDeviceURLs();
  await executeCommand(deviceURL, "setTargetTemperature", [temp]);
}

export async function refreshState() {
  const { deviceURL } = await getDeviceURLs();
  await executeCommand(deviceURL, "refreshState", []);
}
