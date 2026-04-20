export type RevenueMode =
  | "averagedPerNight"
  | "byCheckIn"
  | "byCheckOut"
  | "byBookingDate";

export interface MonthRevenue {
  month: string;
  realized: number;
  upcoming: number;
  isFuture: boolean;
  occupancyRate: number;
}

export interface SplitMetric {
  global: number;
  house: number;
  room: number;
}

export interface BookingSummary {
  id: number;
  guest: string;
  arrival: string;
  departure: string;
  nights: number;
  price: number;
  tjm: number;
  channel: string;
  type: "house" | "room";
  bookingTime?: string;
  event?: string | null;
}

export interface RevenueProjection {
  /** Tendance actuelle = réalisé + confirmé + (TJM moyen × jours non couverts). */
  projectedRevenue: number;
  daysRemaining: number;
  avgDailyRevenue: number;
  realizedRevenue: number;
  confirmedUpcoming: number;
  /** Garanti = réalisé + confirmé (si aucune nouvelle résa) */
  minimumRevenue: number;
  /**
   * Projection pricing dynamique = réalisé + confirmé + somme(prix Beds24 × taux d'occupation)
   * sur les jours non couverts. Null si les prix ne sont pas disponibles.
   */
  dynamicPricingRevenue: number | null;
  /** Taux d'occupation annuel utilisé pour le calcul dynamique (ratio 0-1) */
  occupancyRatio: number;
}

export interface DashboardStats {
  revenueByMonth: MonthRevenue[];
  occupancyRate: number;
  channelDistribution: { channel: string; count: number; revenue: number }[];
  totalRevenue: number;
  totalBookings: number;
  tjm: SplitMetric;
  revpar: SplitMetric;
  avgStay: SplitMetric;
  avgLeadTime: SplitMetric;
  recentBookings: BookingSummary[];
  topBookings: BookingSummary[];
  projection: RevenueProjection;
}

export interface Beds24Booking {
  id: number;
  propertyId: number;
  roomId: number;
  arrival: string;
  departure: string;
  firstName: string;
  lastName: string;
  status: string;
  price: number;
  referer: string;
  channel: string;
  numAdult: number;
  numChild: number;
  bookingTime: string;
  // Contact / billing fields (Beds24 v2 /bookings response)
  title?: string;      // Civilité OU nom de société (souvent mal utilisé par les clients)
  email?: string;
  mobile?: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  comments?: string;   // Guest comments (printed on invoice)
  notes?: string;      // Internal notes (NOT printed)
  arrivalTime?: string;
  invoiceItems?: Beds24InvoiceItem[];
}

export interface Beds24InvoiceItem {
  id?: number;
  type?: string;          // "charge", "payment", etc.
  description?: string;
  qty?: number;
  amount?: number;        // per unit
  lineTotal?: number;     // some responses include this pre-computed
  vatRate?: number;
  invoiceId?: number | string;
  status?: string;
}

export interface Beds24Property {
  id: number;
  name: string;
}

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
