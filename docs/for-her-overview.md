# For Her — Product Write-up

**What it is:** a PCOS-first women's health companion that leads with a clinically-grounded risk screen, then turns into a daily cycle/symptom/mood tracker with a phase-aware community and diet scanner. It's a front-end prototype — all state lives in the browser (`localStorage`, keys prefixed `forher.`), no backend — so every "intelligence" is a deterministic function over the data the woman enters.

The whole product is organized around one idea: **understand your risk first, then track your body from there**, with everything downstream (content, community, hormones, tips) adapting to *where she is in her cycle* and *what her goal is*.

---

## 1. The PCOS assessment — the front door

**The model (exactly):** a **primary-care domain framework from Kalra et al. (Indian J Endocrinol Metab, 2023)**, with **symptom weighting from Pedersen et al. (Can Fam Physician, 2007)** and **self-report methodology from Bedrick et al. (Women's Health Rep, 2020)**. It's explicitly a *screening* tool, not a diagnosis.

**Structure:** a diagnosis gate, then up to 8 one-at-a-time questions.

- **Diagnosis gate first:** "Have you been diagnosed with… PCOS/PCOD, Thyroid disorder, Diabetes/pre-diabetes, None?" Selecting **PCOS skips screening** entirely and routes to a management path; thyroid/diabetes are carried as co-diagnoses.
- **8 screening questions**, each mapped to one of **three clinical (Kalra) domains** and, where relevant, one of **four Pedersen predictors**:

| # | Question | Domain | Pedersen predictor |
|---|---|---|---|
| 1 | Cycle regularity | Menstrual | menses |
| 2 | Severe period pain | Menstrual | — |
| 3 | Trying to conceive / difficulty | (family-planning intent) | — (TTC flag only) |
| 4 | Excess facial/body hair | Dermatological | hirsutism |
| 5 | Regular hair removal | Dermatological | hirsutism |
| 6 | Persistent acne | Dermatological | acne |
| 7 | Skin darkening (acanthosis nigricans) | Dermatological | — |
| 8 | Unexplained weight gain | Metabolic | obesity |

Each answer carries a severity **level (0/1/2)**. TTC is deliberately **excluded from the risk math** — it's treated as intent (for the Tulip pre-conception branch), not a symptom.

**Scoring → tier (the exact logic):**

1. Any answer with level ≥ 1 makes its **domain "positive"** and adds to a `severitySum`; if it has a Pedersen tag, that predictor flips on.
2. Count **positive domains (0–3)** and **distinct Pedersen predictors (0–4)**.
3. Map to a tier:
   - **Low ("Low Likelihood")** — fewer than 2 domains positive.
   - **High ("Clinical Evaluation Recommended")** — ≥3 Pedersen predictors, **or** all 3 domains positive with severitySum ≥ 8.
   - **Moderate ("Further Evaluation Suggested")** — otherwise (i.e. **≥2 of 3 domains positive**).

So in plain terms: **"any 2 of 3 domains positive" is the threshold for a positive screen, then we stratify up to High by how many Pedersen predictors are present plus overall severity.** The full result (tier, which domains fired, predictor count, severity, TTC flag) is saved so the home card and result screen can reflect it later.

---

## 2. How risk is determined — with AHC vs without AHC

The differentiator is **AHC (Annual Health Check) data** — three lab markers: **BMI, HbA1c, TSH**.

**Marker → domain fusion:**

- **BMI flagged → Metabolic domain** (level 2, predictor = obesity). Threshold: BMI ≥ 25.
- **HbA1c flagged → Metabolic domain** ("borderline dysglycaemia"). Threshold: HbA1c ≥ 5.7% (pre-diabetes range).
- **TSH flagged → rule-out / thyroid note only** — it is *not* a PCOS-positive trigger (PCOS is a diagnosis of exclusion; abnormal thyroid is flagged for separate evaluation).

**With AHC present (the "warm" path):**

- The assessment **already counts the metabolic signals from labs**, so it **drops the self-report weight question** (8 → 7 questions).
- A "From your health check" pre-fill card shows the flagged markers ("Elevated BMI (28)", "Borderline HbA1c").
- The result **fuses labs + symptoms into one screen** — "This combines your recent health check and your symptoms into one result" — and lab-derived signals are tagged "· from your health check" in the *Why this result* breakdown.
- Entry routes through the AHC screen → assessment, with a banner: "Based on your recent health check, let's understand your risk better."

**Without AHC (cold start):**

- All 8 questions are asked; risk is computed from **self-report alone** and the result is flagged **preliminary**.
- It carries an honest **confidence caveat**: *"This is a preliminary screen based on your symptoms alone — adding your health check data would refine it."*
- Home framing is aspirational rather than flagged: "Your body has a rhythm. A quick check can tell you your PCOS risk — then track your cycle from there."

---

## 3. Cycle, period, symptom & mood tracking

**Logging periods** — three ways: tap days on the calendar, an onboarding sheet (last-period date + duration chip, default 4 days), or a mocked **Apple Health / Health Connect sync**. A "period start" is the first day of a contiguous run.

**Learned cycle length** (not hardcoded at 28): once **3+ period-starts** are logged, it takes the **gaps between consecutive starts, discards implausible ones (outside 21–40 days), and uses the median**, clamped to 21–40 (else falls back to 28). Until then it quietly assumes 28.

**Phase derivation** from cycle day:

- Days 1–5 → **Menstrual**
- 6–13 → **Follicular**
- 14–16 → **Ovulation** (peak day 14)
- 17+ → **Luteal**
- Predicted next period = last start + cycle length.

**Daily check-in:** **Mood** (Happy / Tired / Emotional / Irritated / Motivated), **Energy** on a 1–10 scale (banded Drained→Buzzing), and **Symptoms** (Cramps, Acne, Bloating, Fatigue, Headache, Cravings).

**Degraded / uncertain mode:** with no data the clock and predictions show gentle "log your last period" fallbacks rather than fake numbers. *(Note: an "irregular cycles → check your PCOS risk" nudge is wired but currently dormant — there's no automatic irregularity detection from logged gaps yet.)*

**Goals/TTC/pregnancy:** choosing **Trying to conceive** switches copy to a fertile-window framing (peak days 12–16) and surfaces a Tulip pre-conception nudge; **Pregnant** switches to a week-by-week pregnancy view (to week 40) instead of cycle tracking.

---

## 4. Hormonal rhythm by cycle phase

For Her **does** visualize hormones moving across the cycle — a "Hormone Rhythm" screen ("How your hormones move"). It models **four hormones: Estrogen, Progesterone, LH, and Testosterone** *(FSH is named in copy but not curve-modeled)*, as **normalized model curves shown as a 0–100 relative index** (not real serum units — it's an educational rhythm, not a lab value).

The curves follow the real biology:

- **Estrogen** climbs through the follicular phase and **peaks ~day 14**, dips after ovulation, with a smaller luteal hump.
- **LH spikes sharply ~day 14** (the ovulation trigger).
- **Progesterone** stays flat until day 14, then **rises through the luteal phase** (peaks ~day 22).
- **Testosterone** has a **subtle ovulation-window bump (days 12–15)**.

It's presented three ways: a **scrubbable hormone ring** (drag any day, the dominant hormone's dot pulses), **four hormone bars** with 0–100 readouts on the cycle clock, and **per-phase prose** — e.g. ovulation: *"Estrogen high, LH surging — communication and confidence peak."* / luteal: *"Progesterone is rising — focus deepens, but bloating, breast tenderness and acne may build."*

---

## 5. Community — "what women in your phase are saying"

The community is **phase- and intent-aware**, so a woman only sees what's relevant to where she is *right now*.

- **Tip library:** ~20 curated tips, **5 per phase**, in three kinds — **peer** ("From the community"), **pacing** ("Keeping your pace"), and **recipe** ("Diet from the community"). Each carries a real "**N women saved this**" count as social proof. Some tips are gated to a goal (PCOS-specific, TTC-specific).
- **Selection:** filters to the current phase, ranks intent-specific tips above general ones, and shows the **top one of each kind** as a swipeable rail.
- **Contribute how you feel:** a "How are you feeling this {phase} phase?" panel — tappable feeling chips (Energetic, Tired, Crampy, Moody, Calm, Bloated, Motivated, Anxious) + a free-text note → "Share with the community," framed as *"other women in your phase will see it, instead of templates."*
- **Your shared thoughts:** her own posts come back with the likes they received. *(Likes are currently mocked — random 2–13 — pending a real backend.)*
- **Wellness videos:** a phase/goal-matched guided session banner (e.g. "Yoga for PCOS", "Yoga for PMS relief", "Fertility-friendly yoga"). *(Placeholder content — video URLs not yet wired.)*

---

## 6. Diet scanner (the "what's in my food" tool)

A women's-health-framed food tool: **Scan a snack** (packaged item) or **Add a meal** (search). It returns calories, macro bars (protein/carbs/fat/fibre), and ingredient chips that **flag refined flour, added sugar, palm oil, MSG**, then a **PCOS-aware verdict**:

- High added sugar → **"Go easy"** — *"added sugar spikes insulin, which PCOS is sensitive to"* (and in the luteal phase: *"cravings are real — a few squares of dark chocolate beat a sugary biscuit"*).
- Good protein + fibre → **"Good pick"** — slows sugar release; in the menstrual phase it nudges iron-rich choices.
- Otherwise → "In moderation."

*(Foods are a mocked Indian dataset — Maggi, bhujia, poha, chilla, dal-rice, etc.)*

---

## 7. The home companion & intent model — how it all connects

The home shows **one adaptive "For Her" card** that changes by state, in priority order:

1. **Pregnant** → week-based card.
2. **Has cycle data** → daily companion: cycle day + phase, a phase/risk-aware community tip (rotated so it's fresh each visit), a video thumbnail, and a **PCOS risk chip** if she's been assessed.
3. **Assessed, not tracking yet** → her risk result + "Start tracking."
4. **First-time** → "Check my PCOS risk."

Everything is driven by a **5-way intent model — cycle / pcos / ttc / pregnant / explore** — persisted and used everywhere: a **Moderate/High PCOS result automatically switches intent to "pcos,"** which then steers the community tips, the video, and the scanner framing. PCOS routing is smart too: if a health check exists it goes through the AHC screen, otherwise straight to the assessment.

---

## The thread that ties it together

> **Assessment** (Kalra domains + Pedersen, AHC-fused or self-report) → **a risk tier + intent** → **a home companion** that greets her by cycle day/phase → **cycle, symptom, mood & hormone tracking** that learns her real cycle length → a **community and diet scanner** that only ever show what's relevant to *her phase and her goal*. PCOS is the lens; the cycle is the daily hook; engagement is the point.

**Honest prototype caveats** (worth knowing before a demo): AHC labs, scanner foods, community likes and video URLs are mocked/placeholder; the auto "irregular cycle" detector is wired but not yet firing; FSH is mentioned but not curve-modeled; and there's a minor HbA1c severity-weighting discrepancy between the AHC screen and the combined classifier.
