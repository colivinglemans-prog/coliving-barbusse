import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import { AjCloud } from "@/lib/camera/ajcloud";
import { maxCts, newAlarmsSince, toCameraAlert } from "@/lib/camera/watch";
import { getRedis, hasRedis, redisKey } from "@/lib/redis";
import { getActiveBookings, stayInProgress } from "@/lib/bookings";
import { recordNotification } from "@/lib/notify-log";
import { todayParis } from "@sejour/socle/lib/time";

/**
 * Veille de vidéosurveillance : relaie vers ntfy les nouveaux événements de mouvement des
 * caméras Wansview / Cinnado de la maison, avec l'image de l'événement en pièce jointe et un
 * lien vers le clip vidéo.
 *
 * L'appli officielle n'expose ni RTSP ni ONVIF et son flux passe par un P2P propriétaire ;
 * mais son API cloud, elle, se laisse interroger avec le compte Wansview (`lib/camera/ajcloud.ts`).
 * On y lit les alarmes (`alarms-survey`) sans jamais toucher à la caméra ni au réseau local :
 * le cron tourne donc sur Vercel, et l'alerte arrive sur le téléphone où que soit l'hôte.
 *
 * **Anti-inondation.** Au tout premier passage d'une caméra, on ne notifie rien : on mémorise
 * seulement l'horodatage du dernier événement connu (`barbusse:camera:last-cts:<did>`), pour ne
 * pas déverser tout l'historique. Les passages suivants ne notifient que ce qui est postérieur.
 *
 * **Dépôt public.** Les URLs d'image et de vidéo sont signées (jetons temporaires) : elles ne
 * figurent jamais dans la réponse de ce cron ni dans les logs — seulement dans la notification.
 *
 * Variables : `AJCLOUD_EMAIL`, `AJCLOUD_PASSWORD` (absentes → le cron se tait, `skipped`),
 * `NTFY_TOPIC`, `CRON_SECRET`. `CAMERA_WATCH_ENABLED=false` le coupe sans redéployer.
 * `?dry=1` calcule et rend le compte rendu sans envoyer ni rien mémoriser.
 *
 * **Priorité selon la présence** (2026-11-14, décision de l'hôte) : 4 quand la maison est vide
 * (un mouvement y est suspect), 2 pendant un séjour, du jour d'arrivée au jour de départ inclus
 * (chaque entrée et sortie des voyageurs ferait sonner le téléphone). Beds24 illisible → 4.
 *
 * Cron-job.org, toutes les 5 minutes.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ALERTS_PER_RUN = 6;

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.CAMERA_WATCH_ENABLED === "false") {
    return NextResponse.json({ skipped: "disabled" });
  }

  const email = process.env.AJCLOUD_EMAIL;
  const password = process.env.AJCLOUD_PASSWORD;
  if (!email || !password) {
    return NextResponse.json({ skipped: "no-credentials" });
  }

  if (!hasRedis()) {
    return NextResponse.json({ skipped: "no-redis" }, { status: 500 });
  }

  const dry = request.nextUrl.searchParams.get("dry") === "1";
  const redis = getRedis();

  let devices;
  try {
    const client = new AjCloud({ email, password, region: "eu" });
    await client.login();
    devices = await client.devices();

    const report: Array<{
      did: string;
      name: string;
      online: boolean;
      total: number;
      fresh: number;
      baseline?: boolean;
    }> = [];
    let sent = 0;
    let priority: 2 | 4 | undefined;

    for (const device of devices) {
      if (!device.emcUrl) {
        report.push({ did: device.deviceId, name: device.name, online: device.online, total: 0, fresh: 0 });
        continue;
      }
      const alarms = await client.alarmsSurvey(device);
      const key = redisKey("camera", "last-cts", device.deviceId);
      const stored = await redis.get<number>(key);
      const lastCts = typeof stored === "number" ? stored : Number(stored ?? 0);

      // Premier passage : on pose la ligne de base sans notifier.
      if (!stored) {
        const baseline = maxCts(alarms, 0);
        if (!dry && baseline > 0) await redis.set(key, baseline);
        report.push({
          did: device.deviceId,
          name: device.name,
          online: device.online,
          total: alarms.length,
          fresh: 0,
          baseline: true,
        });
        continue;
      }

      const fresh = newAlarmsSince(alarms, lastCts);
      report.push({
        did: device.deviceId,
        name: device.name,
        online: device.online,
        total: alarms.length,
        fresh: fresh.length,
      });

      if (fresh.length === 0) continue;

      if (!dry && !process.env.NTFY_TOPIC) {
        return NextResponse.json(
          { error: "NTFY_TOPIC is not set: a motion event cannot be delivered" },
          { status: 500 },
        );
      }

      priority ??= await motionPriority();
      for (const alarm of fresh) {
        if (sent >= MAX_ALERTS_PER_RUN) break;
        const alert = toCameraAlert(alarm);
        if (!dry) {
          await sendMotion(device.name, alert.when, alert.imageUrl, alert.videoUrl, priority);
        }
        sent += 1;
      }

      if (!dry) await redis.set(key, maxCts(alarms, lastCts));
    }

    return NextResponse.json({ success: true, dry, devices: report, sent, ...(priority ? { priority } : {}) });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

/**
 * Notification ntfy avec l'image de l'événement en pièce jointe (ntfy la récupère à l'URL
 * donnée) et le clip vidéo au tap. Titre en ASCII (les en-têtes ntfy le sont) ; le corps, lui,
 * accepte l'UTF-8. On ne journalise jamais les URLs signées.
 */
async function motionPriority(): Promise<2 | 4> {
  try {
    return stayInProgress(await getActiveBookings(), todayParis()) ? 2 : 4;
  } catch (e) {
    console.error("[camera-watch] réservations illisibles:", e instanceof Error ? e.message : e);
    return 4;
  }
}

async function sendMotion(
  deviceName: string,
  when: string,
  imageUrl: string | null,
  videoUrl: string | null,
  priority: 2 | 4,
): Promise<void> {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;
  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    Title: asciiTitle(`Mouvement - ${deviceName}`),
    Priority: String(priority),
    Tags: "camera,movie_camera",
  };
  if (imageUrl) headers.Attach = imageUrl;
  if (videoUrl) headers.Click = videoUrl;
  const res = await fetch(topic, {
    method: "POST",
    headers,
    body: `Mouvement détecté à ${when}.`,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`ntfy ${res.status}`);
  // Journal des 30 jours : titre et priorité seulement, jamais les liens signés.
  await recordNotification({ title: `Mouvement - ${deviceName}`, priority, tags: ["camera"] });
}

/** Replie les accents du titre (en-têtes ntfy en ASCII) sans dépendre de la table complète. */
function asciiTitle(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7e]/g, "");
}
