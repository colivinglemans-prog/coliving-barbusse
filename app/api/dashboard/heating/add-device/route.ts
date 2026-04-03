import { NextRequest, NextResponse } from "next/server";
import { getExtraDevices, saveExtraDevices, getFullZoneConfig } from "@/lib/heatzy";
import type { HeatzyMode } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { did, name, zoneId, defaultMode, replaceDid } = body as {
      did: string;
      name: string;
      zoneId: string;
      defaultMode?: string;
      replaceDid?: string; // DID to replace (for re-pairing / hardware swap)
    };

    if (!did || !name || !zoneId) {
      return NextResponse.json(
        { error: "did, name et zoneId sont requis" },
        { status: 400 },
      );
    }

    // Validate zone exists
    const config = await getFullZoneConfig();
    if (!config.zones.some((z) => z.id === zoneId)) {
      return NextResponse.json({ error: "Zone inconnue" }, { status: 400 });
    }

    const extras = await getExtraDevices();

    // If replacing an existing device, remove the old entry
    if (replaceDid) {
      const idx = extras.findIndex((e) => e.did === replaceDid);
      if (idx >= 0) extras.splice(idx, 1);
    }

    // Don't add duplicates
    if (!extras.some((e) => e.did === did)) {
      extras.push({
        did,
        name,
        zoneId,
        defaultMode: (defaultMode as HeatzyMode) ?? "fro",
      });
    }

    await saveExtraDevices(extras);

    return NextResponse.json({ success: true, extras });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
