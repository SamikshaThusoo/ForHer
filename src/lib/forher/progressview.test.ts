import { describe, it, expect } from "vitest";
import { nextVisit, phaseActivity, planDayForDate, logsInPhase, checkpointMarkers } from "./progressview";
import type { Persona } from "@/types/persona";
import type { PlanVisit } from "@/lib/journey";
import type { DayLog } from "./daylog";

const VISITS: PlanVisit[] = [
  { day: 5, kind: "consult", label: "Doctor baseline consult", service: "doctor" },
  { day: 35, kind: "consult", label: "Dermatology", service: "dermatology" },
  { day: 90, kind: "test", label: "Day 90 retest", service: "labs" },
];

describe("nextVisit", () => {
  it("returns the first visit on or after the given day", () => {
    expect(nextVisit(VISITS, 1)?.day).toBe(5);
    expect(nextVisit(VISITS, 6)?.day).toBe(35);
    expect(nextVisit(VISITS, 35)?.day).toBe(35);
  });
  it("returns null when nothing is left", () => {
    expect(nextVisit(VISITS, 91)).toBeNull();
  });
});

describe("phaseActivity", () => {
  it("sums tasks and counts active days in the range", () => {
    const done = { 1: ["a", "b"], 2: [], 3: ["c"], 40: ["x"] };
    expect(phaseActivity(done, 1, 30)).toEqual({ tasks: 3, activeDays: 2 });
    expect(phaseActivity(done, 31, 60)).toEqual({ tasks: 1, activeDays: 1 });
  });
});

describe("planDayForDate", () => {
  it("maps enrollment day to plan day 1 and counts forward", () => {
    expect(planDayForDate("2026-01-01", "2026-01-01")).toBe(1);
    expect(planDayForDate("2026-01-01", "2026-01-31")).toBe(31);
    expect(planDayForDate("2026-01-01", "2026-02-01")).toBe(32);
  });
});

describe("logsInPhase", () => {
  it("counts period-starts and symptom-days whose plan day is in range", () => {
    const dayLog: DayLog = {
      "2026-01-05": { period: true },
      "2026-01-06": { period: true },
      "2026-01-10": { symptoms: ["acne"] },
      "2026-02-15": { period: true, symptoms: ["cramps"] },
    };
    expect(logsInPhase(dayLog, "2026-01-01", 1, 30)).toEqual({ periods: 1, symptomDays: 1 });
    expect(logsInPhase(dayLog, "2026-01-01", 31, 60)).toEqual({ periods: 1, symptomDays: 1 });
  });
});

function persona(): Persona {
  const day0 = { weightKg: 80, waistCm: 100, bmi: 30, fbs: 100, insulinFasting: 20, hba1c: 6.0 };
  const day90 = { weightKg: 74, waistCm: 92, bmi: 27, fbs: 90, insulinFasting: 12, hba1c: 5.4 };
  return {
    id: "aanya", name: "", shortName: "", gender: "F", ageYears: 30, city: "", role: "", avatarSeed: "x",
    smartReport: { healthScore: 600, band: "warm", bandLabel: "Fair", chronologicalAge: 30, biologicalAge: 30, heartAge: 30, cvdRiskPct: 1, diabetesRiskPct: 1, hypertensionRiskPct: 1, populationAvgScore: 700, topDrivers: [], labs: [] },
    cares: { enrolled: true },
    pmos: {
      eligible: true, entryState: "A", hasAhc: true, ttc: false, enrollmentDay: "2026-01-01",
      assessment: { irregularPeriods: false, acneSkin: false, hairChanges: false, weightDifficulty: false, familyHistory: false },
      cycleHistory: [], markers: { day0, day90, day180: day90 },
    },
  } as Persona;
}

describe("checkpointMarkers cadence + state", () => {
  it("day 30 shows only self-logged markers, labelled current", () => {
    const keys = checkpointMarkers(persona(), 30).map((m) => m.key);
    expect(keys).toEqual(["weightKg", "waistCm", "bmi"]);
    expect(checkpointMarkers(persona(), 30).every((m) => m.state === "current")).toBe(true);
  });
  it("day 60 adds HOMA-IR (projected), still no HbA1c", () => {
    const rows = checkpointMarkers(persona(), 60);
    const homa = rows.find((m) => m.key === "homaIr");
    expect(homa?.state).toBe("projected");
    expect(rows.some((m) => m.key === "hba1c")).toBe(false);
  });
  it("day 90 shows all five, all measured", () => {
    const rows = checkpointMarkers(persona(), 90);
    expect(rows.map((m) => m.key).sort()).toEqual(["bmi", "hba1c", "homaIr", "waistCm", "weightKg"]);
    expect(rows.every((m) => m.state === "measured")).toBe(true);
  });
});
