"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import HeatingZoneCard from "@/components/dashboard/HeatingZoneCard";
import type { HeatzyDevice } from "@/lib/types";
import type { TempTrend } from "@/components/dashboard/HeatingDeviceCard";

interface ZoneData {
  id: string;
  label: string;
  defaultMode: string;
  cftTemp?: number;
  ecoTemp?: number;
  devices: HeatzyDevice[];
}

interface HeatingData {
  zones: ZoneData[];
  alertCount: number;
  occupied: boolean;
  currentRule?: string;
  nextRule?: string;
}

const GLOBAL_MODE_BUTTONS = [
  { mode: "cft", label: "Tout en Confort", color: "bg-orange-500 hover:bg-orange-600" },
  { mode: "eco", label: "Tout en Éco", color: "bg-blue-500 hover:bg-blue-600" },
  { mode: "fro", label: "Tout en Hors-gel", color: "bg-gray-500 hover:bg-gray-600" },
  { mode: "presence", label: "Tout en Présence", color: "bg-green-500 hover:bg-green-600" },
  { mode: "stop", label: "Tout Stop", color: "bg-red-500 hover:bg-red-600" },
];

export default function HeatingPage() {
  const [actualRole, setActualRole] = useState<"admin" | "viewer">("admin");
  const [viewAsViewer, setViewAsViewer] = useState(false);
  const role = actualRole === "admin" && viewAsViewer ? "viewer" : actualRole;
  const [data, setData] = useState<HeatingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    unassigned: { did: string; alias: string; mac: string; isOnline: boolean }[];
    missing: { did: string; name: string; zone: string }[];
    zones: { id: string; label: string }[];
    allOk: boolean;
  } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tempHistoryRef = useRef<Map<string, number[]>>(new Map());
  const [trends, setTrends] = useState<Map<string, TempTrend>>(new Map());
  const presenceHistoryRef = useRef<Map<string, { detected: boolean; since: Date }>>(new Map());
  const [presenceSince, setPresenceSince] = useState<Map<string, Date>>(new Map());

  const updatePresence = useCallback((zones: ZoneData[]) => {
    const history = presenceHistoryRef.current;
    const newSince = new Map<string, Date>();

    for (const zone of zones) {
      for (const device of zone.devices) {
        if (device.presenceDetected === undefined) continue;
        const did = device.did;
        const prev = history.get(did);

        if (!prev || prev.detected !== device.presenceDetected) {
          // State changed or first time
          const since = new Date();
          history.set(did, { detected: device.presenceDetected, since });
          newSince.set(did, since);
        } else {
          newSince.set(did, prev.since);
        }
      }
    }
    setPresenceSince(newSince);
  }, []);

  const updateTrends = useCallback((zones: ZoneData[]) => {
    const history = tempHistoryRef.current;
    const newTrends = new Map<string, TempTrend>();

    for (const zone of zones) {
      for (const device of zone.devices) {
        if (device.temperature === undefined) continue;
        const did = device.did;
        const temps = history.get(did) ?? [];
        temps.push(device.temperature);
        if (temps.length > 10) temps.shift();
        history.set(did, temps);

        if (temps.length >= 2) {
          const diff = temps[temps.length - 1] - temps[0];
          if (diff > 0.5) newTrends.set(did, "up");
          else if (diff < -0.5) newTrends.set(did, "down");
          else newTrends.set(did, "stable");
        }
      }
    }
    setTrends(newTrends);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/heating");
      if (!res.ok) throw new Error("Erreur de chargement");
      const json = await res.json();
      setData(json);
      updateTrends(json.zones);
      updatePresence(json.zones);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    }
  }, [updateTrends, updatePresence]);

  useEffect(() => {
    // Fetch role
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setActualRole(d.role ?? "admin"))
      .catch(() => {});

    // Initial fetch
    fetchData();

    // Poll every 30 seconds
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  async function handleSetMode(
    target: { zoneId?: string; deviceId?: string },
    mode: string,
  ) {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/heating/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...target, mode }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Erreur");
      }
      // Refresh after a short delay to let the device update
      setTimeout(fetchData, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du changement de mode");
    } finally {
      setLoading(false);
    }
  }

  function handleSetZoneMode(zoneId: string, mode: string) {
    handleSetMode({ zoneId }, mode);
  }

  function handleSetDeviceMode(did: string, mode: string) {
    handleSetMode({ deviceId: did }, mode);
  }

  function handleSetAllMode(mode: string) {
    handleSetMode({}, mode);
  }

  async function handleToggleLock(did: string, lock: boolean) {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/heating/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: did, lock }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Erreur");
      }
      setTimeout(fetchData, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du verrouillage");
    } finally {
      setLoading(false);
    }
  }

  async function handleScan() {
    setScanning(true);
    try {
      const res = await fetch("/api/dashboard/heating/scan");
      if (!res.ok) throw new Error("Erreur de scan");
      setScanResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors du scan");
    } finally {
      setScanning(false);
    }
  }

  async function handleAddDevice(did: string, name: string, zoneId: string, replaceDid?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/heating/add-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ did, name, zoneId, replaceDid }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout");
      setScanResult(null);
      setTimeout(fetchData, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handlePilotLock(locked: boolean) {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/heating/pilot-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked }),
      });
      if (!res.ok) throw new Error("Erreur");
      setTimeout(fetchData, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lock pilotes");
    } finally {
      setLoading(false);
    }
  }

  // Stats
  const totalDevices = data?.zones.reduce((s, z) => s + z.devices.length, 0) ?? 0;
  const onlineCount =
    data?.zones.reduce(
      (s, z) => s + z.devices.filter((d) => d.isOnline).length,
      0,
    ) ?? 0;
  const offlineCount = totalDevices - onlineCount;
  const alertCount = data?.alertCount ?? 0;

  return (
    <>
      <DashboardNav role={actualRole} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Chauffage</h1>
          {actualRole === "admin" && (
            <button
              onClick={() => setViewAsViewer((v) => !v)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                viewAsViewer
                  ? "bg-gray-200 text-gray-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {viewAsViewer ? "Vue viewer" : "Vue admin"}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-green-50 p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{onlineCount}</div>
            <div className="text-sm text-green-600">En ligne</div>
          </div>
          <div className="rounded-2xl bg-red-50 p-4 text-center">
            <div className="text-2xl font-bold text-red-700">{offlineCount}</div>
            <div className="text-sm text-red-600">Hors ligne</div>
          </div>
          <div className="rounded-2xl bg-gray-50 p-4 text-center">
            <div className="text-2xl font-bold text-gray-700">{totalDevices}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div
            className={`rounded-2xl p-4 text-center ${
              alertCount > 0
                ? "bg-amber-50 border-2 border-amber-300"
                : "bg-gray-50"
            }`}
          >
            <div
              className={`text-2xl font-bold ${
                alertCount > 0 ? "text-amber-700" : "text-gray-700"
              }`}
            >
              {alertCount}
            </div>
            <div
              className={`text-sm ${
                alertCount > 0 ? "text-amber-600" : "text-gray-500"
              }`}
            >
              Action{alertCount !== 1 ? "s" : ""} requise{alertCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Heating rules */}
        {data?.currentRule && (
          <div className="mb-6 rounded-2xl bg-blue-50 border border-blue-200 p-4">
            <div className="text-sm font-medium text-blue-900">
              {data.currentRule}
            </div>
            {data.nextRule && (
              <div className="text-sm text-blue-600 mt-1">
                Prochain : {data.nextRule}
              </div>
            )}
          </div>
        )}

        {/* Global control (admin only) */}
        {role === "admin" && (
          <div className="mb-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700 mr-2">
                Contrôle global :
              </span>
              {GLOBAL_MODE_BUTTONS.map((btn) => (
                <button
                  key={btn.mode}
                  onClick={() => handleSetAllMode(btn.mode)}
                  disabled={loading}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-40 ${btn.color}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handlePilotLock(true)}
                disabled={loading}
                className="rounded-lg border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition-colors disabled:opacity-40"
              >
                Verrouiller les Pilotes
              </button>
              <button
                onClick={() => handlePilotLock(false)}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
              >
                Déverrouiller les Pilotes
              </button>
              <button
                onClick={handleScan}
                disabled={scanning}
                className="rounded-lg border border-teal-300 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors disabled:opacity-40"
              >
                {scanning ? "Scan en cours..." : "Scanner les appareils"}
              </button>
            </div>
          </div>
        )}

        {/* Scan results */}
        {scanResult && !scanResult.allOk && (
          <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-teal-900">Résultat du scan</h3>

            {scanResult.missing.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-700 mb-2">
                  Radiateurs manquants ({scanResult.missing.length}) :
                </p>
                {scanResult.missing.map((m) => (
                  <div key={m.did} className="text-sm text-red-600 ml-2">
                    {m.name} (zone: {m.zone}) — DID introuvable
                  </div>
                ))}
              </div>
            )}

            {scanResult.unassigned.length > 0 && (
              <div>
                <p className="text-sm font-medium text-teal-700 mb-2">
                  Appareils non assignés ({scanResult.unassigned.length}) :
                </p>
                {scanResult.unassigned.map((d) => (
                  <div key={d.did} className="flex flex-wrap items-center gap-2 mb-2 ml-2 text-sm">
                    <span className="text-gray-700">
                      {d.alias} ({d.isOnline ? "en ligne" : "hors ligne"})
                    </span>
                    {scanResult.missing.length > 0 ? (
                      // Replacement mode: assign to a missing device
                      scanResult.missing.map((m) => (
                        <button
                          key={m.did}
                          onClick={() => handleAddDevice(d.did, m.name, m.zone, m.did)}
                          disabled={loading}
                          className="rounded bg-teal-600 px-3 py-1 text-xs text-white hover:bg-teal-700 disabled:opacity-40"
                        >
                          Remplacer {m.name}
                        </button>
                      ))
                    ) : (
                      // New device mode: choose zone
                      <select
                        onChange={(e) => {
                          if (e.target.value) handleAddDevice(d.did, d.alias, e.target.value);
                        }}
                        defaultValue=""
                        className="rounded border border-teal-300 px-2 py-1 text-xs"
                      >
                        <option value="" disabled>Assigner à une zone...</option>
                        {scanResult.zones.map((z) => (
                          <option key={z.id} value={z.id}>{z.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {scanResult?.allOk && (
          <div className="mb-6 rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
            Tous les radiateurs sont correctement configurés.
          </div>
        )}

        {/* Zone sections */}
        {!data && !error && (
          <div className="py-12 text-center text-gray-400">
            Chargement des radiateurs...
          </div>
        )}

        <div className="space-y-6">
          {data?.zones.map((zone) => (
            <HeatingZoneCard
              key={zone.id}
              zoneId={zone.id}
              label={zone.label}
              cftTemp={zone.cftTemp}
              ecoTemp={zone.ecoTemp}
              devices={zone.devices}
              onSetZoneMode={handleSetZoneMode}
              onSetDeviceMode={handleSetDeviceMode}
              loading={loading}
              role={role}
              trends={trends}
              presenceSince={presenceSince}
              onToggleLock={handleToggleLock}
            />
          ))}
        </div>

        {/* Scheduling rules reference */}
        <details className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-600">
            Règles de chauffage
          </summary>
          <div className="mt-3 space-y-3 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800">Chambres occupées</h4>
              <ul className="ml-4 list-disc">
                <li>7h-20h : Mode présence</li>
                <li>20h-7h : Confort</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">RDC occupé (espaces communs)</h4>
              <ul className="ml-4 list-disc">
                <li>7h-20h : Mode présence</li>
                <li>20h-0h : Confort</li>
                <li>0h-5h : Mode présence (éco si personne)</li>
                <li>5h-7h : Confort</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Entre deux réservations (même jour)</h4>
              <ul className="ml-4 list-disc">
                <li>9h-17h : Éco</li>
                <li>Sinon : Hors-gel</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Pas de réservation</h4>
              <p className="ml-4">Hors-gel</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Pré-chauffage</h4>
              <ul className="ml-4 list-disc">
                <li>12h : Éco (montée progressive, évite de faire sauter les plombs)</li>
                <li>15h : Confort (arrivée voyageurs à 17h)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800">Températures par défaut</h4>
              <ul className="ml-4 list-disc">
                <li>Confort : 21°C (22°C dernier étage)</li>
                <li>Éco : 17°C</li>
                <li>Reset automatique toutes les 4h</li>
              </ul>
            </div>
          </div>
        </details>
      </main>
    </>
  );
}
