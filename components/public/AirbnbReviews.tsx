"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import reviews from "@/data/reviews.json";

const PAGE_SIZE = 3;
const totalPages = Math.ceil(reviews.length / PAGE_SIZE);

function ReviewCard({ review }: { review: (typeof reviews)[number] }) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const date = new Date(review.date + "-01");
  const month = date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // Detect if text is actually overflowing
  useEffect(() => {
    const el = textRef.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight + 1);
  }, [review.text]);

  return (
    <div className="flex flex-col rounded-xl border border-border p-5">
      <div className="flex items-center gap-3">
        {review.photo ? (
          <Image
            src={review.photo}
            alt={review.name}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white">
            {review.name.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-medium text-foreground">{review.name}</p>
          <p className="text-xs text-secondary">{review.location}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <svg
              key={i}
              className={`h-3.5 w-3.5 ${i < review.rating ? "text-foreground" : "text-gray-200"}`}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ))}
        </div>
        <span className="text-xs capitalize text-secondary">· {month}</span>
      </div>

      <p
        ref={textRef}
        className={`mt-3 text-sm leading-relaxed text-secondary ${!expanded ? "line-clamp-4" : ""}`}
      >
        {review.text}
      </p>
      {clamped && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 self-start text-xs font-medium text-foreground underline underline-offset-2"
        >
          {expanded ? "Voir moins" : "Lire la suite"}
        </button>
      )}
    </div>
  );
}

export default function AirbnbReviews() {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);

  const prev = useCallback(() => setPage((p) => (p - 1 + totalPages) % totalPages), []);
  const next = useCallback(() => setPage((p) => (p + 1) % totalPages), []);

  // Auto-advance every 8s
  useEffect(() => {
    const timer = setInterval(next, 30000);
    return () => clearInterval(timer);
  }, [next]);

  const visible = reviews.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <section id="avis" className="mx-auto max-w-6xl border-b border-border px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{t.reviews.title}</h2>
          <p className="mt-1 text-sm text-secondary">{t.reviews.subtitle}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="mr-2 text-sm text-secondary">{page + 1}/{totalPages}</span>
          <button
            onClick={prev}
            className="rounded-full border border-border p-2 text-foreground transition-colors hover:bg-light-bg"
            aria-label="Avis précédents"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="rounded-full border border-border p-2 text-foreground transition-colors hover:bg-light-bg"
            aria-label="Avis suivants"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Review cards — 1 col mobile, 3 cols desktop */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {visible.map((review) => (
          <ReviewCard key={review.name + review.date} review={review} />
        ))}
      </div>

      {/* Dots */}
      <div className="mt-4 flex justify-center gap-1.5">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === page ? "w-6 bg-foreground" : "w-1.5 bg-gray-300"
            }`}
            aria-label={`Page ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
