"use client";

import { useTranslation } from "@/lib/i18n";

export default function Highlights() {
  const { t } = useTranslation();

  const highlights = [
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
        </svg>
      ),
      title: t.highlights.selfCheckIn.title,
      description: t.highlights.selfCheckIn.description,
    },
    {
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
      title: t.highlights.quiet.title,
      description: t.highlights.quiet.description,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <div className="space-y-6">
        {highlights.map((h) => (
          <div key={h.title} className="flex gap-4">
            <div className="shrink-0 text-foreground">{h.icon}</div>
            <div>
              <h3 className="font-medium text-foreground">{h.title}</h3>
              <p className="mt-0.5 text-sm text-secondary">{h.description}</p>
            </div>
          </div>
        ))}

        {/* Superhôte — carte mise en avant */}
        <div className="rounded-xl bg-gradient-to-r from-rose-50 to-amber-50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{t.highlights.superhost.title}</h3>
              <p className="mt-1 text-sm text-secondary">
                {t.highlights.superhost.description}
              </p>
              <a
                href="https://www.airbnb.fr/users/profile/1465428634658451220"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
              >
                {t.highlights.superhost.reviewsLink}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
