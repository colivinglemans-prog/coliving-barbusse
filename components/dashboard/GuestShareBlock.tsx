"use client";

import { useEffect, useRef, useState } from "react";
import { GUIDE_LOCALES, guideUrl, guestLocaleFromCountry, type GuideLocale } from "@/lib/site";
import { buildGuestMessage } from "@/lib/guest-messages";

interface GuestShareBlockProps {
  bookingId: number;
  firstName?: string;
  /** Pays Beds24, sert à mettre en avant la langue probable du voyageur. */
  country?: string;
}

/**
 * Bloc de partage dans la fiche réservation : lien du guide et message prêt à
 * envoyer dans les 5 langues, plus le code de la serrure. Admin uniquement —
 * le parent ne monte ce composant qu'en rôle admin.
 */
export default function GuestShareBlock({ bookingId, firstName, country }: GuestShareBlockProps) {
  const [code, setCode] = useState<string | null>(null);
  const [codeState, setCodeState] = useState<"loading" | "ready" | "error">("loading");
  const [copied, setCopied] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const fallbackRef = useRef<HTMLTextAreaElement>(null);

  const suggested = guestLocaleFromCountry(country);

  useEffect(() => {
    let cancelled = false;
    setCodeState("loading");
    setCode(null);

    fetch(`/api/dashboard/bookings/${bookingId}/nuki-code`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ code: string | null }>;
      })
      .then((data) => {
        if (cancelled) return;
        setCode(data.code);
        setCodeState("ready");
      })
      .catch(() => {
        if (!cancelled) setCodeState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  // Le presse-papier peut être refusé (mode app, contexte non sécurisé) : on
  // sélectionne alors le texte pour une copie manuelle plutôt que d'échouer en silence.
  useEffect(() => {
    if (fallback && fallbackRef.current) {
      fallbackRef.current.focus();
      fallbackRef.current.select();
    }
  }, [fallback]);

  async function copy(key: string, text: string) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setFallback(null);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      setCopied(null);
      setFallback(text);
    }
  }

  function localeRow(kind: "link" | "msg", textFor: (l: GuideLocale) => string) {
    return (
      <div className="mt-1 flex flex-wrap gap-1.5">
        {GUIDE_LOCALES.map((l) => {
          const key = `${kind}-${l}`;
          const isCopied = copied === key;
          return (
            <button
              key={l}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                copy(key, textFor(l));
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium uppercase transition-colors ${
                isCopied
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : l === suggested
                    ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {isCopied ? "✓" : l}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="col-span-2 border-t border-gray-100 pt-3">
      <p className="text-xs font-medium text-gray-500">Partage voyageur</p>

      <div className="mt-2">
        <p className="text-xs text-gray-400">Lien du guide</p>
        {localeRow("link", (l) => guideUrl(l))}
      </div>

      <div className="mt-3">
        <p className="text-xs text-gray-400">Message complet</p>
        {localeRow("msg", (l) =>
          buildGuestMessage(l, {
            firstName,
            url: guideUrl(l),
            code: code ?? undefined,
          }),
        )}
      </div>

      <div className="mt-3">
        <p className="text-xs text-gray-400">Code d&apos;accès</p>
        <div className="mt-1 flex items-center gap-2">
          {codeState === "loading" && <span className="text-xs text-gray-400">…</span>}
          {codeState === "error" && (
            <span className="text-xs text-red-600">Erreur de chargement</span>
          )}
          {codeState === "ready" && !code && (
            <span className="text-xs text-gray-400">Pas encore généré</span>
          )}
          {codeState === "ready" && code && (
            <>
              <span className="rounded-lg bg-gray-100 px-3 py-1 font-mono text-sm font-semibold tracking-widest text-gray-900">
                {code}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  copy("code", code);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  copied === "code"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {copied === "code" ? "Copié ✓" : "Copier"}
              </button>
            </>
          )}
        </div>
      </div>

      {fallback && (
        <div className="mt-3">
          <p className="text-[10px] text-amber-700">
            Copie automatique impossible — le texte est sélectionné, copie-le à la main.
          </p>
          <textarea
            ref={fallbackRef}
            readOnly
            value={fallback}
            rows={fallback.includes("\n") ? 6 : 2}
            onClick={(e) => {
              e.stopPropagation();
              e.currentTarget.select();
            }}
            className="mt-1 w-full resize-y rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
