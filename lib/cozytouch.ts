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

interface OverkizGateway {
  gatewayId?: string;
  alive?: boolean;
  connectivity?: { status?: string };
}

export interface WaterHeaterConnectivity {
  /** `available` de l'appareil chez Overkiz, `null` si l'appareil n'est pas listé. */
  deviceAvailable: boolean | null;
  /** Passerelle du thermo (identifiant tiré de son `deviceURL`), `null` si introuvable. */
  gatewayAlive: boolean | null;
  gatewayStatus: string | null;
}

/** L'identifiant de passerelle d'un `deviceURL` Overkiz (`modbuslink://1908-1459-2296/1#1`). */
export function gatewayIdOf(deviceURL: string): string | null {
  const m = /^[a-z]+:\/\/([^/]+)\//.exec(deviceURL);
  return m ? m[1] : null;
}

/**
 * Le thermo est-il vraiment joignable ? Les états (`getRawStates`) restent servis en cache quand
 * il n'a plus de courant : le 10/11 au soir, circuit du garage coupé, Cozytouch a renvoyé les
 * mêmes valeurs toute la nuit et l'alerte « hors ligne » n'est jamais partie. On juge sur
 * `available` de l'appareil et sur l'état de sa passerelle. Une valeur inconnue (`null`) ne
 * compte pas comme une coupure.
 */
export function isUnreachable(c: WaterHeaterConnectivity): boolean {
  if (c.deviceAvailable === false) return true;
  if (c.gatewayAlive === false) return true;
  return c.gatewayStatus !== null && c.gatewayStatus !== "OK";
}

export async function getConnectivity(): Promise<WaterHeaterConnectivity> {
  const { deviceURL } = await getDeviceURLs();
  const devices = await cozytouchFetch<OverkizDevice[]>("GET", "/setup/devices");
  const dhw = devices.find((d) => d.deviceURL === deviceURL);
  let gateway: OverkizGateway | undefined;
  try {
    const gateways = await cozytouchFetch<OverkizGateway[]>("GET", "/setup/gateways");
    const id = gatewayIdOf(deviceURL);
    gateway = gateways.find((g) => g.gatewayId === id) ?? (gateways.length === 1 ? gateways[0] : undefined);
  } catch {
    gateway = undefined;
  }
  return {
    deviceAvailable: dhw ? dhw.available : null,
    gatewayAlive: typeof gateway?.alive === "boolean" ? gateway.alive : null,
    gatewayStatus: gateway?.connectivity?.status ?? null,
  };
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
  const absenceMode = findState<string>(states, "modbuslink:DHWAbsenceModeState");
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
    absenceActive: absenceMode === "on",
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

/**
 * Mode Absence : coupe toute la chauffe du thermo (testé le 9/11 au soir : compteur d'énergie
 * figé 10 à 15 min après la commande). Seul moyen de couper l'appoint : en Éco, le thermo le lance
 * quand même. État : `modbuslink:DHWAbsenceModeState`.
 */
export async function setAbsenceMode(on: boolean) {
  const { deviceURL } = await getDeviceURLs();
  await executeCommand(deviceURL, "setAbsenceMode", [on ? "on" : "off"]);
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

// ─── Profil d'occupation et heures de pic ─────────────────────

export type WaterHeaterProfile = "vacant" | "low" | "normal" | "high" | "xl";

export interface WaterHeaterProfileSettings {
  mode: CozytouchDHWMode;
  targetTemperature: number;
  boost: boolean;
  /** Mode Absence : le thermo ne chauffe plus du tout (ni PAC, ni appoint). */
  absence: boolean;
}

export function getWaterHeaterProfile(guests: number): WaterHeaterProfile {
  if (guests <= 0) return "vacant";
  if (guests <= 4) return "low";
  if (guests <= 8) return "normal";
  if (guests <= 12) return "high";
  return "xl";
}

/**
 * Heures de pic de la maison, où le thermo passe en **Absence** (coupures des 7, 8 et 9 novembre
 * 2026, 9 kVA, 14 voyageurs).
 *
 * Mesuré le 9/11 au soir (compteur d'énergie du thermo) : en Éco (`manualEcoActive`), le thermo
 * lance quand même son appoint de 1 800 W — environ 2,1 kW consommés toute la soirée, PAC
 * comprise (la PAC seule consomme ~300 W). Le mode Absence, lui, coupe toute la chauffe, avec
 * 10 à 15 min de retard (compteur figé dès 22 h 34 pour une Absence posée à 22 h 20). C'est le
 * seul interrupteur qui marche.
 *
 * - **16 h 45 – 22 h** : le dîner, la bascule des chambres en confort à 20 h ; posé à 16 h 45
 *   pour agir à 17 h.
 * - **4 h 45 – 7 h** : la bascule du RDC en confort à 5 h et les premières douches.
 *
 * Le ballon classique de 300 L, en aval, fournit l'eau chaude pendant ces plages. Hors pic, le
 * thermo est en Éco 55 °C et gère lui-même PAC et appoint (ce qui couvre une PAC bloquée).
 * Plages en minutes depuis minuit, heure de Paris.
 */
export const PEAK_WINDOWS = [
  { from: 4 * 60 + 45, to: 7 * 60 },
  { from: 16 * 60 + 45, to: 22 * 60 },
] as const;

export function isPeak(hour: number, minute = 0): boolean {
  const t = hour * 60 + minute;
  return PEAK_WINDOWS.some((w) => t >= w.from && t < w.to);
}

/**
 * Réglages par profil : Éco (`manualEcoActive`) 55 °C occupé, 50 °C vide, jamais de boost
 * automatique ; **Absence pendant les heures de pic** quand des voyageurs sont là.
 */
export function getProfileSettings(profile: WaterHeaterProfile, peak: boolean): WaterHeaterProfileSettings {
  if (profile === "vacant") return { mode: "manualEcoActive", targetTemperature: 50, boost: false, absence: false };
  return { mode: "manualEcoActive", targetTemperature: 55, boost: false, absence: peak };
}

/** Réglages attendus : la même fonction pour l'automation, le contrôle et le dashboard. */
export function getExpectedSettings(
  guests: number,
  hour: number,
  minute = 0,
): WaterHeaterProfileSettings & { profile: WaterHeaterProfile; peak: boolean } {
  const profile = getWaterHeaterProfile(guests);
  const peak = isPeak(hour, minute);
  return { ...getProfileSettings(profile, peak), profile, peak };
}

// Une sonde décrochée remonte 0 : hors de cette plage, une sonde est ignorée.
const PLAUSIBLE = { min: 5, max: 85 } as const;

/** La sonde du milieu, ou `undefined` si absente ou hors plage (liaison modbus décrochée). */
export function plausibleMiddle(
  status: Pick<CozytouchWaterHeaterStatus, "middleTemperature">,
): number | undefined {
  const t = status.middleTemperature;
  return t != null && t >= PLAUSIBLE.min && t <= PLAUSIBLE.max ? t : undefined;
}

/**
 * PAC à l'arrêt : compteur d'heures immobile depuis une mesure vieille d'au moins **2 h** (le
 * compteur remonte des heures entières), eau à plus de 5 °C sous la consigne, et **aucune Absence**
 * dans l'intervalle (en Absence, la PAC s'arrête normalement). En Éco, le thermo compense alors
 * par l'appoint : l'alerte sert à le savoir (coût ×3), pas à sauver l'eau chaude.
 */
export const PAC_STALL = { afterMs: 2 * 60 * 60 * 1000, gapC: 5 } as const;

export function heatPumpStalled(
  status: Pick<
    CozytouchWaterHeaterStatus,
    "heatPumpHours" | "middleTemperature" | "bottomTemperature" | "targetTemperature" | "absenceActive"
  >,
  earlier: { at: string; heatPumpHours?: number } | null,
  now: Date,
  absenceSince: boolean,
): boolean {
  if (status.absenceActive || absenceSince) return false;
  if (!earlier || earlier.heatPumpHours == null || status.heatPumpHours == null) return false;
  if (now.getTime() - new Date(earlier.at).getTime() < PAC_STALL.afterMs) return false;
  const bottom = status.bottomTemperature >= PLAUSIBLE.min ? status.bottomTemperature : undefined;
  const water = plausibleMiddle(status) ?? bottom;
  if (water === undefined) return false;
  return status.heatPumpHours === earlier.heatPumpHours && water < status.targetTemperature - PAC_STALL.gapC;
}
