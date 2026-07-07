import { describe, it, expect } from "vitest";
import { activeNudge } from "./nudge";
import type { Persona } from "@/types/persona";
import type { AssessmentAnswers } from "@/types/journey";
import type { CycleLog } from "./state";
import type { DayLog } from "./daylog";

const ALL_FALSE: AssessmentAnswers = {
  irregularPeriods: false, acneSkin: false, hairChanges: false, weightDifficulty: false, familyHistory: false,
};

function persona(cycleHistory: string[] = []): Persona {
  return {
    id: "aanya", name: "", shortName: "", gender: "F", ageYears: 30, city: "", role: "", avatarSeed: "x",
    smartReport: { healthScore: 600, band: "warm", bandLabel: "Fair", chronologicalAge: 30, biologicalAge: 30, heartAge: 30, cvdRiskPct: 1, diabetesRiskPct: 1, hypertensionRiskPct: 1, populationAvgScore: 700, topDrivers: [], labs: [] },
    cares: { enrolled: true },
    pmos: {
      eligible: true, entryState: "A", hasAhc: true, ttc: false, enrollmentDay: "2026-01-01",
      assessment: ALL_FALSE, ahcMarkers: undefined, cycleHistory,
      markers: { day0: {}, day90: {}, day180: {} },
    },
  } as Persona;
}
const REGULAR = persona([]); // empty history → shouldResurfaceAssessment false
const IRREGULAR = persona(["2025-10-02", "2025-11-20", "2026-01-01"]); // gaps 49, 42 → both out of range

const base = {
  persona: REGULAR, cycleLog: null as CycleLog | null, dayLog: {} as DayLog,
  cycleLength: 28, today: new Date("2026-05-01T00:00:00"),
};
const symptomDays = (n: number, id = "acne"): DayLog => {
  const out: DayLog = {};
  for (let i = 1; i <= n; i++) out[`2026-04-0${i}`] = { symptoms: [id] };
  return out;
};

describe("activeNudge — tier gate", () => {
  it("never nudges medium/high", () => {
    expect(activeNudge({ ...base, tier: "high", persona: IRREGULAR })).toBeNull();
    expect(activeNudge({ ...base, tier: "medium", persona: IRREGULAR })).toBeNull();
  });
});

describe("activeNudge — missed period", () => {
  const missed: CycleLog = { intent: "track", lastPeriod: "2026-01-01" }; // 120d before today, > 2*28
  const content = (n: ReturnType<typeof activeNudge>) => [n?.body, ...(n?.points ?? [])].join(" ");
  it("fires the clinical copy for a tracking user past 2 cycles", () => {
    const n = activeNudge({ ...base, tier: "none", cycleLog: missed });
    expect(n?.type).toBe("missed-period");
    expect(content(n)).toMatch(/doctor/i);
  });
  it("fires the TTC copy when intent is ttc", () => {
    const n = activeNudge({ ...base, tier: "none", cycleLog: { intent: "ttc", lastPeriod: "2026-01-01" } });
    expect(n?.type).toBe("missed-period");
    expect(content(n)).toMatch(/test|conceive/i);
  });
  it("does not fire when a period was logged recently", () => {
    const n = activeNudge({ ...base, tier: "none", cycleLog: missed, dayLog: { "2026-04-20": { period: true } } });
    expect(n?.type).not.toBe("missed-period");
  });
  it("is skipped for a pregnant user", () => {
    const n = activeNudge({ ...base, tier: "none", cycleLog: { intent: "pregnant", lastPeriod: "2026-01-01" } });
    expect(n?.type).not.toBe("missed-period");
  });
});

describe("activeNudge — irregular", () => {
  it("fires for an irregular seed history when nothing higher fires", () => {
    const n = activeNudge({ ...base, tier: "none", persona: IRREGULAR });
    expect(n?.type).toBe("irregular");
  });
  it("does not fire for a regular history", () => {
    const n = activeNudge({ ...base, tier: "low", persona: REGULAR });
    expect(n).toBeNull();
  });
  it("fires when logged period dates are irregular, even for a regular-seed persona", () => {
    // 3 logged period starts: gaps 73d and 56d — both out of the 21–35 range
    const dayLog: DayLog = {
      "2026-01-01": { period: true },
      "2026-03-15": { period: true },
      "2026-05-10": { period: true },
    };
    const n = activeNudge({ ...base, tier: "low", persona: REGULAR, dayLog });
    expect(n?.type).toBe("irregular");
  });
});

describe("activeNudge — symptom", () => {
  it("fires at 3 qualifying days, naming the symptom", () => {
    const n = activeNudge({ ...base, tier: "low", dayLog: symptomDays(3, "acne") });
    expect(n?.type).toBe("symptom");
    expect(n?.body).toMatch(/acne/i);
  });
  it("does not fire at 2 days", () => {
    const n = activeNudge({ ...base, tier: "low", dayLog: symptomDays(2, "acne") });
    expect(n).toBeNull();
  });
  it("ignores non-qualifying symptoms", () => {
    const n = activeNudge({ ...base, tier: "low", dayLog: symptomDays(3, "bloating") });
    expect(n).toBeNull();
  });
});

describe("activeNudge — wellness", () => {
  it("shows for none when nothing else fires", () => {
    expect(activeNudge({ ...base, tier: "none" })?.type).toBe("wellness");
  });
  it("does not show for low", () => {
    expect(activeNudge({ ...base, tier: "low" })).toBeNull();
  });
});

describe("activeNudge — priority + dismissal", () => {
  const missed: CycleLog = { intent: "track", lastPeriod: "2026-01-01" };
  it("missed-period beats irregular", () => {
    expect(activeNudge({ ...base, tier: "none", persona: IRREGULAR, cycleLog: missed })?.type).toBe("missed-period");
  });
  it("irregular beats symptom", () => {
    expect(activeNudge({ ...base, tier: "none", persona: IRREGULAR, dayLog: symptomDays(3) })?.type).toBe("irregular");
  });
});
