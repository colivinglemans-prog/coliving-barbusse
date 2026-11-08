import type { NextRequest } from "next/server";
import { shortLinkRedirect } from "@/lib/short-links";

/** QR « Le guide de la maison » des fiches imprimées. */
export function GET(req: NextRequest) {
  return shortLinkRedirect(req, (l) => `/${l}/guide-arrivee#sur-place`);
}
