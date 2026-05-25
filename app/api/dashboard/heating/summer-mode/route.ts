import { NextRequest, NextResponse } from "next/server";
import { getFullZoneConfig, getSummerMode, saveSummerMode, setDeviceMode } from "@/lib/heatzy";

export async function GET() {
  const enabled = await getSummerMode();
  return NextResponse.json({ enabled });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { enabled } = body as { enabled?: boolean };

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Champ 'enabled' requis (boolean)" },
        { status: 400 },
      );
    }

    await saveSummerMode(enabled);

    const stopped: string[] = [];
    const fallbackFro: string[] = [];
    const failed: { name: string; reason: string }[] = [];

    if (enabled) {
      const config = await getFullZoneConfig();
      for (const zone of config.zones) {
        for (const device of zone.devices) {
          try {
            await setDeviceMode(device.did, "stop");
            stopped.push(device.name);
          } catch (e) {
            // Fallback to fro (hors-gel) — same effect in summer, supported by all firmwares
            try {
              await setDeviceMode(device.did, "fro");
              fallbackFro.push(device.name);
            } catch (e2) {
              const reason = e2 instanceof Error ? e2.message : "unknown";
              failed.push({ name: device.name, reason });
            }
          }
          await sleep(100);
        }
      }
    }

    return NextResponse.json({
      success: true,
      enabled,
      stopped: stopped.length,
      fallbackFro: fallbackFro.length,
      failed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
