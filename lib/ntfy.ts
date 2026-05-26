/**
 * Push notifications via ntfy.sh.
 *
 * Configuration: NTFY_TOPIC must contain the full URL (ex: https://ntfy.sh/coliving-barbusse-xyz123).
 * Souscrire au topic depuis l'app ntfy mobile pour recevoir les notifications push.
 */

export interface NtfyOptions {
  title?: string;
  priority?: 1 | 2 | 3 | 4 | 5; // 3 = default, 5 = max
  tags?: string[]; // emojis ou mots-clés (ex: ["key", "house"])
  click?: string;  // URL ouverte au tap
}

export async function sendNtfy(message: string, options: NtfyOptions = {}): Promise<void> {
  const url = process.env.NTFY_TOPIC;
  if (!url) {
    console.error("NTFY_TOPIC is not set, skipping push notification");
    return;
  }

  const headers: Record<string, string> = { "Content-Type": "text/plain; charset=utf-8" };
  if (options.title) headers["Title"] = encodeRfc2047(options.title);
  if (options.priority) headers["Priority"] = String(options.priority);
  if (options.tags && options.tags.length > 0) headers["Tags"] = options.tags.join(",");
  if (options.click) headers["Click"] = options.click;

  const res = await fetch(url, { method: "POST", headers, body: message, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ntfy ${res.status}: ${text.slice(0, 200)}`);
  }
}

// ntfy headers must be ASCII — encode non-ASCII as RFC 2047 (UTF-8 base64).
function encodeRfc2047(value: string): string {
  let isAscii = true;
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 127) {
      isAscii = false;
      break;
    }
  }
  if (isAscii) return value;
  const b64 = Buffer.from(value, "utf-8").toString("base64");
  return `=?UTF-8?B?${b64}?=`;
}
