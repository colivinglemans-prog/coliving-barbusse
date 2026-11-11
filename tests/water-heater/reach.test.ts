import { describe, expect, it } from "vitest";
import { gatewayIdOf, isUnreachable } from "@/lib/cozytouch";

describe("thermo injoignable (circuit du garage coupé, 10/11)", () => {
  it("identifiant de passerelle tiré du deviceURL", () => {
    expect(gatewayIdOf("modbuslink://1908-1459-2296/1#1")).toBe("1908-1459-2296");
    expect(gatewayIdOf("pas-une-url")).toBeNull();
  });

  it("appareil indisponible ou passerelle morte : injoignable", () => {
    expect(isUnreachable({ deviceAvailable: false, gatewayAlive: true, gatewayStatus: "OK" })).toBe(true);
    expect(isUnreachable({ deviceAvailable: true, gatewayAlive: false, gatewayStatus: "OK" })).toBe(true);
    expect(isUnreachable({ deviceAvailable: true, gatewayAlive: true, gatewayStatus: "DISCONNECTED" })).toBe(true);
  });

  it("tout va bien, ou rien de connu : joignable", () => {
    expect(isUnreachable({ deviceAvailable: true, gatewayAlive: true, gatewayStatus: "OK" })).toBe(false);
    expect(isUnreachable({ deviceAvailable: null, gatewayAlive: null, gatewayStatus: null })).toBe(false);
  });
});
