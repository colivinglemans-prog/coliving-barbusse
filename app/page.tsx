import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function RootPage() {
  const h = await headers();
  const accept = h.get("accept-language") || "";
  const prefersEn = /^en\b/i.test(accept) && !/^fr\b/i.test(accept);
  redirect(prefersEn ? "/en" : "/fr");
}
