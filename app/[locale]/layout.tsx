import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { I18nProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const SUPPORTED: Locale[] = ["fr", "en"];

export function generateStaticParams() {
  return SUPPORTED.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!SUPPORTED.includes(locale as Locale)) notFound();

  return (
    <I18nProvider initialLocale={locale as Locale}>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </I18nProvider>
  );
}
