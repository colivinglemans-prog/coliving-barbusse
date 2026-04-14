import { NextRequest, NextResponse } from "next/server";
import {
  setDHWMode,
  setBoostModeDuration,
  setTargetTemperature,
  refreshState,
} from "@/lib/cozytouch";
import type { CozytouchDHWMode } from "@/lib/types";

const VALID_MODES: CozytouchDHWMode[] = ["autoMode", "manualEcoActive", "manualEcoInactive"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "setMode": {
        const { mode } = body;
        if (!VALID_MODES.includes(mode)) {
          return NextResponse.json({ error: `Invalid mode: ${mode}` }, { status: 400 });
        }
        await setDHWMode(mode);
        return NextResponse.json({ success: true, action: "setMode", mode });
      }

      case "setBoost": {
        const duration = Number(body.duration);
        if (isNaN(duration) || duration < 0 || duration > 7) {
          return NextResponse.json({ error: "Duration must be 0-7" }, { status: 400 });
        }
        await setBoostModeDuration(duration);
        return NextResponse.json({ success: true, action: "setBoost", duration });
      }

      case "setTemperature": {
        const temp = Number(body.temperature);
        if (isNaN(temp) || temp < 40 || temp > 62) {
          return NextResponse.json({ error: "Temperature must be 40-62°C" }, { status: 400 });
        }
        await setTargetTemperature(temp);
        return NextResponse.json({ success: true, action: "setTemperature", temp });
      }

      case "refresh": {
        await refreshState();
        return NextResponse.json({ success: true, action: "refresh" });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
