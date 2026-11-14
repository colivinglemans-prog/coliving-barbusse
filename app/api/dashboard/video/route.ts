import { NextResponse, type NextRequest } from "next/server";
import { guard } from "@/lib/auth";
import { AjCloud } from "@/lib/camera/ajcloud";

/**
 * Charge utile de la page « Vidéo » (admin) : les caméras Wansview/AJCloud de la maison, avec
 * leur **image instantanée** et la **galerie des événements de mouvement** (image + court clip
 * vidéo). Tout vient de l'API cloud AJCloud (`lib/camera/ajcloud.ts`), relu à chaque appel car les
 * URLs sont **signées et expirent**.
 *
 * Le **direct** (flux live) ne vit pas ici : un serverless ne tient pas une connexion persistante.
 * Il viendra d'un pont local (go2rtc sur la VM Freebox) via `CAMERA_LIVE_BASE`. ICSee/ANRAN sont
 * sur des clouds distincts, non branchés → signalés en `others`.
 *
 * Admin seulement, revérifié ici. Aucune donnée sensible : ni identifiant, ni jeton. Les URLs
 * d'image/clip (signées, temporaires) ne sont renvoyées qu'à l'admin authentifié.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EVENTS_PER_CAMERA = 12;

export async function GET(request: NextRequest) {
  const refus = await guard.denyNonAdmin(request);
  if (refus) return refus;

  const email = process.env.AJCLOUD_EMAIL;
  const password = process.env.AJCLOUD_PASSWORD;
  if (!email || !password) {
    return NextResponse.json({ cameras: [], others: othersList(), error: "no-credentials" });
  }

  try {
    const client = new AjCloud({ email, password, region: "eu" });
    await client.login();
    const devices = await client.devices();

    const cameras = await Promise.all(
      devices.map(async (d) => {
        let events: Array<{ at: string; imageUrl: string; videoUrl: string | null }> = [];
        if (d.emcUrl) {
          const alarms = await client.alarmsSurvey(d).catch(() => []);
          events = alarms
            .map((a) => ({
              at: new Date(Number(a.cts)).toISOString(),
              imageUrl: firstUrl(a.images),
              videoUrl: firstUrl(a.avs),
            }))
            .filter((e) => e.imageUrl)
            .sort((x, y) => y.at.localeCompare(x.at))
            .slice(0, EVENTS_PER_CAMERA) as Array<{ at: string; imageUrl: string; videoUrl: string | null }>;
        }
        return {
          deviceId: d.deviceId,
          name: d.name,
          online: d.online,
          snapshotUrl: d.snapshotUrl,
          events,
        };
      }),
    );

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      cameras,
      others: othersList(),
      liveBase: process.env.CAMERA_LIVE_BASE ?? null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ cameras: [], others: othersList(), error: msg }, { status: 502 });
  }
}

/** Les caméras non branchées (clouds distincts), affichées en encarts « non connectées ». */
function othersList(): Array<{ name: string; reason: string }> {
  return [
    { name: "ICSee", reason: "cloud distinct (XMEye/jftechws) — non branché" },
    { name: "ANRAN", reason: "cloud distinct (Yoosee) — non branché" },
  ];
}

function firstUrl(items: Array<{ url: string }> | undefined): string {
  if (!Array.isArray(items)) return "";
  const found = items.find((i) => i.url && i.url.length > 0);
  return found ? found.url : "";
}
