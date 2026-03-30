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
    } else {
      current.delete(deviceId);
    }

    // Save lock state first (most important — persists even if Heatzy API fails)
    await saveLockedDevices(current);

    // Then try to set device mode (best effort)
    let modeSet = false;
    if (lock) {
      try {
        await setDeviceMode(deviceId, "fro");
        modeSet = true;
      } catch (e) {
        console.error("Lock: failed to set fro mode on", deviceId, e);
      }
    }

    return NextResponse.json({
      success: true,
      lockedDevices: [...current],
      modeSet,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Lock route error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
