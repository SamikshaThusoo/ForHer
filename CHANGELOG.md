# For Her — PCOS-first restructure + community module

Restructures the For Her flow so **PCOS leads**, fuses the health check into one
combined risk result, learns cycle length, and adds a net-new community module.
All state is in `localStorage`; no build step.

## localStorage keys (canonical)

| Key | Shape | Written by | Read by |
| --- | --- | --- | --- |
| `forher.pcos.v1` | `{ tier, domainPositive, ttcFlag, assessedAt }` | banner.html | index.html, cycle.html, forher-widget.html |
| `forher.intent.v1` | `{ intent, setAt }` (intent ∈ cycle\|pcos\|ttc\|pregnant\|explore) | cycle.html | cycle.html (community filtering) |
| `forher.cyclelen.v1` | `{ length, learnedAt, fromCycles }` | cycle.html | cycle.html, index.html |
| `forher.ahc.v1` | `{ tier, …, markers:{ bmi, hba1c, tsh } }` | ahc.html | banner.html, index.html |
| `forher.cycle.v1` (`FH_KEY`) | existing cycle/log state | index.html, cycle.html | index.html, cycle.html |

`forher.journey.v1` is the legacy intent key — still read as a fallback, no longer written.

## Files changed

### `index.html` — home "For Her" card
- **PCOS result state** (`renderPcosResult`): the card now reflects `forher.pcos.v1`
  with per-tier copy (low / moderate / high), tier-tinted background, risk pill, and
  "Start tracking" / "View my result" CTAs. *(Fixes the reported bug: the home banner
  never changed across PCOS risk stages.)*
- **Dispatcher priority**: PCOS result → daily cycle card → first-time hook; re-renders
  on `storage` events for the PCOS key too.
- **PCOS-first entry**: first-time CTA and the chooser's PCOS option now open
  `banner.html` (was `cycle.html` / `ahc.html`).
- **Learned cycle length**: reads `forher.cyclelen.v1` (clamped 21–40) via
  `getCycleLength()` instead of a hardcoded 28; pill reads "Around day N/len" until a
  length is learned, then "Day N/len".
- **AHC-aware first-time copy**: grounded nudge citing a flagged metabolic marker when
  the health check shows one (thresholds `AHC_BMI_THRESHOLD` / `AHC_HBA1C_THRESHOLD`,
  marked TODO for clinical sign-off); neutral PCOS-check copy otherwise.

### `banner.html` — combined PCOS assessment
- `classify()` folds **AHC lab markers** (BMI, HbA1c) into the Kalra **metabolic
  domain** when `forher.ahc.v1` has them — one combined result, not a second verdict.
- When AHC is present, the self-report metabolic question is dropped (8→7) and a
  **pre-fill card** shows the counted metabolic signals atop the first question.
- The "why this result" list tags AHC-sourced signals; the result is marked
  **preliminary** only when no health check is on record.

### `ahc.html`
- Persists raw lab markers (`markers: { bmi, hba1c, tsh }`, value + flagged) into
  `forher.ahc.v1` so the rest of For Her can read the metabolic domain without re-asking.

### `cycle.html`
- Intent persisted to **`forher.intent.v1`** `{intent,setAt}` (legacy `journey.v1`
  read as fallback). Intent stays editable — the gate is reachable on every entry.
- **Pregnancy** view surfaces a prior PCOS result (tier-aware care note): pregnancy
  drops the cycle questionnaire + prediction but **not** the PCOS flag, since it raises
  gestational-diabetes / pre-eclampsia risk and warrants earlier glucose monitoring.
- Loads `forher-community.js` and renders the community hooks below the today card,
  using the live phase + stored intent.
- (Learned cycle-length engine was already present: `getCycleLength`,
  `recomputeCycleLength`, `getAllPeriodStarts`, live `CYCLE_LENGTH` getter.)

### `forher-community.js` — NEW
- `FORHER_TIPS`: seed set (~5 tips per phase) across kinds `peer | pacing | recipe`,
  marked `// DRAFT — pending clinical review`.
- `getCommunityHooks(phase, intent)`: phase + intent match (intent-specific first,
  then `any`).
- `renderCommunity(containerEl, phase, intent)`: embeddable; injects scoped styles,
  draws the three hook types as cards with a non-medical disclaimer. Peer tips framed
  as "women found this helped"; pacing is about your own pace, not a leaderboard.

### `forher-widget.html`
- No change needed — already aligned with the PCOS-first model (default CTA opens the
  assessment; after a result it reads `forher.pcos.v1` and switches to tracking with
  tier-aware copy).

## Open product decisions (flagged, not guessed)

- **Home priority once a user has BOTH a PCOS result and logged cycle data**: RESOLVED —
  the **daily card leads** and the PCOS result rides along as a compact tappable risk
  chip (→ banner.html). Depth (action plan, what-it-means) is carried by the daily
  hooks / community, not the home card. Before any cycle data, a saved result still
  shows on its own to invite tracking.
- **AHC metabolic thresholds** (`AHC_BMI_THRESHOLD=25`, `AHC_HBA1C_THRESHOLD=5.7`):
  placeholders, left as TODO for clinical sign-off.
- **TTC 12-month nudge**: data is trackable from logged history; surfacing a Tulip
  pre-conception prompt is left gentle / non-automatic per spec — not yet wired.
- All `FORHER_TIPS` copy is DRAFT pending clinical review.

## Verification
- `node --check` passes on the inline JS of every edited HTML file and on
  `forher-community.js` (see the extraction helper used during development).
- Browser click-through confirmed: home card reflects PCOS tier; AHC fuses to a higher
  combined tier; intent persists; pregnancy surfaces the PCOS note; community hooks
  filter by phase + intent.
