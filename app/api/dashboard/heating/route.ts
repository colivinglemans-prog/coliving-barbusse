import { NextRequest, NextResponse } from "next/server";
import { getDevices, getDeviceStatus, getFullZoneConfig, getLockedDevices, getSummerMode } from "@/lib/heatzy";
import { expectedHeatingMode, getHeatingRules, heatingSituation } from "@/lib/heating-schedule";
import { getBookingsWithArchive } from "@/lib/bookings";
import type { HeatzyDevice, HeatzyDeviceAlert } from "@/lib/types";
import { todayParis, nowParis } from "@sejour/socle/lib/time";
import { isExcludedStatus } from "@sejour/socle/lib/booking-status";
import { guard } from "@/lib/auth";
import { freshLoad, readHeatingLoad } from "@/lib/heating-state";
import { ELECTRICAL_BUDGET } from "@/lib/electrical-budget";

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

export async function GET(request: NextRequest) {
  const refus = await guard.deny(request, ["admin", "viewer"]);
  if (refus) return refus;

  try {
    const config = await getFullZoneConfig();
    const allDeviceConfigs = config.zones.flatMap((z) =>
      z.devices.map((d) => ({ ...d, zone: z })),
    );

    // Fetch device list and active bookings in parallel
    const [rawDevices, fetchedBookings] = await Promise.all([
      getDevices(),
      getBookingsWithArchive({
        arrivalTo: todayParis(),
        departureFrom: todayParis(),
      }).catch(() => []),
    ]);
    // Mêmes réservations que l'automatisation : sans les statuts exclus (bloquées, annulées).
    const activeBookings = fetchedBookings.filter((b) => !isExcludedStatus(b.status));

    const rawDeviceMap = new Map(rawDevices.map((d) => [d.did, d]));
    const paris = nowParis();
    const currentHour = paris.getHours();
    const minute = paris.getMinutes();
    const today = todayParis();

    // Le mode attendu et la règle affichée viennent de la même fonction que l'automatisation.
    const situation = heatingSituation(activeBookings, today, currentHour);
    const occupied = situation === "occupied";
    const nextCheckIn = activeBookings
      .filter((b) => b.arrival > today)
      .sort((a, b) => a.arrival.localeCompare(b.arrival))[0]?.arrival;
    const rules = getHeatingRules(situation, currentHour, nextCheckIn);
    const [lockedDevices, summerMode] = await Promise.all([
      getLockedDevices(),
      getSummerMode(),
    ]);

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
        const pilotLocked = (status.lock_switch as number) === 1;
        const curTemp = typeof status.cur_temp === "number" ? Math.round(status.cur_temp / 10) : undefined;
        const deviceCftTemp = typeof status.cft_temp === "number" ? (status.cft_temp as number) / 10 : undefined;
        const deviceEcoTemp = typeof status.eco_temp === "number" ? (status.eco_temp as number) / 10 : undefined;

        // Target temp is based on the actual base mode (what the radiator is doing)
        const targetTemp = getTargetTemp(baseMode, deviceCftTemp, deviceEcoTemp);

        // ─── Alert detection ──────────────────────────────────
        // Only 3 types of alerts = actionable issues requiring on-site intervention:
        // 1. Radiateur non connecté
        // 2. Radiateur qui chauffe alors qu'il ne devrait pas
        // 3. Radiateur qui ne chauffe pas alors qu'il devrait
        const alerts: HeatzyDeviceAlert[] = [];

        if (!isOnline) {
          alerts.push({
            level: "error",
            message: "Hors ligne — vérifier branchement / WiFi",
          });
        }

        // Skip heating alerts for locked devices (intentionally in hors-gel) or summer mode (everything stopped)
        if (isOnline && !isLocked && !summerMode) {
          if (!occupied) {
            // Pas de réservation : ne devrait PAS chauffer (sauf si temp < 7°C hors-gel)
            if (isHeating && curTemp !== undefined && curTemp > 10) {
              alerts.push({
                level: "error",
                message: `Chauffe sans réservation (${curTemp}°C) — vérifier le radiateur`,
              });
            }
          } else {
            // Réservation active : devrait chauffer si la température est basse
            if (!isHeating && curTemp !== undefined && targetTemp !== undefined && curTemp < targetTemp - 3 && baseMode !== "stop" && baseMode !== "fro") {
              alerts.push({
                level: "error",
                message: `Ne chauffe pas alors que la pièce est froide (${curTemp}°C pour ${targetTemp}°C) — vérifier le radiateur`,
              });
            }
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
          pilotLocked,
          presenceDetected,
          temperature: curTemp,
          cftTemp: deviceCftTemp,
          ecoTemp: deviceEcoTemp,
          expectedMode: isLocked
            ? "fro"
            : (expectedHeatingMode(activeBookings, today, currentHour, deviceConfig.zone, minute).mode ??
              deviceConfig.defaultMode),
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
          pilotLocked: false,
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

    const finalRules = summerMode
      ? {
          currentRule: "Mode été activé — automatisation suspendue, radiateurs en stop",
          nextRule: "Réactiver le chauffage avant les premiers froids",
        }
      : rules;

    // Charge estimée et délestage du dernier passage de l'automatisation (15 min au plus).
    const memo = freshLoad(await readHeatingLoad(), new Date());
    const load = memo
      ? {
          totalW: memo.totalW,
          capW: memo.capW,
          shedZones: memo.shedZones,
          observedShedZones: memo.observedShedZones ?? [],
          at: memo.at,
          kva: ELECTRICAL_BUDGET.kva,
        }
      : null;

    return NextResponse.json({ zones, alertCount, occupied, summerMode, load, ...finalRules, serverTime: `${todayParis()} ${currentHour}h (Paris)` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
