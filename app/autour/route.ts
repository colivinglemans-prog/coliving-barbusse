import type { NextRequest } from "next/server";
import { shortLinkRedirect } from "@/lib/short-links";

/** QR « Autour de la maison » des fiches imprimées. */
export function GET(req: NextRequest) {
  return shortLinkRedirect(req, (l) => `/${l}/blog#pendant-le-sejour`);
}
