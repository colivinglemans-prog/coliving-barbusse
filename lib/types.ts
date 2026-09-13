/**
 * Format de transport de Beds24 — **monté dans le socle au Lot 2**.
 *
 * Réexporté ici sous ses noms d'origine pour que les dix modules qui parlent vraiment à
 * l'API — factures, taxe de séjour, commissions, code Nuki, notifications d'arrivée — gardent
 * leur import. Ils ont besoin de la forme brute, avec `invoiceItems` et `infoItems` ; tout ce
 * qui **calcule** doit passer par `Booking` (`@sejour/socle/lib/booking`), auquel
 * `lib/beds24.ts` traduit.
 */
export type {
  Beds24Booking,
  Beds24InfoItem,
  Beds24InvoiceItem,
  Beds24Property,
} from "@sejour/socle/lib/beds24-types";

// ─── Heatzy Pilote Pro ──────────────────────────────────────

export type HeatzyMode = "cft" | "eco" | "fro" | "stop" | "presence";

export interface HeatzyDeviceAlert {
  level: "error" | "warning";
  message: string;
}

export interface HeatzyDevice {
  did: string;
  name: string;
  zone: string;
  mode: HeatzyMode | string;
  curSignal?: string;          // signal réellement envoyé par le fil pilote
  isOnline: boolean;
  isHeating: boolean;          // true si le radiateur chauffe actuellement
  temperature?: number;
  humidity?: number;
  cftTemp?: number;            // température confort actuelle du device (°C)
  ecoTemp?: number;            // température éco actuelle du device (°C)
  isLocked: boolean;            // true si verrouillé en hors-gel (ignoré par les crons)
  pilotLocked: boolean;         // true si boutons physiques du Heatzy verrouillés
  presenceDetected?: boolean;   // true si capteur détecte quelqu'un (seulement en mode présence)
  expectedMode?: HeatzyMode | string;
  targetTemp?: number;         // consigne attendue en °C
  alerts: HeatzyDeviceAlert[]; // liste des alertes (peut en avoir plusieurs)
}

export interface HeatzyDeviceConfig {
  did: string;
  name: string;
  defaultMode: HeatzyMode;
}

export interface HeatzyZone {
  id: string;
  label: string;
  defaultMode: HeatzyMode;
  nightMode?: HeatzyMode; // mode applied 0h-5h during reservation (e.g. "presence" for common areas)
  cftTemp?: number; // comfort temp in tenths (e.g. 210 = 21.0°C)
  ecoTemp?: number; // eco temp in tenths (e.g. 170 = 17.0°C)
  devices: HeatzyDeviceConfig[];
}

export interface HeatzyZoneConfig {
  zones: HeatzyZone[];
  excludedDevices?: string[]; // DIDs to ignore in scans (personal devices)
  roomMapping: Record<
    string,
    {
      beds24PropertyId: number;
      beds24RoomId?: number;
      zoneId: string;
      deviceIds: string[];
    }
  >;
}

// ─── Cozytouch Water Heater ────────────────────────────────

export type CozytouchDHWMode = "autoMode" | "manualEcoActive" | "manualEcoInactive";

export interface CozytouchWaterHeaterStatus {
  bottomTemperature: number;
  middleTemperature?: number;
  targetTemperature: number;
  mode: CozytouchDHWMode;
  isHeating: boolean;
  boostActive: boolean;
  remainingHotWater?: number;
  showersRemaining?: number;
  capacity?: number;
  powerHeatPump?: number;
  powerElectric?: number;
  isAvailable: boolean;
  energyConsumption?: number;
}
