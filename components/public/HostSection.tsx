"use client";

import { useTranslation } from "@/lib/i18n";

export default function HostSection() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">{t.host.title}</h2>
      <div className="mt-6 flex flex-col gap-6 md:flex-row">
        {/* Host card */}
        <div className="flex shrink-0 flex-col items-center rounded-xl border border-border p-6 md:w-64">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-3xl font-bold text-white">
            A
          </div>
          <h3 className="mt-3 text-lg font-semibold text-foreground">Alexandre</h3>
          <p className="text-sm text-secondary">{t.host.superhost}</p>
          <div className="mt-4 flex gap-4 text-center text-xs text-secondary">
            <div>
              <p className="text-lg font-semibold text-foreground">⭐</p>
              <p>{t.host.superhost}</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">2+</p>
              <p>{t.host.experience}</p>
            </div>
          </div>
        </div>

        {/* Host description */}
        <div className="flex-1 space-y-4">
          <div>
            <h3 className="font-medium text-foreground">{t.host.about}</h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary">
              {t.host.aboutText}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-foreground">{t.host.languages}</h3>
            <p className="mt-1 text-sm text-secondary">{t.host.languagesValue}</p>
          </div>

          <div>
            <h3 className="font-medium text-foreground">{t.host.responseRate}</h3>
            <p className="mt-1 text-sm text-secondary">
              {t.host.responseRateValue}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="https://wa.me/33620921005?text=Bonjour%20Alexandre%2C%20je%20suis%20int%C3%A9ress%C3%A9(e)%20par%20le%20Coliving%20Barbusse."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t.host.whatsapp}
            </a>
            <a
              href="https://www.airbnb.fr/contact_host/1568872179155283702"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-foreground px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-light-bg"
            >
              {t.host.airbnbMessage}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
