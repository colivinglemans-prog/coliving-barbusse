import { describe, it, expect } from "vitest";
import type { AjAlarm } from "@/lib/camera/ajcloud";
import { newAlarmsSince, maxCts, formatCtime, toCameraAlert } from "@/lib/camera/watch";

function alarm(cts: string, ctime = "20261111155820", img = "https://x/i.jpg", vid = "https://x/v.ts"): AjAlarm {
  return { did: "WVCD1", cts, cdate: "20261111", ctime, dur: "10000", images: [{ tags: "original", url: img }, { tags: "thumbnail", url: "" }], avs: [{ tags: "video", url: vid }, { tags: "voice", url: "" }] };
}

describe("newAlarmsSince", () => {
  it("ne garde que les alarmes strictement postérieures, triées croissantes", () => {
    const list = [alarm("300"), alarm("100"), alarm("200")];
    expect(newAlarmsSince(list, 150).map((a) => a.cts)).toEqual(["200", "300"]);
  });
  it("rend tout si lastCts est 0, rien si tout est antérieur", () => {
    const list = [alarm("100"), alarm("200")];
    expect(newAlarmsSince(list, 0)).toHaveLength(2);
    expect(newAlarmsSince(list, 999)).toHaveLength(0);
  });
});

describe("maxCts", () => {
  it("rend le cts le plus élevé, sinon le fallback", () => {
    expect(maxCts([alarm("100"), alarm("500"), alarm("300")], 0)).toBe(500);
    expect(maxCts([], 42)).toBe(42);
  });
});

describe("formatCtime", () => {
  it("formate YYYYMMDDHHMMSS", () => {
    expect(formatCtime("20261111155820")).toBe("11/11 à 15:58");
  });
  it("rend la chaîne brute si le format surprend", () => {
    expect(formatCtime("oops")).toBe("oops");
  });
});

describe("toCameraAlert", () => {
  it("extrait la première URL non vide d'image et de vidéo", () => {
    const a = toCameraAlert(alarm("123"));
    expect(a.imageUrl).toBe("https://x/i.jpg");
    expect(a.videoUrl).toBe("https://x/v.ts");
    expect(a.cts).toBe(123);
  });
  it("rend null quand toutes les URLs sont vides", () => {
    const a = toCameraAlert({ ...alarm("1"), images: [{ tags: "original", url: "" }], avs: [] });
    expect(a.imageUrl).toBeNull();
    expect(a.videoUrl).toBeNull();
  });
});
