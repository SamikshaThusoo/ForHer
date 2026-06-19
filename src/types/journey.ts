// Deterministic 6-month PMOS (PCOS) care-journey domain types.

export type JourneyPhase = "entry" | "foundation" | "build" | "consolidate" | "review";
export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

/** Risk outcome === care track. 'none' = engagement only; 'low' = 30-day self-guided;
 *  'medium'/'high' = 6-month supervised arc. */
export type RiskOutcome = "none" | "low" | "medium" | "high";
export type CareTrack = RiskOutcome;
/** Tiers that route into a care plan (excludes 'none'). */
export type RiskTier = Exclude<RiskOutcome, "none">;

export type TaskCategory = "move" | "nourish" | "track" | "mind" | "learn" | "connect" | "clinical";
export type Cadence = "daily" | "weekly" | "fortnightly" | "monthly" | "once" | "scheduled";
export type Source = "companion" | "careplan" | "clinical";

/** Where a task's one-tap action routes. Surfaces that exist today: food-logger,
 *  scanner, ask, consult. Surfaces not yet built route to 'placeholder'. */
export type RouteTarget =
  | "food-logger" | "scanner" | "ask" | "consult"
  | "cycle-log" | "activity" | "community" | "learn" | "placeholder";

export interface TaskTarget {
  kind: "steps" | "duration_min" | "count" | "boolean" | "sessions_week";
  value: number;
  unit?: string;
}

export interface JourneyTask {
  id: string;
  category: TaskCategory;
  title: string;
  detail: string;
  target: TaskTarget;
  cadence: Cadence;
  source: Source;
  phaseEmphasis?: CyclePhase[];
  track: CareTrack;
  routeTo: RouteTarget;
  clinicalNote?: string;
  /** Lower = higher priority for pickThreeThings. Assigned by the resolver. */
  priority: number;
}

export interface Touchpoint {
  day: number;
  kind: "baseline" | "consult" | "retest" | "cc-connect" | "review";
  /** Service codes, e.g. ["doctor","diet","psychologist"]. */
  services: string[];
  label: string;
  retest?: "partial" | "full";
}

export interface Specialist {
  role: "doctor" | "nutritionist" | "dermatologist" | "gynaecologist" | "psychologist" | "care-coordinator";
  label: string;
  /** Why this specialist is on the circle for this persona's tier/flags. */
  reason: string;
}

export interface MarkerSet {
  bmi?: number;
  hba1c?: number;        // %
  fbs?: number;          // mg/dL
  insulinFasting?: number; // µIU/mL
  tsh?: number;          // mIU/L
  lh?: number;           // IU/L
  fsh?: number;          // IU/L
  testosterone?: number; // ng/dL
  weightKg?: number;
  waistCm?: number;
  /** Derived; filled by getMarkerSnapshot. */
  homaIr?: number;
  lhFshRatio?: number;
}

export interface TransitionOption {
  key: "step-down" | "continue-structured" | "tulip-handoff";
  title: string;
  detail: string;
  recommended: boolean;
}

/** The 5-question screener already specced. */
export interface AssessmentAnswers {
  irregularPeriods: boolean;
  acneSkin: boolean;
  hairChanges: boolean;     // hirsutism
  weightDifficulty: boolean;
  familyHistory: boolean;   // diabetes / PCOS
}

export interface AhcMarkers {
  bmi?: number;
  hba1c?: number;
  tsh?: number;
}

/** Three-domain PMOS signal breakdown. */
export interface DomainSignals {
  androgenic: boolean;
  metabolic: boolean;
  polyendocrine: boolean;
  /** Count of positive domains (0–3). */
  positiveCount: number;
  /** 'low' when the metabolic picture is self-report only (cold start / no labs). */
  confidence: "high" | "low";
}

/** Consult-outcome flags, set deterministically per persona seed — never by the engine. */
export interface PrescribedFlags {
  supplement?: { name: string; fromDay: number };
  medication?: { name: string; fromDay: number };
}

export interface PmosProfile {
  /** Women's-health eligibility. false → State D (cards never become eligible). */
  eligible: boolean;
  entryState: "A" | "B" | "C" | "D";
  hasAhc: boolean;
  /** TTC intent toggle — surfaces the Tulip branch from Week 4. */
  ttc: boolean;
  /** ISO calendar date that maps to dayIndex 0. */
  enrollmentDay: string;
  assessment: AssessmentAnswers;
  ahcMarkers?: AhcMarkers;
  /** Recent period-start dates (ISO, ascending) → drives learnedCycleLength. */
  cycleHistory: string[];
  /** Marker anchors the engine interpolates between. */
  markers: { day0: MarkerSet; day90: MarkerSet; day180: MarkerSet };
  prescribed?: PrescribedFlags;
}
