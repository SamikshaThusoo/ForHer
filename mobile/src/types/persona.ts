import type { PmosProfile } from "./journey";

export type ScoreBand = "poor" | "fair" | "warm" | "good";
export type Status = "normal" | "borderline" | "flagged" | "severe";

export interface LabValue {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  rangeLabel?: string;
  status: Status;
}

export interface SmartReport {
  healthScore: number;            // 0–1000
  band: ScoreBand;
  bandLabel: "Poor" | "Fair" | "Good" | "Excellent";
  chronologicalAge: number;
  biologicalAge: number;
  /** Biological age at the moment the user enrolled in their primary care program. */
  baselineBiologicalAge?: number;
  heartAge: number;
  cvdRiskPct: number;
  diabetesRiskPct: number;
  hypertensionRiskPct: number;
  populationAvgScore: number;
  topDrivers: string[];           // e.g. ["prediabetes", "vitamin D", "borderline BP"]
  labs: LabValue[];
  /** Last 7 daily scores (index 0 = 6 days ago, index 6 = today). Used for sparkline + delta. */
  scoreHistory?: number[];
  /** One-sentence contributing factor for today's score movement. */
  scoreCauseToday?: string;
}

export type ProgramKey =
  | "prediabetes-reversal"
  | "pcos-care"
  | "cvd-risk-reduction"
  | "hypertension-control"
  | "calorie-fit";

export interface CaresEnrollment {
  enrolled: boolean;
  primaryProgram?: ProgramKey;
  overlayModules?: ProgramKey[];
  weekOfTwelve?: number;
  nextDoctorConsult?: { date: string; doctor: string };
  nextCoachSession?: { date: string; coach: string; photoUrl?: string };
  daysToMidRetest?: number;
  /** Consecutive days the user has logged any activity / completed a daily action. */
  streakDays?: number;
  /** Coach's voice line for this week, used above the CTA. */
  coachMessage?: { quote: string; coach: string };
  /** When true (e.g., Sunday-night of a completed week), show the brief week-complete celebration. */
  weekCelebration?: { active: boolean; week: number };
}

export interface Persona {
  id: "nikhil" | "priya" | "aanya" | "meera" | "sana" | "riya";
  name: string;
  shortName: string;
  /** Family/last name used in greetings and short displays (e.g. "Iyer"). */
  lastName?: string;
  gender: "M" | "F";
  ageYears: number;
  city: string;
  role: string;
  avatarSeed: string;             // for deterministic avatar
  /** When true, the DigitalTwin renders a DiceBear avatar instead of the default silhouette. */
  useAvatarVariant?: boolean;
  smartReport: SmartReport;
  cares: CaresEnrollment;
  /** Women's-health / PMOS journey profile. Absent on non-eligible personas. */
  pmos?: PmosProfile;
}
