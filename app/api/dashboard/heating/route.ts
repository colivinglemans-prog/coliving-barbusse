import { NextResponse } from "next/server";
import { getDevices, getDeviceStatus, getZoneConfig } from "@/lib/heatzy";
import { getBookings } from "@/lib/beds24";
import type { HeatzyDevice, HeatzyDeviceAlert } from "@/lib/types";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function isRoomOccupied(
  deviceId: string,
  bookings: { arrival: string; departure: string }[],
  config: ReturnType<typeof getZoneConfig>,
): boolean {
  const today = todayStr();
  for (const mapping of Object.values(config.roomMapping)) {
    if (!mapping.deviceIds.includes(deviceId)) continue;
    for (const booking of bookings) {
      if (booking.arrival <= today && booking.departure > today) {
        return true;
      }
    }
  }
  return false;
}

const MODE_LABELS: Record<string, string> = {
  cft: "confort",
  eco: "éco",
  fro: "hors-gel",
  stop: "stop",
  presence: "présence",
};

function modeLabel(mode: string) {
  return MODE_LABELS[mode] ?? mode;
}

export async function GET() {
  try {
    const config = getZoneConfig();
    const allDeviceConfigs = config.zones.flatMap((z) =>
      z.devices.map((d) => ({ ...d, zone: z })),
    );

    // Fetch device statuses and bookings in parallel
    const [rawDevices, activeBookings] = await Promise.all([
      getDevices(),
      getBookings({
        arrivalTo: todayStr(),
        departureFrom: todayStr(),
      }).catch(() => []),
    ]);

    const rawDeviceMap = new Map(rawDevices.map((d) => [d.did, d]));

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
        const curSignal = status.cur_signal as string | undefined;
        const curTemp = typeof status.cur_temp === "number" ? Math.round(status.cur_temp / 10) : undefined;
        const curHumi = typeof status.cur_humi === "number" ? status.cur_humi as number : undefined;
        const deviceCftTemp = typeof status.cft_temp === "number" ? (status.cft_temp as number) / 10 : undefined;
        const deviceEcoTemp = typeof status.eco_temp === "number" ? (status.eco_temp as number) / 10 : undefined;

        // Expected mode based on occupancy + time
        const occupied = isRoomOccupied(deviceConfig.did, activeBookings, config);
        const currentHour = new Date().getHours();
        const isDaytime = currentHour >= 7 && currentHour < 20;
        const expectedMode = occupied
          ? (isDaytime ? "presence" : "cft")
          : deviceConfig.defaultMode;

        // Zone temperature defaults
        const zoneCftTemp = deviceConfig.zone.cftTemp ? deviceConfig.zone.cftTemp / 10 : undefined;
        const zoneEcoTemp = deviceConfig.zone.ecoTemp ? deviceConfig.zone.ecoTemp / 10 : undefined;

        // ─── Alert detection ──────────────────────────────────
        const alerts: HeatzyDeviceAlert[] = [];

        if (!isOnline) {
          alerts.push({
            level: "error",
            message: "Hors ligne — vérifier branchement / WiFi",
          });
        }

        if (isOnline && occupied && mode === "stop") {
          alerts.push({
            level: "error",
            message: "Éteint alors que chambre occupée — allumer le radiateur",
          });
        }

        // Fil pilote mismatch: API mode != actual signal sent
        if (isOnline && curSignal && derogMode !== 3) {
          // Only check when not in presence mode (presence mode manages signal itself)
          if (curSignal !== baseMode) {
            alerts.push({
              level: "error",
              message: `Signal fil pilote (${modeLabel(curSignal)}) ≠ mode commandé (${modeLabel(baseMode)}) — remettre le boîtier en position fil pilote`,
            });
          }
        }

        // Mode mismatch vs expected (lower priority if fil pilote issue already flagged)
        if (isOnline && mode !== expectedMode && !alerts.some((a) => a.level === "error")) {
          alerts.push({
            level: "warning",
            message: `Mode ${modeLabel(mode)} au lieu de ${modeLabel(expectedMode)}`,
          });
        }

        // Temperature mismatch: guest changed comfort or eco temp
        if (isOnline && zoneCftTemp && deviceCftTemp && Math.abs(deviceCftTemp - zoneCftTemp) >= 1) {
          alerts.push({
            level: "warning",
            message: `Température confort modifiée : ${deviceCftTemp}°C au lieu de ${zoneCftTemp}°C`,
          });
        }
        if (isOnline && zoneEcoTemp && deviceEcoTemp && Math.abs(deviceEcoTemp - zoneEcoTemp) >= 1) {
          alerts.push({
            level: "warning",
            message: `Température éco modifiée : ${deviceEcoTemp}°C au lieu de ${zoneEcoTemp}°C`,
          });
        }

        return {
          did: deviceConfig.did,
          name: deviceConfig.name,
          zone: deviceConfig.zone.id,
          mode,
          curSignal,
          isOnline,
          temperature: curTemp,
          humidity: curHumi,
          cftTemp: deviceCftTemp,
          ecoTemp: deviceEcoTemp,
          expectedMode,
          alerts,
        } as HeatzyDevice;
      } catch {
        return {
          did: deviceConfig.did,
          name: deviceConfig.name,
          zone: deviceConfig.zone.id,
          mode: "unknown",
          isOnline: false,
          alerts: [{
            level: "error" as const,
            message: "Impossible de récupérer le statut — vérifier la connexion",
          }],
        } as HeatzyDevice;
      }
    });

    const deviceStatuses = await Promise.all(statusPromises);
    const statusMap = new Map(deviceStatuses.map((d) => [d.did, d]));

    // Build zones with enriched device data
    let alertCount = 0;
    const zones = config.zones.map((zone) => {
      const devices: HeatzyDevice[] = zone.devices
        .map((dc) => statusMap.get(dc.did))
        .filter((d): d is HeatzyDevice => d !== null && d !== undefined)
        .sort((a, b) => {
          // Errors first, then warnings, then clean — then alphabetical
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

    return NextResponse.json({ zones, alertCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
