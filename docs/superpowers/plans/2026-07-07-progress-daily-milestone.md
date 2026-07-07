# Progress → Daily + Milestone Views — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `/progress` into two tabbed views — **Daily** (today's behavioural recap; no body/lab markers) and **Milestone** (the 30/60/90 checkpoints with clinical markers, appointments, activity, and logs).

**Architecture:** Pure read-only helpers in `src/lib/forher/progressview.ts` (next appointment, per-phase activity, calendar→plan-day mapping, per-phase logs, per-checkpoint marker cadence). `/progress/page.tsx` becomes a thin tab shell rendering two new components, `DailyView` and `MilestoneView`, which read existing stores. No marker/cycle/plan math is changed — only read.

**Tech Stack:** Next.js 14 App Router, TypeScript, CSS Modules, Framer Motion, Lucide, Vitest.

## Global Constraints

- **No new dependencies.** Framer + Lucide only.
- **Extend existing shapes/keys; don't break stored data.** All reads are of existing keys.
- **Don't change cycle, marker, projection, or plan-phase math** — read `getMarkerSnapshot`, `PHASE_BOUNDS`, `getPlanTouchpoints`, `cycleview` only.
- **Daily has NO body or lab markers** (they don't move day to day). Markers live only in Milestone checkpoints.
- **Marker cadence (confirmed):** Weight/Waist/BMI at 30/60/90; HOMA-IR at 60/90; HbA1c at 90 only.
- **Projected vs measured (confirmed):** Day 30/60 lab markers = "projected"; self-logged (weight/waist/BMI) = "current"; Day 90 = "measured". Never let a completed daily task appear to move a lab marker.
- **Cold start:** streak/tasks/active-days = 0 framed as a starting line ("Day 1 — your streak starts today"), never a failure.
- **Checkpoints gate on the plan day** (`fh.day`, the `/plan` scrubber value) exactly like the current milestone banner: a checkpoint at day 30/60/90 is "reached" when `fh.day >= 30/60/90`.
- **Calendar→plan-day:** `enrollmentDay` (all personas `2026-01-01`) = plan day 1; a logged calendar date maps to plan day `daysBetween(enrollmentDay, iso) + 1`.
- **Quality floor:** `prefers-reduced-motion`; tabs/controls tap+keyboard operable with visible `:focus-visible`; ~420px.
- **Tokens:** reuse `progress.module.css` stat/marker/milestone styles; plum `#5B2A4A`/`#8E5378`/`#3E1B33`.
- **Commits:** `--no-verify`, trailers `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` / `Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc`.
- **Validate:** `npx vitest run` (helpers, TDD) + `npm run build` (tsc). User verifies UI on Vercel.

## File Structure

- `src/lib/forher/progressview.ts` (new) — `nextVisit`, `phaseActivity`, `planDayForDate`, `logsInPhase`, `checkpointMarkers` + `CheckpointMarker` type. Pure.
- `src/lib/forher/progressview.test.ts` (new) — TDD.
- `src/app/progress/page.tsx` (rewrite) — hydration guard + companion empty state (preserve existing) + hero + **Daily/Milestone tabs** → renders `DailyView` / `MilestoneView`.
- `src/components/forher/Progress/DailyView.tsx` (new) — today's recap, detail, cycle phase, care-plan, next appointment.
- `src/components/forher/Progress/MilestoneView.tsx` (new) — three checkpoints, gated on `fh.day`.
- `src/app/progress/progress.module.css` (extend) — tabs + new row/checkpoint classes (reuse existing stat/marker classes).

---

## Task 1: Pure progress-view helpers (`progressview.ts`)

**Files:**
- Create: `src/lib/forher/progressview.ts`
- Test: `src/lib/forher/progressview.test.ts`

**Interfaces:**
- Consumes: `getMarkerSnapshot`, `type PlanVisit` (`@/lib/journey`), `MarkerSet` (`@/types/journey`), `periodDaysSet`, `type DayLog` (`./daylog`), `Persona`.
- Produces:
  - `nextVisit(visits: PlanVisit[], day: number): PlanVisit | null`
  - `phaseActivity(done: Record<number, string[]>, from: number, to: number): { tasks: number; activeDays: number }`
  - `planDayForDate(enrollmentISO: string, iso: string): number`
  - `logsInPhase(dayLog: DayLog, enrollmentISO: string, from: number, to: number): { periods: number; symptomDays: number }`
  - `type CheckpointMarker = { key: keyof MarkerSet; label: string; unit: string; decimals: number; kind: "self" | "lab"; value: number; state: "current" | "projected" | "measured" }`
  - `checkpointMarkers(persona: Persona, checkpointDay: number): CheckpointMarker[]`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/forher/progressview.test.ts
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
      "2026-01-05": { period: true },              // plan day 5 (Foundation) — a start
      "2026-01-06": { period: true },              // plan day 6 — continuation, not a new start
      "2026-01-10": { symptoms: ["acne"] },        // plan day 10 (Foundation)
      "2026-02-15": { period: true, symptoms: ["cramps"] }, // plan day 46 (Build)
    };
    expect(logsInPhase(dayLog, "2026-01-01", 1, 30)).toEqual({ periods: 1, symptomDays: 1 });
    expect(logsInPhase(dayLog, "2026-01-01", 31, 60)).toEqual({ periods: 1, symptomDays: 1 });
  });
});

// Persona with three marker anchors so getMarkerSnapshot can interpolate + derive homaIr.
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/forher/progressview.test.ts`
Expected: FAIL — "Failed to resolve import './progressview'".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/forher/progressview.ts
// Pure read-only helpers for the Daily + Milestone progress views. No marker/cycle/plan
// math is changed here — snapshots and ranges are only read + bucketed.
import type { Persona } from "@/types/persona";
import type { MarkerSet } from "@/types/journey";
import { getMarkerSnapshot, type PlanVisit } from "@/lib/journey";
import { periodDaysSet, type DayLog } from "./daylog";

const DAY_MS = 86400000;

/** The next scheduled appointment on or after the current plan day (visits are sorted). */
export function nextVisit(visits: PlanVisit[], day: number): PlanVisit | null {
  return visits.find((v) => v.day >= day) ?? null;
}

/** Tasks completed + days with ≥1 task, within an inclusive plan-day range. */
export function phaseActivity(done: Record<number, string[]>, from: number, to: number): { tasks: number; activeDays: number } {
  let tasks = 0;
  let activeDays = 0;
  for (let d = from; d <= to; d++) {
    const n = (done[d] ?? []).length;
    tasks += n;
    if (n > 0) activeDays++;
  }
  return { tasks, activeDays };
}

/** Calendar date → 1-based plan day (enrollmentDay = day 1). */
export function planDayForDate(enrollmentISO: string, iso: string): number {
  const diff = Math.round(
    (new Date(`${iso}T00:00:00`).getTime() - new Date(`${enrollmentISO}T00:00:00`).getTime()) / DAY_MS,
  );
  return diff + 1;
}

/** Period-starts + symptom-days whose mapped plan day falls in [from,to]. */
export function logsInPhase(
  dayLog: DayLog,
  enrollmentISO: string,
  from: number,
  to: number,
): { periods: number; symptomDays: number } {
  const inPhase = (iso: string) => {
    const pd = planDayForDate(enrollmentISO, iso);
    return pd >= from && pd <= to;
  };
  const periodDays = periodDaysSet(dayLog);
  let periods = 0;
  for (const iso of periodDays) {
    if (!inPhase(iso)) continue;
    const prev = new Date(new Date(`${iso}T00:00:00`).getTime() - DAY_MS).toISOString().slice(0, 10);
    if (!periodDays.has(prev)) periods++; // a start = first day of a run
  }
  let symptomDays = 0;
  for (const [iso, entry] of Object.entries(dayLog)) {
    if ((entry.symptoms?.length ?? 0) > 0 && inPhase(iso)) symptomDays++;
  }
  return { periods, symptomDays };
}

export type CheckpointMarker = {
  key: keyof MarkerSet;
  label: string;
  unit: string;
  decimals: number;
  kind: "self" | "lab";
  value: number;
  state: "current" | "projected" | "measured";
};

// Which markers appear at which checkpoint (confirmed cadence).
const MARKER_CADENCE: { key: keyof MarkerSet; label: string; unit: string; decimals: number; kind: "self" | "lab"; days: number[] }[] = [
  { key: "weightKg", label: "Weight", unit: "kg", decimals: 0, kind: "self", days: [30, 60, 90] },
  { key: "waistCm", label: "Waist", unit: "cm", decimals: 0, kind: "self", days: [30, 60, 90] },
  { key: "bmi", label: "BMI", unit: "", decimals: 1, kind: "self", days: [30, 60, 90] },
  { key: "homaIr", label: "HOMA-IR", unit: "", decimals: 1, kind: "lab", days: [60, 90] },
  { key: "hba1c", label: "HbA1c", unit: "%", decimals: 1, kind: "lab", days: [90] },
];

/** Markers to show at a checkpoint, each with its projected/current/measured label. */
export function checkpointMarkers(persona: Persona, checkpointDay: number): CheckpointMarker[] {
  const snap = getMarkerSnapshot(persona, checkpointDay);
  return MARKER_CADENCE.filter((m) => m.days.includes(checkpointDay) && snap[m.key] != null).map((m) => ({
    key: m.key,
    label: m.label,
    unit: m.unit,
    decimals: m.decimals,
    kind: m.kind,
    value: snap[m.key] as number,
    state: checkpointDay === 90 ? "measured" : m.kind === "lab" ? "projected" : "current",
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/forher/progressview.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add src/lib/forher/progressview.ts src/lib/forher/progressview.test.ts
git commit --no-verify -m "feat(progress): pure helpers for daily + milestone views

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc"
```

---

## Task 2: Tab shell + Daily view

**Files:**
- Modify: `src/app/progress/page.tsx` (rewrite the render into a tab shell; keep the hydration guard + companion empty state + hero verbatim from the current file)
- Create: `src/components/forher/Progress/DailyView.tsx`
- Modify: `src/app/progress/progress.module.css` (append tab + daily classes)

**Interfaces:**
- Consumes: `useForHer` (`@/lib/forher/state`), `personaTrack` + `resolveTasksForDay` + `getPlanTouchpoints` + `PHASE_BOUNDS` (`@/lib/journey`), `cycleLengthFor`/`cycleDayFromLog`/`phaseForCycleDay`/`PHASE_LABEL` (`@/lib/forher/cycleview`), `readDayLog` (`@/lib/forher/daylog`), `nextVisit` (`@/lib/forher/progressview`), `usePersona`.
- Produces: `DailyView` component (no props; reads persona from context). `ProgressPage` renders tabs → `DailyView` / `MilestoneView`.

UI task — verify via `npm run build` + manual.

- [ ] **Step 1: Add the tab shell to `page.tsx`**

Read the current `src/app/progress/page.tsx` and preserve: the `!fh.hydrated` guard, the `track === "none"` empty state, and the `<header>`/hero. Replace everything below the hero with the tab bar + view switch:

```tsx
// state (top of component)
const [tab, setTab] = useState<"daily" | "milestone">("daily");

// …after the hero, inside <main>…
<div className={styles.tabs} role="tablist" aria-label="Progress views">
  <button role="tab" type="button" aria-selected={tab === "daily"}
    className={`${styles.tab} ${tab === "daily" ? styles.tabOn : ""}`} onClick={() => setTab("daily")}>
    Daily
  </button>
  <button role="tab" type="button" aria-selected={tab === "milestone"}
    className={`${styles.tab} ${tab === "milestone" ? styles.tabOn : ""}`} onClick={() => setTab("milestone")}>
    Milestone
  </button>
</div>
{tab === "daily" ? <DailyView /> : <MilestoneView />}
```

Add imports: `import { useState } from "react";`, `import { DailyView } from "@/components/forher/Progress/DailyView";`, `import { MilestoneView } from "@/components/forher/Progress/MilestoneView";`. Remove the now-unused `METRICS`, `milestone()`, `getMarkerSnapshot`, marker-row and Day-90 blocks from `page.tsx` (they move into `MilestoneView`).

- [ ] **Step 2: Implement `DailyView`**

```tsx
// src/components/forher/Progress/DailyView.tsx
"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { resolveTasksForDay, getPlanTouchpoints, getPhase } from "@/lib/journey";
import { cycleLengthFor, cycleDayFromLog, phaseForCycleDay, PHASE_LABEL } from "@/lib/forher/cycleview";
import { readDayLog } from "@/lib/forher/daylog";
import { nextVisit } from "@/lib/forher/progressview";
import { Flame, CheckCircle2, CalendarHeart, Stethoscope, Moon, Sparkles } from "lucide-react";
import styles from "@/app/progress/progress.module.css";

const PHASE_NAME: Record<string, string> = { foundation: "Foundation", build: "Build", milestone: "Milestone" };
const todayISO = () => new Date().toISOString().slice(0, 10);
function todayMood(): string[] | null {
  try {
    const arr = JSON.parse(localStorage.getItem("forher.moodlog.v1") || "[]");
    const e = Array.isArray(arr) ? [...arr].reverse().find((x: { day?: string }) => x.day === todayISO()) : null;
    return e ? (e.feelings ?? []) : null;
  } catch { return null; }
}

export function DailyView() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  if (!fh.hydrated) return null;

  const day = fh.day;
  const allTasks = resolveTasksForDay(persona, day);
  const doneToday = fh.done[day] ?? [];
  const tasksTotal = allTasks.length;
  const tasksDone = doneToday.length;
  const daysActive = Object.values(fh.done).filter((a) => a.length > 0).length;
  const isStart = fh.streak === 0 && tasksDone === 0 && daysActive === 0;

  const dayLog = readDayLog(persona.id);
  const mood = todayMood();
  const symptomsToday = dayLog[todayISO()]?.symptoms ?? [];

  const lp = fh.cycleLog?.lastPeriod;
  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  const cycleDay = lp ? cycleDayFromLog(lp, L, new Date()) : null;
  const cyclePhase = lp ? phaseForCycleDay(cycleDay!, L, fh.cycleLog?.duration ?? 5) : null;

  const upcoming = nextVisit(getPlanTouchpoints(persona), day);
  const inDays = upcoming ? upcoming.day - day : null;

  return (
    <div className={styles.daily}>
      {/* Today's recap — the 3 stats (reuse existing stat styling) */}
      <div className={styles.stats}>
        <div className={styles.stat}><Flame size={18} /><span className={styles.statNum}>{fh.streak}</span><span className={styles.statLabel}>day streak</span></div>
        <div className={styles.stat}><CheckCircle2 size={18} /><span className={styles.statNum}>{tasksDone}/{tasksTotal}</span><span className={styles.statLabel}>today</span></div>
        <div className={styles.stat}><Sparkles size={18} /><span className={styles.statNum}>{daysActive}</span><span className={styles.statLabel}>active days</span></div>
      </div>
      {isStart && <p className={styles.startLine}>Day 1 — your streak starts today. One task counts.</p>}

      {/* Detail of what was done today */}
      <div className={styles.dCard}>
        <span className={styles.dLabel}>Today</span>
        {tasksDone > 0 ? (
          <ul className={styles.dList}>
            {allTasks.filter((t) => doneToday.includes(t.id)).map((t) => (
              <li key={t.id} className={styles.dDone}><CheckCircle2 size={14} /> {t.title}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.dMuted}>No tasks ticked yet — <Link href="/">pick one</Link>.</p>
        )}
        <p className={styles.dRow}><Moon size={14} /> {mood ? (mood.length ? `Mood: ${mood.slice(0, 3).join(", ").toLowerCase()}` : "Mood logged") : "Mood not logged"}</p>
        <p className={styles.dRow}><CalendarHeart size={14} /> {symptomsToday.length ? `Symptoms: ${symptomsToday.length} logged` : "No symptoms logged today"}</p>
      </div>

      {/* Cycle phase + care plan */}
      <div className={styles.dCard}>
        <p className={styles.dRow}><CalendarHeart size={14} /> {cyclePhase ? `Day ${cycleDay} · ${PHASE_LABEL[cyclePhase]}` : "Cycle not set up"}</p>
        <p className={styles.dRow}><Sparkles size={14} /> Day {day} of 90 · {PHASE_NAME[getPhase(day)]}</p>
      </div>

      {/* Upcoming appointment */}
      <div className={styles.dCard}>
        <span className={styles.dLabel}>Upcoming</span>
        {upcoming ? (
          <p className={styles.dRow}><Stethoscope size={14} /> {upcoming.label} · {inDays === 0 ? "today" : `in ${inDays} day${inDays === 1 ? "" : "s"}`}</p>
        ) : (
          <p className={styles.dMuted}>No appointments left in your plan.</p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Append the Daily + tab CSS to `progress.module.css`**

Add: `.tabs` (flex segmented control, plum), `.tab`/`.tabOn` (pill buttons, `:focus-visible` outline `#8E5378`), `.daily` (column gap), `.startLine` (muted starting-line copy), `.dCard` (white card, radius 16, subtle shadow — match existing cards), `.dLabel` (uppercase eyebrow `#8E5378`), `.dList`/`.dDone` (checked task rows), `.dRow` (icon + text row), `.dMuted` (muted). Reuse the existing `.stats`/`.stat`/`.statNum`/`.statLabel` classes already in the file. No animation beyond existing; nothing that needs a reduced-motion block.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: "✓ Compiled successfully"; `/progress` present.

- [ ] **Step 5: Commit**

```bash
git add src/app/progress/ src/components/forher/Progress/DailyView.tsx
git commit --no-verify -m "feat(progress): Daily tab — today's recap, cycle, care plan, next appointment

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc"
```

---

## Task 3: Milestone view

**Files:**
- Create: `src/components/forher/Progress/MilestoneView.tsx`
- Modify: `src/app/progress/progress.module.css` (append checkpoint classes)

**Interfaces:**
- Consumes: `useForHer`, `usePersona`, `getPlanTouchpoints` + `PHASE_BOUNDS` (`@/lib/journey`), `readDayLog` (`@/lib/forher/daylog`), `readHealthProfile`/`bmiFrom` (`@/lib/forher/healthprofile`), `phaseActivity`/`logsInPhase`/`checkpointMarkers` (`@/lib/forher/progressview`).

UI task — verify via `npm run build` + manual.

- [ ] **Step 1: Implement `MilestoneView`**

```tsx
// src/components/forher/Progress/MilestoneView.tsx
"use client";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { getPlanTouchpoints, PHASE_BOUNDS } from "@/lib/journey";
import { readDayLog } from "@/lib/forher/daylog";
import { readHealthProfile, bmiFrom } from "@/lib/forher/healthprofile";
import { phaseActivity, logsInPhase, checkpointMarkers } from "@/lib/forher/progressview";
import { Trophy, Lock, CheckCircle2, FlaskConical, Stethoscope, Droplet, ClipboardEdit } from "lucide-react";
import styles from "@/app/progress/progress.module.css";

const CHECKPOINTS = [
  { day: 30, phase: PHASE_BOUNDS[0], title: "Foundation" },
  { day: 60, phase: PHASE_BOUNDS[1], title: "Build" },
  { day: 90, phase: PHASE_BOUNDS[2], title: "Final · Day 90" },
];
const STATE_LABEL: Record<string, string> = { current: "current", projected: "projected", measured: "measured" };

export function MilestoneView() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  if (!fh.hydrated) return null;

  const enrollment = persona.pmos?.enrollmentDay ?? "2026-01-01";
  const visits = getPlanTouchpoints(persona);
  const dayLog = readDayLog(persona.id);
  const bmi = bmiFrom(readHealthProfile(persona.id));

  return (
    <div className={styles.milestones}>
      {CHECKPOINTS.map((cp) => {
        const reached = fh.day >= cp.day;
        const { from, to } = cp.phase;
        const appts = visits.filter((v) => v.day >= from && v.day <= to);
        const act = phaseActivity(fh.done, from, to);
        const logs = logsInPhase(dayLog, enrollment, from, to);
        const markers = checkpointMarkers(persona, cp.day);
        return (
          <section key={cp.day} className={`${styles.cp} ${reached ? "" : styles.cpLocked}`}>
            <div className={styles.cpHead}>
              <span className={styles.cpIcon}>{reached ? <Trophy size={16} /> : <Lock size={15} />}</span>
              <div>
                <strong className={styles.cpTitle}>{cp.title}</strong>
                <span className={styles.cpSub}>Day {from}–{to}{reached ? "" : " · locked"}</span>
              </div>
            </div>

            {reached ? (
              <>
                {/* Appointments in this phase */}
                <div className={styles.cpBlock}>
                  <span className={styles.cpLabel}>Appointments</span>
                  {appts.length ? appts.map((a) => (
                    <p key={`${a.day}-${a.service}`} className={styles.cpRow}>
                      {a.kind === "test" ? <FlaskConical size={13} /> : <Stethoscope size={13} />} Day {a.day} · {a.label}
                    </p>
                  )) : <p className={styles.cpMuted}>None scheduled.</p>}
                </div>

                {/* Clinical markers (cadence-gated, projected/current/measured) */}
                {markers.length > 0 && (
                  <div className={styles.cpBlock}>
                    <span className={styles.cpLabel}>Clinical markers</span>
                    {markers.map((m) => (
                      <p key={m.key} className={styles.cpRow}>
                        {m.label}: <strong>{m.value.toFixed(m.decimals)}{m.unit}</strong>
                        <span className={styles.cpState}>{STATE_LABEL[m.state]}</span>
                      </p>
                    ))}
                  </div>
                )}

                {/* Activity + logs */}
                <div className={styles.cpBlock}>
                  <span className={styles.cpLabel}>This phase</span>
                  <p className={styles.cpRow}><CheckCircle2 size={13} /> {act.tasks} tasks · {act.activeDays} active days</p>
                  <p className={styles.cpRow}><Droplet size={13} /> {logs.periods} period{logs.periods === 1 ? "" : "s"} · {logs.symptomDays} symptom-day{logs.symptomDays === 1 ? "" : "s"} logged</p>
                  <p className={styles.cpRow}><ClipboardEdit size={13} /> Health profile: {bmi ? `BMI ${bmi}` : "not updated"}</p>
                </div>

                {/* Day 90 extras */}
                {cp.day === 90 && (
                  <div className={styles.cpBlock}>
                    <span className={styles.cpLabel}>Day-90 re-test</span>
                    <p className={styles.cpRow}><FlaskConical size={13} /> Full panel — HbA1c, HOMA-IR, lipids, hormones</p>
                  </div>
                )}
              </>
            ) : (
              <p className={styles.cpPreview}>Reached at Day {cp.day}. Your markers, appointments and activity for this phase appear here.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Append the checkpoint CSS to `progress.module.css`**

Add: `.milestones` (column gap), `.cp` (card, radius 18, plum-soft border/shadow), `.cpLocked` (reduced opacity ~0.6, muted), `.cpHead`/`.cpIcon`/`.cpTitle`/`.cpSub`, `.cpBlock` (divider + gap), `.cpLabel` (uppercase eyebrow `#8E5378`), `.cpRow` (icon+text row), `.cpState` (small pill: `current`/`projected` muted, `measured` green `#4F9D69`), `.cpMuted`, `.cpPreview` (locked preview text). Reuse existing marker-bar tokens if a bar treatment is wanted; a labelled value row is sufficient here.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: "✓ Compiled successfully".

- [ ] **Step 4: Commit**

```bash
git add src/components/forher/Progress/MilestoneView.tsx src/app/progress/progress.module.css
git commit --no-verify -m "feat(progress): Milestone tab — 30/60/90 checkpoints, gated on plan day

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc"
```

---

## Final verification (after all tasks)

- [ ] `npx vitest run` — all suites pass (existing + new progressview).
- [ ] `npm run build` — clean compile.
- [ ] Manual (Vercel):
  - Daily is the default; shows recap + today's tasks + mood + symptoms + cycle phase + care-plan + next appointment; **no BMI/markers**.
  - Day 1 reads as a starting line, not a failure.
  - Milestone shows the three checkpoints; reached (fh.day ≥ 30/60/90) expanded, upcoming locked.
  - Markers cadence correct (weight/waist/BMI everywhere; HOMA-IR 60/90; HbA1c 90) and labelled current/projected/measured.
  - Companion (`none`) still shows the empty state; previously stored data loads.
  - Reduced motion + 420px width OK.

## Out of scope (per spec)

- Cycle/marker/projection/plan-phase math (read only). Visual redesign. Per-phase *streak* (kept as a Daily concept; phase activity shows tasks + active days).
