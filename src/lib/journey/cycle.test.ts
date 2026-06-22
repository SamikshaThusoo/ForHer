import { describe, it, expect } from "vitest";
import { learnedCycleLength, getCyclePhase } from "./cycle";
import type { Persona } from "@/types/persona";

// Minimal persona stub carrying only what the cycle engine reads.
function stub(cycleHistory: string[], enrollmentDay = "2026-01-01"): Persona {
  return {
    id: "aanya", name: "", shortName: "", gender: "F", ageYears: 30, city: "", role: "",
    avatarSeed: "x",
    smartReport: {
      healthScore: 600, band: "warm", bandLabel: "Fair", chronologicalAge: 30, biologicalAge: 30,
      heartAge: 30, cvdRiskPct: 1, diabetesRiskPct: 1, hypertensionRiskPct: 1,
      populationAvgScore: 700, topDrivers: [], labs: [],
    },
    cares: { enrolled: true },
    pmos: {
      eligible: true, entryState: "A", hasAhc: true, ttc: false, enrollmentDay,
      assessment: { irregularPeriods: false, acneSkin: false, hairChanges: false, weightDifficulty: false, familyHistory: false },
      cycleHistory,
      markers: { day0: {}, day90: {}, day180: {} },
    },
  };
}

describe("learnedCycleLength", () => {
  it("defaults to 28 with no history", () => {
    expect(learnedCycleLength([])).toBe(28);
  });
  it("learns ~30 from regular 30-day gaps", () => {
    expect(learnedCycleLength(["2026-01-01", "2026-01-31", "2026-03-02"])).toBe(30);
  });
  it("clamps to the 21–40 range", () => {
    expect(learnedCycleLength(["2026-01-01", "2026-03-15"])).toBeLessThanOrEqual(40);
  });
});

describe("getCyclePhase", () => {
  it("returns menstrual on a period-start day", () => {
    // enrollmentDay = last start; dayIndex 0 → day-of-cycle 1
    const p = stub(["2026-01-01"], "2026-01-01");
    expect(getCyclePhase(p, 0).phase).toBe("menstrual");
  });
  it("returns low confidence for irregular history", () => {
    const p = stub(["2026-01-01", "2026-03-20", "2026-04-02"]); // a >45-day gap
    expect(getCyclePhase(p, 10).confidence).toBe("low");
  });
});
