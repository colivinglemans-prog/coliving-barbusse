"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Page « Vidéo » (admin) : les caméras Wansview/AJCloud avec leur **image instantanée** (rafraîchie
 * ≈ 30 s → pseudo-direct) et la **galerie des événements de mouvement** (image + court clip vidéo
 * jouable en ligne). ICSee/ANRAN (clouds distincts) s'affichent en encarts « non connectées ».
 *
 * Le **vrai direct** (flux live continu) viendra d'un pont local (go2rtc sur la VM Freebox) — pas
 * d'un serverless. Les clips sont du MPEG-TS, lus par `mpegts.js` (chargé à la demande).
 */

interface MotionEvent {
  at: string;
  imageUrl: string;
  videoUrl: string | null;
}
interface Camera {
  deviceId: string;
  name: string;
  online: boolean;
  snapshotUrl: string | null;
  events: MotionEvent[];
}
interface Payload {
  generatedAt: string;
  cameras: Camera[];
  others: { name: string; reason: string }[];
  liveBase: string | null;
  error?: string;
}

const REFRESH_MS = 30_000;

const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default function VideoDashboard() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clip, setClip] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const fetchOnce = () =>
      fetch("/api/dashboard/video", { cache: "no-store" })
        .then(async (r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return (await r.json()) as Payload;
        })
        .then((d) => {
          if (alive) {
            setData(d);
            setError(null);
          }
        })
        .catch((e) => alive && setError(String(e)));
    fetchOnce();
    const id = setInterval(fetchOnce, REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (error && !data) {
    return <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-red-600">Erreur : {error}</p>;
  }
  if (!data) {
    return <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate-500">Chargement…</p>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold text-slate-800">Caméras</h1>
        <p className="text-sm text-slate-500">
          Image rafraîchie automatiquement et alertes de mouvement (image + court clip). Le direct
          continu viendra du pont local (Freebox).
        </p>
      </header>

      {data.error && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {data.error === "no-credentials"
            ? "Identifiants caméra absents sur le serveur."
            : `Caméras indisponibles : ${data.error}`}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.cameras.map((cam) => (
          <article key={cam.deviceId} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
              <span className="font-medium text-slate-800">{cam.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  cam.online ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                }`}
              >
                {cam.online ? "en ligne" : "hors ligne"}
              </span>
            </div>

            {/* Image courante (pseudo-direct) */}
            <div className="relative aspect-video bg-slate-900">
              {cam.snapshotUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cam.snapshotUrl}
                  alt={`Image de ${cam.name}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  pas d&apos;image
                </div>
              )}
            </div>

            {/* Galerie des alertes de mouvement */}
            <div className="px-3 py-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                Mouvements récents
              </p>
              {cam.events.length === 0 ? (
                <p className="text-xs text-slate-400">Aucun événement récent.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {cam.events.map((ev, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => ev.videoUrl && setClip(ev.videoUrl)}
                      className="group relative block overflow-hidden rounded border border-slate-200"
                      title={`${timeFmt.format(new Date(ev.at))}${ev.videoUrl ? " — voir la vidéo" : ""}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ev.imageUrl} alt="" className="aspect-video w-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1 py-0.5 text-[10px] text-white">
                        {timeFmt.format(new Date(ev.at))}
                      </span>
                      {ev.videoUrl && (
                        <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 transition group-hover:opacity-100">
                          ▶
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </article>
        ))}

        {/* Caméras non branchées */}
        {data.others.map((o) => (
          <article key={o.name} className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-500">{o.name}</span>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-500">
                non connectée
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{o.reason}</p>
            <p className="mt-1 text-xs text-slate-400">
              Sera branchée via le pont local (RTSP) sur la Freebox.
            </p>
          </article>
        ))}
      </section>

      <p className="mt-3 text-right text-xs text-slate-400">
        Mis à jour à {timeFmt.format(new Date(data.generatedAt))}
      </p>

      {clip && <ClipModal url={clip} onClose={() => setClip(null)} />}
    </div>
  );
}

/** Lecture d'un clip MPEG-TS (.ts) via mpegts.js, chargé à la demande. */
function ClipModal({ url, onClose }: { url: string; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let player:
      | { attachMediaElement: (el: HTMLMediaElement) => void; load: () => void; destroy: () => void }
      | null = null;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import("mpegts.js");
        const mpegts = mod.default;
        if (cancelled || !videoRef.current || !mpegts.isSupported()) {
          setFailed(true);
          return;
        }
        player = mpegts.createPlayer({ type: "mpegts", url, isLive: false });
        player.attachMediaElement(videoRef.current);
        player.load();
        videoRef.current.play().catch(() => {});
      } catch {
        setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      try {
        player?.destroy();
      } catch {
        /* rien */
      }
    };
  }, [url]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div className="w-full max-w-2xl rounded-lg bg-black" onClick={(e) => e.stopPropagation()}>
        <video ref={videoRef} controls className="max-h-[70vh] w-full rounded-t-lg bg-black" />
        <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-300">
          {failed ? (
            <a href={url} target="_blank" rel="noreferrer" className="underline">
              Lecture impossible ici — ouvrir/télécharger le clip
            </a>
          ) : (
            <span>Clip de mouvement</span>
          )}
          <button type="button" onClick={onClose} className="rounded bg-slate-700 px-3 py-1 text-white">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
