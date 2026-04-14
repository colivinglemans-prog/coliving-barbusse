"use client";

import { useState } from "react";
import type { BookingSummary } from "@/lib/types";

interface BookingsTableProps {
  title: string;
  bookings: BookingSummary[];
  highlightColumn?: "tjm" | "arrival";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export default function BookingsTable({ title, bookings, highlightColumn }: BookingsTableProps) {
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
              <th className="pb-3 pr-4">Type</th>
              <th className="pb-3 pr-4">Voyageur</th>
              <th className="pb-3 pr-4">Dates</th>
              <th className="pb-3 pr-4 text-right">Nuits</th>
              <th className="pb-3 pr-4 text-right">Revenu</th>
              <th className="pb-3 pr-4 text-right">TJM</th>
              <th className="pb-3">Canal</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((b) => (
              <tr key={b.id} className="border-b border-gray-50 last:border-0">
                <td className="py-2.5 pr-4" title={b.type === "house" ? "Maison entière" : "Chambre"}>
                  {b.type === "house" ? "🏠" : "🛏️"}
                </td>
                <td className="py-2.5 pr-4 font-medium text-gray-900">{b.guest}</td>
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
                <td className="py-2.5 text-gray-500">{b.channel}</td>
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
