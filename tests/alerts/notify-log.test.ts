/**
 * Journal des notifications (30 jours), présence de voyageurs pour la priorité, radiateurs tenus
 * hors des alertes. Données inventées.
 */
import { describe, expect, it } from "vitest";
import { parse, summarizeNotifications, titleFamily, type NotificationRecord } from "@/lib/notify-log";
import { guestsAround, stayInProgress } from "@/lib/bookings";
import { alertIgnoredDids } from "@/lib/heatzy";
import type { Beds24Booking, HeatzyZoneConfig } from "@/lib/types";

describe("journal des notifications", () => {
  it("une entrée illisible est ignorée, jamais une exception", () => {
    expect(parse("{pas du json")).toBeNull();
    expect(parse(null)).toBeNull();
    expect(parse({ title: "sans date" })).toBeNull();
    expect(parse('{"at":"2026-11-14T00:00:00Z","title":"x","priority":3}')).toMatchObject({ title: "x" });
  });

  it("regroupe les titres qui ne diffèrent que par un nombre", () => {
    expect(titleFamily("[Chauffage] 3 radiateur(s) en alerte")).toBe("[Chauffage] N radiateur(s) en alerte");
  });

  it("résume par priorité, par famille et par jour de Paris", () => {
    const r: NotificationRecord[] = [
      { at: "2026-11-14T02:30:45Z", title: "[Chauffage] 1 radiateur(s) en alerte", priority: 4 },
      { at: "2026-11-14T05:30:42Z", title: "[Chauffage] Radiateurs rétablis", priority: 1 },
      { at: "2026-11-13T23:30:00Z", title: "[Chauffage] 2 radiateur(s) en alerte", priority: 4 },
    ];
    const s = summarizeNotifications(r);
    expect(s.total).toBe(3);
    expect(s.byPriority).toEqual({ "1": 1, "4": 2 });
    expect(s.byTitle[0]).toMatchObject({ title: "[Chauffage] N radiateur(s) en alerte", count: 2, maxPriority: 4 });
    // 23 h 30 UTC le 13 = 0 h 30 le 14 à Paris
    expect(s.byDay).toEqual({ "2026-11-14": 3 });
  });
});

describe("présence de voyageurs", () => {
  const b = (arrival: string, departure: string, status = "confirmed") =>
    ({ id: 1, arrival, departure, status }) as unknown as Beds24Booking;

  it("séjour en cours, du jour d'arrivée au jour de départ inclus", () => {
    expect(stayInProgress([b("2026-11-10", "2026-11-14")], "2026-11-14")).toBe(true);
    expect(stayInProgress([b("2026-11-15", "2026-11-17")], "2026-11-14")).toBe(false);
    expect(stayInProgress([b("2026-11-10", "2026-11-16", "request")], "2026-11-14")).toBe(false);
  });

  it("voyageurs là ou arrivant d'ici demain", () => {
    expect(guestsAround([b("2026-11-15", "2026-11-17")], "2026-11-14", "2026-11-15")).toBe(true);
    expect(guestsAround([b("2026-11-16", "2026-11-17")], "2026-11-14", "2026-11-15")).toBe(false);
    expect(guestsAround([b("2026-11-15", "2026-11-17", "new")], "2026-11-14", "2026-11-15")).toBe(true);
  });
});

describe("radiateurs tenus hors des alertes", () => {
  it("rend les identifiants marqués `alerts: false`", () => {
    const config = {
      zones: [
        {
          id: "rdc",
          label: "RDC",
          defaultMode: "fro",
          devices: [
            { did: "a", name: "Salon", defaultMode: "fro" },
            { did: "b", name: "Véranda D", defaultMode: "fro", alerts: false },
          ],
        },
      ],
      roomMapping: {},
    } as unknown as HeatzyZoneConfig;
    expect([...alertIgnoredDids(config)]).toEqual(["b"]);
  });
});
