"use client";

import { useEffect, useRef, useState } from "react";
import { GUIDE_LOCALES, guideUrl, guestLocaleFromCountry, type GuideLocale } from "@/lib/site";
import { buildGuestMessage } from "@/lib/guest-messages";

type MessageKind = "arrivee" | "depart";

const MESSAGE_KINDS = ["arrivee", "depart"] as const;

const MESSAGE_LABELS: Record<MessageKind, string> = {
  arrivee: "Arrivée + code",
  depart: "Départ",
};

/** Réponse de `GET /api/dashboard/bookings/[id]/messages`. */
interface MessagesState {
  channel: string;
  sendable: boolean;
  locale: GuideLocale;
  codeAvailable: boolean;
  etat: Record<MessageKind, string | null>;
}

function formatEnvoi(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  const [msgs, setMsgs] = useState<MessagesState | null>(null);
  const [msgsState, setMsgsState] = useState<"loading" | "ready" | "error">("loading");
  const [sending, setSending] = useState<MessageKind | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

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

  // État des deux boutons : relu dans le fil Beds24, donc juste même si le message est parti
  // par auto-action ou depuis un autre appareil.
  useEffect(() => {
    let cancelled = false;
    setMsgsState("loading");
    setMsgs(null);
    setSendError(null);

    fetch(`/api/dashboard/bookings/${bookingId}/messages`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<MessagesState>;
      })
      .then((data) => {
        if (cancelled) return;
        setMsgs(data);
        setMsgsState("ready");
      })
      .catch(() => {
        if (!cancelled) setMsgsState("error");
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

  /**
   * Ce que le bouton ne peut pas faire, et pourquoi — affiché à côté plutôt que deviné par
   * un bouton gris sans explication.
   */
  function blocage(kind: MessageKind): string | null {
    if (!msgs) return null;
    if (!msgs.sendable) return "Réservation directe — pas de fil";
    if (kind === "arrivee" && !msgs.codeAvailable) return "PIN pas encore généré";
    return null;
  }

  async function send(kind: MessageKind) {
    if (!msgs || sending) return;

    // Le message part chez un vrai voyageur et ne se rattrape pas : on confirme d'abord, en
    // disant par où il passe et dans quelle langue.
    const ok = window.confirm(
      `Envoyer le message « ${MESSAGE_LABELS[kind]} » en ${msgs.locale.toUpperCase()} ` +
        `au voyageur via ${msgs.channel} ?

Il le recevra immédiatement.`,
    );
    if (!ok) return;

    setSending(kind);
    setSendError(null);
    try {
      const res = await fetch(`/api/dashboard/bookings/${bookingId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const data = (await res.json().catch(() => null)) as
        | { etat?: MessagesState["etat"]; error?: string }
        | null;

      if (!res.ok) {
        // Le refus « déjà envoyé » rend l'état à jour : on le prend, le bouton se grise.
        if (data?.etat) setMsgs({ ...msgs, etat: data.etat });
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }
      if (data?.etat) setMsgs({ ...msgs, etat: data.etat });
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Envoi échoué");
    } finally {
      setSending(null);
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

      <div className="mt-3">
        <p className="text-xs text-gray-400">Envoi direct au voyageur</p>

        {msgsState === "loading" && <span className="text-xs text-gray-400">…</span>}
        {msgsState === "error" && (
          <span className="text-xs text-red-600">État des messages indisponible</span>
        )}

        {msgsState === "ready" && msgs && (
          <div className="mt-1 flex flex-col gap-1.5">
            {MESSAGE_KINDS.map((kind) => {
              const sentAt = msgs.etat[kind];
              const raison = blocage(kind);
              const disabled = Boolean(sentAt) || Boolean(raison) || sending !== null;
              return (
                <div key={kind} className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      send(kind);
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      disabled
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                        : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    }`}
                  >
                    {sending === kind ? "Envoi…" : MESSAGE_LABELS[kind]}
                  </button>
                  <span className="text-[10px] text-gray-400">
                    {sentAt
                      ? `Envoyé le ${formatEnvoi(sentAt)}`
                      : (raison ?? `À envoyer · ${msgs.locale.toUpperCase()} · ${msgs.channel}`)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {sendError && <p className="mt-1 text-[10px] text-red-600">{sendError}</p>}
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
