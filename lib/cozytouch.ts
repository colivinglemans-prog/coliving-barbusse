import { getRedis } from "./redis";
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

/**
 * `fresh` : ignore les deux caches et ouvre une session neuve. Le second essai après un 401
 * doit passer par là — relire Redis lui rendrait la session expirée qu'il vient de recevoir
 * (cause des erreurs « 401 Not authenticated » une heure sur deux, 2026-11-07).
 */
async function getSession(fresh = false): Promise<string> {
  if (!fresh) {
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

// ─── Generic fetch wrapper ──────────────────────────────────

async function cozytouchFetch<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  retry = true,
): Promise<T> {
  // Le second essai (retry = false) suit un 401 : session neuve obligatoire.
  const session = await getSession(!retry);

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
    invalidateCache(SESSION_KEY);
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

function toNumber(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
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
  // Type exact non documenté (nombre ou chaîne selon les firmwares) : converti, ou ignoré.
  const heatPumpHours = toNumber(findState<unknown>(states, "modbuslink:HeatPumpOperatingTimeState"));
  const electricHours = toNumber(findState<unknown>(states, "modbuslink:ElectricBoosterOperatingTimeState"));

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
    heatPumpHours,
    electricHours,
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

export async function setBoostMode(on: boolean) {
  const { deviceURL } = await getDeviceURLs();
  await executeCommand(deviceURL, "setBoostMode", [on ? "on" : "off"]);
}

export async function setTargetTemperature(temp: number) {
  const { deviceURL } = await getDeviceURLs();
  await executeCommand(deviceURL, "setTargetDHWTemperature", [temp]);
}

export async function refreshState() {
  const { deviceURL } = await getDeviceURLs();
  // Refresh key states
  await executeCommand(deviceURL, "refreshBottomTankWaterTemperature", []);
  await executeCommand(deviceURL, "refreshMiddleWaterTemperature", []);
  await executeCommand(deviceURL, "refreshHeatingStatus", []);
  await executeCommand(deviceURL, "refreshDHWMode", []);
  await executeCommand(deviceURL, "refreshBoostMode", []);
  await executeCommand(deviceURL, "refreshRemainingHotWater", []);
  await executeCommand(deviceURL, "refreshNumberOfShowerRemaining", []);
}

// ─── Profil d'occupation et appoint électrique ────────────────

export type WaterHeaterProfile = "vacant" | "low" | "normal" | "high" | "xl";

export interface WaterHeaterProfileSettings {
  mode: CozytouchDHWMode;
  targetTemperature: number;
  boost: boolean;
}

export function getWaterHeaterProfile(guests: number): WaterHeaterProfile {
  if (guests <= 0) return "vacant";
  if (guests <= 4) return "low";
  if (guests <= 8) return "normal";
  if (guests <= 12) return "high";
  return "xl";
}

/**
 * Règle de l'appoint électrique du thermo (1 800 W), depuis les coupures des 7, 8 et 9 novembre
 * 2026 (9 kVA, 14 voyageurs) : il chauffait le soir et la nuit, en même temps que la cuisine,
 * les radiateurs en confort et le ballon classique de 300 L.
 *
 * **Par défaut, PAC seule** (`manualEcoActive`). L'appoint n'est permis que si les trois
 * conditions sont réunies :
 *
 * 1. **10 h ≤ heure < 16 h** (`hours`) ;
 * 2. **la charge estimée des radiateurs** (`lib/radiator-load.ts`) est connue et sous
 *    `ELECTRICAL_BUDGET.boosterRadiatorBudgetW` — le jour d'arrivée, la remise en chauffe la
 *    fait monter et l'appoint est refusé de lui-même ;
 * 3. **la PAC ne suffit pas** : milieu du ballon sous `pacSufficientMiddle`, ou PAC à l'arrêt
 *    (`heatPumpStalled`). Sinon l'appoint remplace de la PAC, trois fois moins chère (le 9/11,
 *    7 h d'appoint seul pendant que la PAC était bloquée).
 */
export const BOOSTER_RULE = {
  hours: { from: 10, to: 16 },
  pacSufficientMiddle: 45,
  /** Appoint déjà permis : il le reste jusqu'à ce milieu (hystérésis, pas de bascule à chaque quart d'heure). */
  pacSufficientMiddleWhileBoosting: 50,
  /**
   * Une PAC dont le compteur d'heures n'a pas bougé depuis ce délai est à l'arrêt. Deux heures et
   * non une : le compteur remonte des **heures entières** ; une PAC qui tourne depuis 45 min peut
   * ne pas avoir changé d'heure.
   */
  stalledAfterMs: 2 * 60 * 60 * 1000,
  /** Eau « sous la consigne » : plus de `stalledGapC` degrés en dessous. */
  stalledGapC: 5,
  // Une sonde décrochée remonte 0 : hors de cette plage, la sonde du milieu est ignorée.
  plausible: { min: 5, max: 85 },
} as const;

/** La sonde du milieu, ou `undefined` si absente ou hors plage (liaison modbus décrochée). */
export function plausibleMiddle(
  status: Pick<CozytouchWaterHeaterStatus, "middleTemperature">,
): number | undefined {
  const t = status.middleTemperature;
  const { min, max } = BOOSTER_RULE.plausible;
  return t != null && t >= min && t <= max ? t : undefined;
}

/**
 * PAC à l'arrêt : son compteur d'heures n'a pas bougé depuis une mesure vieille d'au moins une
 * heure, alors que l'eau est nettement sous la consigne (elle devrait chauffer).
 */
export function heatPumpStalled(
  status: Pick<CozytouchWaterHeaterStatus, "heatPumpHours" | "middleTemperature" | "bottomTemperature" | "targetTemperature">,
  earlier: { at: string; heatPumpHours?: number } | null,
  now: Date,
): boolean {
  if (!earlier || earlier.heatPumpHours == null || status.heatPumpHours == null) return false;
  if (now.getTime() - new Date(earlier.at).getTime() < BOOSTER_RULE.stalledAfterMs) return false;
  const bottom = status.bottomTemperature >= BOOSTER_RULE.plausible.min ? status.bottomTemperature : undefined;
  const water = plausibleMiddle(status) ?? bottom;
  if (water === undefined) return false;
  return status.heatPumpHours === earlier.heatPumpHours && water < status.targetTemperature - BOOSTER_RULE.stalledGapC;
}

export type BoosterReason = "allowed" | "vacant" | "hours" | "load-unknown" | "load" | "pac-ok";

export interface BoosterInput {
  guests: number;
  hour: number;
  /** Charge estimée des radiateurs, `null` si inconnue. */
  radiatorLoadW: number | null;
  budgetW: number;
  status: Pick<CozytouchWaterHeaterStatus, "middleTemperature">;
  stalled: boolean;
  /** L'appoint était permis au passage précédent (hystérésis sur le milieu du ballon). */
  wasAllowed?: boolean;
}

export function decideBooster(input: BoosterInput): { allowed: boolean; reason: BoosterReason } {
  const { from, to } = BOOSTER_RULE.hours;
  if (input.guests <= 0) return { allowed: false, reason: "vacant" };
  if (input.hour < from || input.hour >= to) return { allowed: false, reason: "hours" };
  if (input.radiatorLoadW === null) return { allowed: false, reason: "load-unknown" };
  if (input.radiatorLoadW > input.budgetW) return { allowed: false, reason: "load" };
  const middle = plausibleMiddle(input.status);
  const threshold = input.wasAllowed ? BOOSTER_RULE.pacSufficientMiddleWhileBoosting : BOOSTER_RULE.pacSufficientMiddle;
  const needed = input.stalled || (middle !== undefined && middle < threshold);
  if (!needed) return { allowed: false, reason: "pac-ok" };
  return { allowed: true, reason: "allowed" };
}

/** En clair, pour les journaux, les alertes et le dashboard. */
export const BOOSTER_REASON_LABEL: Record<BoosterReason, string> = {
  allowed: "appoint permis",
  vacant: "maison vide",
  hours: "hors de 10 h-16 h",
  "load-unknown": "charge des radiateurs inconnue",
  load: "radiateurs trop chargés",
  "pac-ok": "la PAC suffit",
};

/**
 * Réglages par profil. Sans appoint : PAC seule, 55 °C (le point où le COP de 2,66 est mesuré),
 * 50 °C maison vide. Avec appoint : `manualEcoInactive`, plus le boost et 60 °C à partir de
 * 9 personnes.
 */
export function getProfileSettings(profile: WaterHeaterProfile, boosterAllowed: boolean): WaterHeaterProfileSettings {
  if (profile === "vacant") return { mode: "manualEcoActive", targetTemperature: 50, boost: false };
  const big = profile === "high" || profile === "xl";
  if (!boosterAllowed) return { mode: "manualEcoActive", targetTemperature: 55, boost: false };
  return { mode: "manualEcoInactive", targetTemperature: big ? 60 : 55, boost: big };
}

/** Réglages attendus : la même fonction pour l'automation, le contrôle et le dashboard. */
export function getExpectedSettings(
  guests: number,
  boosterAllowed: boolean,
): WaterHeaterProfileSettings & { profile: WaterHeaterProfile } {
  const profile = getWaterHeaterProfile(guests);
  return { ...getProfileSettings(profile, boosterAllowed), profile };
}
