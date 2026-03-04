"use client";

import { useTranslation } from "@/lib/i18n";

export default function HouseRules() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">{t.rules.title}</h2>
      <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {t.rules.sections.map((section) => (
          <div key={section.title}>
            <h3 className="font-medium text-foreground">{section.title}</h3>
            <ul className="mt-3 space-y-2">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-secondary">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
