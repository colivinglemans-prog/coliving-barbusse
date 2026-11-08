/**
 * Le Wi-Fi de la maison, lu dans les variables d'environnement `WIFI_SSID` et `WIFI_PASSWORD`
 * (Vercel, `.env.local`).
 *
 * Il ne vit plus dans `lib/property-info.ts` depuis le 2026-11-08 : ce fichier est suivi par git
 * dans un dépôt **public**, et le mot de passe y était en clair. Seul le guide d'arrivée (noindex,
 * composant serveur, prérendu au build) l'affiche, et le passe au QR code client en props.
 *
 * Variables absentes : `null`, et le guide affiche un renvoi vers l'hôte plutôt qu'un réseau vide.
 */
export interface WifiInfo {
  ssid: string;
  password: string;
  encryption: "WPA";
}

export function getWifi(): WifiInfo | null {
  const ssid = process.env.WIFI_SSID?.trim();
  const password = process.env.WIFI_PASSWORD?.trim();
  if (!ssid || !password) return null;
  return { ssid, password, encryption: "WPA" };
}

/** Charge utile du QR code Wi-Fi (format reconnu par les appareils photo iOS et Android). */
export function wifiQrPayload(wifi: WifiInfo): string {
  // Le format WIFI: réserve \ ; , : et " : on les échappe d'une barre oblique inverse.
  const esc = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
  return `WIFI:T:${wifi.encryption};S:${esc(wifi.ssid)};P:${esc(wifi.password)};;`;
}
