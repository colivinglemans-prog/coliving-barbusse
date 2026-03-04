"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

export default function Description() {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();
  const text = t.description.body;
  const lines = text.split("\n").filter(Boolean);
  const preview = lines.slice(0, 3).join("\n\n");

  return (
    <div className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <h2 className="text-xl font-semibold text-foreground">{t.description.title}</h2>

      <div className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-foreground">
        {expanded ? text : preview + "..."}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-4 flex items-center gap-1 text-sm font-semibold text-foreground underline decoration-1 underline-offset-4 hover:text-primary"
      >
        {expanded ? t.description.showLess : t.description.readMore}
        <svg
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}
