import { createGuestMessagesRoutes } from "@sejour/socle/lib/guest-messaging/http";
import { guard } from "@/lib/auth";
import { preview, report, sendOne, TEMPLATE_IDS } from "./engine";

/**
 * Les trois routes de l'écran « Messages voyageurs » : la fabrique du socle porte tous les
 * contrôles (admin seul, paramètres en liste blanche, même origine, erreurs génériques).
 */
export const messagesRoutes = createGuestMessagesRoutes({ guard, templateIds: TEMPLATE_IDS, report, preview, sendOne });
