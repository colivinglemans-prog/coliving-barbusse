import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { getDevices, getFullZoneConfig } from "@/lib/heatzy";
import { sendHeatingAlert } from "@/lib/alerts";
import { reportAlerts, reportCronRun, type TrackedAlert } from "@/lib/alert-memory";
import { readPowerCut } from "@/lib/heating-state";
import { todayParis, nowParis } from "@sejour/socle/lib/time";

/**
 * Connectivité des radiateurs, toutes les 30 min (cron-job.org) et à 8 h (Vercel).
 *
 * Règle commune des alertes (`reportAlerts`, état `barbusse:alert:heating-health`) :
 * - un radiateur ne compte qu'**hors ligne deux contrôles de suite** (un Heatzy au Wi-Fi capricieux
 *   qui décroche une minute ne mérite pas une alerte) ;
 * - une alerte à l'ouverture, une quand un nouveau radiateur tombe, rien entre les deux ;
 * - « Radiateurs rétablis » en priorité 1 quand tout est revenu.
 *
 * Les radiateurs d'une coupure de courant soupçonnée ou signalée (`lib/power-cut.ts`) sont
 * ignorés : l'alerte de coupure les nomme déjà.
 */
const LABEL = "Contrôle des radiateurs";

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [config, rawDevices, cut] = await Promise.all([getFullZoneConfig(), getDevices(), readPowerCut()]);
    const inCut = new Set(cut?.devices ?? []);

    // Radiateurs configurés : identifiant → nom
    const configuredDevices = new Map<string, string>();
    for (const zone of config.zones) {
      for (const device of zone.devices) {
        configuredDevices.set(device.did, device.name);
      }
    }

    const offlineDevices: string[] = [];
    for (const raw of rawDevices) {
      const name = configuredDevices.get(raw.did);
      if (!name) continue; // Hors configuration
      if (!raw.is_online) offlineDevices.push(name);
    }

    // Radiateurs configurés absents de la réponse de l'API
    const apiDeviceIds = new Set(rawDevices.map((d) => d.did));
    const missingDevices: string[] = [];
    for (const [did, name] of configuredDevices) {
      if (!apiDeviceIds.has(did)) missingDevices.push(name);
    }

    const tracked: TrackedAlert[] = [
      ...offlineDevices
        .filter((n) => !inCut.has(n))
        .map((n) => ({ id: `offline:${n}`, priority: 4 as const, line: `Hors ligne : ${n}` })),
      ...missingDevices.map((n) => ({ id: `missing:${n}`, priority: 4 as const, line: `Introuvable dans l'API Heatzy : ${n}` })),
    ];

    const alert = await reportAlerts("heating-health", tracked, sendHeatingAlert, {
      title: (c) => `${c.length} radiateur(s) en alerte`,
      intro: `Constaté à deux contrôles de suite, le dernier le ${todayParis()} à ${nowParis().toLocaleTimeString("fr-FR")}.`,
      recoveredTitle: "Radiateurs rétablis",
      recoveredBody: "Tous les radiateurs sont de nouveau en ligne.",
    });
    await reportCronRun("heating-health", LABEL, sendHeatingAlert, null).catch(() => {});

    return NextResponse.json({
      success: true,
      total: configuredDevices.size,
      online: configuredDevices.size - offlineDevices.length - missingDevices.length,
      alert,
      offline: offlineDevices.length,
      missing: missingDevices.length,
      inPowerCut: offlineDevices.filter((n) => inCut.has(n)).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await reportCronRun("heating-health", LABEL, sendHeatingAlert, message).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
