import { NextResponse } from "next/server";
import { getWaterHeaterStatus } from "@/lib/cozytouch";

export async function GET() {
  try {
    const status = await getWaterHeaterStatus();

    return NextResponse.json({
      status,
      seriesNote:
        "Le ballon thermodynamique préchauffe l'eau en amont du ballon classique. La température affichée est celle du ballon thermo.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
