import { describe, it, expect } from "vitest";
import { getTouchpointsDue, getCareCircle, personaTrack } from "./touchpoints";
import type { Persona } from "@/types/persona";
import type { AhcMarkers, AssessmentAnswers } from "@/types/journey";

function persona(answers: AssessmentAnswers, ahc?: AhcMarkers): Persona {
  return {
    id: "aanya", name: "", shortName: "", gender: "F", ageYears: 30, city: "", role: "", avatarSeed: "x",
    smartReport: { healthScore: 600, band: "warm", bandLabel: "Fair", chronologicalAge: 30, biologicalAge: 30, heartAge: 30, cvdRiskPct: 1, diabetesRiskPct: 1, hypertensionRiskPct: 1, populationAvgScore: 700, topDrivers: [], labs: [] },
    cares: { enrolled: true },
    pmos: {
      eligible: true, entryState: "A", hasAhc: true, ttc: false, enrollmentDay: "2026-01-01",
      assessment: answers, ahcMarkers: ahc, cycleHistory: [],
      markers: { day0: {}, day90: {}, day180: {} },
    },
  };
}
const HIGH = persona(
  { irregularPeriods: true, acneSkin: true, hairChanges: true, weightDifficulty: true, familyHistory: true },
  { bmi: 31, hba1c: 6.0, tsh: 6.1 },
);

describe("personaTrack", () => {
  it("derives high for Aanya-like answers", () => { expect(personaTrack(HIGH)).toBe("high"); });
});

describe("getTouchpointsDue", () => {
  it("returns the baseline on day 0", () => {
    expect(getTouchpointsDue(HIGH, 0).some((t) => t.kind === "baseline")).toBe(true);
  });
  it("returns the partial retest on day 90", () => {
    const due = getTouchpointsDue(HIGH, 90);
    expect(due.some((t) => t.retest === "partial")).toBe(true);
  });
  it("synthesizes a CC connect on a fortnightly day with nothing scheduled", () => {
    // day 14: no scheduled touchpoint, high track cadence 14 → cc-connect
    expect(getTouchpointsDue(HIGH, 14).some((t) => t.kind === "cc-connect")).toBe(true);
  });
  it("returns nothing on a quiet day", () => {
    expect(getTouchpointsDue(HIGH, 13)).toHaveLength(0);
  });
});

describe("getCareCircle", () => {
  it("adds dermatologist when acne/hirsutism present", () => {
    const roles = getCareCircle("high", { acneOrHirsutism: true, ttc: false, highMetabolic: true }).map((s) => s.role);
    expect(roles).toContain("dermatologist");
    expect(roles).toContain("psychologist");
  });
  it("adds gynaecologist for TTC", () => {
    const roles = getCareCircle("medium", { acneOrHirsutism: false, ttc: true, highMetabolic: false }).map((s) => s.role);
    expect(roles).toContain("gynaecologist");
  });
});
