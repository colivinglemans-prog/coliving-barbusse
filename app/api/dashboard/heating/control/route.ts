import { NextRequest, NextResponse } from "next/server";
import { setDeviceMode, setZoneMode, setAllDevicesMode } from "@/lib/heatzy";
import type { HeatzyMode } from "@/lib/types";

const VALID_MODES: Set<string> = new Set(["cft", "eco", "fro", "stop", "presence"]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { zoneId, deviceId, mode } = body as {
      zoneId?: string;
      deviceId?: string;
      mode?: string;
    };

    if (!mode || !VALID_MODES.has(mode)) {
      return NextResponse.json(
        { error: `Mode invalide. Modes valides : ${[...VALID_MODES].join(", ")}` },
        { status: 400 },
      );
    }

    if (!zoneId && !deviceId) {
      // Control all devices
      const updated = await setAllDevicesMode(mode as HeatzyMode);
      return NextResponse.json({ success: true, updated });
    }

    if (zoneId) {
      const updated = await setZoneMode(zoneId, mode as HeatzyMode);
      return NextResponse.json({ success: true, updated });
    }

    if (deviceId) {
      await setDeviceMode(deviceId, mode as HeatzyMode);
      return NextResponse.json({ success: true, updated: 1 });
    }

    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
