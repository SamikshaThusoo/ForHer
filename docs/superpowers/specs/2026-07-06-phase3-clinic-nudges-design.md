# Phase 3 — Clinic Nudges (entry triggers) — Design

**Status:** approved design, pre-plan.
**Depends on:** ClinicForHer Phase 1 (the `/clinic` surface). This adds the *entry logic* — who gets pointed to the clinic, and when.

## Goal

Get the right non-care-plan users to the clinic at the right moment, via one gentle, dismissible, non-diagnostic nudge — without nagging. Turns tracking (cycles + symptoms) into a routed check-in.

## Non-negotiables

- **Non-diagnostic.** Never assert PMOS/PCOS. Always route to a clinician. The screening disclaimer lives on the clinic side (already there).
- **Non-naggy.** Dismissible; dismissal persists so it never re-fires on every app open.
- **No new dependencies.** Framer + Lucide only. New localStorage key is `forher.<id>.*`-prefixed (cleared by `resetForHer`).
- **Don't change cycle/risk/phase math.** Detection *reads* existing data (cycle history, cycle log, day log) and reuses existing helpers; it never recomputes them.
- **Match existing tokens/patterns.** Plum palette, `:focus-visible`, `prefers-reduced-motion`, ~420px.

## Who sees nudges

| Tier | Standing Clinic strip | Nudges |
|---|---|---|
| `high`, `medium` | **Yes** (existing) | No — they already have the door |
| `low` | **No** (see change below) | missed-period, irregular, symptom |
| `none` (companion) | No | missed-period, irregular, symptom, **wellness** |

**Behavior change to existing code:** the Clinic entry strip in `ForHerPromo` currently renders for *every* care-plan track (`track !== "none"`), which includes `low`. Per the product model (low = lifestyle guidance, no prominent booking push; clinic via symptom trigger), **restrict the strip to `medium` + `high`.** `low` keeps its reduced-intensity hub but reaches the clinic through nudges.

## Architecture

**One shared, dismissible banner** — `ClinicNudge` — rendered at the top of the For Her space in `ForHerPromo`, above the hub, for `none` and `low` users. At most one nudge shows at a time: the highest-priority trigger that is firing and not dismissed. Primary CTA → `/clinic`; ✕ dismisses and persists.

**All detection is pure and tested** — `src/lib/forher/nudge.ts`. A single entry point returns the active nudge (or null); the banner just renders it. `today` is injected (not `new Date()` inside) so detection is deterministic in tests.

### Data read (no writes to these)

- `personaTrack(persona)` — tier.
- `persona.pmos.cycleHistory: string[]` — for irregular detection (via existing `shouldResurfaceAssessment`).
- `CycleLog` (`forher.<id>.cycle`) — `{ intent, lastPeriod?, duration?, cycleLength? }`.
- `DayLog` (`forher.<id>.loggedperiods`) — period days + symptoms.
- `cycleLengthFor(persona, cycleLog?.cycleLength)` — cycle length.

### Types + entry point (`nudge.ts`)

```ts
export type NudgeType = "missed-period" | "irregular" | "symptom" | "wellness";
export type Nudge = { type: NudgeType; title: string; body: string; cta: string; href: string };

export function activeNudge(args: {
  tier: CareTrack;
  persona: Persona;
  cycleLog: CycleLog | null;
  dayLog: DayLog;
  cycleLength: number;
  today: Date;
  dismissed: Set<NudgeType>;
}): Nudge | null;
```

`activeNudge` returns `null` for `medium`/`high`. Otherwise it evaluates the four detectors **in priority order** and returns the first that fires and whose type is not in `dismissed`.

### The four triggers (priority order — first wins)

1. **`missed-period`** (intent-aware). Fires when the tracker is set up (`cycleLog.intent` is `track` or `ttc`, `lastPeriod` present) and no period has been logged past `lastKnownPeriod + 2 × cycleLength`, where `lastKnownPeriod` = the latest of `cycleLog.lastPeriod` and any period day in `dayLog`. Skipped when `intent === "pregnant"`.
   - `intent === "ttc"` → title "Your period's late", body "This could be worth a test or a quick chat — book a check-in." → `/clinic`.
   - else → title "A missed period is worth a look", body "Worth checking with a doctor — thyroid, hormones, and ruling a few things out." → `/clinic`.
2. **`irregular`**. Fires when `shouldResurfaceAssessment(persona)` is true (≥2 recent cycle gaps outside 21–35 days — existing logic). Title "Your cycles have been irregular", body "A check-in could help rule a few things out." → `/clinic`.
3. **`symptom`**. Fires when the day log has **≥3 days** where `symptoms` includes any of `acne`, `hair_loss`, `pelvic_pain`, `bladder_incontinence`. Title "Some symptoms worth a check", body names the most-logged of those (e.g. "You've logged acne a few times — a check-in could help get ahead of it."). → `/clinic`.
4. **`wellness`** (`none` only; lowest priority; always available). Title "Here whenever you need", body "A question about your hormonal health? A wellness check-in is here whenever you want one." → `/clinic`.

### Dismissal storage (`nudge.ts`)

New key `forher.<id>.nudgeDismissed` = `NudgeType[]`.

```ts
export function readDismissed(id: string): Set<NudgeType>;
export function dismissNudge(id: string, type: NudgeType): void; // append + persist
```

Prototype: a dismissal is permanent-until-`resetForHer` (the app has no real clock to age a 30-day window against). **Production note:** replace with a 30-day suppression window.

## UI

`ClinicNudge` (`src/components/forher/ClinicNudge/`): a compact banner — small icon, title, one-line body, a "Book a check-in" link (`href`), and an ✕ dismiss. Plum/warm-sand tokens, `:focus-visible`, reduced-motion (fade only, no slide). `role` semantics: it's a region, not a modal — the ✕ is a `button` with `aria-label`.

`ForHerPromo` change: after the not-assessed guard, compute `activeNudge(...)` for `none`/`low`, render `<ClinicNudge>` above the hub in both the companion and care-plan branches; gate the existing Clinic strip to `medium`/`high`. Dismiss → `dismissNudge` + local state so it disappears immediately.

## Testing (TDD, pure functions first)

`nudge.test.ts` — with an injected `today` and constructed persona/cycleLog/dayLog:
- missed-period: fires past `2 × cycleLength`, not before; TTC vs clinical copy; skipped when `pregnant`; respects a newer logged period.
- irregular: fires for a 2-out-of-range history (Aanya-like), not for a regular one.
- symptom: fires at ≥3 qualifying days, not at 2; ignores non-qualifying symptoms; names the most-logged.
- wellness: only for `none`, only when nothing higher fires.
- priority: missed-period beats irregular beats symptom beats wellness.
- dismissal: a dismissed type is skipped; the next-priority nudge shows instead.
- tier gate: `medium`/`high` → always null.

## Out of scope (flag, don't build)

- Real scheduling (booking stays prototype).
- Changing risk/cycle/phase math (read only).
- The 30-day dismissal window (prototype uses permanent-until-reset).
- Any diagnostic claim.
