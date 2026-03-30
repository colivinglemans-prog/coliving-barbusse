import { NextRequest, NextResponse } from "next/server";
import { getLockedDevices, saveLockedDevices, setDeviceMode } from "@/lib/heatzy";

export async function GET() {
  const locked = [...getLockedDevices()];
  return NextResponse.json({ lockedDevices: locked });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, lock } = body as { deviceId: string; lock: boolean };

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    const current = getLockedDevices();

    if (lock) {
      current.add(deviceId);
      // Set device to frost protection immediately
      await setDeviceMode(deviceId, "fro");
    } else {
      current.delete(deviceId);
    }

    // Persist to /tmp (survives within serverless container)
    saveLockedDevices(current);

    return NextResponse.json({
      success: true,
      lockedDevices: [...current],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
