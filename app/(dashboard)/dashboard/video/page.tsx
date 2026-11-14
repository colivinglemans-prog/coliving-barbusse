import DashboardNav from "@/components/dashboard/DashboardNav";
import VideoDashboard from "@/components/dashboard/VideoDashboard";

/**
 * Page « Vidéo » (admin) : caméras Wansview/AJCloud — image instantanée + alertes de mouvement
 * (image + court clip). Voir `app/api/dashboard/video/route.ts` et `lib/camera/ajcloud.ts`.
 *
 * Admin seulement : la route porte sa garde `denyNonAdmin`, et le chemin **n'est pas** dans la
 * liste blanche viewer de `proxy.ts`.
 */
export default function VideoPage() {
  return (
    <>
      <DashboardNav />
      <VideoDashboard />
    </>
  );
}
