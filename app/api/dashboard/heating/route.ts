import { NextResponse } from "next/server";
import { getDevices, getDeviceStatus, getZoneConfig, getLockedDevices, getOccupiedMode, getHeatingRules } from "@/lib/heatzy";
import { getBookings } from "@/lib/beds24";
import type { HeatzyDevice, HeatzyDeviceAlert } from "@/lib/types";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function hasActiveReservation(
  bookings: { arrival: string; departure: string }[],
): boolean {
  const today = todayStr();
  return bookings.some((b) => b.arrival <= today && b.departure > today);
}

const MODE_LABELS: Record<string, string> = {
  cft: "confort",
  cft1: "confort-1",
  cft2: "confort-2",
  eco: "éco",
  fro: "hors-gel",
  stop: "stop",
  presence: "présence",
};

function modeLabel(mode: string) {
  return MODE_LABELS[mode] ?? mode;
}

/** Returns the target temperature (°C) for the current mode */
function getTargetTemp(
  mode: string,
  deviceCftTemp?: number,
  deviceEcoTemp?: number,
): number | undefined {
  if (mode.startsWith("cft")) return deviceCftTemp;
  if (mode === "eco") return deviceEcoTemp;
  if (mode === "fro") return 7;
  if (mode === "stop") return undefined;
  return undefined;
}

export async function GET() {
  try {
    const config = getZoneConfig();
    const allDeviceConfigs = config.zones.flatMap((z) =>
      z.devices.map((d) => ({ ...d, zone: z })),
    );

    // Fetch device list and active bookings in parallel
    const [rawDevices, activeBookings] = await Promise.all([
      getDevices(),
      getBookings({
        arrivalTo: todayStr(),
        departureFrom: todayStr(),
      }).catch(() => []),
    ]);

    const occupied = hasActiveReservation(activeBookings);
    const rawDeviceMap = new Map(rawDevices.map((d) => [d.did, d]));
    const currentHour = new Date().getHours();

    // Check for same-day turnaround and next check-in
    const today = todayStr();
    const hasCheckOutToday = activeBookings.some((b) => b.departure === today);
    const hasCheckInToday = activeBookings.some((b) => b.arrival === today);
    const hasSameDayTurnaround = hasCheckOutToday && hasCheckInToday;
    const futureBookings = activeBookings
      .filter((b) => b.arrival > today)
      .sort((a, b) => a.arrival.localeCompare(b.arrival));
    const nextCheckIn = futureBookings[0]?.arrival;

    // Compute heating rules
    const rules = getHeatingRules(occupied, currentHour, hasSameDayTurnaround, nextCheckIn);
    const lockedDevices = await getLockedDevices();

    // Fetch detailed status for each configured device in parallel
    const statusPromises = allDeviceConfigs.map(async (deviceConfig) => {
      try {
        const status = await getDeviceStatus(deviceConfig.did);
        const rawDevice = rawDeviceMap.get(deviceConfig.did);
        const isOnline = rawDevice?.is_online ?? false;

        // Parse device attributes
        const derogMode = status.derog_mode as number | undefined;
        const baseMode = (status.mode as string) ?? "unknown";
        const mode = derogMode === 3 ? "presence" : baseMode;
        const isHeating = (status.Heating_state as number) === 1;
        const isLocked = lockedDevices.has(deviceConfig.did);
        // Presence detection: only available when derog_mode=3
        const presenceDetected = derogMode === 3 ? baseMode.startsWith("cft") : undefined;
        const curTemp = typeof status.cur_temp === "number" ? Math.round(status.cur_temp / 10) : undefined;
        const deviceCftTemp = typeof status.cft_temp === "number" ? (status.cft_temp as number) / 10 : undefined;
        const deviceEcoTemp = typeof status.eco_temp === "number" ? (status.eco_temp as number) / 10 : undefined;

        // Target temp is based on the actual base mode (what the radiator is doing)
        const targetTemp = getTargetTemp(baseMode, deviceCftTemp, deviceEcoTemp);

        // Zone defaults for comparison
        const zoneCftTemp = deviceConfig.zone.cftTemp ? deviceConfig.zone.cftTemp / 10 : undefined;
        const zoneEcoTemp = deviceConfig.zone.ecoTemp ? deviceConfig.zone.ecoTemp / 10 : undefined;

        // ─── Alert detection ──────────────────────────────────
        const alerts: HeatzyDeviceAlert[] = [];

        // === ALWAYS ===

        if (!isOnline) {
          alerts.push({
            level: "error",
            message: "Hors ligne — vérifier branchement / WiFi",
          });
        }

        // Only warn if guest INCREASED temperature (decreases are accepted)
        if (isOnline && zoneCftTemp && deviceCftTemp && deviceCftTemp > zoneCftTemp + 0.5) {
          alerts.push({
            level: "warning",
            message: `Consigne confort augmentée : ${deviceCftTemp}°C au lieu de ${zoneCftTemp}°C`,
          });
        }

        if (isOnline && zoneEcoTemp && deviceEcoTemp && deviceEcoTemp > zoneEcoTemp + 0.5) {
          alerts.push({
            level: "warning",
            message: `Consigne éco augmentée : ${deviceEcoTemp}°C au lieu de ${zoneEcoTemp}°C`,
          });
        }

        if (isOnline && !occupied) {
          // === A) PAS DE RÉSERVATION ===

          if (isHeating && curTemp !== undefined && curTemp > 10) {
            alerts.push({
              level: "error",
              message: `Chauffe sans réservation (${curTemp}°C) — vérifier sur place`,
            });
          }

          if (curTemp !== undefined && deviceCftTemp !== undefined && curTemp > deviceCftTemp + 3) {
            alerts.push({
              level: "warning",
              message: `Température anormale (${curTemp}°C pour consigne ${deviceCftTemp}°C)`,
            });
          }
        }

        if (isOnline && occupied) {
          // === B) RÉSERVATION ACTIVE ===

          // Check if device is in the expected mode for this zone/hour
          const expectedZoneMode = getOccupiedMode(deviceConfig.zone, currentHour);
          if (expectedZoneMode === "presence" && derogMode !== 3) {
            alerts.push({
              level: "warning",
              message: `Pas en mode présence — mode actuel : ${modeLabel(baseMode)}`,
            });
          }

          // Température trop élevée
          if (curTemp !== undefined && deviceCftTemp !== undefined && curTemp > deviceCftTemp + 3) {
            alerts.push({
              level: "warning",
              message: `Température anormale (${curTemp}°C pour consigne ${deviceCftTemp}°C)`,
            });
          }

          // Chauffe mais n'atteint pas la consigne
          if (isHeating && curTemp !== undefined && targetTemp !== undefined && curTemp < targetTemp - 5) {
            alerts.push({
              level: "warning",
              message: `Chauffe mais n'atteint pas la consigne (${curTemp}°C pour ${targetTemp}°C) — vérifier sur place`,
            });
          }

          // Ne chauffe pas alors que la pièce est froide
          if (!isHeating && curTemp !== undefined && targetTemp !== undefined && curTemp < targetTemp - 3 && baseMode !== "stop" && baseMode !== "fro") {
            alerts.push({
              level: "error",
              message: `Ne chauffe pas alors que la pièce est froide (${curTemp}°C pour ${targetTemp}°C) — vérifier le radiateur`,
            });
          }
        }

        return {
          did: deviceConfig.did,
          name: deviceConfig.name,
          zone: deviceConfig.zone.id,
          mode,
          isOnline,
          isHeating,
          isLocked,
          presenceDetected,
          temperature: curTemp,
          cftTemp: deviceCftTemp,
          ecoTemp: deviceEcoTemp,
          expectedMode: isLocked ? "fro" : (occupied ? getOccupiedMode(deviceConfig.zone, currentHour) : "fro"),
          targetTemp,
          alerts,
        } as HeatzyDevice;
      } catch {
        return {
          did: deviceConfig.did,
          name: deviceConfig.name,
          zone: deviceConfig.zone.id,
          mode: "unknown",
          isOnline: false,
          isHeating: false,
          isLocked: lockedDevices.has(deviceConfig.did),
          alerts: [{
            level: "error" as const,
            message: "Impossible de récupérer le statut — vérifier la connexion",
          }],
        } as HeatzyDevice;
      }
    });

    const deviceStatuses = await Promise.all(statusPromises);
    const statusMap = new Map(deviceStatuses.map((d) => [d.did, d]));

    // Build zones
    let alertCount = 0;
    const zones = config.zones.map((zone) => {
      const devices: HeatzyDevice[] = zone.devices
        .map((dc) => statusMap.get(dc.did))
        .filter((d): d is HeatzyDevice => d !== null && d !== undefined)
        .sort((a, b) => {
          const aLevel = a.alerts.some((al) => al.level === "error") ? 0 : a.alerts.length > 0 ? 1 : 2;
          const bLevel = b.alerts.some((al) => al.level === "error") ? 0 : b.alerts.length > 0 ? 1 : 2;
          if (aLevel !== bLevel) return aLevel - bLevel;
          return a.name.localeCompare(b.name, "fr", { numeric: true });
        });

      alertCount += devices.filter((d) => d.alerts.length > 0).length;

      return {
        id: zone.id,
        label: zone.label,
        defaultMode: zone.defaultMode,
        cftTemp: zone.cftTemp ? zone.cftTemp / 10 : undefined,
        ecoTemp: zone.ecoTemp ? zone.ecoTemp / 10 : undefined,
        devices,
      };
    });

    return NextResponse.json({ zones, alertCount, occupied, ...rules });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
