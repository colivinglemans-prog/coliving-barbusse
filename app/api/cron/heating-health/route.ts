import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { alertIgnoredDids, getDevices, getFullZoneConfig } from "@/lib/heatzy";
import { sendHeatingAlert } from "@/lib/alerts";
import { reportAlerts, reportCronRun, type TrackedAlert } from "@/lib/alert-memory";
import { readPowerCut } from "@/lib/heating-state";
import { todayParis, nowParis, tomorrowParis } from "@sejour/socle/lib/time";
import { getBookingsAround, guestsAround } from "@/lib/bookings";

/**
 * Connectivité des radiateurs, toutes les 30 min (cron-job.org) et à 8 h (Vercel).
 *
 * Règle commune des alertes (`reportAlerts`, état `barbusse:alert:heating-health`) :
 * - un radiateur ne compte qu'**hors ligne deux contrôles de suite** (un Heatzy au Wi-Fi capricieux
 *   qui décroche une minute ne mérite pas une alerte) ;
 * - une alerte à l'ouverture, une quand un nouveau radiateur tombe, rien entre les deux ;
 * - « Radiateurs rétablis » en priorité 1 quand tout est revenu.
 *
 * **Priorité** (2026-11-14) : un radiateur seul en défaut part en 3 (sans son fort) quand la
 * maison est vide ; en 4 dès que des voyageurs sont là ou arrivent d'ici demain, ou que plusieurs
 * radiateurs sont en défaut. Beds24 illisible → comme si des voyageurs étaient là.
 * Les radiateurs `alerts: false` (Véranda D, en panne connue) ne sont jamais contrôlés.
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

    // Radiateurs configurés : identifiant → nom (hors radiateurs tenus hors des alertes)
    const ignored = alertIgnoredDids(config);
    const configuredDevices = new Map<string, string>();
    for (const zone of config.zones) {
      for (const device of zone.devices) {
        if (!ignored.has(device.did)) configuredDevices.set(device.did, device.name);
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

    const faulty = [
      ...offlineDevices.filter((n) => !inCut.has(n)).map((n) => ({ id: `offline:${n}`, line: `Hors ligne : ${n}` })),
      ...missingDevices.map((n) => ({ id: `missing:${n}`, line: `Introuvable dans l'API Heatzy : ${n}` })),
    ];
    // La gravité de chaque radiateur ne dépend que de la présence de voyageurs ; « plusieurs en
    // défaut → 4 » se décide à l'envoi, sur les seuls confirmés (sinon un radiateur vu une fois
    // ferait escalader l'alerte déjà ouverte). Beds24 illisible : gravité 3 (pas d'escalade
    // pour une panne de Beds24), mais l'envoi part en 4.
    let guests: boolean | null = false;
    if (faulty.length > 0) {
      const today = todayParis();
      guests = await getBookingsAround(today, tomorrowParis())
        .then((b) => guestsAround(b, today, tomorrowParis()))
        .catch((e) => {
          console.error("[heating-health] réservations illisibles:", e instanceof Error ? e.message : e);
          return null;
        });
    }
    const tracked: TrackedAlert[] = faulty.map((f) => ({ ...f, priority: guests ? 4 : 3 }));

    const alert = await reportAlerts("heating-health", tracked, sendHeatingAlert, {
      title: (c) => `${c.length} radiateur(s) en alerte`,
      intro: `Constaté à deux contrôles de suite, le dernier le ${todayParis()} à ${nowParis().toLocaleTimeString("fr-FR")}.`,
      recoveredTitle: "Radiateurs rétablis",
      recoveredBody: "Tous les radiateurs sont de nouveau en ligne.",
      priority: (c) => (c.length > 1 || guests !== false ? 4 : 3),
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
