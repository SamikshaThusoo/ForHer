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

export function cycleLengthFor(persona: Persona): number {
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

/** Phase for a 1-based cycle day, matching the engine's boundaries. */
export function phaseForCycleDay(cycleDay: number, L: number): CyclePhase {
  const ovStart = Math.floor(L / 2) - 1;
  const ovEnd = Math.floor(L / 2) + 2;
  if (cycleDay <= 5) return "menstrual";
  if (cycleDay < ovStart) return "follicular";
  if (cycleDay <= ovEnd) return "ovulatory";
  return "luteal";
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

// ---- Normalized hormone model curves (0..1) over the cycle day ----
// Mirrors the For Her prototype's educational rhythm (not real serum units).
export function hEstrogen(d: number): number {
  if (d <= 5) return 0.1 + 0.05 * d;
  if (d <= 13) return 0.3 + 0.55 * ((d - 5) / 8);
  if (d <= 14) return 0.85;
  if (d <= 16) return 0.85 - 0.4 * ((d - 14) / 2);
  if (d <= 22) return 0.45 + 0.15 * Math.sin(((d - 16) / 6) * Math.PI);
  return Math.max(0.1, 0.45 - 0.4 * ((d - 22) / 6));
}
export function hLh(d: number): number {
  if (d < 12) return 0.15;
  if (d < 14) return 0.15 + 0.7 * ((d - 12) / 2);
  if (d <= 15) return Math.max(0.15, 0.85 - 0.55 * (d - 14));
  return 0.15;
}
export function hProgesterone(d: number): number {
  if (d <= 14) return 0.08;
  if (d <= 22) return 0.08 + 0.7 * ((d - 14) / 8);
  return Math.max(0.08, 0.78 - 0.65 * ((d - 22) / 6));
}
export function hTestosterone(d: number): number {
  if (d <= 8) return 0.18;
  if (d <= 12) return 0.18 + 0.32 * ((d - 8) / 4);
  if (d <= 15) return 0.5 + 0.15 * Math.sin(((d - 12) / 3) * Math.PI);
  return Math.max(0.18, 0.5 - 0.32 * ((d - 15) / 13));
}

export const HORMONES = [
  { key: "estrogen", label: "Estrogen", color: "#C76B7A", fn: hEstrogen,
    note: "Drives energy and mood; rises through the follicular phase, peaks at ovulation." },
  { key: "progesterone", label: "Progesterone", color: "#8E5378", fn: hProgesterone,
    note: "The calming, grounding hormone of the luteal phase; can also bring bloating." },
  { key: "lh", label: "LH", color: "#C9A24A", fn: hLh,
    note: "Surges sharply mid-cycle to trigger ovulation." },
  { key: "testosterone", label: "Testosterone", color: "#2F7A7A", fn: hTestosterone,
    note: "Supports drive and libido; tends to run higher with PMOS." },
] as const;
