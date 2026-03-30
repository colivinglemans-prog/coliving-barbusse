import { NextRequest, NextResponse } from "next/server";
import { getLockedDevices, saveLockedDevices, setDeviceMode } from "@/lib/heatzy";

export async function GET() {
  const locked = [...await getLockedDevices()];
  return NextResponse.json({ lockedDevices: locked });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, lock } = body as { deviceId: string; lock: boolean };

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId required" }, { status: 400 });
    }

    const current = await getLockedDevices();

    if (lock) {
      current.add(deviceId);
      await setDeviceMode(deviceId, "fro");
    } else {
      current.delete(deviceId);
    }

    await saveLockedDevices(current);

    return NextResponse.json({
      success: true,
      lockedDevices: [...current],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
