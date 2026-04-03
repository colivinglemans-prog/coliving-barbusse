import { NextResponse } from "next/server";
import { getDevices, getFullZoneConfig } from "@/lib/heatzy";

export async function GET() {
  try {
    const [rawDevices, config] = await Promise.all([
      getDevices(),
      getFullZoneConfig(),
    ]);

    // All DIDs currently in the config
    const configuredDids = new Set(
      config.zones.flatMap((z) => z.devices.map((d) => d.did)),
    );

    // Excluded DIDs (personal devices)
    const excludedDids = new Set(config.excludedDevices ?? []);

    // Devices on the Heatzy account but not in config and not excluded
    const unassigned = rawDevices
      .filter((d) => !configuredDids.has(d.did) && !excludedDids.has(d.did))
      .map((d) => ({
        did: d.did,
        alias: d.dev_alias,
        mac: d.mac,
        isOnline: d.is_online,
        productName: d.product_name,
      }));

    // Configured devices whose DID is not found on the Heatzy account
    const apiDids = new Set(rawDevices.map((d) => d.did));
    const missing: { did: string; name: string; zone: string }[] = [];
    for (const zone of config.zones) {
      for (const device of zone.devices) {
        if (!apiDids.has(device.did)) {
          missing.push({ did: device.did, name: device.name, zone: zone.id });
        }
      }
    }

    // Available zones for assignment
    const zones = config.zones.map((z) => ({ id: z.id, label: z.label }));

    return NextResponse.json({
      unassigned,
      missing,
      zones,
      allOk: unassigned.length === 0 && missing.length === 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
