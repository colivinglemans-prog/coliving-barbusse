export type RevenueMode =
  | "averagedPerNight"
  | "byCheckIn"
  | "byCheckOut"
  | "byBookingDate";

export interface MonthRevenue {
  month: string;
  realized: number;
  upcoming: number;
  isFuture: boolean;
  occupancyRate: number;
}

export interface DashboardStats {
  revenueByMonth: MonthRevenue[];
  occupancyRate: number;
  channelDistribution: { channel: string; count: number; revenue: number }[];
  totalRevenue: number;
  totalBookings: number;
}

export interface Beds24Booking {
  id: number;
  propertyId: number;
  roomId: number;
  arrival: string;
  departure: string;
  firstName: string;
  lastName: string;
  status: string;
  price: number;
  referer: string;
  channel: string;
  numAdult: number;
  numChild: number;
  bookingTime: string;
}

export interface Beds24Property {
  id: number;
  name: string;
}
