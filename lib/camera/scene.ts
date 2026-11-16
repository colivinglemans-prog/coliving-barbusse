/**
 * Filtre des faux positifs de la caméra du garage (2026-11-16) — logique pure, sans E/S.
 *
 * La caméra filme un étendoir : le linge et un sac plastique qui bougent la déclenchent, surtout la
 * nuit en infrarouge. Mesure sur les 10 images d'une journée réelle : un faux positif reproduit
 * presque à l'identique l'image du mouvement précédent, un vrai passage la change franchement
 * (lumière allumée, linge étendu, silhouette).
 *
 * **Critère : l'écart du bloc le plus changé.** L'image est réduite à 64×36 en niveaux de gris,
 * découpée en 8×6 blocs de 8×6 pixels ; on prend l'écart absolu moyen du bloc qui a le plus changé.
 * La moyenne sur toute l'image diluerait une silhouette qui n'en occupe qu'une petite partie.
 * Mesuré : faux positifs 7,6 et 9,9 ; vrais mouvements 54 et plus. Seuil de départ très bas, 12
 * (décision de l'hôte), réglable par `CAMERA_SCENE_THRESHOLD`.
 *
 * **Deux références, une par mode.** La caméra passe en infrarouge (image sans couleur) quand le
 * garage est sombre. Une image IR se compare à la dernière image IR, une image en couleur à la
 * dernière en couleur : sinon un faux positif de nuit, comparé à une image éclairée de la veille,
 * passerait pour un changement. Le passage de l'IR à la couleur est toujours significatif :
 * quelqu'un a allumé.
 */

export const THUMB_W = 64;
export const THUMB_H = 36;
const BLOCK_W = 8;
const BLOCK_H = 6;

/** Saturation moyenne (0-255, comme le canal S de HSV) en dessous de laquelle l'image est en IR. */
export const IR_SATURATION_MAX = 4;

export const DEFAULT_SCENE_THRESHOLD = 12;

export type SceneMode = "ir" | "color";

export interface Thumbnail {
  /** 64×36 niveaux de gris, ligne par ligne. */
  gray: Uint8Array;
  mode: SceneMode;
  /** Saturation moyenne, pour le journal de calibrage. */
  saturation: number;
}

/**
 * Réduit une image RGBA (sortie de `jpeg-js`) en vignette 64×36 en gris, par moyenne des pixels
 * de chaque case, et mesure sa saturation moyenne.
 */
export function thumbnailFromRgba(data: Uint8Array, width: number, height: number): Thumbnail {
  if (width < THUMB_W || height < THUMB_H || data.length < width * height * 4) {
    throw new Error("image trop petite ou tronquée");
  }
  const gray = new Uint8Array(THUMB_W * THUMB_H);
  let satSum = 0;
  let satCount = 0;
  for (let ty = 0; ty < THUMB_H; ty++) {
    const y0 = Math.floor((ty * height) / THUMB_H);
    const y1 = Math.floor(((ty + 1) * height) / THUMB_H);
    for (let tx = 0; tx < THUMB_W; tx++) {
      const x0 = Math.floor((tx * width) / THUMB_W);
      const x1 = Math.floor(((tx + 1) * width) / THUMB_W);
      let sum = 0;
      let n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          sum += 0.299 * r + 0.587 * g + 0.114 * b;
          n++;
          const max = Math.max(r, g, b);
          if (max > 0) satSum += ((max - Math.min(r, g, b)) * 255) / max;
          satCount++;
        }
      }
      gray[ty * THUMB_W + tx] = Math.round(sum / Math.max(n, 1));
    }
  }
  const saturation = satCount ? satSum / satCount : 0;
  return { gray, mode: saturation < IR_SATURATION_MAX ? "ir" : "color", saturation };
}

/** Écart absolu moyen du bloc 8×6 le plus changé entre deux vignettes. */
export function blockMaxDiff(a: Uint8Array, b: Uint8Array): number {
  if (a.length !== THUMB_W * THUMB_H || b.length !== THUMB_W * THUMB_H) {
    throw new Error("vignettes de taille inattendue");
  }
  let worst = 0;
  for (let by = 0; by < THUMB_H / BLOCK_H; by++) {
    for (let bx = 0; bx < THUMB_W / BLOCK_W; bx++) {
      let sum = 0;
      for (let y = by * BLOCK_H; y < (by + 1) * BLOCK_H; y++) {
        for (let x = bx * BLOCK_W; x < (bx + 1) * BLOCK_W; x++) {
          const i = y * THUMB_W + x;
          sum += Math.abs(a[i] - b[i]);
        }
      }
      worst = Math.max(worst, sum / (BLOCK_W * BLOCK_H));
    }
  }
  return worst;
}

/** Mémoire de la caméra : une référence par mode, et le mode du dernier mouvement. */
export interface SceneMemory {
  ir?: Uint8Array;
  color?: Uint8Array;
  lastMode?: SceneMode;
}

export type SceneReason = "no-reference" | "light-on" | "changed" | "unchanged";

export interface SceneVerdict {
  significant: boolean;
  reason: SceneReason;
  /** Écart du bloc le plus changé, s'il a été calculé. */
  diff?: number;
}

/** Le mouvement est-il un vrai changement de la scène ? */
export function judgeScene(memory: SceneMemory, next: Thumbnail, threshold: number): SceneVerdict {
  if (next.mode === "color" && memory.lastMode === "ir") return { significant: true, reason: "light-on" };
  const ref = memory[next.mode];
  if (!ref) return { significant: true, reason: "no-reference" };
  const diff = blockMaxDiff(ref, next.gray);
  return diff >= threshold
    ? { significant: true, reason: "changed", diff }
    : { significant: false, reason: "unchanged", diff };
}

/** La mémoire après ce mouvement : sa vignette devient la référence de son mode. */
export function rememberScene(memory: SceneMemory, next: Thumbnail): SceneMemory {
  return { ...memory, [next.mode]: next.gray, lastMode: next.mode };
}

/** Sérialisation compacte pour Redis (base64, 2 304 octets par référence). */
export function encodeMemory(m: SceneMemory): string {
  const b64 = (u?: Uint8Array) => (u ? Buffer.from(u).toString("base64") : undefined);
  return JSON.stringify({ ir: b64(m.ir), color: b64(m.color), lastMode: m.lastMode });
}

export function decodeMemory(raw: unknown): SceneMemory {
  if (!raw) return {};
  try {
    const o = (typeof raw === "string" ? JSON.parse(raw) : raw) as Record<string, unknown>;
    const u = (v: unknown) => {
      if (typeof v !== "string") return undefined;
      const buf = new Uint8Array(Buffer.from(v, "base64"));
      return buf.length === THUMB_W * THUMB_H ? buf : undefined;
    };
    const lastMode = o.lastMode === "ir" || o.lastMode === "color" ? o.lastMode : undefined;
    return { ir: u(o.ir), color: u(o.color), lastMode };
  } catch {
    return {};
  }
}

/** Seuil lu dans l'environnement ; valeur absente ou invalide → défaut. */
export function sceneThreshold(raw: string | undefined): number {
  const n = Number(raw);
  return raw && Number.isFinite(n) && n > 0 ? n : DEFAULT_SCENE_THRESHOLD;
}

/** Caméras filtrées : liste d'identifiants séparés par des virgules ; vide → aucune. */
export function filteredCameras(enabled: string | undefined, dids: string | undefined): Set<string> {
  if (enabled === "false") return new Set();
  return new Set((dids ?? "").split(",").map((s) => s.trim()).filter(Boolean));
}

/**
 * Ce qu'on fait d'un mouvement : notifier à la priorité de la présence, ou, s'il est jugé sans
 * changement, l'ignorer pendant un séjour et le notifier en priorité 1 (muette) maison vide — on
 * n'avale jamais un mouvement quand la maison est censée être vide.
 */
export function motionDecision(
  verdict: SceneVerdict,
  presencePriority: 2 | 4,
): { send: false } | { send: true; priority: 1 | 2 | 4 } {
  if (verdict.significant) return { send: true, priority: presencePriority };
  return presencePriority === 4 ? { send: true, priority: 1 } : { send: false };
}
