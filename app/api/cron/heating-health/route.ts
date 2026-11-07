import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { getDevices, getFullZoneConfig } from "@/lib/heatzy";
import { sendHeatingAlert } from "@/lib/alerts";
import { alertTransition, failingInputs } from "@/lib/alert-memory";
import { todayParis, nowParis } from "@sejour/socle/lib/time";

/**
 * Connectivité des radiateurs, toutes les 30 min (cron-job.org) et à 8 h (Vercel).
 *
 * Jusqu'au 2026-11-07, la même alerte repartait à chaque passage tant qu'un radiateur restait
 * hors ligne : 48 notifications par jour. Elle passe désormais par `nextAlertState`, état dans
 * Redis (`barbusse:alert:heating-health`) : une alerte à l'ouverture, une quand un nouveau
 * radiateur tombe, une (priorité 2) quand tout est revenu — rien entre les deux.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const config = await getFullZoneConfig();
    const rawDevices = await getDevices();

    // Build a map of configured device IDs to names
    const configuredDevices = new Map<string, string>();
    for (const zone of config.zones) {
      for (const device of zone.devices) {
        configuredDevices.set(device.did, device.name);
      }
    }

    const offlineDevices: string[] = [];

    for (const raw of rawDevices) {
      const name = configuredDevices.get(raw.did);
      if (!name) continue; // Device not in our config
      if (!raw.is_online) {
        offlineDevices.push(name);
      }
    }

    // Check for configured devices not found in API response
    const apiDeviceIds = new Set(rawDevices.map((d) => d.did));
    const missingDevices: string[] = [];
    for (const [did, name] of configuredDevices) {
      if (!apiDeviceIds.has(did)) {
        missingDevices.push(name);
      }
    }

    const transition = await alertTransition(
      "heating-health",
      failingInputs([...offlineDevices.map((n) => `offline:${n}`), ...missingDevices.map((n) => `missing:${n}`)]),
    );

    if (transition.action === "recover") {
      await sendHeatingAlert("Radiateurs rétablis", "Tous les radiateurs sont de nouveau en ligne.", 2);
    }

    // Alerte à l'ouverture et à l'aggravation seulement.
    if (transition.action === "open" || transition.action === "escalate") {
      const today = todayParis();
      const lines: string[] = [];

      if (offlineDevices.length > 0) {
        lines.push(
          `Radiateurs hors ligne (${offlineDevices.length}) :`,
          ...offlineDevices.map((n) => `  - ${n}`),
          "",
        );
      }

      if (missingDevices.length > 0) {
        lines.push(
          `Radiateurs introuvables dans l'API Heatzy (${missingDevices.length}) :`,
          ...missingDevices.map((n) => `  - ${n}`),
          "",
        );
      }

      lines.push(`Vérification effectuée le ${today} à ${nowParis().toLocaleTimeString("fr-FR")}`);

      await sendHeatingAlert(
        `${offlineDevices.length + missingDevices.length} radiateur(s) en alerte`,
        lines.join("\n"),
      );
    }

    return NextResponse.json({
      success: true,
      total: configuredDevices.size,
      online: configuredDevices.size - offlineDevices.length - missingDevices.length,
      alert: transition.action,
      offline: offlineDevices.length,
      missing: missingDevices.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await sendHeatingAlert(
      "Erreur health check chauffage",
      `Le health check du chauffage a rencontré une erreur :\n\n${message}`,
    ).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
