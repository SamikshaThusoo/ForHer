# ClinicForHer — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ClinicForHer — the bookable clinical layer of For Her: a tier-driven care circle (consults + tests), a care team, and an editable health profile — reachable from the For Her card and shown to high/medium-risk users at enrollment.

**Architecture:** One new `/clinic` screen, entered from the For Her card/space (never a bottom-nav tab). It reads the risk tier live via `personaTrack` and composes the recommended care from the **existing** `getCareCircle` engine plus a new sibling `getCareTests` — one source of truth, no forked care lists. Booking is a prototype localStorage flow (a confirm sheet → a `booked` state), no API. The old `/cares/care-team` stub is retired in favour of Clinic's single care-team view.

**Tech Stack:** Next.js 14 App Router, TypeScript, CSS Modules, Framer Motion, Lucide, Vitest.

## Global Constraints

- **No new dependencies.** Framer Motion + Lucide only; booking is localStorage, no scheduling API.
- **Do not change risk-assessment, cycle, or phase math.** Read the tier via `personaTrack(persona)`; never recompute or persist it.
- **Extend existing data shapes/keys; never break stored data.** All new keys are `forher.<id>.*`-prefixed so `resetForHer()` clears them.
- **Non-diagnostic framing.** The app screens and routes; it does not diagnose. Every clinical surface carries the screening disclaimer: *"This is a screening tool, not a diagnosis. Please consult a qualified clinician for medical decisions."*
- **One action, not five.** Each tier leads with a single primary CTA, then a secondary list.
- **Tier vocabulary:** code stays `none | low | medium | high`; UI copy renders the middle tier as "Moderate".
- **Quality floor:** `prefers-reduced-motion` respected (both `useReducedMotion()` and CSS `@media`); tap + keyboard operable with visible `:focus-visible` (plum `#8E5378`, 2px offset); usable at ~420px.
- **Design tokens:** plum `#5B2A4A` / soft `#8E5378` / deep `#3E1B33` / soft-bg `#F5ECF1`; clinical warm-sand card = `.carClinical` gradient `linear-gradient(135deg,#FBEFE6,#FCF6EE)` with icon accent `#B5532F`. Serif `var(--font-forher-serif)`, sans `var(--font-forher-sans)`.
- **Commits:** `--no-verify`, message trailers:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc`
- **Validate:** `npx vitest run` (pure functions, TDD) + `npm run build` (typecheck via `tsc`). User verifies UI on Vercel.

## File Structure

- `src/lib/journey/careplan.ts` (new) — `CareTest`, `getCareTests`, `careCircleFlags`, `getClinicPlan` assembler + `CareItem`/`ClinicPlan` types. Pure. Composes existing `getCareCircle`.
- `src/lib/journey/careplan.test.ts` (new) — TDD for the above.
- `src/lib/journey/index.ts` (modify) — re-export careplan.
- `src/lib/forher/clinic.ts` (new) — `Booking`/`Bookings`, `migrateBookings`, `read/writeBookings`, `upsertBooking`, `isBooked`. Key `forher.<id>.bookings`.
- `src/lib/forher/clinic.test.ts` (new) — TDD.
- `src/lib/forher/healthprofile.ts` (new) — `HealthProfile`, `bmiFrom`, `read/writeHealthProfile`. Key `forher.<id>.healthprofile`.
- `src/lib/forher/healthprofile.test.ts` (new) — TDD.
- `src/components/forher/BookingSheet/BookingSheet.tsx` + `.module.css` (new) — confirm sheet (reuses the DayLogSheet bottom-sheet pattern).
- `src/components/forher/ClinicForHer/ClinicForHer.tsx` + `.module.css` (new) — the Clinic screen body.
- `src/app/clinic/page.tsx` (new) — route wrapper.
- `src/components/forher/ForHerPromo/ForHerPromo.tsx` (modify) — Clinic entry card in the For Her space.
- `src/app/for-her/page.tsx` (modify) — route high/medium to `/clinic` after enrollment.
- `src/components/forher/BottomNav/BottomNav.tsx` (modify) + `src/app/cares/care-team/` (delete) — retire the stub.

---

## Task 1: Tier-driven tests + care-circle flags (`getCareTests`, `careCircleFlags`)

**Files:**
- Create: `src/lib/journey/careplan.ts`
- Test: `src/lib/journey/careplan.test.ts`

**Interfaces:**
- Consumes: `getCareCircle`, `personaTrack` (`./touchpoints`), `getDomainSignals` (`./risk`), `Persona`, `CareTrack`, `Specialist`.
- Produces: `type CareTest = { id: string; label: string; reason: string }`; `getCareTests(tier: CareTrack, flags: { acneOrHirsutism: boolean; ttc: boolean; highMetabolic: boolean }): CareTest[]`; `careCircleFlags(persona: Persona, profile: HealthProfile): { acneOrHirsutism: boolean; ttc: boolean; highMetabolic: boolean }`. (`HealthProfile` is imported from Task 4; write Task 4 first or type the param inline as shown.)

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/journey/careplan.test.ts
import { describe, it, expect } from "vitest";
import { getCareTests } from "./careplan";

const F = { acneOrHirsutism: false, ttc: false, highMetabolic: false };

describe("getCareTests", () => {
  it("none and low get no tests", () => {
    expect(getCareTests("none", F)).toEqual([]);
    expect(getCareTests("low", F)).toEqual([]);
  });
  it("medium gets the hormone / PCOS-essentials panel", () => {
    const t = getCareTests("medium", F);
    expect(t.map((x) => x.id)).toEqual(["hormone-panel"]);
  });
  it("high adds a pelvic ultrasound after the hormone panel", () => {
    const t = getCareTests("high", { ...F, highMetabolic: true });
    expect(t.map((x) => x.id)).toEqual(["hormone-panel", "pelvic-ultrasound"]);
  });
  it("every test carries a plain-language reason", () => {
    for (const t of getCareTests("high", F)) expect(t.reason.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/journey/careplan.test.ts`
Expected: FAIL — "Failed to resolve import './careplan'".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/journey/careplan.ts
import type { Persona } from "@/types/persona";
import type { CareTrack, Specialist } from "@/types/journey";
import type { HealthProfile } from "@/lib/forher/healthprofile";
import { getCareCircle, personaTrack } from "./touchpoints";
import { getDomainSignals } from "./risk";

/** A recommended diagnostic test/panel, tier-driven. Sibling to getCareCircle's
 *  consults — one source of truth for "what care does this tier get". */
export type CareTest = { id: string; label: string; reason: string };

export function getCareTests(
  tier: CareTrack,
  _flags: { acneOrHirsutism: boolean; ttc: boolean; highMetabolic: boolean },
): CareTest[] {
  if (tier === "none" || tier === "low") return [];
  const tests: CareTest[] = [
    {
      id: "hormone-panel",
      label: "Hormone & PCOS-essentials panel",
      reason: "Clarifies the hormonal picture behind your markers.",
    },
  ];
  if (tier === "high") {
    tests.push({
      id: "pelvic-ultrasound",
      label: "Pelvic ultrasound",
      reason: "Checks the ovaries — part of a full PMOS work-up.",
    });
  }
  return tests;
}

/** Care-circle flags, with the health profile overriding persona defaults for the
 *  two live flags (skin/hair → androgenic, TTC). The tier itself is never changed. */
export function careCircleFlags(persona: Persona, profile: HealthProfile) {
  const androgenic = persona.pmos
    ? getDomainSignals(persona.pmos.assessment, persona.pmos.ahcMarkers).androgenic
    : false;
  return {
    acneOrHirsutism: profile.skinHairChanges ?? androgenic,
    ttc: profile.ttc ?? !!persona.pmos?.ttc,
    highMetabolic: personaTrack(persona) === "high",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/journey/careplan.test.ts`
Expected: PASS (4 tests). (`careCircleFlags` is covered indirectly in Task 4/5; the `_flags` param is kept for call-site symmetry with `getCareCircle`.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/journey/careplan.ts src/lib/journey/careplan.test.ts
git commit --no-verify -m "feat(clinic): tier-driven care tests + care-circle flag deriver

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc"
```

---

## Task 2: Clinic plan assembler (`getClinicPlan`)

**Files:**
- Modify: `src/lib/journey/careplan.ts` (append)
- Modify: `src/lib/journey/careplan.test.ts` (append)
- Modify: `src/lib/journey/index.ts` — add `export * from "./careplan";`

**Interfaces:**
- Consumes: `getCareCircle`, `personaTrack`, `getCareTests`, `careCircleFlags`.
- Produces:
  - `type CareItem = { id: string; kind: "consult" | "test"; label: string; reason: string; priority?: boolean }`
  - `type ClinicPlan = { tier: CareTrack; primary: CareItem | null; secondary: CareItem[]; showBooking: boolean }`
  - `getClinicPlan(persona: Persona, profile: HealthProfile): ClinicPlan`

- [ ] **Step 1: Write the failing test**

```ts
// append to src/lib/journey/careplan.test.ts
import { getClinicPlan } from "./careplan";
import type { Persona } from "@/types/persona";

// Minimal persona factory: only the fields the care engine reads.
function persona(over: Partial<Persona["pmos"]> = {}): Persona {
  return {
    id: "t", name: "T",
    pmos: {
      eligible: true, entryState: "A", hasAhc: true, ttc: false,
      enrollmentDay: "2026-01-01",
      assessment: { irregularPeriods: true, acneSkin: true, hairChanges: false, weightDifficulty: true, familyHistory: false },
      ahcMarkers: { bmi: 31, hba1c: 6.1 },
      cycleHistory: [], markers: {} as never,
      ...over,
    },
  } as Persona;
}

describe("getClinicPlan", () => {
  it("high leads with a priority gynaecologist consult and shows booking", () => {
    const p = getClinicPlan(persona(), {});
    expect(p.tier).toBe("high");
    expect(p.primary?.kind).toBe("consult");
    expect(p.primary?.id).toBe("gynaecologist");
    expect(p.primary?.priority).toBe(true);
    expect(p.showBooking).toBe(true);
    expect(p.secondary.some((i) => i.id === "hormone-panel")).toBe(true);
    expect(p.secondary.some((i) => i.id === "pelvic-ultrasound")).toBe(true);
  });

  it("medium without a gynae leads with the hormone panel", () => {
    // 2 positive domains, no metabolic escalation, no ttc → medium, no gynae in circle
    const p = getClinicPlan(
      persona({ ahcMarkers: { bmi: 24, hba1c: 5.2 }, assessment: { irregularPeriods: true, acneSkin: true, hairChanges: false, weightDifficulty: false, familyHistory: false } }),
      {},
    );
    expect(p.tier).toBe("medium");
    expect(p.primary?.kind).toBe("test");
    expect(p.primary?.id).toBe("hormone-panel");
    expect(p.showBooking).toBe(true);
  });

  it("medium with TTC leads with the gynaecologist consult", () => {
    const p = getClinicPlan(
      persona({ ahcMarkers: { bmi: 24, hba1c: 5.2 }, assessment: { irregularPeriods: true, acneSkin: true, hairChanges: false, weightDifficulty: false, familyHistory: false } }),
      { ttc: true },
    );
    expect(p.tier).toBe("medium");
    expect(p.primary?.id).toBe("gynaecologist");
    expect(p.primary?.priority).toBeUndefined();
  });

  it("no primary and no booking for the companion (none) track", () => {
    const p = getClinicPlan(persona({ assessment: { irregularPeriods: false, acneSkin: false, hairChanges: false, weightDifficulty: false, familyHistory: false }, ahcMarkers: { bmi: 22, hba1c: 5.0 } }), {});
    expect(p.tier).toBe("none");
    expect(p.showBooking).toBe(false);
  });

  it("primary is never duplicated in the secondary list", () => {
    const p = getClinicPlan(persona(), {});
    expect(p.secondary.some((i) => i.kind === p.primary?.kind && i.id === p.primary?.id)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/journey/careplan.test.ts`
Expected: FAIL — "getClinicPlan is not a function".

- [ ] **Step 3: Write minimal implementation**

```ts
// append to src/lib/journey/careplan.ts
export type CareItem = {
  id: string;
  kind: "consult" | "test";
  label: string;
  reason: string;
  priority?: boolean;
};

export type ClinicPlan = {
  tier: CareTrack;
  primary: CareItem | null;
  secondary: CareItem[];
  showBooking: boolean;
};

const consultItem = (s: Specialist, priority = false): CareItem => ({
  id: s.role, kind: "consult", label: `${priority ? "Priority " : ""}${s.label} consult`, reason: s.reason, priority: priority || undefined,
});
const testItem = (t: CareTest): CareItem => ({ id: t.id, kind: "test", label: t.label, reason: t.reason });

export function getClinicPlan(persona: Persona, profile: HealthProfile): ClinicPlan {
  const tier = personaTrack(persona);
  const flags = careCircleFlags(persona, profile);
  const consults = getCareCircle(tier, flags);
  const tests = getCareTests(tier, flags);

  const gynae = consults.find((c) => c.role === "gynaecologist");
  const hormone = tests.find((t) => t.id === "hormone-panel");

  let primary: CareItem | null = null;
  if (tier === "high" && gynae) primary = consultItem(gynae, true);
  else if (tier === "medium") primary = gynae ? consultItem(gynae) : hormone ? testItem(hormone) : null;
  else if (tier === "low") {
    const doctor = consults.find((c) => c.role === "doctor") ?? consults[0];
    primary = doctor ? consultItem(doctor) : null;
  }
  // tier === "none" → primary stays null

  const all: CareItem[] = [...consults.map((c) => consultItem(c)), ...tests.map(testItem)];
  const secondary = all.filter((i) => !(primary && i.kind === primary.kind && i.id === primary.id));

  return { tier, primary, secondary, showBooking: tier !== "none" };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/journey/careplan.test.ts`
Expected: PASS (all Task 1 + Task 2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/journey/careplan.ts src/lib/journey/careplan.test.ts src/lib/journey/index.ts
git commit --no-verify -m "feat(clinic): getClinicPlan assembler (one primary action per tier)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc"
```

---

## Task 3: Booking storage (`src/lib/forher/clinic.ts`)

**Files:**
- Create: `src/lib/forher/clinic.ts`
- Test: `src/lib/forher/clinic.test.ts`

**Interfaces:**
- Produces:
  - `type Booking = { itemId: string; kind: "consult" | "test"; label: string; slot: string; bookedAt: string }`
  - `type Bookings = Record<string, Booking>`
  - `migrateBookings(raw: unknown): Bookings`, `upsertBooking(b: Bookings, booking: Booking): Bookings`, `isBooked(b: Bookings, itemId: string): boolean`, `readBookings(id: string): Bookings`, `writeBookings(id: string, b: Bookings): void`
  - `const PLACEHOLDER_SLOTS: Record<"consult" | "test", string>` — static prototype slot text.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/forher/clinic.test.ts
import { describe, it, expect } from "vitest";
import { migrateBookings, upsertBooking, isBooked, type Booking } from "./clinic";

const b: Booking = { itemId: "gynaecologist", kind: "consult", label: "Gynaecologist consult", slot: "Tomorrow, 4:30 PM", bookedAt: "2026-07-06T10:00:00.000Z" };

describe("migrateBookings", () => {
  it("passes an object through and rejects arrays/garbage", () => {
    expect(migrateBookings({ x: b })).toEqual({ x: b });
    expect(migrateBookings([b])).toEqual({});
    expect(migrateBookings(null)).toEqual({});
    expect(migrateBookings(7)).toEqual({});
  });
});

describe("upsertBooking / isBooked", () => {
  it("adds a booking keyed by itemId and reports it booked", () => {
    const next = upsertBooking({}, b);
    expect(isBooked(next, "gynaecologist")).toBe(true);
    expect(isBooked(next, "hormone-panel")).toBe(false);
  });
  it("overwrites an existing booking for the same item without duplicating", () => {
    const next = upsertBooking(upsertBooking({}, b), { ...b, slot: "Friday, 9 AM" });
    expect(Object.keys(next)).toHaveLength(1);
    expect(next.gynaecologist.slot).toBe("Friday, 9 AM");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/forher/clinic.test.ts`
Expected: FAIL — "Failed to resolve import './clinic'".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/forher/clinic.ts
// Prototype booking state for ClinicForHer. No scheduling API — a booked item is
// persisted per-persona so the card can reflect "booked". Cleared by resetForHer().

export type Booking = {
  itemId: string;
  kind: "consult" | "test";
  label: string;
  slot: string;      // static placeholder slot text (prototype)
  bookedAt: string;  // ISO timestamp, supplied by the caller
};
export type Bookings = Record<string, Booking>; // keyed by itemId

const key = (id: string) => `forher.${id}.bookings`;

/** Static placeholder slots — the prototype "next available" time per kind. */
export const PLACEHOLDER_SLOTS: Record<"consult" | "test", string> = {
  consult: "Earliest video visit: tomorrow, 4:30 PM",
  test: "Sample collection: tomorrow, 8:00–10:00 AM",
};

export function migrateBookings(raw: unknown): Bookings {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Bookings) : {};
}
export function upsertBooking(b: Bookings, booking: Booking): Bookings {
  return { ...b, [booking.itemId]: booking };
}
export function isBooked(b: Bookings, itemId: string): boolean {
  return !!b[itemId];
}
export function readBookings(id: string): Bookings {
  try { return migrateBookings(JSON.parse(localStorage.getItem(key(id)) ?? "null")); }
  catch { return {}; }
}
export function writeBookings(id: string, b: Bookings) {
  try { localStorage.setItem(key(id), JSON.stringify(b)); } catch { /* ignore */ }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/forher/clinic.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/forher/clinic.ts src/lib/forher/clinic.test.ts
git commit --no-verify -m "feat(clinic): prototype booking storage (per-persona, no API)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc"
```

---

## Task 4: Health profile storage (`src/lib/forher/healthprofile.ts`)

**Files:**
- Create: `src/lib/forher/healthprofile.ts`
- Test: `src/lib/forher/healthprofile.test.ts`

**Interfaces:**
- Produces:
  - `type HealthProfile = { heightCm?: number; weightKg?: number; ttc?: boolean; skinHairChanges?: boolean; everPregnant?: boolean; pregnancyNotes?: string }`
  - `bmiFrom(p: HealthProfile): number | null`, `readHealthProfile(id: string): HealthProfile`, `writeHealthProfile(id: string, p: HealthProfile): void`
- Note: this type is imported by Task 1's `careplan.ts` — implement this file before or alongside Task 1's typecheck.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/forher/healthprofile.test.ts
import { describe, it, expect } from "vitest";
import { bmiFrom } from "./healthprofile";

describe("bmiFrom", () => {
  it("computes BMI to one decimal from height + weight", () => {
    expect(bmiFrom({ heightCm: 160, weightKg: 64 })).toBe(25); // 64 / 1.6^2
  });
  it("returns null when height or weight is missing or non-positive", () => {
    expect(bmiFrom({ weightKg: 64 })).toBeNull();
    expect(bmiFrom({ heightCm: 0, weightKg: 64 })).toBeNull();
    expect(bmiFrom({})).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/forher/healthprofile.test.ts`
Expected: FAIL — "Failed to resolve import './healthprofile'".

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/forher/healthprofile.ts
// Editable health profile for ClinicForHer. Captured/persisted per persona; the two
// live flags (ttc, skinHairChanges) feed the care-circle via careCircleFlags — they do
// NOT recompute the risk tier. BMI/labs are captured for the care team, not rescored.

export type HealthProfile = {
  heightCm?: number;
  weightKg?: number;
  ttc?: boolean;             // overrides persona.pmos.ttc for the care circle
  skinHairChanges?: boolean; // overrides the androgenic signal for the care circle
  everPregnant?: boolean;
  pregnancyNotes?: string;
};

const key = (id: string) => `forher.${id}.healthprofile`;

export function bmiFrom(p: HealthProfile): number | null {
  if (!p.heightCm || !p.weightKg || p.heightCm <= 0) return null;
  const m = p.heightCm / 100;
  return Math.round((p.weightKg / (m * m)) * 10) / 10;
}
export function readHealthProfile(id: string): HealthProfile {
  try {
    const raw = JSON.parse(localStorage.getItem(key(id)) ?? "null");
    return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as HealthProfile) : {};
  } catch { return {}; }
}
export function writeHealthProfile(id: string, p: HealthProfile) {
  try { localStorage.setItem(key(id), JSON.stringify(p)); } catch { /* ignore */ }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/forher/healthprofile.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/forher/healthprofile.ts src/lib/forher/healthprofile.test.ts
git commit --no-verify -m "feat(clinic): editable health profile storage + BMI derive

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc"
```

---

## Task 5: Booking confirm sheet (`BookingSheet`)

**Files:**
- Create: `src/components/forher/BookingSheet/BookingSheet.tsx`
- Create: `src/components/forher/BookingSheet/BookingSheet.module.css`

**Interfaces:**
- Consumes: `CareItem` (from `@/lib/journey`), `PLACEHOLDER_SLOTS` (from `@/lib/forher/clinic`).
- Produces: `BookingSheet` component. Props:
  `{ item: CareItem | null; onConfirm: (item: CareItem, slot: string) => void; onClose: () => void }`.
  Open when `item !== null`.

This is a UI task — no vitest; verify via `npm run build` + manual. Reuse the exact modal mechanics from `src/components/forher/DayLogSheet/DayLogSheet.tsx` (Framer bottom sheet: scrim fade, spring slide, drag-to-dismiss, focus trap, Escape, scroll lock, return focus, `useReducedMotion`).

- [ ] **Step 1: Implement the component**

```tsx
// src/components/forher/BookingSheet/BookingSheet.tsx
"use client";
import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Stethoscope, FlaskConical, ShieldCheck } from "lucide-react";
import type { CareItem } from "@/lib/journey";
import { PLACEHOLDER_SLOTS } from "@/lib/forher/clinic";
import styles from "./BookingSheet.module.css";

const SPRING = { type: "spring" as const, stiffness: 380, damping: 38 };

/** Prototype booking confirm — specialist/test + placeholder slot + a note that her
 *  health context is shared. Confirm persists a booked state (handled by the parent). */
export function BookingSheet({
  item,
  onConfirm,
  onClose,
}: {
  item: CareItem | null;
  onConfirm: (item: CareItem, slot: string) => void;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const open = item !== null;
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      sheetRef.current
        ? Array.from(sheetRef.current.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null)
        : [];
    const t = setTimeout(() => focusables()[0]?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "Tab") {
        const f = focusables(); if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; prevActive?.focus?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const slot = item ? PLACEHOLDER_SLOTS[item.kind] : "";
  const Icon = item?.kind === "test" ? FlaskConical : Stethoscope;

  return (
    <AnimatePresence>
      {open && item && (
        <motion.div className={styles.scrim} onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.2 }}>
          <motion.div ref={sheetRef} className={styles.sheet} role="dialog" aria-modal="true"
            aria-label={`Book ${item.label}`} onClick={(e) => e.stopPropagation()}
            initial={reduce ? { opacity: 0 } : { y: "100%" }} animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "100%" }} transition={reduce ? { duration: 0 } : SPRING}
            drag={reduce ? false : "y"} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_e, info) => { if (info.offset.y > 120 || info.velocity.y > 700) onClose(); }}>
            <div className={styles.grab} aria-hidden />
            <div className={styles.header}>
              <span className={styles.icon}><Icon size={20} /></span>
              <div>
                <span className={styles.eyebrow}>Confirm your booking</span>
                <h2 className={styles.title}>{item.label}</h2>
              </div>
              <button type="button" className={styles.close} onClick={onClose} aria-label="Close"><X size={18} /></button>
            </div>
            <p className={styles.why}>{item.reason}</p>
            <div className={styles.slot}>{slot}</div>
            <p className={styles.shared}><ShieldCheck size={14} aria-hidden /> Your health context is shared, so your clinician arrives informed.</p>
            <button type="button" className={styles.confirm} onClick={() => onConfirm(item, slot)}>Confirm booking</button>
            <p className={styles.disclaimer}>This is a screening tool, not a diagnosis. Please consult a qualified clinician for medical decisions.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Implement the CSS**

Copy `DayLogSheet.module.css` `.scrim` / `.sheet` / `.grab` / `.header` / `.eyebrow` / `.title` / `.close` verbatim (same tokens), then add:

```css
/* src/components/forher/BookingSheet/BookingSheet.module.css — after the copied base */
.icon { width: 40px; height: 40px; flex: 0 0 auto; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(181, 83, 47, 0.14); color: #B5532F; }
.why { font-size: 13px; color: #6B5A65; margin: 4px 0 12px; }
.slot { font-size: 13px; font-weight: 700; color: #3E1B33; background: #F5ECF1; border-radius: 12px; padding: 12px 14px; }
.shared { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #8E5378; margin: 12px 0 14px; }
.confirm { width: 100%; font-family: inherit; font-size: 14px; font-weight: 700; color: #fff; background: linear-gradient(135deg, #5B2A4A, #8E5378); border: none; border-radius: 14px; padding: 13px; cursor: pointer; box-shadow: 0 6px 16px rgba(91, 42, 74, 0.22); }
.confirm:focus-visible { outline: 2px solid #3E1B33; outline-offset: 2px; }
.disclaimer { font-size: 11px; color: #9A8A92; text-align: center; margin-top: 12px; }
@media (prefers-reduced-motion: reduce) { .scrim { backdrop-filter: none; } }
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: "✓ Compiled successfully" — no type errors in BookingSheet.

- [ ] **Step 4: Commit**

```bash
git add src/components/forher/BookingSheet/
git commit --no-verify -m "feat(clinic): booking confirm bottom sheet

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc"
```

---

## Task 6: Clinic screen (`ClinicForHer` + `/clinic` route)

**Files:**
- Create: `src/components/forher/ClinicForHer/ClinicForHer.tsx`
- Create: `src/components/forher/ClinicForHer/ClinicForHer.module.css`
- Create: `src/app/clinic/page.tsx`

**Interfaces:**
- Consumes: `usePersona` (`@/context/PersonaContext`), `getClinicPlan`, `type CareItem` (`@/lib/journey`), `readHealthProfile`/`writeHealthProfile`/`bmiFrom`/`type HealthProfile` (`@/lib/forher/healthprofile`), `readBookings`/`writeBookings`/`upsertBooking`/`isBooked`/`type Bookings` (`@/lib/forher/clinic`), `BookingSheet`, `getCareCircle` for the care-team list.
- Produces: `ClinicForHer` component (no props; reads persona from context). `/clinic` renders it inside `fhTheme`.

UI task — verify via `npm run build` + manual checklist. Structure below; match the `.car`/`.carClinical` action-card pattern from `src/app/home.module.css`.

- [ ] **Step 1: Implement the route wrapper**

```tsx
// src/app/clinic/page.tsx
import { ClinicForHer } from "@/components/forher/ClinicForHer/ClinicForHer";

export default function ClinicPage() {
  return <ClinicForHer />;
}
```

- [ ] **Step 2: Implement the screen**

```tsx
// src/components/forher/ClinicForHer/ClinicForHer.tsx
"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Stethoscope, FlaskConical, Check, Users, ClipboardEdit } from "lucide-react";
import { usePersona } from "@/context/PersonaContext";
import { getClinicPlan, getCareCircle, careCircleFlags, type CareItem } from "@/lib/journey";
import { readHealthProfile, writeHealthProfile, bmiFrom, type HealthProfile } from "@/lib/forher/healthprofile";
import { readBookings, writeBookings, upsertBooking, isBooked, type Bookings } from "@/lib/forher/clinic";
import { BookingSheet } from "@/components/forher/BookingSheet/BookingSheet";
import styles from "./ClinicForHer.module.css";

const TIER_COPY: Record<string, string> = {
  high: "Your screen points to a higher likelihood of PMOS. Let's get you seen.",
  medium: "Your screen suggests a moderate hormonal-health risk worth checking.",
  low: "A couple of signals worth a light check-in.",
  none: "No risk signals right now — you're in great shape.",
};

export function ClinicForHer() {
  const { persona } = usePersona();
  const [profile, setProfile] = useState<HealthProfile>(() => (typeof window === "undefined" ? {} : readHealthProfile(persona.id)));
  const [bookings, setBookings] = useState<Bookings>(() => (typeof window === "undefined" ? {} : readBookings(persona.id)));
  const [sheetItem, setSheetItem] = useState<CareItem | null>(null);

  const plan = useMemo(() => getClinicPlan(persona, profile), [persona, profile]);
  const team = useMemo(() => getCareCircle(plan.tier, careCircleFlags(persona, profile)), [persona, profile, plan.tier]);

  const book = (item: CareItem, slot: string) => {
    setBookings((prev) => {
      const next = upsertBooking(prev, { itemId: item.id, kind: item.kind, label: item.label, slot, bookedAt: new Date().toISOString() });
      writeBookings(persona.id, next);
      return next;
    });
    setSheetItem(null);
  };

  const patch = (p: Partial<HealthProfile>) =>
    setProfile((prev) => { const next = { ...prev, ...p }; writeHealthProfile(persona.id, next); return next; });

  const bmi = bmiFrom(profile);

  const Card = ({ item }: { item: CareItem }) => {
    const booked = isBooked(bookings, item.id);
    const Icon = item.kind === "test" ? FlaskConical : Stethoscope;
    return (
      <div className={`${styles.item} ${item.priority ? styles.itemPriority : ""}`}>
        <span className={styles.itemIcon}><Icon size={20} /></span>
        <div className={styles.itemBody}>
          <h3 className={styles.itemTitle}>{item.label}</h3>
          <p className={styles.itemWhy}>{item.reason}</p>
        </div>
        {booked ? (
          <span className={styles.booked}><Check size={15} aria-hidden /> Booked</span>
        ) : (
          <button type="button" className={styles.bookBtn} onClick={() => setSheetItem(item)}
            aria-label={`Book ${item.label}`}>Book</button>
        )}
      </div>
    );
  };

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.header}>
        <Link href="/" className={styles.back} aria-label="Back to home"><ChevronLeft size={20} /></Link>
        <span className={styles.brand}>Clinic</span>
      </header>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>ClinicForHer</span>
        <h1 className={styles.h1}>Your next step</h1>
        <p className={styles.lede}>{TIER_COPY[plan.tier]}</p>
      </section>

      {plan.showBooking ? (
        <>
          {plan.primary && (
            <section className={styles.section}>
              <span className={styles.sectionLabel}>Recommended now</span>
              <div className={`${styles.primary}`}>
                <Card item={plan.primary} />
              </div>
            </section>
          )}

          {plan.secondary.length > 0 && (
            <section className={styles.section}>
              <span className={styles.sectionLabel}>Your care circle</span>
              <div className={styles.list}>{plan.secondary.map((i) => <Card key={`${i.kind}:${i.id}`} item={i} />)}</div>
            </section>
          )}
        </>
      ) : (
        <section className={styles.section}>
          <div className={styles.lifestyle}>
            <p>Keep up your lifestyle habits and cycle tracking. A wellness check-in is here whenever you want one.</p>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <span className={styles.sectionLabel}><Users size={13} aria-hidden /> Your care team</span>
        <div className={styles.team}>
          {team.map((s) => (
            <div key={s.role} className={styles.member}>
              <strong>{s.label}</strong>
              <span>{s.reason}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <span className={styles.sectionLabel}><ClipboardEdit size={13} aria-hidden /> Health profile</span>
        <div className={styles.profile}>
          <label className={styles.field}><span>Height (cm)</span>
            <input type="number" inputMode="numeric" min={100} max={220} value={profile.heightCm ?? ""}
              onChange={(e) => patch({ heightCm: e.target.value ? Number(e.target.value) : undefined })} /></label>
          <label className={styles.field}><span>Weight (kg)</span>
            <input type="number" inputMode="numeric" min={30} max={200} value={profile.weightKg ?? ""}
              onChange={(e) => patch({ weightKg: e.target.value ? Number(e.target.value) : undefined })} /></label>
          <p className={styles.bmi}>{bmi ? `BMI ${bmi} · shared with your care team for review` : "Add height + weight to see your BMI"}</p>
          <button type="button" className={`${styles.toggle} ${profile.ttc ? styles.toggleOn : ""}`}
            aria-pressed={!!profile.ttc} onClick={() => patch({ ttc: !profile.ttc })}>Trying to conceive</button>
          <button type="button" className={`${styles.toggle} ${profile.skinHairChanges ? styles.toggleOn : ""}`}
            aria-pressed={!!profile.skinHairChanges} onClick={() => patch({ skinHairChanges: !profile.skinHairChanges })}>Skin or hair changes</button>
          <button type="button" className={`${styles.toggle} ${profile.everPregnant ? styles.toggleOn : ""}`}
            aria-pressed={!!profile.everPregnant} onClick={() => patch({ everPregnant: !profile.everPregnant })}>Been pregnant before</button>
          <p className={styles.hint}>Trying-to-conceive and skin/hair changes adjust your care circle. Height, weight and history are shared for your care team to review at your next visit.</p>
        </div>
      </section>

      <p className={styles.disclaimer}>This is a screening tool, not a diagnosis. Please consult a qualified clinician for medical decisions.</p>

      <BookingSheet item={sheetItem} onConfirm={book} onClose={() => setSheetItem(null)} />
    </main>
  );
}
```

- [ ] **Step 3: Implement the CSS**

Create `ClinicForHer.module.css` following existing page conventions (`for-her.module.css` / `plan.module.css` for `.page`/`.header`/`.back`/`.brand`/`.disclaimer`; `home.module.css` clinical card tokens). Key classes: `.page` (max-width 480, padding, min-height 100dvh, plum bg), `.hero`, `.eyebrow` (`#8E5378` uppercase), `.h1` (serif, `#3E1B33`), `.lede`, `.section`+`.sectionLabel` (flex, `#8E5378`), `.item` (flex row, warm-sand `.carClinical` gradient card, `.itemPriority` = plum-accented border/glow), `.itemIcon` (`#B5532F` on `rgba(181,83,47,.14)`), `.itemTitle` (serif), `.itemWhy`, `.bookBtn` (plum gradient pill, `:focus-visible` outline `#8E5378`), `.booked` (green `#4F9D69` check), `.team`/`.member`, `.profile`/`.field` (input border-color `:focus` per CycleOnboarding), `.toggle`/`.toggleOn` (chip pattern from DayLogSheet `.chip`/`.chipOn`), `.bmi`/`.hint`/`.lifestyle`/`.disclaimer`. Add `@media (prefers-reduced-motion: reduce)` where any transition exists.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: "✓ Compiled successfully"; `/clinic` appears in the route list.

- [ ] **Step 5: Commit**

```bash
git add src/components/forher/ClinicForHer/ src/app/clinic/
git commit --no-verify -m "feat(clinic): ClinicForHer screen — care circle, team, health profile

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc"
```

---

## Task 7: Entry points (For Her card + enrollment redirect)

**Files:**
- Modify: `src/components/forher/ForHerPromo/ForHerPromo.tsx` — add a Clinic entry card in the care-plan state (and, later phases, the companion soft card — out of scope here).
- Modify: `src/app/for-her/page.tsx:83-87` — route high/medium to `/clinic` after enrollment.

**Interfaces:**
- Consumes: `personaTrack` (already imported in ForHerPromo).

- [ ] **Step 1: Route to Clinic at enrollment**

In `src/app/for-her/page.tsx`, change the `schedule` step's `onComplete` so care-plan users land on Clinic instead of home:

```tsx
{step === "schedule" && (
  <ScheduleCollection
    onComplete={(s) => { saveSchedule(persona.id, s); markAssessed(persona.id); router.push("/clinic"); }}
  />
)}
```

(`outcome` here is always `medium`/`high` — the `none` branch already redirected to `/` in the `routing` step.)

- [ ] **Step 2: Add the Clinic entry card in the For Her space**

In `ForHerPromo.tsx`, inside the assessed care-plan branch (`track !== "none"`, the block that renders `<ForHerHub />`), add a prominent link card **above** the hub, e.g.:

```tsx
<Link href="/clinic" className={styles.clinicEntry}>
  <span className={styles.clinicEyebrow}>ClinicForHer</span>
  <strong>Your care circle & next visit</strong>
  <span className={styles.clinicCta}>Open clinic <ArrowRight size={14} /></span>
</Link>
```

Add `ArrowRight` to the lucide import and `.clinicEntry`/`.clinicEyebrow`/`.clinicCta` to `ForHerPromo.module.css` using the warm-sand clinical tokens (`linear-gradient(135deg,#FBEFE6,#FCF6EE)`, accent `#B5532F`), with a `:focus-visible` outline.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: "✓ Compiled successfully".

- [ ] **Step 4: Commit**

```bash
git add src/components/forher/ForHerPromo/ src/app/for-her/page.tsx
git commit --no-verify -m "feat(clinic): enter Clinic from the For Her card + at enrollment

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc"
```

---

## Task 8: Retire the `/cares/care-team` stub

**Files:**
- Modify: `src/components/forher/BottomNav/BottomNav.tsx:14` — remove the `Care` tab.
- Delete: `src/app/cares/care-team/page.tsx` (and the `src/app/cares` tree if nothing else lives there).

**Note to reviewer:** Per the product call, Clinic is reached from the For Her card, *not* a nav tab — so the Care tab is removed rather than repointed. If a persistent nav entry is later wanted, repoint this tab to `/clinic` instead.

- [ ] **Step 1: Remove the Care tab**

In `BottomNav.tsx`, delete the line:
```tsx
{ href: "/cares/care-team", label: "Care", icon: Users, carePlanOnly: true },
```
and drop the now-unused `Users` from the lucide import.

- [ ] **Step 2: Delete the stub route**

```bash
git rm src/app/cares/care-team/page.tsx
# if src/app/cares has no other routes/files, remove the empty dirs too
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: "✓ Compiled successfully"; `/cares/care-team` no longer in the route list; no dangling imports.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit --no-verify -m "chore(clinic): retire /cares/care-team stub in favour of Clinic

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01F3KHKZNYqQ2shJd3AfNzrc"
```

---

## Final verification (after all tasks)

- [ ] `npx vitest run` — all suites pass (existing 69 + Task 1–4 additions).
- [ ] `npm run build` — clean compile; `/clinic` present, `/cares/care-team` gone.
- [ ] Manual (Vercel): high & medium personas reach Clinic from the For Her card and at enrollment; primary CTA leads and matches the tier; booking a card persists and the card flips to "Booked" on reload; disclaimer shows; health-profile toggles change the care circle live; BMI derives; reduced-motion drops all animation; usable at 420px; previously saved state still loads.

---

## Out of scope — separate follow-on plan (Phase 3: entry triggers)

Not built here; flagged for their own plan:
- **Low-risk symptom gate:** surface Clinic when `acne`, `hair_loss`, `pelvic_pain`, or `bladder_incontinence` is logged on **≥3 days** (reads `loggedperiods`).
- **Cycle nudges:** "3 irregular cycles → doc intervention" and "3 cycles not logged → TTC nudge" (the TTC nudge is new — no existing code).
- **No-problem soft card:** dismissible "Book a wellness check-in" in the companion hub, non-naggy (dismissal persists), non-diagnostic.
- **Phase-review rescore hook:** apply captured BMI/lab profile changes at phase completion (days 30/60/90) after a doctor review — not live.
