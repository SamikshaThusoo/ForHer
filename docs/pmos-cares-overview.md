# PMOS Cares — Product Write-up

**What it is:** a guided **6-month PMOS care program** that sits on top of the daily companion. Where *For Her* is the consumer self-tracking app, **PMOS Cares is the clinical-grade journey**: it screens and tiers a woman's PMOS risk, assembles a care team, lays out a 6-month arc of consults and retests, and — critically — turns every day into a set of **checkable, PMOS-specific lifestyle tasks** so the program drives daily engagement, not just quarterly appointments.

**How it's built (different stack from For Her):** Next.js 14 (App Router) + TypeScript, CSS Modules, restyled to the For Her plum/serif look via a shared `.fhTheme`. **All the intelligence is a deterministic, unit-tested engine** (`lib/journey/`, 53 passing tests) — pure functions of `(persona, dayIndex)`, no backend. It lives behind a top-level toggle: **PMOS Program ⟷ For Her**, with the For Her consumer prototype served untouched alongside it. "PMOS" is the brand throughout, with a one-line home note that it's *"the condition you may know as PCOS."*

**Naming:** the condition is branded **PMOS (Polyendocrine Metabolic Ovarian Syndrome)** — a single swappable label — reflecting that it's screened across three endocrine/metabolic domains, not just the ovaries.

---

## 1. The PMOS assessment — a 3-domain screen

**The model:** a **5-question screener mapped onto three PMOS domains**, scored as **"any 2 of 3 domains positive," then escalated by severity.** The five questions (the validated screener wording) and their domains:

| Question | Domain |
|---|---|
| Irregular periods | **Polyendocrine** |
| Persistent acne / skin | **Androgenic** |
| Hair changes / hirsutism | **Androgenic** |
| Difficulty managing weight | **Metabolic** |
| Family history of diabetes / PMOS (PCOS) | **Polyendocrine** |

**Domain logic:**

- **Androgenic** = acne/skin **or** hair changes.
- **Metabolic** = weight difficulty **or** AHC labs (BMI ≥ 25 **or** HbA1c ≥ 5.7%).
- **Polyendocrine** = irregular periods **or** family history **or** AHC TSH ≥ 4.0.

**Outcome (exact):** count positive domains (0–3) → **0 = No risk, 1 = Low, 2 = Medium, 3 = High.** Then a **severity bump**: a Medium result is escalated to **High** if AHC shows **HbA1c ≥ 6.0% or BMI ≥ 30**. The result screen shows a 4-stop risk meter, the three-domain breakdown (which fired), and the framing *"a screen, not a diagnosis."*

---

## 2. Risk with AHC vs without AHC

Same three markers as For Her — **BMI, HbA1c, TSH** — folded into the domains above. The difference is what the **entry experience** and **confidence** look like (the four entry states):

- **State A — Warm (AHC flagged):** the home shows a single **flagged-markers entry card** ("A few markers worth a closer look — 31 BMI, 6.0% HbA1c, 6.1 TSH… these can be linked to PMOS"). The metabolic question is **pre-filled from labs**, and the result fuses labs + symptoms at **high confidence**.
- **State B — AHC, no flags:** a lower-urgency, opt-in discovery card.
- **State C — Cold start (no AHC):** "Take the check — no report needed." Risk is computed from **self-report only**, and the result is **always marked "Confidence: indicative" with a "Book labs to confirm" prompt** — because the metabolic picture is incomplete without labs (this holds even when the outcome is "No risk").
- **State D — Not eligible:** PMOS never surfaces.

---

## 3. Risk routing → which track you enter

The outcome *is* the care track:

| Outcome | Routes into |
|---|---|
| **No risk** | **Engagement track** — companion only (cycle/mood/habits) + periodic re-screen |
| **Low** | **30-day self-guided lifestyle track** |
| **Medium** | **Structured 6-month plan** (supervised) |
| **High** | **Structured + supervised 6-month plan** (full care team) |

After routing, a **consent screen** assembles the woman's **care circle** one specialist at a time (revealed with a stagger), gated by an "I understand this is lifestyle support, not a diagnosis or prescription" checkbox. The circle is tier-resolved: **Doctor + Nutritionist + Care Coordinator** as the base, **+ Psychologist** at High, **+ Dermatologist** if skin/hair signs, **+ Gynaecologist** if High or trying-to-conceive.

---

## 4. The 6-month care journey

The arc (compressed from the 12-month LifeSync+ clinical program, retests pulled to **Day 90 and Day 180**) runs across five phases:

| Phase | Days | Theme |
|---|---|---|
| **Entry** | 0 | Assess & enrol |
| **Foundation** | 1–28 | Understand — baseline, habit-building |
| **Build** | 29–90 | Manage — nutrition/derm touchpoints, **Day 90 partial retest** |
| **Consolidate** | 91–150 | Sustain — gynae ~Day 120, autonomy grows |
| **Review** | 151–182 | Measure & decide — **Day 180 full retest** + outcomes |

**Clinical touchpoint schedule** (tier-modulated): Day 0 baseline → Day 5 doctor + diet (+ nutritionist at Med/High, + psychologist at High) → Day 30 diet review → Day 60 diet (+ dermatology) → **Day 90 partial retest** → Day 120 gynae + diet (+ hormone panel at High) → Day 150 diet → **Day 180 full retest + outcomes**. **Care-Coordinator connects** are synthesized between services — every ~14 days for Medium/High, ~30 for Low.

**Day-180 outcomes & transition:** the engine compares Day 0 / 90 / 180 markers and offers one of three paths — **step down to maintenance** (recommended if markers improved), **continue structured**, or **warm handoff to Tulip** (if TTC) — exactly one recommended.

---

## 5. The daily task engine — the engagement core

This is the heart of PMOS Cares and the thing For Her doesn't have: **given a persona and any day 0–182, the engine produces that day's exact task list**, differentiated by risk tier and modulated by cycle phase. Grounded in the **2023 International Evidence-based PCOS Guideline** (movement 150–300 min/wk, strength ≥2 days, benefits without weight loss, no single diet superior, screen for mood).

**Eight task types:** **Move · Nourish · Track · Sleep · Mind · Learn · Connect · Clinical** (Sleep is its own type — a distinct PCOS lever).

**Targets scale by tier** — e.g. daily steps **6k (none) → 7k (low) → 8k (medium) → progressive 6k→10k (high)**; meals logged **1 → 3**; aerobic **150 → 230 min/wk**; low-GI swaps, hydration, strength days, mood screens (PHQ-2/GAD-2 cadence) all step up with risk. Examples in the library: log meals, one low-GI swap, protein-first breakfast, aerobic minutes, strength session, hydration, cycle + mood log, skin + hair check, weight + waist (optional, stigma-aware), breathing/stress reset, **sleep wind-down**, micro-learning, community prompt, and BBT (TTC only).

**Cycle-phase modifiers:** tasks shift emphasis — ovulatory phase nudges a harder session ("energy is peaking"), luteal leans gentle ("energy may dip — keep it gentle"). For irregular PMOS cycles the phase engine runs in **degraded mode** (low confidence).

**Clinical + adherence injection:** any touchpoint due that day appears as a top-priority **Clinical** task; **prescribed** items (e.g. Aanya's myo-inositol from Day 7) appear as adherence reminders — and the app itself **never prescribes**; that flag is a deterministic consult-outcome on the persona.

**"3 things today":** a shared priority ranking surfaces the top three (clinical-due first, then habit-at-risk, then phase-relevant), one per category.

**Guideline guardrails baked into copy:** food framed as additions/swaps (no red/green guilt scoring), weight permission-based with "benefits accrue even without weight loss," a positive mood screen routes to a psychologist (never an automated verdict), steps framed as an engagement proxy not a clinical mandate.

---

## 6. The plan & the engagement surfaces

The **`/plan` screen** is the daily hub: a **day scrubber** (slider + Day 1/30/90/120/180 presets) lets you move through the whole 6 months and watch the phase, cycle phase, touchpoints, and task set change. Each task is **checkable** *and* **tappable** — a **"Log ›"** opens the relevant real surface:

- **Nourish** → **Food logger** (`/cares/food`) and **Scanner** (`/cares/scan`) — both giving **PMOS-tuned verdicts** through an insulin/blood-sugar lens (sugar, refined carbs, protein+fibre → "Good pick / Go easy / In moderation," with a protein-fibre + walk swap, never guilt framing).
- **Track / cycle + mood** → **Mood & cycle log** (`/log/mood`) — feelings chips + cycle status + note.
- **Move** → **Activity logger** (`/log/move`) — steps + session type/duration.
- **Learn** → **PMOS education cards** (`/learn`) — six guideline-grounded reads (insulin & PMOS, move your way, eat for steady energy, working with your phases, mood matters, sleep is a lever).
- **Clinical** → **Care team** (`/cares/care-team`); plus **Ask** for Q&A.

All of these are restyled to the For Her plum/serif look so the program reads as one product.

---

## 7. Cycle engine & the marker meters

Shared with the rest of the program:

- **Learned cycle length** from logged period-starts (averaged gaps, clamped 21–40, default 28), feeding the **phase engine** (menstrual ≤5 / follicular / ovulatory 14–16 / luteal) with a **low-confidence flag for irregular cycles** and a `shouldResurfaceAssessment` trigger.
- **Marker context meters** interpolated across the journey from Day 0/90/180 anchors, with two derived clinically-meaningful ratios surfaced as context (never a raw dump): **HOMA-IR** (fasting glucose × insulin ÷ 405) and the **LH:FSH ratio**, alongside HbA1c, BMI and weight.

---

## 8. The personas (entry/risk scenarios)

Four seeded women, each a distinct entry + risk scenario, switchable in the demo with clear labels (`Entry A · High`, etc.) and an always-visible scenario caption:

| Persona | Entry state | Outcome | Demonstrates |
|---|---|---|---|
| **Aanya** | A — AHC flagged (BMI 31, HbA1c 6.0, TSH 6.1) | **High** | Full supervised 6-month plan; TTC toggle for the Tulip branch; myo-inositol adherence |
| **Meera** | A — AHC flagged (BMI 27) | **Medium** | Structured 6-month plan |
| **Sana** | B — AHC, no flags | **Low** | 30-day self-guided track |
| **Riya** | C — cold start, no AHC | **No risk** | Engagement track + the indicative/book-labs caveat |

Each carries a baseline cycle history (so length is learned, not assumed) and **non-uniform Day-0/90/180 marker sets** (some markers improve, some hold) so the outcomes report looks realistic. Persona persists across navigation (`?persona=` deep links).

---

## The thread that ties it together

> **Assessment** (5 questions → 3 PMOS domains, AHC-fused or cold-start) → **a risk tier + a care track** → a **consented care circle** → a **6-month arc** of phase-mapped consults and two retests → and underneath it all, **a daily plan** of tier- and phase-specific lifestyle tasks you check off and log on real surfaces. The clinical touchpoints are the skeleton; **the daily tasks are the engagement engine**; PMOS is the lens.

**Honest prototype caveats:** marker trajectories, prescribed flags and consult content are seeded per persona; the logging surfaces save to `localStorage` (no backend); food verdicts run on a mocked Indian food dataset; the 6-month compression of the 12-month clinical program (retests at 90/180) and the daily-task *content* (guideline-based, since the source deck specifies the clinical schedule but not daily tasks) are product decisions we made and can tune.

---

## Where the code lives

- **Engine (pure, tested):** `src/lib/journey/` — `risk.ts` (assessment/scoring), `cycle.ts` (phase engine), `phase.ts` (journey phase), `touchpoints.ts` (schedule + care circle), `tasks.ts` (daily task resolver), `markers.ts` (HOMA-IR / LH:FSH / outcomes), `entryFraming.ts`, `scenario.ts`, `constants.ts` (touchpoint schedule + task catalog).
- **Personas:** `src/data/pmosPersonas.ts`.
- **Screens:** `src/app/page.tsx` (PMOS home), `src/app/for-her/` (assessment flow), `src/app/plan/` (6-month plan), `src/app/log/mood/`, `src/app/log/move/`, `src/app/learn/`, and the reused `src/app/cares/*` logging surfaces.
- **Plans/specs:** `plans/2026-06-18-pmos-care-journey-engine.md`, `plans/2026-06-18-pmos-care-journey-assessment-ui.md`.
- **Branch:** `feat/cares-integration`.
