import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import {
  getWaterHeaterStatus,
  getExpectedSettings,
  CATCH_UP_BOOST,
  setDHWMode,
  setBoostMode,
  setTargetTemperature,
} from "@/lib/cozytouch";
import { getActiveBookings, countGuests } from "@/lib/bookings";
import { sendWaterHeaterAlert } from "@/lib/alerts";
import { beat } from "@/lib/heartbeat";
import { todayParis, currentHourParis } from "@sejour/socle/lib/time";
import { getRedis, redisKey } from "@/lib/redis";
import { appendWaterHeaterLog, logEntry } from "@/lib/water-heater-log";

const CATCH_UP_NOTICE_KEY = redisKey("water-heater", "catchup-notified");
const CATCH_UP_NOTICE_TTL_SECONDS = 6 * 3600;

/** `true` si la notification de rattrapage peut partir (verrou posé). Redis injoignable : elle part. */
async function claimCatchUpNotice(): Promise<boolean> {
  try {
    const res = await getRedis().set(CATCH_UP_NOTICE_KEY, new Date().toISOString(), {
      nx: true,
      ex: CATCH_UP_NOTICE_TTL_SECONDS,
    });
    return res === "OK";
  } catch (e) {
    console.error("[water-heater-automation] verrou de notification:", e instanceof Error ? e.message : e);
    return true;
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = todayParis();
    const currentHour = currentHourParis();

    const bookings = await getActiveBookings();
    const guests = countGuests(bookings, today, currentHour);
    const status = await getWaterHeaterStatus();
    const { profile, catchUp, ...settings } = getExpectedSettings(guests, currentHour, status);

    const applied: string[] = [];

    if (status.mode !== settings.mode) {
      await setDHWMode(settings.mode);
      applied.push(`mode ${status.mode} → ${settings.mode}`);
    }

    if (status.targetTemperature !== settings.targetTemperature) {
      await setTargetTemperature(settings.targetTemperature);
      applied.push(
        `consigne ${status.targetTemperature}°C → ${settings.targetTemperature}°C`,
      );
    }

    if (status.boostActive !== settings.boost) {
      await setBoostMode(settings.boost);
      applied.push(`boost ${status.boostActive ? "on" : "off"} → ${settings.boost ? "on" : "off"}`);
      // Une notification à l'enclenchement seulement : l'hystérésis le maintient ensuite sans
      // bruit. Et une par tranche de 6 h au plus : un ballon qui ignore la commande (ou un état
      // Overkiz figé) la ferait repartir à chaque passage horaire.
      if (catchUp && settings.boost && (await claimCatchUpNotice())) {
        await sendWaterHeaterAlert(
          "Boost de rattrapage enclenché",
          `Milieu du ballon à ${status.middleTemperature}°C (seuil ${CATCH_UP_BOOST.start}°C) avec ${guests} personne(s) présente(s).\nBoost maintenu jusqu'à ${CATCH_UP_BOOST.stop}°C au milieu.`,
          3,
        ).catch(() => {});
      }
    }

    await appendWaterHeaterLog(logEntry(new Date(), guests, profile, catchUp, status, applied));
    await beat("water-heater-automation", "ok");
    return NextResponse.json({
      success: true,
      profile,
      guests,
      settings,
      catchUp,
      middleTemperature: status.middleTemperature,
      applied,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await beat("water-heater-automation", "error");
    await sendWaterHeaterAlert(
      "Erreur automation eau chaude",
      `L'automation du ballon thermodynamique a rencontré une erreur :\n\n${message}`,
    ).catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
