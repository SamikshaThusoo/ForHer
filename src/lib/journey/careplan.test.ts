import { describe, it, expect } from "vitest";
import { getCareTests, getClinicPlan } from "./careplan";
import type { Persona } from "@/types/persona";
import type { AhcMarkers, AssessmentAnswers } from "@/types/journey";

const F = { acneOrHirsutism: false, ttc: false, highMetabolic: false };

describe("getCareTests", () => {
  it("none and low get no tests", () => {
    expect(getCareTests("none", F)).toEqual([]);
    expect(getCareTests("low", F)).toEqual([]);
  });
  it("medium gets the hormone / PCOS-essentials panel", () => {
    const t = getCareTests("medium", F);
    expect(t.map((x) => x.id)).toEqual(["hormone-panel"]);
  });
  it("high adds a pelvic ultrasound after the hormone panel", () => {
    const t = getCareTests("high", { ...F, highMetabolic: true });
    expect(t.map((x) => x.id)).toEqual(["hormone-panel", "pelvic-ultrasound"]);
  });
  it("every test carries a plain-language reason", () => {
    for (const t of getCareTests("high", F)) expect(t.reason.length).toBeGreaterThan(0);
  });
});

// Build-safe Persona factory — mirrors src/lib/journey/touchpoints.test.ts.
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

// 3 positive domains (androgenic + metabolic + polyendocrine) + high labs → high.
const HIGH = persona(
  { irregularPeriods: true, acneSkin: true, hairChanges: false, weightDifficulty: true, familyHistory: false },
  { bmi: 31, hba1c: 6.1 },
);
// 2 domains (androgenic + polyendocrine), metabolic false, no escalation → medium.
const MED = persona(
  { irregularPeriods: true, acneSkin: true, hairChanges: false, weightDifficulty: false, familyHistory: false },
  { bmi: 24, hba1c: 5.2 },
);
// 0 domains → none (companion).
const NONE = persona(
  { irregularPeriods: false, acneSkin: false, hairChanges: false, weightDifficulty: false, familyHistory: false },
  { bmi: 22, hba1c: 5.0 },
);

describe("getClinicPlan", () => {
  it("high leads with a priority gynaecologist consult and shows booking", () => {
    const p = getClinicPlan(HIGH, {});
    expect(p.tier).toBe("high");
    expect(p.primary?.kind).toBe("consult");
    expect(p.primary?.id).toBe("gynaecologist");
    expect(p.primary?.priority).toBe(true);
    expect(p.showBooking).toBe(true);
    expect(p.secondary.some((i) => i.id === "hormone-panel")).toBe(true);
    expect(p.secondary.some((i) => i.id === "pelvic-ultrasound")).toBe(true);
  });

  it("medium without a gynae leads with the hormone panel", () => {
    const p = getClinicPlan(MED, {});
    expect(p.tier).toBe("medium");
    expect(p.primary?.kind).toBe("test");
    expect(p.primary?.id).toBe("hormone-panel");
    expect(p.showBooking).toBe(true);
  });

  it("medium with TTC leads with the gynaecologist consult (not priority)", () => {
    const p = getClinicPlan(MED, { ttc: true });
    expect(p.tier).toBe("medium");
    expect(p.primary?.id).toBe("gynaecologist");
    expect(p.primary?.priority).toBeUndefined();
  });

  it("no primary and no booking for the companion (none) track", () => {
    const p = getClinicPlan(NONE, {});
    expect(p.tier).toBe("none");
    expect(p.showBooking).toBe(false);
  });

  it("primary is never duplicated in the secondary list", () => {
    const p = getClinicPlan(HIGH, {});
    expect(p.secondary.some((i) => i.kind === p.primary?.kind && i.id === p.primary?.id)).toBe(false);
  });
});
