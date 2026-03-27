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

export interface DashboardStats {
  revenueByMonth: MonthRevenue[];
  occupancyRate: number;
  channelDistribution: { channel: string; count: number; revenue: number }[];
  totalRevenue: number;
  totalBookings: number;
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
  cftTemp?: number; // comfort temp in tenths (e.g. 210 = 21.0°C)
  ecoTemp?: number; // eco temp in tenths (e.g. 170 = 17.0°C)
  devices: HeatzyDeviceConfig[];
}

export interface HeatzyZoneConfig {
  zones: HeatzyZone[];
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
