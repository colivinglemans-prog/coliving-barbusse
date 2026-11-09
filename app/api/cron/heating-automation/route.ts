import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import {
  getFullZoneConfig,
  getLockedDevices,
  saveLockedDevices,
  setDeviceMode,
  setDeviceTemperatures,
  getSummerMode,
  readRadiators,
} from "@/lib/heatzy";
import { expectedHeatingMode, type HeatingSituation } from "@/lib/heating-schedule";
import { getActiveBookings } from "@/lib/bookings";
import { sendHeatingAlert } from "@/lib/alerts";
import { alertTransition, failingInputs } from "@/lib/alert-memory";
import { beat } from "@/lib/heartbeat";
import { getRedis, redisKey } from "@/lib/redis";
import { todayParis, nowParis } from "@sejour/socle/lib/time";
import {
  estimateRadiatorLoad,
  expectedSetpoint,
  setpointsAboveZone,
  type RadiatorReading,
} from "@/lib/radiator-load";
import { ELECTRICAL_BUDGET, LOAD_SHEDDING_MODE } from "@/lib/electrical-budget";
import { planShedding, type ShedState } from "@/lib/load-shedding";
import { powerCutTransition } from "@/lib/power-cut";
import {
  readOnlineRadiators,
  readPowerCut,
  readShedState,
  saveHeatingLoad,
  saveOnlineRadiators,
  savePowerCut,
  saveShedState,
} from "@/lib/heating-state";
import type { HeatzyMode, HeatzyZone } from "@/lib/types";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Libellé de l'action, par situation — ceux d'avant la fonction unique. */
const LABEL: Record<Exclude<HeatingSituation, "vacant">, string> = {
  "preheat-cft": "pré-chauffage confort (arrivée aujourd'hui)",
  "preheat-eco": "pré-chauffage éco (montée progressive)",
  "arrival-morning": "hors-gel (arrivée aujourd'hui, avant pré-chauffage)",
  occupied: "(occupé)",
  turnaround: "(entre deux réservations)",
  checkout: "hors-gel (départ)",
};

/** Situations où les radiateurs chauffent pour des voyageurs : délestage et consignes ramenées. */
const HEATED: ReadonlySet<HeatingSituation> = new Set(["occupied", "preheat-eco", "preheat-cft", "turnaround"]);

/** Modes délestables : ceux qui visent le confort. Une zone en éco ou hors-gel l'est déjà. */
const SHEDDABLE_MODES: ReadonlySet<string> = new Set(["cft", "presence"]);

const SHED_NOTICE_TTL_SECONDS = 24 * 3600;

async function claimDailyShedNotice(today: string): Promise<boolean> {
  try {
    const res = await getRedis().set(redisKey("heating", "shed-notified", today), "1", {
      nx: true,
      ex: SHED_NOTICE_TTL_SECONDS,
    });
    return res === "OK";
  } catch {
    return false;
  }
}

/**
 * Pilotage du chauffage, toutes les 15 min (cron-job.org) et à 7 h (Vercel).
 *
 * 1. **Mode** de chaque zone : `expectedHeatingMode` (`lib/heating-schedule.ts`), décalage de la
 *    zone compris (dernier étage −15 min, RDC à l'heure, 1er +15 min).
 * 2. **Délestage** (coupures des 7-9/11/2026 à 9 kVA) : charge estimée des radiateurs après ce
 *    passage (`lib/radiator-load.ts`) ; au-delà de `ELECTRICAL_BUDGET.radiatorCapW`, des étages
 *    passent en éco pour le quart d'heure, à tour de rôle (`lib/load-shedding.ts`), jamais le RDC.
 *    **En observation** tant que `LOAD_SHEDDING_MODE` vaut `"observe"` : calculé, journalisé et
 *    affiché, sans toucher aux radiateurs.
 * 3. **Consignes** montées par les voyageurs : ramenées à celles de la zone à chaque passage.
 * 4. **Coupure de courant** : 3 radiateurs ou plus tombés d'un coup → alerte prioritaire
 *    (`lib/power-cut.ts`), puis « courant revenu ».
 *
 * La charge estimée est mémorisée pour l'automation du ballon (`lib/heating-state.ts`). Si les
 * radiateurs sont illisibles (API Heatzy en panne), les modes sont posés quand même, sans
 * délestage ni contrôle des consignes.
 *
 * Les radiateurs qui refusent leur mode (`failures`) déclenchent une alerte ntfy, une fois par
 * changement d'état (`barbusse:alert:heating-automation`).
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (await getSummerMode()) {
      await beat("heating-automation", "ok");
      return NextResponse.json({
        success: true,
        skipped: "summer-mode",
        actions: [],
        failures: [],
        timestamp: new Date().toISOString(),
      });
    }

    const now = new Date();
    const paris = nowParis();
    const config = await getFullZoneConfig();
    const today = todayParis();
    const currentHour = paris.getHours();
    const minute = paris.getMinutes();

    const allBookings = await getActiveBookings();

    const actions: string[] = [];
    const lockedDevices = await getLockedDevices();

    const hasCheckOutToday = allBookings.some((b) => b.departure === today);
    const situation = expectedHeatingMode(allBookings, today, currentHour, {}, minute).situation;

    // Fin de réservation : tous les radiateurs verrouillés sont rendus à l'automatisation.
    if (hasCheckOutToday && situation !== "occupied" && lockedDevices.size > 0) {
      await saveLockedDevices(new Set());
      actions.push(`Déverrouillage de ${lockedDevices.size} device(s) (fin de réservation)`);
      lockedDevices.clear();
    }

    let readings: RadiatorReading[] | null = null;
    try {
      readings = await readRadiators(config);
    } catch (e) {
      console.error("[heating-automation] lecture des radiateurs:", e instanceof Error ? e.message : e);
    }

    // ─── Coupure de courant ───
    let powerCut: "cut" | "restored" | null = null;
    let cutOngoing = false;
    if (readings) {
      const online = readings.filter((r) => r.online).map((r) => r.name);
      const [previousOnline, cut] = await Promise.all([readOnlineRadiators(), readPowerCut()]);
      const t = powerCutTransition(previousOnline, online, cut, now);
      await Promise.all([saveOnlineRadiators(online), savePowerCut(t.cut)]);
      cutOngoing = t.cut !== null;
      if (t.action === "cut") {
        powerCut = "cut";
        // Tout est tombé : coupure générale, mais aussi box Internet ou cloud Heatzy en panne
        // (indiscernables d'ici). Une partie encore en ligne : disjoncteur divisionnaire.
        await sendHeatingAlert(
          t.allOffline ? "Coupure de courant ou box Internet" : "Coupure de courant probable",
          [
            `${t.newlyOffline.length} radiateurs sont tombés hors ligne en même temps (${paris.toLocaleTimeString("fr-FR")}) :`,
            ...t.newlyOffline.map((n) => `  - ${n}`),
            "",
            t.allOffline
              ? "Plus aucun radiateur en ligne : disjoncteur général, ou box Internet / cloud Heatzy en panne. Appeler les voyageurs."
              : "Une partie de la maison reste en ligne : un disjoncteur divisionnaire a probablement sauté. Appeler les voyageurs.",
          ].join("\n"),
          5,
        ).catch(() => {});
      } else if (t.action === "restored") {
        powerCut = "restored";
        await sendHeatingAlert(
          "Courant revenu",
          "Tous les radiateurs de la coupure sont de nouveau en ligne. Modes et consignes réappliqués.",
          3,
        ).catch(() => {});
      }
    }

    // ─── Modes attendus, puis délestage ───
    const zoneModes = new Map<string, HeatzyMode | null>(
      config.zones.map((zone) => [zone.id, expectedHeatingMode(allBookings, today, currentHour, zone, minute).mode]),
    );
    const zonesById = new Map<string, HeatzyZone>(config.zones.map((z) => [z.id, z]));

    const sheddingActive = LOAD_SHEDDING_MODE === "active";
    let shed: ShedState | null = null;
    let observedShed: string[] = [];
    let estimatedW: number | null = null;
    if (readings && HEATED.has(situation)) {
      const load = estimateRadiatorLoad(readings, (r) =>
        expectedSetpoint(zoneModes.get(r.zoneId) ?? null, r, zonesById.get(r.zoneId) ?? {}),
      );
      // Seules les zones qui visent le confort peuvent céder quelque chose.
      const sheddable: Record<string, number> = {};
      for (const [zoneId, w] of Object.entries(load.byZone)) {
        if (SHEDDABLE_MODES.has(zoneModes.get(zoneId) ?? "")) sheddable[zoneId] = w;
      }
      const plan = planShedding(
        load.totalW,
        sheddable,
        ELECTRICAL_BUDGET.radiatorCapW,
        sheddingActive ? await readShedState() : null,
        now,
      );
      if (!sheddingActive) {
        // Observation : on note ce que le délestage ferait, rien n'est appliqué.
        observedShed = plan.zones;
        estimatedW = load.totalW;
        if (plan.zones.length > 0) {
          actions.push(
            `Délestage (observation, non appliqué) : mettrait ${plan.zones.join(", ")} en éco (charge estimée ${load.totalW} W > ${plan.capW} W)`,
          );
        }
        await saveHeatingLoad({
          totalW: load.totalW,
          capW: plan.capW,
          shedZones: [],
          observedShedZones: plan.zones,
          unknown: load.unknown,
          at: now.toISOString(),
        });
      } else {
        shed = plan;
        estimatedW = shed.remainingW;
        if (shed.zones.length > 0) {
          actions.push(
            `Délestage : ${shed.zones.join(", ")} en éco (charge estimée ${load.totalW} W > ${shed.capW} W, reste ${shed.remainingW} W)`,
          );
          if (await claimDailyShedNotice(today)) {
            await sendHeatingAlert(
              "Délestage des radiateurs",
              `Charge estimée ${load.totalW} W pour un plafond de ${shed.capW} W (${ELECTRICAL_BUDGET.kva} kVA).\nZones en éco ce quart d'heure : ${shed.zones.join(", ")}. Rotation toutes les 15 min, jamais le RDC.\nUne notification par jour au plus.`,
              3,
            ).catch(() => {});
          }
        }
        await Promise.all([
          saveShedState(shed),
          saveHeatingLoad({
            totalW: shed.remainingW,
            capW: shed.capW,
            shedZones: shed.zones,
            unknown: load.unknown,
            at: now.toISOString(),
          }),
        ]);
      }
    } else if (readings) {
      const load = estimateRadiatorLoad(readings);
      estimatedW = load.totalW;
      await saveHeatingLoad({
        totalW: load.totalW,
        capW: ELECTRICAL_BUDGET.radiatorCapW,
        shedZones: [],
        unknown: load.unknown,
        at: now.toISOString(),
      });
    }
    const shedZones = new Set(shed?.zones ?? []);
    const readingByDid = new Map((readings ?? []).map((r) => [r.did, r]));

    const failures: string[] = [];
    const failedDevices: string[] = [];

    for (const zone of config.zones) {
      const expected = zoneModes.get(zone.id) ?? null;
      const mode: HeatzyMode | null =
        expected !== null && shedZones.has(zone.id) && SHEDDABLE_MODES.has(expected) ? "eco" : expected;
      for (const device of zone.devices) {
        const did = device.did;

        if (lockedDevices.has(did)) {
          actions.push(`${device.name}: ignoré (verrouillé)`);
          continue;
        }
        // Aucune réservation autour : rien d'imposé.
        if (mode === null || situation === "vacant") continue;

        try {
          await setDeviceMode(did, mode);
          if (mode !== expected) {
            actions.push(`${device.name}: eco (délesté, au lieu de ${expected})`);
          } else {
            const label = LABEL[situation];
            actions.push(label.startsWith("(") ? `${device.name}: ${mode} ${label}` : `${device.name}: ${label}`);
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          failures.push(`${device.name}: ${msg}`);
          failedDevices.push(device.name);
          console.error(`Heating automation error for ${device.name}:`, e);
        }
        // Consignes montées par un voyageur : ramenées à celles de la zone. Un échec ici n'est
        // pas un mode refusé : il est noté à part, sans alerte (le passage suivant réessaie).
        const reading = readingByDid.get(did);
        if (HEATED.has(situation) && reading && setpointsAboveZone(reading.attrs, zone)) {
          try {
            await setDeviceTemperatures(did, zone.cftTemp!, zone.ecoTemp!);
            actions.push(
              `${device.name}: consignes ramenées (${Number(reading.attrs!.cft_temp) / 10}/${Number(reading.attrs!.eco_temp) / 10} → ${zone.cftTemp! / 10}/${zone.ecoTemp! / 10} °C)`,
            );
          } catch (e) {
            actions.push(`${device.name}: consignes non ramenées (${e instanceof Error ? e.message : "erreur"})`);
          }
        }
        await sleep(100);
      }
    }

    // Alerte sur les radiateurs qui n'ont pas pris leur mode — une fois par changement d'état.
    // Pendant une coupure, ils sont hors ligne par force : l'alerte de coupure suffit.
    const transition = cutOngoing
      ? { action: "none" as const }
      : await alertTransition("heating-automation", failingInputs(failedDevices));
    if (transition.action === "open" || transition.action === "escalate") {
      await sendHeatingAlert(
        `${failedDevices.length} radiateur(s) n'ont pas pris leur mode`,
        [`Situation : ${situation}`, "", ...failures.map((f) => `  - ${f}`)].join("\n"),
      ).catch(() => {});
    } else if (transition.action === "recover") {
      await sendHeatingAlert("Tous les radiateurs ont repris leur mode", "Plus aucun échec de commande.", 2).catch(
        () => {},
      );
    }

    await beat("heating-automation", "ok");
    return NextResponse.json({
      success: true,
      situation,
      estimatedLoadW: estimatedW,
      capW: ELECTRICAL_BUDGET.radiatorCapW,
      sheddingMode: LOAD_SHEDDING_MODE,
      shedZones: [...shedZones],
      observedShedZones: observedShed,
      powerCut,
      actions,
      failures,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await beat("heating-automation", "error");
    await sendHeatingAlert(
      "Erreur automation chauffage",
      `L'automation du chauffage a rencontré une erreur :\n\n${message}`,
    ).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
