import { NextResponse } from "next/server";
import { getDevices, getDeviceStatus, getZoneConfig } from "@/lib/heatzy";
import { getBookings } from "@/lib/beds24";
import type { HeatzyDevice } from "@/lib/types";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function isRoomOccupied(
  deviceId: string,
  bookings: { arrival: string; departure: string }[],
  config: ReturnType<typeof getZoneConfig>,
): boolean {
  const today = todayStr();
  // Check if this device is part of any room mapping with an active booking
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

export async function GET() {
  try {
    const config = getZoneConfig();
    const allDeviceIds = config.zones.flatMap((z) => z.devices);

    // Fetch device statuses and bookings in parallel
    const [rawDevices, bookings] = await Promise.all([
      getDevices(),
      getBookings({
        arrivalFrom: todayStr(),
        arrivalTo: todayStr(),
        departureFrom: todayStr(),
        departureTo: todayStr(),
      }).catch(() => []),
    ]);

    // Also fetch bookings that started before today but haven't ended
    const activeBookings = await getBookings({
      arrivalTo: todayStr(),
      departureFrom: todayStr(),
    }).catch(() => []);

    const allBookings = [...bookings, ...activeBookings].filter(
      (b, i, arr) => arr.findIndex((x) => x.id === b.id) === i,
    );

    // Build a map of did -> raw device info for online status
    const rawDeviceMap = new Map(rawDevices.map((d) => [d.did, d]));

    // Fetch detailed status for each configured device in parallel
    const statusPromises = allDeviceIds.map(async (deviceConfig) => {
      try {
        const status = await getDeviceStatus(deviceConfig.did);
        const rawDevice = rawDeviceMap.get(deviceConfig.did);
        const isOnline = rawDevice?.is_online ?? false;
        const mode = (status.mode as string) ?? "unknown";
        const occupied = isRoomOccupied(deviceConfig.did, allBookings, config);
        const expectedMode = occupied ? "cft" : deviceConfig.defaultMode;

        let hasAlert = false;
        let alertMessage: string | undefined;

        if (!isOnline) {
          hasAlert = true;
          alertMessage = "Hors ligne — vérifier branchement / WiFi";
        } else if (occupied && mode === "stop") {
          hasAlert = true;
          alertMessage = "Éteint alors que chambre occupée — vérifier le radiateur";
        } else if (mode !== expectedMode && isOnline) {
          hasAlert = true;
          alertMessage = `Mode inattendu (${mode} au lieu de ${expectedMode}) — remettre en fil pilote`;
        }

        return {
          did: deviceConfig.did,
          name: deviceConfig.name,
          mode,
          isOnline,
          temperature: status.cur_temp,
          expectedMode,
          hasAlert,
          alertMessage,
        };
      } catch {
        return {
          did: deviceConfig.did,
          name: deviceConfig.name,
          mode: "unknown",
          isOnline: false,
          temperature: undefined,
          expectedMode: deviceConfig.defaultMode,
          hasAlert: true,
          alertMessage: "Impossible de récupérer le statut — vérifier la connexion",
        };
      }
    });

    const deviceStatuses = await Promise.all(statusPromises);
    const statusMap = new Map(deviceStatuses.map((d) => [d.did, d]));

    // Build zones with enriched device data, alerts first
    let alertCount = 0;
    const zones = config.zones.map((zone) => {
      const devices: HeatzyDevice[] = zone.devices
        .map((dc) => {
          const status = statusMap.get(dc.did);
          if (!status) return null;
          if (status.hasAlert) alertCount++;
          return { ...status, zone: zone.id } as HeatzyDevice;
        })
        .filter((d): d is HeatzyDevice => d !== null)
        .sort((a, b) => {
          // Alerts first
          if (a.hasAlert && !b.hasAlert) return -1;
          if (!a.hasAlert && b.hasAlert) return 1;
          return 0;
        });

      return {
        id: zone.id,
        label: zone.label,
        defaultMode: zone.defaultMode,
        devices,
      };
    });

    return NextResponse.json({ zones, alertCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
