"use client";

import { useEffect, useState } from "react";
import type { Beds24Booking } from "@/lib/types";
import type { DashboardRole } from "@/lib/auth";
import DashboardNav from "@/components/dashboard/DashboardNav";
import BookingCalendar from "@/components/dashboard/BookingCalendar";

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Beds24Booking[]>([]);
  const [role, setRole] = useState<DashboardRole>("admin");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch role and bookings in parallel
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        const to = new Date(now.getFullYear(), now.getMonth() + 13, 0);
        const arrivalFrom = from.toISOString().split("T")[0];
        const arrivalTo = to.toISOString().split("T")[0];

        const [meRes, bookingsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch(`/api/dashboard/bookings?arrivalFrom=${arrivalFrom}&arrivalTo=${arrivalTo}`),
        ]);

        if (meRes.ok) {
          const { role: r } = await meRes.json();
          setRole(r);
        }

        if (!bookingsRes.ok) throw new Error("Erreur de chargement");
        const data: Beds24Booking[] = await bookingsRes.json();
        setBookings(data);
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
      <DashboardNav role={role} />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          Calendrier des réservations
        </h1>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <BookingCalendar bookings={bookings} showPrices={role === "admin"} />
          </div>
        )}
      </div>
    </>
  );
}
