import { describe, it, expect } from "vitest";
import { getDomainSignals, getRiskOutcome } from "./risk";
import type { AssessmentAnswers } from "@/types/journey";

const NONE: AssessmentAnswers = {
  irregularPeriods: false, acneSkin: false, hairChanges: false,
  weightDifficulty: false, familyHistory: false,
};
const a = (p: Partial<AssessmentAnswers>): AssessmentAnswers => ({ ...NONE, ...p });

describe("getDomainSignals", () => {
  it("flags androgenic from acne or hair", () => {
    expect(getDomainSignals(a({ acneSkin: true })).androgenic).toBe(true);
    expect(getDomainSignals(a({ hairChanges: true })).androgenic).toBe(true);
  });
  it("flags metabolic from AHC labs even with no self-report", () => {
    const s = getDomainSignals(a({}), { bmi: 31, hba1c: 6.0 });
    expect(s.metabolic).toBe(true);
    expect(s.confidence).toBe("high");
  });
  it("marks low confidence when metabolic is self-report only", () => {
    const s = getDomainSignals(a({ weightDifficulty: true })); // no AHC
    expect(s.metabolic).toBe(true);
    expect(s.confidence).toBe("low");
  });
  it("flags polyendocrine from TSH", () => {
    expect(getDomainSignals(a({}), { tsh: 6.1 }).polyendocrine).toBe(true);
  });
});

describe("getRiskOutcome", () => {
  it("returns none for zero domains", () => {
    expect(getRiskOutcome(NONE)).toBe("none");
  });
  it("returns low for one domain", () => {
    expect(getRiskOutcome(a({ acneSkin: true }))).toBe("low");
  });
  it("returns medium for two domains", () => {
    // metabolic (weight) + polyendocrine (irregular) = 2
    expect(getRiskOutcome(a({ weightDifficulty: true, irregularPeriods: true }))).toBe("medium");
  });
  it("returns high for all three domains", () => {
    expect(getRiskOutcome(
      a({ acneSkin: true, weightDifficulty: true, irregularPeriods: true }),
    )).toBe("high");
  });
  it("bumps medium to high on severe AHC labs", () => {
    // 2 domains via self-report, but HbA1c 6.2 / BMI 31 → high
    expect(getRiskOutcome(
      a({ hairChanges: true, irregularPeriods: true }),
      { bmi: 31, hba1c: 6.2 },
    )).toBe("high");
  });
  it("Aanya profile resolves high; Riya profile resolves none", () => {
    expect(getRiskOutcome(
      a({ irregularPeriods: true, acneSkin: true, hairChanges: true, weightDifficulty: true, familyHistory: true }),
      { bmi: 31, hba1c: 6.0, tsh: 6.1 },
    )).toBe("high");
    expect(getRiskOutcome(NONE)).toBe("none");
  });
});
