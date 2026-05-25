import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function RootPage() {
  const h = await headers();
  const accept = (h.get("accept-language") || "").toLowerCase();
  // Pick the first preference among supported locales (fr default).
  const first = accept.split(",")[0]?.trim() || "";
  let target = "fr";
  if (first.startsWith("it")) target = "it";
  else if (first.startsWith("de")) target = "de";
  else if (first.startsWith("en")) target = "en";
  redirect(`/${target}`);
}
