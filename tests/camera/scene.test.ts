import { describe, expect, it } from "vitest";
import {
  THUMB_H,
  THUMB_W,
  blockMaxDiff,
  decodeMemory,
  encodeMemory,
  filteredCameras,
  judgeScene,
  motionDecision,
  rememberScene,
  sceneThreshold,
  thumbnailFromRgba,
  type Thumbnail,
} from "@/lib/camera/scene";

const N = THUMB_W * THUMB_H;

function flat(value: number): Uint8Array {
  return new Uint8Array(N).fill(value);
}

function ir(gray: Uint8Array): Thumbnail {
  return { gray, mode: "ir", saturation: 0 };
}

function color(gray: Uint8Array): Thumbnail {
  return { gray, mode: "color", saturation: 25 };
}

/** Une vignette avec un rectangle plus clair (silhouette) de w×h pixels en (x, y). */
function withPatch(base: number, patch: number, x: number, y: number, w: number, h: number): Uint8Array {
  const g = flat(base);
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) g[yy * THUMB_W + xx] = patch;
  return g;
}

describe("thumbnailFromRgba", () => {
  it("réduit une image grise en IR, une image colorée en couleur", () => {
    const w = 640;
    const h = 360;
    const grayImg = new Uint8Array(w * h * 4).fill(120);
    const t = thumbnailFromRgba(grayImg, w, h);
    expect(t.gray.length).toBe(N);
    expect(t.mode).toBe("ir");
    expect(t.gray[0]).toBe(120);

    const colorImg = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) colorImg.set([150, 110, 90, 255], i * 4);
    expect(thumbnailFromRgba(colorImg, w, h).mode).toBe("color");
  });

  it("refuse une image tronquée", () => {
    expect(() => thumbnailFromRgba(new Uint8Array(10), 640, 360)).toThrow();
  });
});

describe("blockMaxDiff", () => {
  it("bruit léger partout (linge qui bouge) : sous le seuil", () => {
    const a = flat(100);
    const b = flat(100).map((v, i) => v + (i % 3 === 0 ? 8 : 0));
    expect(blockMaxDiff(a, b)).toBeLessThan(12);
  });

  it("silhouette sur 5 % de l'image : au-dessus, là où la moyenne globale la diluerait", () => {
    const a = flat(80);
    const b = withPatch(80, 140, 20, 10, 16, 12); // 192 px sur 2 304 ≈ 8 %, à cheval sur les blocs
    const globalMean = b.reduce((s, v, i) => s + Math.abs(v - a[i]), 0) / N;
    expect(globalMean).toBeLessThan(6); // la moyenne globale l'aurait ignorée
    expect(blockMaxDiff(a, b)).toBeGreaterThanOrEqual(25);
  });
});

describe("judgeScene", () => {
  const T = 12;

  it("sans référence : notifié", () => {
    expect(judgeScene({}, ir(flat(90)), T)).toMatchObject({ significant: true, reason: "no-reference" });
  });

  it("image IR identique à la précédente IR : ignorée", () => {
    const mem = rememberScene({}, ir(flat(90)));
    expect(judgeScene(mem, ir(flat(92)), T)).toMatchObject({ significant: false, reason: "unchanged" });
  });

  it("nuit après une soirée éclairée : comparée à la dernière image IR, pas à l'image en couleur", () => {
    let mem = rememberScene({}, ir(flat(90)));
    mem = rememberScene(mem, color(flat(200)));
    mem = rememberScene(mem, ir(flat(91))); // la lumière s'éteint : un mouvement IR la note
    expect(judgeScene(mem, ir(flat(90)), T).significant).toBe(false);
  });

  it("allumage (IR puis couleur) : toujours notifié", () => {
    let mem = rememberScene({}, color(flat(150)));
    mem = rememberScene(mem, ir(flat(90)));
    expect(judgeScene(mem, color(flat(150)), T)).toMatchObject({ significant: true, reason: "light-on" });
  });

  it("scène changée : notifiée", () => {
    const mem = rememberScene({}, ir(flat(90)));
    expect(judgeScene(mem, ir(withPatch(90, 160, 0, 0, 8, 6)), T)).toMatchObject({
      significant: true,
      reason: "changed",
    });
  });
});

describe("motionDecision", () => {
  it("maison vide : un mouvement sans changement part quand même, en priorité 1", () => {
    expect(motionDecision({ significant: false, reason: "unchanged" }, 4)).toEqual({ send: true, priority: 1 });
  });
  it("pendant un séjour : ignoré", () => {
    expect(motionDecision({ significant: false, reason: "unchanged" }, 2)).toEqual({ send: false });
  });
  it("vrai mouvement : priorité de la présence", () => {
    expect(motionDecision({ significant: true, reason: "changed" }, 4)).toEqual({ send: true, priority: 4 });
    expect(motionDecision({ significant: true, reason: "light-on" }, 2)).toEqual({ send: true, priority: 2 });
  });
});

describe("mémoire et réglages", () => {
  it("aller-retour Redis ; une valeur abîmée donne une mémoire vide", () => {
    const mem = rememberScene(rememberScene({}, ir(flat(7))), color(flat(9)));
    const back = decodeMemory(encodeMemory(mem));
    expect(back.lastMode).toBe("color");
    expect(back.ir?.[0]).toBe(7);
    expect(back.color?.[0]).toBe(9);
    expect(decodeMemory("{pas du json")).toEqual({});
    expect(decodeMemory(null)).toEqual({});
  });

  it("seuil : défaut 12, valeur de l'environnement sinon", () => {
    expect(sceneThreshold(undefined)).toBe(12);
    expect(sceneThreshold("abc")).toBe(12);
    expect(sceneThreshold("20")).toBe(20);
  });

  it("caméras filtrées : liste, vide = aucune, interrupteur coupé = aucune", () => {
    expect([...filteredCameras(undefined, "a, b")]).toEqual(["a", "b"]);
    expect(filteredCameras(undefined, "").size).toBe(0);
    expect(filteredCameras("false", "a").size).toBe(0);
  });
});
