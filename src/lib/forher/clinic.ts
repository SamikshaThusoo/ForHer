// Prototype booking state for ClinicForHer. No scheduling API — a booked item is
// persisted per-persona so the card can reflect "booked". Cleared by resetForHer().

export type Booking = {
  itemId: string;
  kind: "consult" | "test";
  label: string;
  slot: string; // static placeholder slot text (prototype)
  bookedAt: string; // ISO timestamp, supplied by the caller
};
export type Bookings = Record<string, Booking>; // keyed by itemId

const key = (id: string) => `forher.${id}.bookings`;

/** Static placeholder slots — the prototype "next available" time per kind. */
export const PLACEHOLDER_SLOTS: Record<"consult" | "test", string> = {
  consult: "Earliest video visit: tomorrow, 4:30 PM",
  test: "Sample collection: tomorrow, 8:00–10:00 AM",
};

export function migrateBookings(raw: unknown): Bookings {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Bookings) : {};
}
export function upsertBooking(b: Bookings, booking: Booking): Bookings {
  return { ...b, [booking.itemId]: booking };
}
export function isBooked(b: Bookings, itemId: string): boolean {
  return !!b[itemId];
}
export function readBookings(id: string): Bookings {
  try {
    return migrateBookings(JSON.parse(localStorage.getItem(key(id)) ?? "null"));
  } catch {
    return {};
  }
}
export function writeBookings(id: string, b: Bookings) {
  try {
    localStorage.setItem(key(id), JSON.stringify(b));
  } catch {
    /* ignore */
  }
}
