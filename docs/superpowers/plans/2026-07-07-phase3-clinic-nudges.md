# Phase 3 — Clinic Nudges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route non-care-plan users (companion `none` + `low`) into the clinic via one dismissible, non-diagnostic nudge banner driven by four detectors (missed-period, irregular cycles, concerning symptoms, and an always-available wellness card).

**Architecture:** All detection is pure and lives in `src/lib/forher/nudge.ts` (`activeNudge` returns the top-priority non-dismissed nudge, `today` injected for determinism). A `ClinicNudge` banner renders it. `ForHerPromo` computes the nudge for `none`/`low`, renders the banner above the hub, and — a behavior change — restricts the existing Clinic entry strip to `medium`/`high`.

**Tech Stack:** Next.js 14 App Router, TypeScript, CSS Modules, Framer Motion, Lucide, Vitest.

## Global Constraints

- **No new dependencies.** Framer + Lucide only. New key `forher.<id>.nudgeDismissed` is `forher.*`-prefixed (cleared by `resetForHer`).
- **Non-diagnostic.** Never assert PMOS/PCOS; always route to a clinician; disclaimer lives on the clinic side.
- **Non-naggy.** Dismissible; dismissal persists (permanent-until-`resetForHer` in the prototype).
- **Don't change cycle/risk/phase math.** Detection reads existing data + reuses `shouldResurfaceAssessment`; never recomputes.
- **Tokens/patterns:** plum `#5B2A4A`/`#8E5378`/`#3E1B33`, warm-sand clinical `linear-gradient(135deg,#FBEFE6,#FCF6EE)` accent `#B5532F`; `:focus-visible` 2px `#8E5378`; `prefers-reduced-motion` (fade only); ~420px.
- **Eligibility:** nudges for `none` (all four) and `low` (missed-period, irregular, symptom — no wellness). `medium`/`high` → no nudge (they keep the standing strip).
- **Commits:** `--no-verify`, trailers:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc`
- **Validate:** `npx vitest run` (detection, TDD) + `npm run build` (tsc). User verifies UI on Vercel.

## File Structure

- `src/lib/forher/nudge.ts` (new) — `NudgeType`, `Nudge`, `activeNudge`, the four detectors, `readDismissed`, `dismissNudge`.
- `src/lib/forher/nudge.test.ts` (new) — TDD for detection + priority + dismissal + tier gate.
- `src/components/forher/ClinicNudge/ClinicNudge.tsx` + `.module.css` (new) — the banner.
- `src/components/forher/ForHerPromo/ForHerPromo.tsx` (modify) — compute + render the nudge; gate the strip to `medium`/`high`.

---

## Task 1: Nudge detection + dismissal storage (`nudge.ts`)

**Files:**
- Create: `src/lib/forher/nudge.ts`
- Test: `src/lib/forher/nudge.test.ts`

**Interfaces:**
- Consumes: `Persona`, `CareTrack`, `shouldResurfaceAssessment` (`@/lib/journey`), `periodDaysSet` + `DayLog` (`./daylog`), `CycleLog` (`./state`).
- Produces:
  - `type NudgeType = "missed-period" | "irregular" | "symptom" | "wellness"`
  - `type Nudge = { type: NudgeType; title: string; body: string; cta: string; href: string }`
  - `activeNudge(args: { tier: CareTrack; persona: Persona; cycleLog: CycleLog | null; dayLog: DayLog; cycleLength: number; today: Date; dismissed: Set<NudgeType> }): Nudge | null`
  - `readDismissed(id: string): Set<NudgeType>`, `dismissNudge(id: string, type: NudgeType): void`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/forher/nudge.test.ts
import { describe, it, expect } from "vitest";
import { activeNudge, type NudgeType } from "./nudge";
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
  cycleLength: 28, today: new Date("2026-05-01T00:00:00"), dismissed: new Set<NudgeType>(),
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
  it("fires the clinical copy for a tracking user past 2 cycles", () => {
    const n = activeNudge({ ...base, tier: "none", cycleLog: missed });
    expect(n?.type).toBe("missed-period");
    expect(n?.body).toMatch(/doctor/i);
  });
  it("fires the TTC copy when intent is ttc", () => {
    const n = activeNudge({ ...base, tier: "none", cycleLog: { intent: "ttc", lastPeriod: "2026-01-01" } });
    expect(n?.type).toBe("missed-period");
    expect(n?.body).toMatch(/test|chat/i);
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
  it("fires for an irregular history when nothing higher fires", () => {
    const n = activeNudge({ ...base, tier: "none", persona: IRREGULAR });
    expect(n?.type).toBe("irregular");
  });
  it("does not fire for a regular history", () => {
    const n = activeNudge({ ...base, tier: "low", persona: REGULAR });
    expect(n).toBeNull();
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
  it("a dismissed nudge is skipped for the next one", () => {
    const n = activeNudge({ ...base, tier: "none", persona: IRREGULAR, cycleLog: missed, dismissed: new Set(["missed-period"]) });
    expect(n?.type).toBe("irregular");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/forher/nudge.test.ts`
Expected: FAIL — "Failed to resolve import './nudge'".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/forher/nudge.ts
// Phase 3 clinic nudges: pure detection + persisted dismissal. `activeNudge` returns
// the highest-priority nudge that fires and isn't dismissed, or null. `today` is
// injected so detection is deterministic in tests.
import type { Persona } from "@/types/persona";
import type { CareTrack } from "@/types/journey";
import { shouldResurfaceAssessment } from "@/lib/journey";
import { periodDaysSet, type DayLog } from "./daylog";
import type { CycleLog } from "./state";

export type NudgeType = "missed-period" | "irregular" | "symptom" | "wellness";
export type Nudge = { type: NudgeType; title: string; body: string; cta: string; href: string };

const HREF = "/clinic";
const CTA = "Book a check-in";
const DAY_MS = 86400000;

const CONCERNING = ["acne", "hair_loss", "pelvic_pain", "bladder_incontinence"];
const SYMPTOM_LABEL: Record<string, string> = {
  acne: "acne", hair_loss: "hair loss", pelvic_pain: "pelvic pain", bladder_incontinence: "bladder issues",
};

function latestPeriodISO(cycleLog: CycleLog, dayLog: DayLog): string | null {
  const days = [...periodDaysSet(dayLog)];
  if (cycleLog.lastPeriod) days.push(cycleLog.lastPeriod);
  if (!days.length) return null;
  days.sort(); // YYYY-MM-DD sorts lexicographically = chronologically
  return days[days.length - 1];
}

function missedPeriodNudge(cycleLog: CycleLog | null, dayLog: DayLog, cycleLength: number, today: Date): Nudge | null {
  if (!cycleLog || cycleLog.intent === "pregnant") return null;
  const lastISO = latestPeriodISO(cycleLog, dayLog);
  if (!lastISO) return null;
  const daysSince = Math.floor((today.getTime() - new Date(`${lastISO}T00:00:00`).getTime()) / DAY_MS);
  if (daysSince <= 2 * cycleLength) return null;
  return cycleLog.intent === "ttc"
    ? { type: "missed-period", title: "Your period's late", body: "This could be worth a test or a quick chat — book a check-in.", cta: CTA, href: HREF }
    : { type: "missed-period", title: "A missed period is worth a look", body: "Worth checking with a doctor — thyroid, hormones, and ruling a few things out.", cta: CTA, href: HREF };
}

function irregularNudge(persona: Persona): Nudge | null {
  if (!shouldResurfaceAssessment(persona, 0)) return null;
  return { type: "irregular", title: "Your cycles have been irregular", body: "A check-in could help rule a few things out.", cta: CTA, href: HREF };
}

function symptomNudge(dayLog: DayLog): Nudge | null {
  const counts: Record<string, number> = {};
  let days = 0;
  for (const entry of Object.values(dayLog)) {
    const hit = (entry.symptoms ?? []).filter((s) => CONCERNING.includes(s));
    if (hit.length) {
      days++;
      for (const s of hit) counts[s] = (counts[s] ?? 0) + 1;
    }
  }
  if (days < 3) return null;
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  return { type: "symptom", title: "Some symptoms worth a check", body: `You've logged ${SYMPTOM_LABEL[top]} a few times — a check-in could help get ahead of it.`, cta: CTA, href: HREF };
}

function wellnessNudge(): Nudge {
  return { type: "wellness", title: "Here whenever you need", body: "A question about your hormonal health? A wellness check-in is here whenever you want one.", cta: CTA, href: HREF };
}

export function activeNudge(args: {
  tier: CareTrack;
  persona: Persona;
  cycleLog: CycleLog | null;
  dayLog: DayLog;
  cycleLength: number;
  today: Date;
  dismissed: Set<NudgeType>;
}): Nudge | null {
  const { tier, persona, cycleLog, dayLog, cycleLength, today, dismissed } = args;
  if (tier === "medium" || tier === "high") return null;
  const candidates: (Nudge | null)[] = [
    missedPeriodNudge(cycleLog, dayLog, cycleLength, today),
    irregularNudge(persona),
    symptomNudge(dayLog),
    tier === "none" ? wellnessNudge() : null,
  ];
  for (const n of candidates) if (n && !dismissed.has(n.type)) return n;
  return null;
}

const key = (id: string) => `forher.${id}.nudgeDismissed`;

export function readDismissed(id: string): Set<NudgeType> {
  try {
    const raw = JSON.parse(localStorage.getItem(key(id)) ?? "null");
    return new Set(Array.isArray(raw) ? (raw as NudgeType[]) : []);
  } catch {
    return new Set();
  }
}
export function dismissNudge(id: string, type: NudgeType) {
  try {
    const next = readDismissed(id);
    next.add(type);
    localStorage.setItem(key(id), JSON.stringify([...next]));
  } catch {
    /* ignore */
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/forher/nudge.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/forher/nudge.ts src/lib/forher/nudge.test.ts
git commit --no-verify -m "feat(clinic): Phase 3 nudge detection + dismissal (pure, TDD)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc"
```

---

## Task 2: `ClinicNudge` banner

**Files:**
- Create: `src/components/forher/ClinicNudge/ClinicNudge.tsx`
- Create: `src/components/forher/ClinicNudge/ClinicNudge.module.css`

**Interfaces:**
- Consumes: `Nudge` (`@/lib/forher/nudge`).
- Produces: `ClinicNudge` — props `{ nudge: Nudge; onDismiss: () => void }`.

UI task — verify via `npm run build` + manual.

- [ ] **Step 1: Implement the component**

```tsx
// src/components/forher/ClinicNudge/ClinicNudge.tsx
"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { X, HeartPulse } from "lucide-react";
import type { Nudge } from "@/lib/forher/nudge";
import styles from "./ClinicNudge.module.css";

/** Dismissible, non-diagnostic nudge into the clinic. One shows at a time. */
export function ClinicNudge({ nudge, onDismiss }: { nudge: Nudge; onDismiss: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={styles.nudge}
      role="region"
      aria-label="Clinic suggestion"
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.25 }}
    >
      <span className={styles.icon}>
        <HeartPulse size={18} />
      </span>
      <div className={styles.body}>
        <strong className={styles.title}>{nudge.title}</strong>
        <p className={styles.text}>{nudge.body}</p>
        <Link href={nudge.href} className={styles.cta}>
          {nudge.cta} →
        </Link>
      </div>
      <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss">
        <X size={16} />
      </button>
    </motion.div>
  );
}
```

- [ ] **Step 2: Implement the CSS**

```css
/* src/components/forher/ClinicNudge/ClinicNudge.module.css */
.nudge {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin: 0 0 14px;
  background: linear-gradient(135deg, #fbefe6, #fcf6ee);
  border: 1px solid rgba(181, 83, 47, 0.16);
  border-radius: 16px;
  padding: 13px 14px;
  box-shadow: 0 6px 18px rgba(91, 42, 74, 0.08);
}
.icon {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(181, 83, 47, 0.14);
  color: #b5532f;
}
.body {
  flex: 1 1 auto;
  min-width: 0;
}
.title {
  display: block;
  font-size: 13.5px;
  font-weight: 700;
  color: #3e1b33;
}
.text {
  font-size: 12px;
  line-height: 1.4;
  color: #6b5a65;
  margin: 2px 0 8px;
}
.cta {
  display: inline-flex;
  align-items: center;
  font-size: 12.5px;
  font-weight: 700;
  color: #8e5378;
  text-decoration: none;
}
.cta:focus-visible {
  outline: 2px solid #8e5378;
  outline-offset: 2px;
  border-radius: 4px;
}
.close {
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(91, 42, 74, 0.06);
  border: 1px solid rgba(91, 42, 74, 0.12);
  color: #5b2a4a;
  cursor: pointer;
}
.close:focus-visible {
  outline: 2px solid #8e5378;
  outline-offset: 2px;
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: "✓ Compiled successfully".

- [ ] **Step 4: Commit**

```bash
git add src/components/forher/ClinicNudge/
git commit --no-verify -m "feat(clinic): ClinicNudge banner

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc"
```

---

## Task 3: Wire into `ForHerPromo` + restrict the strip to `medium`/`high`

**Files:**
- Modify: `src/components/forher/ForHerPromo/ForHerPromo.tsx`

**Interfaces:**
- Consumes: `activeNudge`, `readDismissed`, `dismissNudge`, `type NudgeType` (`@/lib/forher/nudge`); `readDayLog` (`@/lib/forher/daylog`); `cycleLengthFor` (`@/lib/forher/cycleview`); `ClinicNudge`.

UI task — verify via `npm run build` + manual. The current file is in context; below are the exact edits.

- [ ] **Step 1: Add imports + the dismissal hook**

Add to the imports at the top of `ForHerPromo.tsx`:

```tsx
import { useState } from "react";
import { activeNudge, readDismissed, dismissNudge, type NudgeType } from "@/lib/forher/nudge";
import { readDayLog } from "@/lib/forher/daylog";
import { cycleLengthFor } from "@/lib/forher/cycleview";
import { ClinicNudge } from "@/components/forher/ClinicNudge/ClinicNudge";
```

At the very top of the `ForHerPromo` function body (before `const f = entryFraming(persona);`), add the hook (hooks must run unconditionally, before the early returns):

```tsx
  const [justDismissed, setJustDismissed] = useState<Set<NudgeType>>(new Set());
```

- [ ] **Step 2: Compute the nudge after the hydration/assessment guard**

Immediately after the `if (!fh.hydrated || !fh.assessed) { ... }` block returns (i.e. once we know the user is assessed), and before the `if (track === "none")` branch, add:

```tsx
  // Phase 3 nudge — companion (none) + low only. activeNudge returns null for medium/high.
  const dismissed = new Set<NudgeType>([...readDismissed(persona.id), ...justDismissed]);
  const nudge = activeNudge({
    tier: track,
    persona,
    cycleLog: fh.cycleLog,
    dayLog: readDayLog(persona.id),
    cycleLength: cycleLengthFor(persona, fh.cycleLog?.cycleLength),
    today: new Date(),
    dismissed,
  });
  const banner = nudge ? (
    <ClinicNudge
      nudge={nudge}
      onDismiss={() => {
        dismissNudge(persona.id, nudge.type);
        setJustDismissed((prev) => new Set([...prev, nudge.type]));
      }}
    />
  ) : null;
```

- [ ] **Step 3: Render the banner in the companion branch**

In the `track === "none"` branch, render `{banner}` just inside the `hubWrap`, above `<ForHerCompanionHub />`:

```tsx
  if (track === "none") {
    return (
      <div className={`${styles.hubWrap} fhReveal`}>
        {banner}
        <div className={styles.hubHead}>
          <div className={styles.hubLeft}>
            <span className={styles.hubBrand}>For Her <span className={styles.hubTag}>Companion</span></span>
            <span className={styles.hubPlanMuted}>Tracking &amp; insights</span>
          </div>
          <Link href="/cares/scan" className={styles.hubScan}><ScanLine size={18} /><span>Scan</span></Link>
        </div>
        <ForHerCompanionHub />
      </div>
    );
  }
```

- [ ] **Step 4: Render the banner in the care-plan branch + gate the Clinic strip to `medium`/`high`**

Replace the final `return (...)` care-plan block so that `{banner}` renders above the hub head, and the Clinic entry strip only shows for `medium`/`high`:

```tsx
  return (
    <div className={`${styles.hubWrap} fhReveal`}>
      {banner}
      <div className={styles.hubHead}>
        <div className={styles.hubLeft}>
          <span className={styles.hubBrand}>For Her <span className={styles.hubTag}>PMOS</span></span>
          <Link href="/plan" className={styles.hubPlan}>Day {Math.min(fh.day, 90)} of 90 · See plan <ArrowRight size={12} /></Link>
        </div>
        <Link href="/cares/scan" className={styles.hubScan}><ScanLine size={18} /><span>Scan</span></Link>
      </div>
      {(track === "medium" || track === "high") && (
        <Link href="/clinic" className={styles.clinicEntry}>
          <span className={styles.clinicIcon}><Stethoscope size={18} /></span>
          <span className={styles.clinicText}>
            <span className={styles.clinicEyebrow}>Clinic ForHer</span>
            <strong className={styles.clinicTitle}>Your care circle &amp; next visit</strong>
          </span>
          <span className={styles.clinicCta}>Open <ArrowRight size={14} /></span>
        </Link>
      )}
      <ForHerHub />
    </div>
  );
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: "✓ Compiled successfully".

- [ ] **Step 6: Commit**

```bash
git add src/components/forher/ForHerPromo/
git commit --no-verify -m "feat(clinic): surface Phase 3 nudge for none/low; restrict Clinic strip to medium/high

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc"
```

---

## Final verification (after all tasks)

- [ ] `npx vitest run` — all suites pass (86 prior + the new nudge suite).
- [ ] `npm run build` — clean compile.
- [ ] Manual (Vercel):
  - A companion (`none`) persona shows a nudge — at minimum the wellness card — above the companion hub; ✕ dismisses it and it doesn't return on reload.
  - Aanya-style irregular history surfaces the irregular nudge (when no missed-period).
  - Logging a concerning symptom (acne / hair loss / pelvic pain / bladder) on ≥3 days surfaces the symptom nudge.
  - A `low` persona shows nudges only on a real trigger (no wellness card) and **no** standing Clinic strip.
  - `medium`/`high` personas show **no** nudge and **keep** the Clinic strip.
  - Reduced motion: banner appears with no slide.
  - Previously stored state still loads; `resetForHer` clears the dismissed set.

## Out of scope (per spec)

- Real scheduling, risk/cycle/phase math changes, the 30-day dismissal window (prototype = permanent-until-reset), any diagnostic claim.
