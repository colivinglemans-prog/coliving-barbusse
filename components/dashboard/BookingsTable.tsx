"use client";

import { useState } from "react";
import type { BookingSummary } from "@/lib/types";

interface BookingsTableProps {
  title: string;
  bookings: BookingSummary[];
  highlightColumn?: "tjm" | "arrival" | "bookingTime";
  showBookingTime?: boolean;
  showEvent?: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function formatBookingTime(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" });
}

export default function BookingsTable({ title, bookings, highlightColumn, showBookingTime, showEvent }: BookingsTableProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? bookings : bookings.slice(0, 5);

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-4 text-sm text-gray-400">Aucune réservation</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-400">
              <th className="pb-3 pr-4">Voyageur</th>
              {showBookingTime && <th className="pb-3 pr-4">Réservée</th>}
              <th className="pb-3 pr-4">Dates</th>
              <th className="pb-3 pr-4 text-right">Nuits</th>
              <th className="pb-3 pr-4 text-right">Revenu</th>
              <th className="pb-3 pr-4 text-right">TJM</th>
              <th className="pb-3 pr-4">Canal</th>
              {showEvent && <th className="pb-3">Événement</th>}
            </tr>
          </thead>
          <tbody>
            {visible.map((b) => (
              <tr key={b.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2.5 pr-4 font-medium text-gray-900">{b.guest}</td>
                {showBookingTime && (
                  <td className={`py-2.5 pr-4 ${highlightColumn === "bookingTime" ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                    {formatBookingTime(b.bookingTime)}
                  </td>
                )}
                <td className="py-2.5 pr-4 text-gray-500">
                  <span className={highlightColumn === "arrival" ? "font-semibold text-gray-900" : ""}>
                    {formatDate(b.arrival)}
                  </span>
                  {" → "}
                  {formatDate(b.departure)}
                </td>
                <td className="py-2.5 pr-4 text-right text-gray-500">{b.nights}</td>
                <td className="py-2.5 pr-4 text-right font-medium text-gray-900">
                  {b.price.toLocaleString("fr-FR")} €
                </td>
                <td className={`py-2.5 pr-4 text-right font-bold ${highlightColumn === "tjm" ? "text-indigo-600" : "text-gray-700"}`}>
                  {b.tjm} €
                </td>
                <td className="py-2.5 pr-4 text-gray-500">{b.channel}</td>
                {showEvent && (
                  <td className="py-2.5 text-xs text-gray-500">
                    {b.event ? (
                      <span className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                        {b.event}
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {bookings.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm font-medium text-rose-500 hover:text-rose-600"
        >
          {expanded ? "Voir moins" : `Voir les ${bookings.length} réservations`}
        </button>
      )}
    </div>
  );
}
