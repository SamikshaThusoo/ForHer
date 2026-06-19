import type { Persona } from "@/types/persona";
import { PMOS_PERSONAS } from "./pmosPersonas";

export const NIKHIL: Persona = {
  id: "nikhil",
  name: "Mr Nikhil Dubey",
  shortName: "Nikhil",
  lastName: "Dubey",
  gender: "M",
  ageYears: 29,
  city: "Bangalore",
  role: "Product Manager",
  avatarSeed: "nikhil-29",
  smartReport: {
    healthScore: 720,
    band: "warm",
    bandLabel: "Good",
    chronologicalAge: 29,
    biologicalAge: 30,
    heartAge: 28,
    cvdRiskPct: 1.6,
    diabetesRiskPct: 4.0,
    hypertensionRiskPct: 5.5,
    populationAvgScore: 738,
    topDrivers: ["mildly elevated lymphocytes", "Vitamin D borderline", "slightly low haemoglobin"],
    labs: [
      { key: "fbs",   label: "Fasting Blood Sugar", value: 80, unit: "mg/dL", rangeLabel: "70–100", status: "normal" },
      { key: "hba1c", label: "HbA1c", value: 5.2, unit: "%", rangeLabel: "<5.7", status: "normal" },
      { key: "sgot",  label: "SGOT", value: 20.78, unit: "U/L", rangeLabel: "<31", status: "normal" },
      { key: "sgpt",  label: "SGPT", value: 18.19, unit: "U/L", rangeLabel: "<34", status: "normal" },
      { key: "uric",  label: "Uric Acid", value: 4.88, unit: "mg/dL", rangeLabel: "3.2–6.1", status: "normal" },
    ],
  },
  cares: { enrolled: false },
};

export const PRIYA: Persona = {
  id: "priya",
  name: "Ms Priya Iyer",
  shortName: "Priya",
  lastName: "Iyer",
  gender: "F",
  ageYears: 34,
  city: "Bangalore",
  role: "Software Engineer",
  avatarSeed: "priya-34",
  smartReport: {
    healthScore: 620,
    band: "warm",
    bandLabel: "Fair",
    chronologicalAge: 34,
    biologicalAge: 38,
    baselineBiologicalAge: 40.1,   // bio age at program enrollment 3 weeks ago
    heartAge: 40,
    cvdRiskPct: 4.2,
    diabetesRiskPct: 12.0,
    hypertensionRiskPct: 8.5,
    populationAvgScore: 738,
    topDrivers: ["prediabetes", "Vitamin D low", "borderline BP"],
    labs: [
      { key: "hba1c", label: "HbA1c", value: 5.9, unit: "%", rangeLabel: "<5.7", status: "flagged" },
      { key: "fbs",   label: "Fasting Blood Sugar", value: 108, unit: "mg/dL", rangeLabel: "70–100", status: "flagged" },
      { key: "sbp",   label: "Systolic BP", value: 134, unit: "mmHg", rangeLabel: "<130", status: "borderline" },
      { key: "vitd",  label: "Vitamin D", value: 18, unit: "ng/mL", rangeLabel: "30–100", status: "flagged" },
      { key: "ldl",   label: "LDL Cholesterol", value: 118, unit: "mg/dL", rangeLabel: "<100", status: "borderline" },
    ],
    // 7-day score series — index 0 = 6 days ago, index 6 = today.
    // Net delta vs 7 days ago = 620 - 602 = +18 (matches the "+18 vs last week" line).
    scoreHistory: [602, 605, 608, 604, 612, 616, 620],
    scoreCauseToday:
      "Your sleep window stretched to 7h 12m (from a 6h 40m avg) — that's most of today's lift.",
  },
  cares: {
    enrolled: true,
    primaryProgram: "prediabetes-reversal",
    overlayModules: ["hypertension-control"],
    weekOfTwelve: 3,
    nextDoctorConsult: { date: "2026-05-28T16:00:00+05:30", doctor: "Dr Anjali Rao (Endocrinology)" },
    nextCoachSession:  {
      date: "2026-05-27T19:00:00+05:30",
      coach: "Riya M. (Nutritionist)",
      photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&q=80&auto=format&fit=crop",
    },
    daysToMidRetest: 21,
    streakDays: 18,
    coachMessage: {
      quote: "Week 3 is where most members plateau — your sleep is holding the line.",
      coach: "Riya M.",
    },
    weekCelebration: { active: true, week: 3 },
  },
};

export const PERSONAS = [NIKHIL, PRIYA, ...PMOS_PERSONAS] as const;
