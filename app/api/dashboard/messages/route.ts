import type { NextRequest } from "next/server";
import { messagesRoutes } from "@/lib/messages/routes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET(request: NextRequest) {
  return messagesRoutes.report(request);
}
