"use client";

import { useEffect, useState } from "react";
import type { BookingListEntry } from "@sejour/socle/lib/booking-dto";
import type { DashboardRole } from "@/lib/auth";
import { eventLinkRef } from "@/lib/events";
import DashboardNav from "@/components/dashboard/DashboardNav";
import BookingCalendar from "@/components/dashboard/BookingCalendar";

export default function CalendarPage() {
  const [bookings, setBookings] = useState<BookingListEntry[]>([]);
  // Les rattachements d'événement déliés à la main, en couples `<id>:<clé>`. Chargés à part
  // des réservations : ils ne viennent pas de Beds24 et ne passent pas par sa projection.
  const [unlinkedEvents, setUnlinkedEvents] = useState<string[]>([]);
  const [actualRole, setActualRole] = useState<DashboardRole>("admin");
  const [viewAsViewer, setViewAsViewer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const effectiveRole: DashboardRole =
    actualRole === "admin" && viewAsViewer ? "viewer" : actualRole;

  useEffect(() => {
    async function fetchData() {
      try {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 13, 0);
        const arrivalFrom = from.toISOString().split("T")[0];
        const arrivalTo = to.toISOString().split("T")[0];

        const [meRes, bookingsRes, linksRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch(`/api/dashboard/bookings?arrivalFrom=${arrivalFrom}&arrivalTo=${arrivalTo}`),
          // Non bloquant : un `Promise.all` qui rejette sur cette route ferait échouer le
          // chargement des réservations, pour une information d'appoint.
          fetch("/api/dashboard/event-links").catch(() => null),
        ]);

        if (meRes.ok) {
          const { role: r } = await meRes.json();
          setActualRole(r);
        }

        if (!bookingsRes.ok) throw new Error("Erreur de chargement");
        const data: BookingListEntry[] = await bookingsRes.json();
        setBookings(data);

        // Un déliement manquant ne vaut pas un calendrier vide : on retombe sur l'étiquetage
        // automatique, qui est l'état d'avant le bouton.
        if (linksRes?.ok) setUnlinkedEvents(await linksRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      <DashboardNav role={actualRole} />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Calendrier des réservations
          </h1>
          {actualRole === "admin" && (
            <button
              onClick={() => setViewAsViewer((v) => !v)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                viewAsViewer
                  ? "bg-gray-200 text-gray-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {viewAsViewer ? "Vue viewer" : "Vue admin"}
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <BookingCalendar
              bookings={bookings}
              showPrices={effectiveRole === "admin"}
              showChannels={effectiveRole === "admin"}
              isAdmin={effectiveRole === "admin"}
              onNotesUpdated={(id, notes) => {
                setBookings((prev) =>
                  prev.map((b) => (b.id === id ? { ...b, notes } : b)),
                );
              }}
              unlinkedEvents={unlinkedEvents}
              onEventLinkChanged={(id, eventKey, unlinked) => {
                const ref = eventLinkRef(id, eventKey);
                setUnlinkedEvents((prev) =>
                  unlinked ? [...prev, ref] : prev.filter((r) => r !== ref),
                );
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}
