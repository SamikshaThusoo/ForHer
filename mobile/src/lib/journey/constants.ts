import type {
  CareTrack, CyclePhase, JourneyPhase, RouteTarget, Source, TaskCategory, TaskTarget,
} from "@/types/journey";

export const PMOS_LABEL = "PMOS";
export const PMOS_FULL = "Polyendocrine Metabolic Ovarian Syndrome";
/** Use on first mention in any surface. */
export const PMOS_LABEL_FIRST_MENTION = "PMOS";

/** Inclusive day bounds per program phase (90-day spec v1.1). */
export const PHASE_BOUNDS: { phase: JourneyPhase; from: number; to: number }[] = [
  { phase: "foundation", from: 1,  to: 30 },
  { phase: "build",      from: 31, to: 60 },
  { phase: "milestone",  from: 61, to: 90 },
];

export const PROGRAM_LAST_DAY = 90;

export const TRACK_LABELS: Record<CareTrack, string> = {
  none:   "Companion mode",
  low:    "90-day plan · reduced intensity",
  medium: "90-day plan · structured",
  high:   "90-day plan · full supervised",
};

/** Care-Coordinator connect cadence (days between connects) by track. */
export const CC_CADENCE_DAYS: Record<CareTrack, number | null> = {
  none: null, low: 30, medium: 14, high: 14,
};

/** Daily step targets by program phase × tier (spec v1.1 §3.1). High ramps across phases. */
export const STEP_TARGETS: Record<JourneyPhase, Record<"low" | "medium" | "high", number>> = {
  foundation: { low: 6000, medium: 7000, high: 6000 },
  build:      { low: 7000, medium: 8000, high: 8000 },
  milestone:  { low: 8000, medium: 9000, high: 10000 },
};

/** Scheduled clinical touchpoints for the 90-day program (spec v1.1 §3.8).
 *  `tracks` lists which tracks receive it; `ifAndrogenic` rows only apply when
 *  skin/hair signs are present (dermatology). CC connects are synthesized by cadence. */
export const TOUCHPOINT_SCHEDULE: {
  day: number;
  kind: "baseline" | "consult" | "retest" | "review";
  services: string[];
  label: string;
  retest?: "partial" | "full";
  tracks: CareTrack[];
  ifAndrogenic?: boolean;
}[] = [
  { day: 2,  kind: "consult",  services: ["nutritionist"],    label: "Dietician onboarding call",      tracks: ["low", "medium", "high"] },
  { day: 5,  kind: "baseline", services: ["doctor"],          label: "Doctor baseline consult",        tracks: ["low", "medium", "high"] },
  { day: 7,  kind: "consult",  services: ["nutritionist"],    label: "Nutritionist intake",            tracks: ["medium", "high"] },
  { day: 21, kind: "consult",  services: ["psychologist"],    label: "Psychologist check-in",          tracks: ["high"] },
  { day: 28, kind: "consult",  services: ["nutritionist"],    label: "Nutritionist follow-up",         tracks: ["medium", "high"] },
  { day: 35, kind: "consult",  services: ["dermatology"],     label: "Dermatology (skin / hair)",      tracks: ["high"] },
  { day: 35, kind: "consult",  services: ["dermatology"],     label: "Dermatology (skin / hair)",      tracks: ["low", "medium"], ifAndrogenic: true },
  { day: 45, kind: "consult",  services: ["nutritionist"],    label: "Nutritionist review",            tracks: ["medium", "high"] },
  { day: 63, kind: "consult",  services: ["nutritionist"],    label: "Nutritionist review",            tracks: ["medium", "high"] },
  { day: 80, kind: "consult",  services: ["gynae"],           label: "Gynaecologist consult",          tracks: ["high"] },
  { day: 80, kind: "consult",  services: ["gynae"],           label: "Gynaecologist consult",          tracks: ["medium"], ifAndrogenic: true },
  { day: 85, kind: "consult",  services: ["prep"],            label: "Pre-retest preparation",         tracks: ["low", "medium", "high"] },
  { day: 90, kind: "retest",   services: ["doctor", "labs"],  label: "Day 90 retest + outcomes",       retest: "partial", tracks: ["low"] },
  { day: 90, kind: "retest",   services: ["doctor", "labs"],  label: "Day 90 retest + outcomes",       retest: "full",    tracks: ["medium"] },
  { day: 90, kind: "retest",   services: ["doctor", "labs", "hormone-panel"], label: "Day 90 retest + outcomes", retest: "full", tracks: ["high"] },
];

/** A task template; the per-track entry carries the resolved target + how often it
 *  recurs (everyDays: 1 daily, 7 weekly, 14 fortnightly, 30 monthly). onDay pins a
 *  one-off. A track absent from `byTrack` means the task does not apply to that track. */
export interface TaskDef {
  id: string;
  category: TaskCategory;
  title: string;
  detail: string;
  routeTo: RouteTarget;
  source: Source;
  phaseEmphasis?: CyclePhase[];
  clinicalNote?: string;
  byTrack: Partial<Record<CareTrack, { target: TaskTarget; everyDays: number; onDay?: number }>>;
}

const daily = (kind: TaskTarget["kind"], value: number, unit?: string, everyDays = 1) =>
  ({ target: { kind, value, unit }, everyDays });

/** Section 3.2 of the spec, encoded. Steps are an engagement proxy (copy says so).
 *  Targets sit inside the 2023 guideline ranges. */
export const TASK_CATALOG: TaskDef[] = [
  {
    id: "steps", category: "move", title: "Hit your step goal",
    detail: "A 10-minute walk counts — movement, not a number.",
    routeTo: "activity", source: "companion",
    byTrack: {
      none:   daily("steps", 6000, "steps"),
      low:    daily("steps", 7000, "steps"),
      medium: daily("steps", 8000, "steps"),
      high:   daily("steps", 10000, "steps"), // progressive 6k→10k handled in resolver detail
    },
  },
  {
    id: "aerobic", category: "move", title: "Aerobic minutes",
    detail: "Moderate movement across the week.",
    routeTo: "activity", source: "careplan", phaseEmphasis: ["follicular", "ovulatory"],
    byTrack: {
      none:   daily("duration_min", 150, "min/week", 7),
      low:    daily("duration_min", 150, "min/week", 7),
      medium: daily("duration_min", 200, "min/week", 7),
      high:   daily("duration_min", 230, "min/week", 7),
    },
  },
  {
    id: "strength", category: "move", title: "Strength session",
    detail: "Strength work — it lifts insulin sensitivity.",
    routeTo: "activity", source: "careplan", phaseEmphasis: ["ovulatory"],
    byTrack: {
      none:   { target: { kind: "sessions_week", value: 1 }, everyDays: 7 },
      low:    { target: { kind: "sessions_week", value: 2 }, everyDays: 7 },
      medium: { target: { kind: "sessions_week", value: 2 }, everyDays: 7 },
      high:   { target: { kind: "sessions_week", value: 3 }, everyDays: 7 },
    },
  },
  {
    id: "meals-log", category: "nourish", title: "Log your meals",
    detail: "Builds awareness — swaps and additions, never guilt.",
    routeTo: "food-logger", source: "companion",
    byTrack: {
      none:   daily("count", 1, "meals"),
      low:    daily("count", 1, "meals"),
      medium: daily("count", 2, "meals"),
      high:   daily("count", 3, "meals"),
    },
  },
  {
    id: "low-gi-swap", category: "nourish", title: "One low-GI swap",
    detail: "Swap a refined carb for low-GI — millet over rice.",
    routeTo: "scanner", source: "careplan", phaseEmphasis: ["luteal"],
    byTrack: {
      medium: daily("count", 1, "swap"),
      high:   daily("count", 2, "swap"),
    },
  },
  {
    id: "hydration", category: "nourish", title: "Hydration",
    detail: "Glasses of water through the day.",
    routeTo: "placeholder", source: "companion",
    byTrack: {
      none:   daily("count", 6, "glasses"),
      low:    daily("count", 6, "glasses"),
      medium: daily("count", 8, "glasses"),
      high:   daily("count", 9, "glasses"),
    },
  },
  {
    id: "cycle-mood-log", category: "track", title: "Log cycle + mood",
    detail: "A daily check-in keeps your phase predictions sharp.",
    routeTo: "cycle-log", source: "companion",
    byTrack: {
      none:   daily("boolean", 1), low: daily("boolean", 1),
      medium: daily("boolean", 1), high: daily("boolean", 1),
    },
  },
  {
    id: "energy-sleep-log", category: "track", title: "Log energy + sleep",
    detail: "Track how rested you feel — luteal dips are normal.",
    routeTo: "placeholder", source: "companion",
    byTrack: {
      none:   daily("boolean", 1, undefined, 7), low: daily("boolean", 1, undefined, 7),
      medium: daily("boolean", 1), high: daily("boolean", 1),
    },
  },
  {
    id: "skin-hair-check", category: "track", title: "Skin + hair check",
    detail: "A weekly note on skin and hair.",
    routeTo: "placeholder", source: "companion",
    byTrack: {
      none:   daily("boolean", 1, undefined, 7), low: daily("boolean", 1, undefined, 7),
      medium: daily("boolean", 1, undefined, 7), high: daily("boolean", 1, undefined, 7),
    },
  },
  {
    id: "weight-waist", category: "track", title: "Weight + waist",
    detail: "Optional, and benefits accrue even without weight change.",
    routeTo: "placeholder", source: "careplan",
    byTrack: {
      low:    daily("boolean", 1, undefined, 30),
      medium: daily("boolean", 1, undefined, 14),
      high:   daily("boolean", 1, undefined, 14),
    },
  },
  {
    id: "stress-breathing", category: "mind", title: "Breathing / stress reset",
    detail: "A few slow minutes — helpful when stress runs high.",
    routeTo: "placeholder", source: "careplan", phaseEmphasis: ["luteal"],
    byTrack: {
      none:   daily("boolean", 1, undefined, 7), low: daily("boolean", 1, undefined, 7),
      medium: { target: { kind: "boolean", value: 1 }, everyDays: 3 },
      high:   daily("boolean", 1),
    },
  },
  {
    id: "mood-screen", category: "mind", title: "Mood check-in",
    detail: "A short mood screen, always reviewed by a person.",
    routeTo: "consult", source: "clinical",
    clinicalNote: "Positive screen → route to psychologist.",
    byTrack: {
      none:   daily("boolean", 1, undefined, 90),
      low:    daily("boolean", 1, undefined, 56),
      medium: daily("boolean", 1, undefined, 28),
      high:   daily("boolean", 1, undefined, 28),
    },
  },
  {
    id: "micro-learning", category: "learn", title: "Today's learning card",
    detail: "A 30-second card on living well with PMOS.",
    routeTo: "learn", source: "companion",
    byTrack: {
      none: daily("boolean", 1), low: daily("boolean", 1),
      medium: daily("boolean", 1), high: daily("boolean", 1),
    },
  },
  {
    id: "community", category: "connect", title: "Community prompt",
    detail: "See what women in your phase are sharing.",
    routeTo: "community", source: "companion",
    byTrack: {
      none:   daily("boolean", 1, undefined, 7), low: daily("boolean", 1, undefined, 7),
      medium: daily("boolean", 1, undefined, 7), high: daily("boolean", 1, undefined, 7),
    },
  },
  {
    id: "sleep", category: "sleep", title: "Wind down for sleep",
    detail: "Steady sleep + wake times calm insulin and cravings.",
    routeTo: "placeholder", source: "careplan",
    byTrack: {
      none:   daily("boolean", 1, undefined, 2), low: daily("boolean", 1, undefined, 2),
      medium: daily("boolean", 1), high: daily("boolean", 1),
    },
  },
  {
    id: "protein-breakfast", category: "nourish", title: "Protein-first breakfast",
    detail: "Protein + fibre blunts the morning sugar spike.",
    routeTo: "food-logger", source: "careplan", phaseEmphasis: ["menstrual", "luteal"],
    byTrack: {
      low:    daily("boolean", 1), medium: daily("boolean", 1), high: daily("boolean", 1),
    },
  },
  {
    id: "bbt", category: "track", title: "Log basal body temperature",
    detail: "BBT helps map your fertile window.",
    routeTo: "cycle-log", source: "careplan", clinicalNote: "TTC only.",
    byTrack: {
      low:    daily("boolean", 1), medium: daily("boolean", 1), high: daily("boolean", 1),
    },
  },
];
