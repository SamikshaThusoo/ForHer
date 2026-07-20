import type { Persona } from "@/types/persona";
import type { CyclePhase } from "@/types/journey";
import { learnedCycleLength } from "@/lib/journey";

// Calendar/hormone helpers for the companion screens. They reuse the engine's
// learned cycle length (no engine changes) and mirror its phase boundaries.

// Day numbers from calendar Y/M/D only (no time-of-day, no timezone drift).
function isoDayNum(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}
function dateDayNum(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

export function cycleLengthFor(persona: Persona, storedCycleLength?: number): number {
  // The user's typical cycle length wins, bypassing the learned [21,40] clamp so
  // long (often irregular) PCOS cycles up to 90 days actually drive prediction.
  // Fall back to the learned average from her history — 28 when nothing to learn.
  if (storedCycleLength && Number.isFinite(storedCycleLength) && storedCycleLength >= 20 && storedCycleLength <= 90) {
    return Math.round(storedCycleLength);
  }
  return learnedCycleLength(persona.pmos?.cycleHistory ?? []);
}

function lastStartFor(persona: Persona): string | undefined {
  const hist = persona.pmos?.cycleHistory ?? [];
  if (hist.length) return [...hist].sort()[hist.length - 1];
  return persona.pmos?.enrollmentDay;
}

/** 1-based cycle day for a calendar date. */
export function cycleDayForDate(persona: Persona, date: Date): number {
  const last = lastStartFor(persona);
  const L = cycleLengthFor(persona);
  if (!last) return 1;
  const days = dateDayNum(date) - isoDayNum(last);
  return (((days % L) + L) % L) + 1;
}

/** 1-based cycle day from a logged last-period date + cycle length. */
export function cycleDayFromLog(lastPeriodISO: string, length: number, date: Date): number {
  const days = dateDayNum(date) - isoDayNum(lastPeriodISO);
  return (((days % length) + length) % length) + 1;
}

/** Ovulation day. The luteal phase is ~constant at 14 days, so ovulation counts
 *  back from the next period rather than sitting at the cycle midpoint — correct
 *  at 28 (= day 14) and for the long cycles this product targets (40 → day 26).
 *  No clinical floor; the max(1,…) only guards against a non-positive day. */
export function ovulationDay(L: number): number {
  return Math.max(1, L - 14);
}

/** Phase for a 1-based cycle day. Menstrual spans the entered period `duration`,
 *  and the ovulatory band is anchored on ovulation (L−14), not the midpoint. */
export function phaseForCycleDay(cycleDay: number, L: number, duration = 5): CyclePhase {
  const ov = ovulationDay(L);
  const ovStart = ov - 1;
  const ovEnd = ov + 2;
  if (cycleDay <= duration) return "menstrual";
  if (cycleDay < ovStart) return "follicular";
  if (cycleDay <= ovEnd) return "ovulatory";
  return "luteal";
}

/** Map an actual cycle day (length L, ovulation at L−14) onto the 28-day hormone
 *  template so the curves' landmarks land on the real ovulation day: the follicular
 *  half stretches/shrinks to put ovulation at template day 14, the luteal half maps
 *  ~1:1 (it is already ~14 days). Keeps the educational curve shapes intact. */
export function hormoneTemplateDay(d: number, L: number): number {
  const ov = ovulationDay(L);
  if (d <= ov) return 1 + (d - 1) * 13 / Math.max(1, ov - 1);
  return 14 + (d - ov) * 14 / Math.max(1, L - ov);
}

/** Predicted date of the next period (next menstrual start). */
export function nextPeriodDate(persona: Persona, from: Date): Date {
  const L = cycleLengthFor(persona);
  const today = cycleDayForDate(persona, from);
  const daysToStart = today === 1 ? 0 : L - today + 1;
  return new Date(from.getTime() + daysToStart * 86400000);
}

export const PHASE_COLOR: Record<CyclePhase, string> = {
  menstrual: "#C76B7A",
  follicular: "#4F9D69",
  ovulatory: "#C9A24A",
  luteal: "#8E5378",
};
export const PHASE_LABEL: Record<CyclePhase, string> = {
  menstrual: "Menstrual", follicular: "Follicular", ovulatory: "Ovulatory", luteal: "Luteal",
};
export const PHASE_PROSE: Record<CyclePhase, string> = {
  menstrual: "Estrogen and progesterone are at their lowest — a time for gentle pace and deep rest.",
  follicular: "Estrogen is climbing — energy, motivation and mental clarity tend to rise.",
  ovulatory: "Estrogen is high and LH surges — confidence, drive and energy often peak.",
  luteal: "Progesterone rises — focus can deepen, but bloating, cravings and acne may build.",
};

// ---- Native hormone rhythm model (normalized 0..1), keyed to cycle length L ----
// Each hormone is a smooth, CONTINUOUS function of the cycle day, parameterized by
// the seeded cycle length and its ovulation day (L-14) — no fixed 28-day template,
// so the landmarks (follicular rise, ovulatory surge, luteal peak) scale with N.
// Absolute serum concentrations differ by orders of magnitude, so every hormone is
// normalized to its OWN maximum: this is a relative-levels, educational chart.
const gauss = (d: number, mu: number, sigma: number) =>
  Math.exp(-((d - mu) ** 2) / (2 * sigma * sigma));
// Asymmetric gaussian: a broad rise (sL) and a sharper fall (sR) around the peak.
const agauss = (d: number, mu: number, sL: number, sR: number) =>
  d <= mu ? gauss(d, mu, sL) : gauss(d, mu, sR);
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

export type HormoneKey = "estrogen" | "progesterone" | "lh" | "testosterone";

/** Raw (un-normalized) hormone levels for a (possibly fractional) cycle day. The
 *  luteal span is a fixed ~14 (ov = L-14); the follicular span stretches with L. */
function rawHormones(d: number, L: number, ov: number): Record<HormoneKey, number> {
  const foll = Math.max(2, ov - 1); // follicular span (day 1 -> ovulation)
  const lut = Math.max(2, L - ov);  // luteal span (~14)
  const midLuteal = ov + lut / 2;
  return {
    // Rises through the follicular phase, peaks just before ovulation (broad rise,
    // sharp post-peak fall = the ovulatory dip), then a smaller secondary luteal rise.
    estrogen:
      0.08 +
      1.0 * agauss(d, ov - 1, foll / 2.4, 2.2) +
      0.5 * gauss(d, midLuteal, lut / 3.2),
    // Flat and low, with a sharp narrow surge at ovulation.
    lh: 0.1 + 1.0 * gauss(d, ov, Math.max(0.9, lut / 12)),
    // Near-zero in the follicular phase, rises after ovulation to a mid-luteal
    // peak, then falls before menses.
    progesterone:
      0.04 + 0.96 * sigmoid((d - (ov + 2)) / 1.6) * gauss(d, midLuteal, lut / 2.7),
    // Gentle: a moderate baseline with a slight rise around ovulation.
    testosterone: 0.3 + 0.38 * gauss(d, ov, foll / 2.4),
  };
}

/** Normalized (0..1) hormone model for a cycle of length L. `value(key, d)` accepts
 *  fractional days so the current-day dots ride the curves smoothly while scrubbing;
 *  the curves and the dots are both read from this one function. */
export function hormoneModel(L: number) {
  const ov = ovulationDay(L);
  const keys: HormoneKey[] = ["estrogen", "progesterone", "lh", "testosterone"];
  const max: Record<HormoneKey, number> = { estrogen: 1e-6, progesterone: 1e-6, lh: 1e-6, testosterone: 1e-6 };
  for (let d = 1; d <= L; d++) {
    const r = rawHormones(d, L, ov);
    for (const k of keys) if (r[k] > max[k]) max[k] = r[k];
  }
  const value = (key: HormoneKey, d: number) =>
    Math.max(0, Math.min(1, rawHormones(d, L, ov)[key] / max[key]));
  return { ov, value };
}

export const HORMONES: { key: HormoneKey; label: string; color: string; note: string }[] = [
  { key: "estrogen", label: "Estrogen", color: "#C76B7A",
    note: "Drives energy and mood; rises through the follicular phase, peaks at ovulation." },
  { key: "progesterone", label: "Progesterone", color: "#8E5378",
    note: "The calming, grounding hormone of the luteal phase; can also bring bloating." },
  { key: "lh", label: "LH", color: "#C9A24A",
    note: "Surges sharply mid-cycle to trigger ovulation." },
  { key: "testosterone", label: "Testosterone", color: "#2F7A7A",
    note: "Supports drive and libido; tends to run higher with PMOS." },
];
