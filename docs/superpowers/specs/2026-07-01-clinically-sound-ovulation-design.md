# Clinically-sound ovulation & fertile-window model

**Date:** 2026-07-01 · **Repo:** SamikshaThusoo/ForHer · **Branch:** feat/cares-integration
**Area:** For Her cycle tracker (calendar, ring, hormone-rhythm page, phase pills)

## Problem

Ovulation is currently pinned to the **midpoint** of the cycle (`ovCd = floor(L/2)`),
and the menstrual phase is hardcoded to **days 1–5**. Both ignore what the user
actually entered:

- `floor(L/2)` is only correct at 28 days. For the long/irregular cycles this PCOS
  product targets it is materially wrong (40-day cycle → says day 20, clinically ~day 26).
- The menstrual band ignores the user's entered **period duration** (3–7 days).
- The hormone-rhythm curves have landmarks hardcoded at ~day 13–14, so on non-28
  cycles they visibly disagree with the calendar/ring ovulation marker.

## Goal

Every ovulation/fertile/phase/hormone value derives purely from the user's two inputs
— **cycle length `L`** and **period duration** — with no fixed 28-day or 5-day
assumption. Clinically sound throughout.

## Decisions (locked with product owner)

1. **Ovulation model:** luteal phase is ~constant 14 days ⇒ `ovCd = L − 14`
   (not the midpoint). No artificial floor — short cycles ovulate early, which is
   real biology. (Defensive `max(1, …)` only to avoid a non-positive day; never
   triggers for the 20–90 input range, where `ovCd` runs 6→76.)
2. **Fertile window:** `ovCd − 5 … ovCd` (the standard 6-day window: 5 days before
   ovulation + ovulation day; the egg is viable only ~12–24h so the day after is
   effectively non-fertile). Calendar green tiles and the ring's "Fertile window
   open" status use the **same** bounds.
3. **Menstrual band = days `1 … duration`** (the entered period length), not 1–5.
   Follicular then starts at `duration + 1`.
4. **Hormone curves rescaled** so their landmarks track `ovCd` (option B): keep the
   existing curves as a 28-day template and sample through a `templateDay(d, L)` remap.
5. **Scope:** tracker only. The care-plan engine (`journey/cycle.ts`) stays on
   `floor(L/2)` per prior decision — tracker and engine intentionally diverge.

## Detailed design

### 1. Shared helpers (`src/lib/forher/cycleview.ts`) — single source of truth

Replace the duplicated `floor(L/2)` scattered across calendar, ring, and
`phaseForCycleDay` with one helper:

```ts
/** Ovulation day: luteal phase is ~constant 14 days, so it counts back from the
 *  next period, not the cycle midpoint. Correct at 28 (=14) and for long cycles. */
export function ovulationDay(L: number): number {
  return Math.max(1, L - 14);
}
```

### 2. `phaseForCycleDay` — duration-driven menstrual, re-anchored ovulation

Signature gains `duration` (defaulted so existing callers stay safe):

```ts
export function phaseForCycleDay(cycleDay: number, L: number, duration = 5): CyclePhase {
  const ov = ovulationDay(L);
  const ovStart = ov - 1;
  const ovEnd = ov + 2;
  if (cycleDay <= duration) return "menstrual";     // was: <= 5
  if (cycleDay < ovStart) return "follicular";
  if (cycleDay <= ovEnd) return "ovulatory";
  return "luteal";
}
```

Menstrual takes priority on any overlap (short cycle + long period → ovulation day
can fall within the bleed; menstrual wins visually, which is the honest edge case).

**Callers to update** (pass the cycle log's `duration`, fall back to 5):
- `src/app/cycle/page.tsx` (`scrubPhase`)
- `src/app/hormones/page.tsx`
- `src/app/community/page.tsx`
- `src/components/forher/ForHerCompanionHub/ForHerCompanionHub.tsx`
- `src/components/forher/ForHerHub/ForHerHub.tsx`

### 3. Calendar (`src/app/cycle/page.tsx`)

- `const ovCd = ovulationDay(L);` (was `Math.floor(L / 2)`).
- Fertile: `isFertile = fromAnchor && !isLogged && !isPred && cd >= ovCd - 5 && cd <= ovCd;`
  (6-day window ending on ovulation; keeps the existing `fromAnchor` past-month guard).
- `isOv = fromAnchor && cd === ovCd;` (unchanged shape).
- `daysToOv` / `ovDate` unchanged (already derive from `ovCd`).

### 4. Ring (`src/components/forher/CycleRing/CycleRing.tsx`)

- `const ovCd = ovulationDay(L);` `ovStart = ovCd - 1;` `ovEnd = ovCd + 2;`.
- Phase-arc segments match `phaseForCycleDay` exactly, clamped so bands never overlap
  on short cycles:
  - menstrual: `1 … duration`
  - follicular: `duration + 1 … ovStart - 1` (dropped when empty)
  - ovulatory: `max(ovStart, duration + 1) … ovEnd`
  - luteal: `ovEnd + 1 … L`
- Status line "Fertile window open" uses `ovCd - 5 … ovCd` (same as calendar),
  "Ovulation day" on `cd === ovCd`.
- The marker florette is reserved for the **ovulation day only** (`cycleDay === ovCd`);
  every other day, including the rest of the fertile window, uses the round dot marker,
  so the cursor is never confused with the permanent ovulation florette.
- Period drops: `1 … min(duration, 7)` (was capped at 5) so they match the menstrual band.
- Florette stays at `ovCd`.

### 5. Hormone curves (`src/app/hormones/page.tsx` + `cycleview.ts`)

Keep `hEstrogen/hLh/hProgesterone/hTestosterone` as a **28-day template**
(ovulation at template day 14). Add a remap that stretches only the follicular half:

```ts
/** Map an actual cycle day (cycle length L, ovulation at L−14) onto the 28-day
 *  hormone template so curve landmarks land on the real ovulation day. The luteal
 *  half maps ~1:1 (it is already ~14 days); the follicular half stretches/shrinks. */
export function hormoneTemplateDay(d: number, L: number): number {
  const ov = ovulationDay(L);
  if (d <= ov) return 1 + (d - 1) * 13 / Math.max(1, ov - 1);       // → ov maps to 14
  return 14 + (d - ov) * 14 / Math.max(1, L - ov);                  // → L maps to 28
}
```

(For the 20–90 range `L − ov = 14` exactly, so the luteal term simplifies to
`14 + (d − ov)`; the general form is kept for safety.)

Apply the remap **everywhere the page reads a hormone value** — curve path sampling,
the scrubber marker dots, the dominant-hormone label, and the bar list — by sampling
`h.fn(hormoneTemplateDay(day, L))` instead of `h.fn(day)`. Curves are still plotted
over actual days `1…L` on the x-axis; only the sampled value changes, so peaks move
to `ovCd`.

Anchor the middle **"Ovulation" axis tick** at `x(ovCd)` instead of the mid-axis
position, so the label sits under the real ovulation day. Also pass `duration` into
`phaseForCycleDay` here.

## Edge cases

- **Short cycle + long period** (e.g. L=20, duration=7 → `ovCd`=6 inside the bleed):
  menstrual wins the phase label on overlapping days; fertile green only renders on
  non-logged days, so it stays visually sane. Documented, not floored.
- **Empty follicular** (very short cycle): the follicular arc segment is filtered out;
  ovulatory start clamps to `duration + 1` so it never overlaps menstrual.
- **`cycleLength` absent** (older localStorage): `cycleLengthFor` already falls back to
  the learned/28 value; `ovulationDay` and phases still work.

## Out of scope

- `journey/cycle.ts` (care-plan engine `getCyclePhase` / `shouldResurfaceAssessment`)
  — stays on `floor(L/2)`. Intentional tracker/engine divergence.
- The "irregular / not sure" low-confidence path (separately parked).
- Any localStorage key/shape change.

## Files touched

- `src/lib/forher/cycleview.ts` — add `ovulationDay`, `hormoneTemplateDay`; change `phaseForCycleDay`.
- `src/app/cycle/page.tsx` — `ovulationDay`, fertile bounds, pass `duration`.
- `src/components/forher/CycleRing/CycleRing.tsx` — `ovulationDay`, duration-driven arcs, fertile status, drops.
- `src/app/hormones/page.tsx` — remap sampling, ovulation axis tick, pass `duration`.
- `src/app/community/page.tsx`, `ForHerCompanionHub.tsx`, `ForHerHub.tsx` — pass `duration`.
- `src/lib/forher/cycleview.test.ts` — new unit tests.

## Tests & verification

New unit tests (`cycleview.test.ts`):
- `ovulationDay`: 21→7, 28→14, 40→26, 90→76.
- `phaseForCycleDay`: menstrual respects `duration`; ovulatory band around `L−14` at
  short/normal/long L; luteal ≈14 days.
- `hormoneTemplateDay`: `d=1→1`, `d=ovCd→14`, `d=L→28` for L∈{21,28,40}.

Then: existing **51 tests stay green**, `npm run build` clean. Manual: for L=28 nothing
shifts; L=40 ovulation moves to day 26 and the hormone LH surge lines up with it;
menstrual band width follows the entered period duration.
