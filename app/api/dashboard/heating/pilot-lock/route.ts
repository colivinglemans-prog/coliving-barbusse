import { NextRequest, NextResponse } from "next/server";
import { getFullZoneConfig, setDevicePilotLock } from "@/lib/heatzy";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locked, deviceId } = body as {
      locked: boolean;
      deviceId?: string; // If omitted, apply to all devices
    };

    if (typeof locked !== "boolean") {
      return NextResponse.json({ error: "locked (boolean) requis" }, { status: 400 });
    }

    if (deviceId) {
      await setDevicePilotLock(deviceId, locked);
      return NextResponse.json({ success: true, updated: 1 });
    }

    // Apply to all devices
    const config = await getFullZoneConfig();
    let updated = 0;
    for (const zone of config.zones) {
      for (const device of zone.devices) {
        await setDevicePilotLock(device.did, locked);
        updated++;
        await sleep(100);
      }
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
