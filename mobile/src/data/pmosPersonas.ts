import type { Persona } from "@/types/persona";
import type { MarkerSet } from "@/types/journey";

const baseReport = (score: number, labs: Persona["smartReport"]["labs"] = []): Persona["smartReport"] => ({
  healthScore: score, band: "warm", bandLabel: "Fair", chronologicalAge: 30, biologicalAge: 31,
  heartAge: 30, cvdRiskPct: 2, diabetesRiskPct: 8, hypertensionRiskPct: 6,
  populationAvgScore: 738, topDrivers: [], labs,
});

const m = (o: MarkerSet): MarkerSet => o;

export const AANYA: Persona = {
  id: "aanya", name: "Ms Aanya Sharma", shortName: "Aanya", lastName: "Sharma",
  gender: "F", ageYears: 28, city: "Delhi", role: "Designer", avatarSeed: "aanya-28",
  smartReport: baseReport(560, [
    { key: "bmi", label: "BMI", value: 31, unit: "kg/m²", rangeLabel: "<25", status: "flagged" },
    { key: "hba1c", label: "HbA1c", value: 6.0, unit: "%", rangeLabel: "<5.7", status: "flagged" },
    { key: "tsh", label: "TSH", value: 6.1, unit: "mIU/L", rangeLabel: "0.4–4.0", status: "flagged" },
  ]),
  cares: { enrolled: true, primaryProgram: "pcos-care", weekOfTwelve: 1 },
  pmos: {
    eligible: true, entryState: "A", hasAhc: true, ttc: false, enrollmentDay: "2026-01-01",
    assessment: { irregularPeriods: true, acneSkin: true, hairChanges: true, weightDifficulty: true, familyHistory: true },
    ahcMarkers: { bmi: 31, hba1c: 6.0, tsh: 6.1 },
    cycleHistory: ["2025-10-02", "2025-11-20", "2026-01-01"], // irregular (49d, 42d)
    markers: {
      day0:   m({ bmi: 31, hba1c: 6.0, fbs: 104, insulinFasting: 18, tsh: 6.1, lh: 14, fsh: 5, testosterone: 62, weightKg: 82, waistCm: 96 }),
      day90:  m({ bmi: 30, hba1c: 5.8, fbs: 99,  insulinFasting: 15, tsh: 5.0, lh: 12, fsh: 5, testosterone: 58, weightKg: 79, waistCm: 93 }),
      day180: m({ bmi: 29, hba1c: 5.6, fbs: 95,  insulinFasting: 12, tsh: 4.2, lh: 10, fsh: 5, testosterone: 52, weightKg: 76, waistCm: 90 }),
    },
    prescribed: { supplement: { name: "myo-inositol", fromDay: 7 } },
  },
};

export const MEERA: Persona = {
  id: "meera", name: "Ms Meera Nair", shortName: "Meera", lastName: "Nair",
  gender: "F", ageYears: 32, city: "Kochi", role: "Teacher", avatarSeed: "meera-32",
  smartReport: baseReport(610, [
    { key: "bmi", label: "BMI", value: 27, unit: "kg/m²", rangeLabel: "<25", status: "borderline" },
    { key: "hba1c", label: "HbA1c", value: 5.6, unit: "%", rangeLabel: "<5.7", status: "normal" },
    { key: "tsh", label: "TSH", value: 3.0, unit: "mIU/L", rangeLabel: "0.4–4.0", status: "normal" },
  ]),
  cares: { enrolled: true, primaryProgram: "pcos-care", weekOfTwelve: 1 },
  pmos: {
    eligible: true, entryState: "A", hasAhc: true, ttc: false, enrollmentDay: "2026-01-01",
    assessment: { irregularPeriods: true, acneSkin: false, hairChanges: false, weightDifficulty: true, familyHistory: true },
    ahcMarkers: { bmi: 27, hba1c: 5.6, tsh: 3.0 },
    cycleHistory: ["2025-10-25", "2025-11-28", "2026-01-01"], // mildly irregular (34d, 34d)
    markers: {
      day0:   m({ bmi: 27, hba1c: 5.6, fbs: 96, insulinFasting: 13, weightKg: 70, waistCm: 88 }),
      day90:  m({ bmi: 26, hba1c: 5.5, fbs: 93, insulinFasting: 11, weightKg: 68, waistCm: 85 }),
      day180: m({ bmi: 26, hba1c: 5.4, fbs: 91, insulinFasting: 10, weightKg: 67, waistCm: 84 }),
    },
  },
};

export const SANA: Persona = {
  id: "sana", name: "Ms Sana Khan", shortName: "Sana", lastName: "Khan",
  gender: "F", ageYears: 26, city: "Pune", role: "Analyst", avatarSeed: "sana-26",
  smartReport: baseReport(690, [
    { key: "bmi", label: "BMI", value: 23, unit: "kg/m²", rangeLabel: "<25", status: "normal" },
    { key: "hba1c", label: "HbA1c", value: 5.3, unit: "%", rangeLabel: "<5.7", status: "normal" },
    { key: "tsh", label: "TSH", value: 2.2, unit: "mIU/L", rangeLabel: "0.4–4.0", status: "normal" },
  ]),
  cares: { enrolled: false },
  pmos: {
    eligible: true, entryState: "B", hasAhc: true, ttc: false, enrollmentDay: "2026-01-01",
    assessment: { irregularPeriods: false, acneSkin: true, hairChanges: false, weightDifficulty: false, familyHistory: false },
    ahcMarkers: { bmi: 23, hba1c: 5.3, tsh: 2.2 },
    cycleHistory: ["2025-11-04", "2025-12-02", "2026-01-01"], // regular (28d, 30d)
    markers: {
      day0:   m({ bmi: 23, hba1c: 5.3, weightKg: 60, waistCm: 78 }),
      day90:  m({ bmi: 23, hba1c: 5.2, weightKg: 59, waistCm: 77 }),
      day180: m({ bmi: 23, hba1c: 5.2, weightKg: 59, waistCm: 76 }),
    },
  },
};

export const RIYA: Persona = {
  id: "riya", name: "Ms Riya Verma", shortName: "Riya", lastName: "Verma",
  gender: "F", ageYears: 24, city: "Jaipur", role: "Student", avatarSeed: "riya-24",
  smartReport: baseReport(710, []), // cold start: no AHC labs on file
  cares: { enrolled: false },
  pmos: {
    eligible: true, entryState: "C", hasAhc: false, ttc: false, enrollmentDay: "2026-01-01",
    assessment: { irregularPeriods: false, acneSkin: false, hairChanges: false, weightDifficulty: false, familyHistory: false },
    cycleHistory: ["2025-11-04", "2025-12-02", "2026-01-01"], // regular
    markers: { day0: {}, day90: {}, day180: {} },
  },
};

export const PMOS_PERSONAS = [AANYA, MEERA, SANA, RIYA] as const;
