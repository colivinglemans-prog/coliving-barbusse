import type { NextRequest } from "next/server";
import { messagesRoutes } from "@/lib/messages/routes";

export const dynamic = "force-dynamic";
// nodemailer (réservations directes) : runtime Node obligatoire.
export const runtime = "nodejs";

export function POST(request: NextRequest) {
  return messagesRoutes.send(request);
}
