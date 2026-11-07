import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { getBookingsWithArchive } from "@/lib/bookings";
import { sendNtfy } from "@sejour/socle/lib/ntfy";
import { todayParis } from "@sejour/socle/lib/time";
import type { Beds24Booking } from "@/lib/types";
import { readKeypadArrivals } from "@/lib/access-sync";

const CHECKIN_INFO_CODE = "CHECKIN";
const REDIS_KEY_TTL_SECONDS = 60 * 24 * 3600; // 60 jours

let redisClient: Redis | null = null;
function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return redisClient;
}

function addDays(yyyymmdd: string, delta: number): string {
  const d = new Date(yyyymmdd + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().split("T")[0];
}

function findCheckInItem(booking: Beds24Booking) {
  return booking.infoItems?.find(
    (i) => (i.code ?? "").toUpperCase() === CHECKIN_INFO_CODE,
  );
}

function formatGuest(b: Beds24Booking): string {
  const name = [b.firstName, b.lastName].filter(Boolean).join(" ").trim();
  return name || "Voyageur inconnu";
}

function nights(b: Beds24Booking): number {
  const a = new Date(b.arrival + "T00:00:00Z").getTime();
  const d = new Date(b.departure + "T00:00:00Z").getTime();
  return Math.max(1, Math.round((d - a) / 86_400_000));
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.CHECKIN_NOTIFICATIONS_ENABLED === "false") {
    return NextResponse.json({ skipped: "disabled" });
  }

  try {
    const today = todayParis();
    // Fenêtre large : arrivées récentes (J-3) jusqu'à demain.
    // Couvre les late check-ins et le cas où l'utilisateur retape son code à J+1.
    const arrivalFrom = addDays(today, -3);
    const arrivalTo = addDays(today, 1);

    const bookings = await getBookingsWithArchive({
      arrivalFrom,
      arrivalTo,
      includeInfoItems: true,
    });

    // Source de l'arrivée : la première ouverture au clavier par le code de la réservation,
    // lue dans le journal de la serrure. L'`infoItem` `CHECKIN` que déposait le connecteur
    // Beds24 → Nuki reste lu en secours, le temps que ses derniers séjours passent.
    let keypad = new Map<number, string>();
    let keypadError: string | null = null;
    try {
      keypad = await readKeypadArrivals();
    } catch (e) {
      keypadError = e instanceof Error ? e.message : String(e);
    }

    const redis = getRedis();
    const notified: Array<{ id: number; guest: string; arrivalTime: string }> = [];
    const errors: Array<{ id: number; error: string }> = [];

    for (const b of bookings) {
      // Skip réservations annulées / blackées
      if (b.status === "cancelled" || b.status === "black") continue;

      const item = findCheckInItem(b);
      const enteredAt = keypad.get(b.id) ?? item?.createTime ?? null;
      if (!enteredAt) continue;

      const key = `checkin:notified:${b.id}`;
      const already = await redis.get(key);
      if (already) continue;

      const guest = formatGuest(b);
      // Instant ISO UTC : journal de la serrure, ou `createTime` de l'ancien `CHECKIN`.
      const arrivalTime = enteredAt
        ? new Date(enteredAt).toLocaleString("fr-FR", {
            timeZone: "Europe/Paris",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "à l'instant";

      const channel = b.channel || b.referer || "Direct";
      const title = `🔑 Check-in ${guest}`;
      const lines = [
        `${guest} • ${channel}`,
        `Arrivée : ${arrivalTime}`,
        `Séjour : ${b.arrival} → ${b.departure} (${nights(b)} nuit${nights(b) > 1 ? "s" : ""})`,
        `Voyageurs : ${b.numAdult ?? 0} adulte${(b.numAdult ?? 0) > 1 ? "s" : ""}${b.numChild ? ` + ${b.numChild} enfant${b.numChild > 1 ? "s" : ""}` : ""}`,
      ];

      try {
        await sendNtfy(lines.join("\n"), {
          title,
          priority: 4,
          tags: ["key"],
        });
        // SET seulement après succès de l'envoi pour pouvoir retry au prochain tick si ntfy down
        await redis.set(key, { at: new Date().toISOString(), enteredAt }, {
          ex: REDIS_KEY_TTL_SECONDS,
        });
        notified.push({ id: b.id, guest, arrivalTime });
      } catch (e) {
        errors.push({
          id: b.id,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return NextResponse.json({
      success: true,
      window: { arrivalFrom, arrivalTo },
      scanned: bookings.length,
      notified,
      errors,
      keypadError,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
