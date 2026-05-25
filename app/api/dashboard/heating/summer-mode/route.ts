import { NextRequest, NextResponse } from "next/server";
import { getSummerMode, saveSummerMode, setAllDevicesMode } from "@/lib/heatzy";

export async function GET() {
  const enabled = await getSummerMode();
  return NextResponse.json({ enabled });
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

    let updated = 0;
    if (enabled) {
      updated = await setAllDevicesMode("stop");
    }

    return NextResponse.json({ success: true, enabled, updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
