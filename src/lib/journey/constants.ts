import type {
  CareTrack, CyclePhase, JourneyPhase, RouteTarget, Source, TaskCategory, TaskTarget,
} from "@/types/journey";

export const PMOS_LABEL = "PMOS";
export const PMOS_FULL = "Polyendocrine Metabolic Ovarian Syndrome";
/** Use on first mention in any surface. */
export const PMOS_LABEL_FIRST_MENTION = "PMOS";

/** Inclusive day bounds per journey phase. */
export const PHASE_BOUNDS: { phase: JourneyPhase; from: number; to: number }[] = [
  { phase: "entry",       from: 0,   to: 0 },
  { phase: "foundation",  from: 1,   to: 28 },
  { phase: "build",       from: 29,  to: 90 },
  { phase: "consolidate", from: 91,  to: 150 },
  { phase: "review",      from: 151, to: 182 },
];

export const TRACK_LABELS: Record<CareTrack, string> = {
  none:   "Engagement track",
  low:    "30-day self-guided track",
  medium: "Structured 6-month plan",
  high:   "Structured + supervised 6-month plan",
};

/** Care-Coordinator connect cadence (days between connects) by track. */
export const CC_CADENCE_DAYS: Record<CareTrack, number | null> = {
  none: null, low: 30, medium: 14, high: 14,
};

/** Scheduled clinical touchpoints (6-month arc = medium/high). `tracks` lists which
 *  tracks receive this touchpoint; retest variations are encoded per row. */
export const TOUCHPOINT_SCHEDULE: {
  day: number;
  kind: "baseline" | "consult" | "retest" | "review";
  services: string[];
  label: string;
  retest?: "partial" | "full";
  tracks: CareTrack[];
}[] = [
  { day: 0,   kind: "baseline", services: ["baseline"],                 label: "Baseline capture",                       tracks: ["low", "medium", "high"] },
  { day: 5,   kind: "consult",  services: ["doctor", "diet"],           label: "Doctor + diet consult",                  tracks: ["low", "medium", "high"] },
  { day: 5,   kind: "consult",  services: ["nutritionist"],             label: "Nutritionist intake",                    tracks: ["medium", "high"] },
  { day: 5,   kind: "consult",  services: ["psychologist"],             label: "Psychologist intake",                    tracks: ["high"] },
  { day: 30,  kind: "consult",  services: ["diet"],                     label: "Diet consult + review",                  tracks: ["low", "medium", "high"] },
  { day: 60,  kind: "consult",  services: ["diet"],                     label: "Diet consult",                           tracks: ["medium", "high"] },
  { day: 60,  kind: "consult",  services: ["dermatology"],              label: "Dermatology (acne / hirsutism)",         tracks: ["medium", "high"] },
  { day: 90,  kind: "retest",   services: ["doctor", "diet"],           label: "Doctor + diet + partial retest",         retest: "partial", tracks: ["low", "medium", "high"] },
  { day: 120, kind: "consult",  services: ["gynae", "diet"],            label: "Gynae + diet consult",                   tracks: ["medium", "high"] },
  { day: 120, kind: "consult",  services: ["hormone-panel"],            label: "Hormone panel (if indicated)",           tracks: ["high"] },
  { day: 150, kind: "consult",  services: ["diet"],                     label: "Diet consult",                           tracks: ["medium", "high"] },
  { day: 180, kind: "retest",   services: ["doctor", "gynae"],          label: "Doctor + gynae + full retest + outcomes", retest: "full", tracks: ["low", "medium", "high"] },
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
    detail: "Steps are a simple movement nudge, not a medical target — a 10-minute walk counts.",
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
    detail: "Moderate movement across the week — within the 150–300 min guideline range.",
    routeTo: "activity", source: "careplan", phaseEmphasis: ["follicular", "ovulatory"],
    byTrack: {
      none:   daily("duration_min", 150, "min/week", 7),
      low:    daily("duration_min", 150, "min/week", 7),
      medium: daily("duration_min", 195, "min/week", 7),
      high:   daily("duration_min", 230, "min/week", 7),
    },
  },
  {
    id: "strength", category: "move", title: "Strength session",
    detail: "Muscle-strengthening on non-consecutive days helps insulin sensitivity.",
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
    detail: "Logging builds awareness — we frame food as additions and swaps, never guilt.",
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
    detail: "Swap a refined carb for a low-GI option — millet for white rice, say.",
    routeTo: "scanner", source: "careplan", phaseEmphasis: ["luteal"],
    byTrack: {
      low:    daily("count", 1, "swap"),
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
      high:   daily("count", 8, "glasses"),
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
    detail: "A weekly note on skin and hair helps spot androgenic changes early.",
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
    detail: "A short PHQ-2 / GAD-2 style screen. A low score routes you to a psychologist, never an automated verdict.",
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
    detail: "A consistent wind-down and wake time steadies insulin and curbs cravings — a real PMOS lever.",
    routeTo: "placeholder", source: "careplan",
    byTrack: {
      none:   daily("boolean", 1, undefined, 2), low: daily("boolean", 1, undefined, 2),
      medium: daily("boolean", 1), high: daily("boolean", 1),
    },
  },
  {
    id: "protein-breakfast", category: "nourish", title: "Protein-first breakfast",
    detail: "Starting the day with protein + fibre blunts the morning blood-sugar spike.",
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
