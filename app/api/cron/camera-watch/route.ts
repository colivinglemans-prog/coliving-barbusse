import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@sejour/socle/lib/cron-auth";
import jpeg from "jpeg-js";
import { AjCloud, type AjAlarm } from "@/lib/camera/ajcloud";
import { maxCts, newAlarmsSince, toCameraAlert } from "@/lib/camera/watch";
import {
  decodeMemory,
  encodeMemory,
  filteredCameras,
  judgeScene,
  motionDecision,
  rememberScene,
  sceneThreshold,
  thumbnailFromRgba,
  type SceneMemory,
  type SceneVerdict,
  type Thumbnail,
} from "@/lib/camera/scene";
import { getRedis, hasRedis, redisKey } from "@/lib/redis";
import { garagePriority, householdVerdict } from "@/lib/camera/household";
import { garageOpenings } from "@/lib/cleaning/sources";
import { getActiveBookings, stayInProgress } from "@/lib/bookings";
import { recordNotification } from "@/lib/notify-log";
import { todayParis } from "@sejour/socle/lib/time";
import { beat } from "@/lib/heartbeat";
import { isDryRun } from "@/lib/cron-params";

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
 * **Filtre des faux positifs** (2026-11-16, `lib/camera/scene.ts`) : pour les caméras listées dans
 * `CAMERA_SCENE_FILTER_DIDS` (le garage), l'image du mouvement est comparée à la précédente du même
 * mode (IR ou couleur). Sans changement (linge qui bouge), le mouvement est ignoré pendant un
 * séjour et part en priorité 1 (muette) maison vide. Image illisible → notifié. Les mouvements
 * ignorés vont dans `barbusse:camera:ignored` (50 derniers) ; un mouvement retenu note son `cts`
 * dans `barbusse:camera:last-real:<did>` (lu par la surveillance de la serrure au départ).
 * `CAMERA_SCENE_THRESHOLD` (défaut 12) règle le seuil, `CAMERA_SCENE_FILTER=false` coupe le filtre.
 *
 * **Caméra du garage** (2026-11-18, décision de l'hôte) : les caméras listées dans
 * `CAMERA_SCENE_FILTER_DIDS` sont celles du garage, qui **n'est pas un espace des voyageurs** —
 * priorité 4 même pendant un séjour, sauf la nuit (22 h-8 h, 2 pendant un séjour, le temps de
 * recalibrer le filtre de nuit) — `garagePriority`. En revanche, un mouvement
 * qui suit une ouverture du digicode par un code **nommé** de la maison (Perso, Sophie, Eric…) est
 * expliqué et ne notifie rien, tant que l'activité continue (`lib/camera/household.ts`, échéance
 * dans `barbusse:camera:household-until:<did>`, jugée après le filtre de scène : seul un mouvement
 * significatif prolonge la présence, 12 h au plus après la dernière ouverture ; `last-real` garde
 * sa condition). Journal Intratone illisible (6 s) → règle normale, sauf pendant une chaîne déjà
 * ouverte : silence jusqu'à son échéance (30 min au plus), sans la prolonger. Les caméras d'entrée et du
 * jardin, à venir, garderont la priorité selon la présence.
 *
 * Cron-job.org, toutes les 10 minutes ; 5 recommandées (`alarms-survey` ne rend que le dernier
 * mouvement : à 10 min, un vrai passage suivi d'un frémissement de linge n'est vu que par le second). Battement `camera-watch` à chaque passage réel (`ok` aussi
 * quand la veille est coupée ou sans identifiants : sautée par décision, pas en panne).
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ALERTS_PER_RUN = 6;

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dry = isDryRun(request.nextUrl.searchParams);
  if (process.env.CAMERA_WATCH_ENABLED === "false") {
    if (!dry) await beat("camera-watch", "ok");
    return NextResponse.json({ skipped: "disabled" });
  }

  const email = process.env.AJCLOUD_EMAIL;
  const password = process.env.AJCLOUD_PASSWORD;
  if (!email || !password) {
    if (!dry) await beat("camera-watch", "ok");
    return NextResponse.json({ skipped: "no-credentials" });
  }

  if (!hasRedis()) {
    return NextResponse.json({ skipped: "no-redis" }, { status: 500 });
  }

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
    let muted = 0;
    let imageErrors = 0;
    const ignored: Array<{ did: string; cts: number; diff?: number }> = [];
    let priority: 2 | 4 | undefined;
    const filtered = filteredCameras(process.env.CAMERA_SCENE_FILTER, process.env.CAMERA_SCENE_FILTER_DIDS);
    // Caméras du garage : la même liste, que le filtre de scène soit actif ou coupé.
    const garage = filteredCameras(undefined, process.env.CAMERA_SCENE_FILTER_DIDS);
    let openings: Array<{ at: Date }> | null = null;
    let household = 0;
    const threshold = sceneThreshold(process.env.CAMERA_SCENE_THRESHOLD);

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

      const isGarage = garage.has(device.deviceId);
      // Garage : pas un espace des voyageurs → 4 même pendant un séjour, sauf la nuit (2).
      const stayPriority = (priority ??= await motionPriority());
      if (isGarage) openings ??= await readGarageOpenings();
      const untilKey = redisKey("camera", "household-until", device.deviceId);
      let until: number | null = isGarage ? Number((await redis.get(untilKey).catch(() => null)) ?? 0) || null : null;
      const untilBefore = until;
      const filtering = filtered.has(device.deviceId);
      const memoryKey = redisKey("camera", "scene", device.deviceId);
      let memory: SceneMemory = filtering ? decodeMemory(await redis.get(memoryKey).catch(() => null)) : {};
      let memoryChanged = false;
      for (const alarm of fresh) {
        if (sent >= MAX_ALERTS_PER_RUN) break;
        const alert = toCameraAlert(alarm);

        // Filtre de scène (caméra du garage) : un mouvement qui ne change pas l'image est ignoré
        // pendant un séjour, muet maison vide. Image illisible → vrai mouvement (`lib/camera/scene.ts`).
        let verdict: SceneVerdict = { significant: true, reason: "no-reference" };
        // Une image illisible est notifiée, mais ne prouve aucune présence : elle ne reporte pas
        // l'alerte de porte (`last-real`), sinon un AJCloud lent + du linge repousseraient l'alerte.
        let sceneRead = !filtering;
        if (filtering) {
          const thumb = await readThumbnail(alarm);
          if (thumb) {
            verdict = judgeScene(memory, thumb, threshold);
            memory = rememberScene(memory, thumb);
            sceneRead = true;
            memoryChanged = true;
          } else {
            verdict = { significant: true, reason: "no-reference" };
            imageErrors += 1;
          }
        }
        // Garage : une personne de la maison est entrée avec son code (Perso, Sophie…) → rien. Jugé
        // APRÈS le filtre de scène : seul un mouvement significatif prolonge la présence, et
        // `last-real` garde sa condition (jamais du linge qui bouge).
        if (isGarage) {
          const h = householdVerdict(Number(alarm.cts), openings ?? [], until, verdict.significant && sceneRead);
          until = h.until;
          if (h.quiet) {
            household += 1;
            ignored.push({ did: device.deviceId, cts: Number(alarm.cts), diff: verdict.diff });
            if (!dry) {
              await recordIgnored(redis, Number(alarm.cts), verdict.diff, "household");
              if (verdict.significant && sceneRead) await redis.set(redisKey("camera", "last-real", device.deviceId), Number(alarm.cts));
            }
            continue;
          }
        }
        const presence = isGarage ? garagePriority(stayPriority === 2, parisHourOf(Number(alarm.cts))) : stayPriority;
        const decision = motionDecision(verdict, presence);

        if (!decision.send) {
          ignored.push({ did: device.deviceId, cts: Number(alarm.cts), diff: verdict.diff });
          if (!dry) await recordIgnored(redis, Number(alarm.cts), verdict.diff);
          continue;
        }
        if (!dry) {
          await sendMotion(device.name, alert.when, alert.imageUrl, alert.videoUrl, decision.priority);
          // Écart de l'image des mouvements envoyés : avec celui des ignorés, de quoi recalibrer le
          // seuil (un faux positif de nuit passé à 22 h 51 le 17/11 n'avait laissé aucune trace).
          if (filtering) await recordSent(redis, Number(alarm.cts), verdict.diff, decision.priority);
          if (verdict.significant && sceneRead) await redis.set(redisKey("camera", "last-real", device.deviceId), Number(alarm.cts));
        }
        if (!verdict.significant) muted += 1;
        sent += 1;
      }

      if (!dry && memoryChanged) await redis.set(memoryKey, encodeMemory(memory));
      if (!dry && until !== null && until !== untilBefore) await redis.set(untilKey, until, { px: Math.max(1, until - Date.now()) + 60_000 });
      if (!dry) await redis.set(key, maxCts(alarms, lastCts));
    }

    if (!dry) await beat("camera-watch", "ok");
    return NextResponse.json({
      success: true,
      dry,
      devices: report,
      sent,
      muted,
      ignored: ignored.map((i) => ({ cts: i.cts, diff: i.diff === undefined ? null : Math.round(i.diff * 10) / 10 })),
      imageErrors,
      household,
      filter: { cameras: filtered.size, threshold },
      ...(priority ? { priority } : {}),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    if (!dry) await beat("camera-watch", "error");
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

const IMAGE_TIMEOUT_MS = 5_000;
const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const IGNORED_LOG_MAX = 50;

/**
 * Vignette de l'image d'un mouvement (l'originale, sur laquelle le seuil a été mesuré ; sinon la
 * miniature). `null` si elle ne peut être ni téléchargée ni décodée : le mouvement est alors
 * traité comme vrai. L'URL signée n'est jamais journalisée.
 */
async function readThumbnail(alarm: AjAlarm): Promise<Thumbnail | null> {
  const images = Array.isArray(alarm.images) ? alarm.images : [];
  const pick =
    images.find((i) => i.url && i.tags === "original") ?? images.find((i) => i.url && i.url.length > 0);
  if (!pick) return null;
  try {
    const res = await fetch(pick.url, { cache: "no-store", signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`image ${res.status}`);
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > IMAGE_MAX_BYTES) throw new Error("image trop lourde");
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.length > IMAGE_MAX_BYTES) throw new Error("image trop lourde");
    const img = jpeg.decode(buf, { useTArray: true, maxResolutionInMP: 4, maxMemoryUsageInMB: 64 });
    return thumbnailFromRgba(img.data, img.width, img.height);
  } catch (e) {
    console.error("[camera-watch] image illisible:", e instanceof Error ? e.message.slice(0, 80) : "erreur");
    return null;
  }
}

/** Mouvements envoyés (50 derniers : instant, écart, priorité, sans URL), `barbusse:camera:sent`. */
async function recordSent(
  redis: ReturnType<typeof getRedis>,
  cts: number,
  diff: number | undefined,
  priority: number,
): Promise<void> {
  try {
    const key = redisKey("camera", "sent");
    await redis.lpush(key, JSON.stringify({ at: new Date(cts).toISOString(), diff: diff ?? null, priority }));
    await redis.ltrim(key, 0, IGNORED_LOG_MAX - 1);
  } catch (e) {
    console.error("[camera-watch] journal des mouvements envoyés:", e instanceof Error ? e.message : e);
  }
}

/**
 * Ouvertures du digicode du garage par un code nommé de la maison, ou `[]` si le journal Intratone
 * ne se lit pas à temps : le mouvement suit alors la règle normale (une alerte de trop plutôt
 * qu'une de moins).
 */
async function readGarageOpenings(): Promise<Array<{ at: Date }>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      garageOpenings(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("délai dépassé")), 6_000);
      }),
    ]);
  } catch (e) {
    console.error("[camera-watch] journal du garage illisible:", e instanceof Error ? e.message : e);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Mouvements ignorés (50 derniers : instant, écart, motif, sans URL), pour recalibrer le seuil.
 * `why` : `scene` (image sans changement) ou `household` (code de la maison au garage).
 */
async function recordIgnored(
  redis: ReturnType<typeof getRedis>,
  cts: number,
  diff?: number,
  why: "scene" | "household" = "scene",
): Promise<void> {
  try {
    const key = redisKey("camera", "ignored");
    await redis.lpush(key, JSON.stringify({ at: new Date(cts).toISOString(), diff: diff ?? null, why }));
    await redis.ltrim(key, 0, IGNORED_LOG_MAX - 1);
  } catch (e) {
    console.error("[camera-watch] journal des mouvements ignorés:", e instanceof Error ? e.message : e);
  }
}

async function sendMotion(
  deviceName: string,
  when: string,
  imageUrl: string | null,
  videoUrl: string | null,
  priority: 1 | 2 | 4,
): Promise<void> {
  const topic = process.env.NTFY_TOPIC;
  // Jamais un mouvement noté envoyé alors qu'il ne l'est pas (la route vérifie le sujet avant).
  if (!topic) throw new Error("NTFY_TOPIC manquant : notification non envoyée");
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
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`ntfy ${res.status}`);
  // Journal des 30 jours : titre et priorité seulement, jamais les liens signés.
  await recordNotification({ title: `Mouvement - ${deviceName}`, priority, tags: ["camera"] });
}

/** Heure de Paris (0-23) d'un instant en millisecondes. */
function parisHourOf(ms: number): number {
  return Number(new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", hourCycle: "h23" }).format(new Date(ms)));
}

/** Replie les accents du titre (en-têtes ntfy en ASCII) sans dépendre de la table complète. */
function asciiTitle(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7e]/g, "");
}
