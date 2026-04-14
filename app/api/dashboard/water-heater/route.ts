import { NextResponse } from "next/server";
import { getWaterHeaterStatus, getDeviceURLs, getRawStates } from "@/lib/cozytouch";

export async function GET() {
  try {
    const status = await getWaterHeaterStatus();

    // Temporary debug: include raw state names to diagnose
    let debug: unknown = undefined;
    try {
      const { deviceURL } = await getDeviceURLs();
      const rawStates = await getRawStates(deviceURL);
      debug = rawStates.map((s: { name: string; value: unknown }) => ({
        name: s.name,
        value: s.value,
      }));
    } catch { /* ignore */ }

    return NextResponse.json({
      status,
      debug,
      seriesNote:
        "Le ballon thermodynamique préchauffe l'eau en amont du ballon classique. La température affichée est celle du ballon thermo.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
