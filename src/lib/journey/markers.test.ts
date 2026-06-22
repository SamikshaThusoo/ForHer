import { describe, it, expect } from "vitest";
import { homaIr, lhFshRatio, getMarkerSnapshot, getTransitionOptions } from "./markers";
import { AANYA, RIYA } from "@/data/pmosPersonas";

describe("derived markers", () => {
  it("computes HOMA-IR = fbs*insulin/405", () => {
    expect(homaIr(104, 18)).toBeCloseTo((104 * 18) / 405, 2);
  });
  it("returns undefined when inputs missing", () => {
    expect(homaIr(undefined, 18)).toBeUndefined();
    expect(lhFshRatio(14, undefined)).toBeUndefined();
  });
  it("computes LH:FSH ratio", () => {
    expect(lhFshRatio(14, 5)).toBeCloseTo(2.8, 2);
  });
});

describe("getMarkerSnapshot", () => {
  it("returns the day-0 anchor at dayIndex 0 with derived fields", () => {
    const snap = getMarkerSnapshot(AANYA, 0);
    expect(snap.hba1c).toBe(6.0);
    expect(snap.homaIr).toBeCloseTo((104 * 18) / 405, 1);
    expect(snap.lhFshRatio).toBeCloseTo(2.8, 1);
  });
  it("interpolates between anchors (day 45 sits between day0 and day90)", () => {
    const snap = getMarkerSnapshot(AANYA, 45);
    expect(snap.hba1c!).toBeLessThan(6.0);
    expect(snap.hba1c!).toBeGreaterThan(5.8);
  });
  it("handles the cold-start persona with empty markers", () => {
    expect(getMarkerSnapshot(RIYA, 90)).toEqual(expect.any(Object)); // no throw, empty-ish
  });
});

describe("getTransitionOptions", () => {
  it("recommends step-down when Aanya's markers improved", () => {
    const opts = getTransitionOptions(AANYA);
    expect(opts).toHaveLength(3);
    expect(opts.filter((o) => o.recommended)).toHaveLength(1);
    expect(opts.find((o) => o.recommended)!.key).toBe("step-down");
  });
});
