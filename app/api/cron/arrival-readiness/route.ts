import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { sendNtfy } from "@sejour/socle/lib/ntfy";
import { addDays } from "@sejour/socle/lib/dates";
import { isExcludedStatus } from "@sejour/socle/lib/booking-status";
import { createNukiArrivalProbe, createNukiProbe } from "@sejour/socle/lib/arrival-readiness/nuki-probe";
import { parisClock } from "@sejour/socle/lib/arrival-readiness/schedule";
import type { ReadinessAlert } from "@sejour/socle/lib/arrival-readiness/format";
import type { ProbeKind, ReadinessBooking, ReadinessProbe } from "@sejour/socle/lib/arrival-readiness/types";
import { getBookings, PROPERTY_ID } from "@/lib/beds24";
import { ACCESS_POLICY, nukiConfig } from "@/lib/access-sync";
import { getDevices, getDeviceStatus, getFullZoneConfig, getLockedDevices, getSummerMode } from "@/lib/heatzy";
import { getWaterHeaterStatus } from "@/lib/cozytouch";
import { getJson, redisKey, setJson } from "@/lib/redis";
import { beat } from "@/lib/heartbeat";
import { createHeatingProbe, type HeatingReading, type HeatingSnapshot } from "@/lib/readiness/heating-probe";
import { createWaterHeaterProbe } from "@/lib/readiness/water-heater-probe";
import { runArrivalReadiness, type ReadinessStore } from "@/lib/readiness/run";
import { LOCK_BATTERY, NO_SHOW_SEVERITY, SEVERITY_BY_PASS } from "@/lib/readiness/config";
import type { Beds24Booking } from "@/lib/types";

/**
 * Préparation d'arrivée : serrure, radiateurs, ballon — **en lecture seule**. Aucune commande
 * n'est envoyée à Nuki, Heatzy ou Cozytouch ; ce cron constate et prévient (ntfy), il ne
 * répare pas.
 *
 * cron-job.org, `35 * * * *`, `Authorization: Bearer $CRON_SECRET`. Les passages (J-1 19h,
 * J 12h30 / 15h30 / 16h30, arrivée tardive, J+1 9h, pile chaque matin à 9h) et les heures de
 * silence (22 h → 8 h, sauf J-1 et arrivée tardive) viennent du socle et de
 * `lib/readiness/config.ts`.
 *
 * `?dryRun=1` calcule sans rien envoyer ni écrire ; `&at=<ISO>` simule l'instant (accepté
 * **seulement** avec `dryRun`). Les sondes lisent toujours l'état **actuel** des appareils :
 * `at` déplace l'horloge des passages, pas celle des radiateurs.
 *
 * État et mémoire dans Redis sous `barbusse:readiness:*`.
 */
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const key = (...parts: Array<string | number>) => redisKey("readiness", ...parts);

const store: ReadinessStore = {
  get: (k) => getJson(k),
  set: (k, v, ttl) => setJson(k, v, ttl),
};

function toReadinessBooking(b: Beds24Booking): ReadinessBooking {
  return {
    bookingId: b.id,
    arrival: b.arrival,
    departure: b.departure,
    guests: (b.numAdult ?? 0) + (b.numChild ?? 0),
    firstName: b.firstName ?? null,
    arrivalTime: b.arrivalTime ?? null,
    bookedAt: b.bookingTime ?? null,
    status: b.status === "cancelled" ? "cancelled" : b.status === "confirmed" || b.status === "new" ? "confirmed" : "provisional",
  };
}

/** Séjours de la maison qui touchent J-1 … J+1 : arrivées, départs (rotation) et non-arrivées. */
async function loadBookings(day: string): Promise<ReadinessBooking[]> {
  const raw = await getBookings({ arrivalTo: addDays(day, 1), departureFrom: addDays(day, -1), fresh: true });
  return raw.filter((b) => b.propertyId === PROPERTY_ID && !isExcludedStatus(b.status)).map(toReadinessBooking);
}

async function readHeating(withStatus: boolean): Promise<HeatingSnapshot> {
  const [config, locked, summer, raw] = await Promise.all([
    getFullZoneConfig(),
    getLockedDevices(),
    getSummerMode(),
    getDevices(),
  ]);
  if (summer) return { summer: true, devices: [] };
  const online = new Map(raw.map((d) => [d.did, d.is_online]));
  const excluded = new Set(config.excludedDevices ?? []);
  const devices = await Promise.all(
    config.zones.flatMap((zone) =>
      zone.devices
        .filter((d) => !excluded.has(d.did))
        .map(async (d): Promise<HeatingReading> => {
          const base: HeatingReading = {
            did: d.did,
            name: d.name,
            zone,
            online: online.get(d.did) ?? false,
            locked: locked.has(d.did),
            unpaired: d.unpaired === true,
            status: null,
          };
          if (!withStatus || !base.online || base.locked || base.unpaired) return base;
          try {
            const s = await getDeviceStatus(d.did);
            const tenth = (v: unknown) => (typeof v === "number" ? v / 10 : null);
            return {
              ...base,
              status: {
                mode: s.derog_mode === 3 ? "presence" : String(s.mode ?? "unknown"),
                temperatureC: tenth(s.cur_temp),
                cftC: tenth(s.cft_temp),
                ecoC: tenth(s.eco_temp),
              },
            };
          } catch {
            return { ...base, statusFailed: true };
          }
        }),
    ),
  );
  return { summer: false, devices };
}

function buildProbes(dryRun: boolean): Partial<Record<ProbeKind, ReadinessProbe>> {
  const probes: Partial<Record<ProbeKind, ReadinessProbe>> = {
    heating: createHeatingProbe({
      read: readHeating,
      baseline: {
        get: (id) => getJson<Record<string, number>>(key("baseline", id)),
        ...(dryRun ? {} : { set: (id: number, temps: Record<string, number>) => setJson(key("baseline", id), temps, 2 * 24 * 3600) }),
      },
      severityByPass: SEVERITY_BY_PASS,
    }),
    waterHeater: createWaterHeaterProbe({ read: getWaterHeaterStatus, severityByPass: SEVERITY_BY_PASS }),
  };
  // Sans jeton Nuki, serrure et présence sont « non applicables » plutôt que de tout faire tomber.
  let nuki;
  try {
    nuki = nukiConfig();
  } catch {
    nuki = null;
  }
  if (nuki) {
    probes.lock = createNukiProbe({
      nuki,
      access: ACCESS_POLICY,
      battery: LOCK_BATTERY,
      severityByPass: SEVERITY_BY_PASS,
    });
    probes.presence = createNukiArrivalProbe({ nuki, access: ACCESS_POLICY, missingSeverity: NO_SHOW_SEVERITY });
  }
  return probes;
}

async function sendAlert(alert: ReadinessAlert): Promise<void> {
  // `sendNtfy` sans sujet journalise et rend la main : l'état serait enregistré comme envoyé.
  if (!process.env.NTFY_TOPIC) throw new Error("NTFY_TOPIC manquant");
  await sendNtfy(alert.body, { title: alert.title, priority: alert.priority, tags: ["house"] });
}

function refuseSend(): Promise<void> {
  throw new Error("dryRun : aucun envoi");
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const params = request.nextUrl.searchParams;
  const dryRun = params.get("dryRun") === "1";
  const at = params.get("at");
  if (at !== null && !dryRun) {
    return NextResponse.json({ error: "`at` n'est accepté qu'avec `dryRun=1`" }, { status: 400 });
  }
  const now = at !== null ? new Date(at) : new Date();
  if (Number.isNaN(now.getTime())) {
    return NextResponse.json({ error: "`at` illisible (ISO 8601 attendu)" }, { status: 400 });
  }

  try {
    const bookings = await loadBookings(parisClock(now).date);
    const report = await runArrivalReadiness({
      now,
      dryRun,
      bookings,
      probes: buildProbes(dryRun),
      store,
      key,
      send: dryRun ? refuseSend : sendAlert,
    });
    if (!dryRun) await beat("arrival-readiness", "ok", now);
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Échec de la préparation d'arrivée";
    console.error("[arrival-readiness]", message);
    if (!dryRun) await beat("arrival-readiness", "error", now);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
