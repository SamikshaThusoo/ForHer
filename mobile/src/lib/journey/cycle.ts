import type { Persona } from "@/types/persona";
import type { CyclePhase } from "@/types/journey";

function dayKeyToDate(iso: string): number {
  return new Date(iso + "T00:00:00Z").getTime();
}
function gapsDays(history: string[]): number[] {
  const sorted = [...history].sort();
  const out: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    out.push(Math.round((dayKeyToDate(sorted[i]) - dayKeyToDate(sorted[i - 1])) / 86400000));
  }
  return out;
}

export function learnedCycleLength(cycleHistory: string[]): number {
  const gaps = gapsDays(cycleHistory).filter((g) => g >= 15 && g <= 60);
  if (!gaps.length) return 28;
  const avg = Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
  return Math.max(21, Math.min(40, avg));
}

function isIrregular(cycleHistory: string[]): boolean {
  const gaps = gapsDays(cycleHistory);
  if (!gaps.length) return false;
  if (gaps.some((g) => g > 45)) return true;
  const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  const stdev = Math.sqrt(gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length);
  return stdev > 7;
}

export function getCyclePhase(
  persona: Persona,
  dayIndex: number,
): { phase: CyclePhase; confidence: "high" | "low" } {
  const history = persona.pmos?.cycleHistory ?? [];
  const L = learnedCycleLength(history);
  const confidence = isIrregular(history) || history.length < 2 ? "low" : "high";

  // Days elapsed from the most recent start (enrollmentDay anchors dayIndex 0).
  const sorted = [...history].sort();
  const lastStart = sorted.length ? sorted[sorted.length - 1] : persona.pmos?.enrollmentDay;
  const anchorOffset = lastStart && persona.pmos
    ? Math.round((dayKeyToDate(persona.pmos.enrollmentDay) - dayKeyToDate(lastStart)) / 86400000)
    : 0;
  const elapsed = anchorOffset + dayIndex;
  const d = (((elapsed % L) + L) % L) + 1; // 1-based day-of-cycle

  const ovStart = Math.floor(L / 2) - 1;
  const ovEnd = Math.floor(L / 2) + 2;
  let phase: CyclePhase;
  if (d <= 5) phase = "menstrual";
  else if (d < ovStart) phase = "follicular";
  else if (d <= ovEnd) phase = "ovulatory";
  else phase = "luteal";

  return { phase, confidence };
}

export function shouldResurfaceAssessment(persona: Persona, _dayIndex: number): boolean {
  const history = persona.pmos?.cycleHistory ?? [];
  const gaps = gapsDays(history);
  const irregular = gaps.filter((g) => g > 35 || g < 21).length;
  return irregular >= 2;
}
