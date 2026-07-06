import { describe, it, expect } from "vitest";
import { migrateBookings, upsertBooking, isBooked, type Booking } from "./clinic";

const b: Booking = { itemId: "gynaecologist", kind: "consult", label: "Gynaecologist consult", slot: "Tomorrow, 4:30 PM", bookedAt: "2026-07-06T10:00:00.000Z" };

describe("migrateBookings", () => {
  it("passes an object through and rejects arrays/garbage", () => {
    expect(migrateBookings({ x: b })).toEqual({ x: b });
    expect(migrateBookings([b])).toEqual({});
    expect(migrateBookings(null)).toEqual({});
    expect(migrateBookings(7)).toEqual({});
  });
});

describe("upsertBooking / isBooked", () => {
  it("adds a booking keyed by itemId and reports it booked", () => {
    const next = upsertBooking({}, b);
    expect(isBooked(next, "gynaecologist")).toBe(true);
    expect(isBooked(next, "hormone-panel")).toBe(false);
  });
  it("overwrites an existing booking for the same item without duplicating", () => {
    const next = upsertBooking(upsertBooking({}, b), { ...b, slot: "Friday, 9 AM" });
    expect(Object.keys(next)).toHaveLength(1);
    expect(next.gynaecologist.slot).toBe("Friday, 9 AM");
  });
});
