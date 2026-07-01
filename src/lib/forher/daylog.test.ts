import { describe, it, expect } from "vitest";
import { migrateDayLog, periodDaysSet, isEmptyEntry } from "./daylog";

describe("migrateDayLog", () => {
  it("migrates the legacy string[] of period days into per-day entries", () => {
    expect(migrateDayLog(["2026-07-01", "2026-07-02"])).toEqual({
      "2026-07-01": { period: true },
      "2026-07-02": { period: true },
    });
  });

  it("passes through the new object shape unchanged", () => {
    const log = { "2026-07-01": { period: true, flow: "medium", symptoms: ["acne"] } };
    expect(migrateDayLog(log)).toEqual(log);
  });

  it("returns empty for null / undefined / garbage", () => {
    expect(migrateDayLog(null)).toEqual({});
    expect(migrateDayLog(undefined)).toEqual({});
    expect(migrateDayLog(42)).toEqual({});
  });

  it("ignores non-string entries in a legacy array", () => {
    expect(migrateDayLog(["2026-07-01", 5, null])).toEqual({ "2026-07-01": { period: true } });
  });
});

describe("periodDaysSet", () => {
  it("returns only the dates marked as a period day (symptom-only days excluded)", () => {
    const log = {
      "2026-07-01": { period: true, flow: "heavy" as const },
      "2026-07-05": { symptoms: ["acne"] },          // symptom-only, not a period day
      "2026-07-06": { period: false, symptoms: ["bloating"] },
    };
    expect([...periodDaysSet(log)].sort()).toEqual(["2026-07-01"]);
  });

  it("is empty for an empty log", () => {
    expect(periodDaysSet({}).size).toBe(0);
  });
});

describe("isEmptyEntry", () => {
  it("is empty with no period, no flow, and no symptoms", () => {
    expect(isEmptyEntry({})).toBe(true);
    expect(isEmptyEntry({ period: false, symptoms: [] })).toBe(true);
  });

  it("is not empty with a flow, symptoms, or a period marking", () => {
    expect(isEmptyEntry({ period: true })).toBe(false);
    expect(isEmptyEntry({ flow: "light" })).toBe(false);
    expect(isEmptyEntry({ symptoms: ["acne"] })).toBe(false);
  });
});
