// Pure read-only helpers for the Daily + Milestone progress views. No marker/cycle/plan
// math is changed here — snapshots and ranges are only read + bucketed.
import type { Persona } from "@/types/persona";
import type { MarkerSet } from "@/types/journey";
import { getMarkerSnapshot, type PlanVisit } from "@/lib/journey";
import { periodDaysSet, type DayLog } from "./daylog";

const DAY_MS = 86400000;

/** The next scheduled appointment on or after the current plan day (visits are sorted). */
export function nextVisit(visits: PlanVisit[], day: number): PlanVisit | null {
  return visits.find((v) => v.day >= day) ?? null;
}

/** Tasks completed + days with ≥1 task, within an inclusive plan-day range. */
export function phaseActivity(done: Record<number, string[]>, from: number, to: number): { tasks: number; activeDays: number } {
  let tasks = 0;
  let activeDays = 0;
  for (let d = from; d <= to; d++) {
    const n = (done[d] ?? []).length;
    tasks += n;
    if (n > 0) activeDays++;
  }
  return { tasks, activeDays };
}

/** Shift an ISO day by n days, timezone-independent (UTC in and out). */
function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Calendar date → 1-based plan day (enrollmentDay = day 1). */
export function planDayForDate(enrollmentISO: string, iso: string): number {
  const diff = Math.round(
    (new Date(`${iso}T00:00:00`).getTime() - new Date(`${enrollmentISO}T00:00:00`).getTime()) / DAY_MS,
  );
  return diff + 1;
}

/** Period-starts + symptom-days whose mapped plan day falls in [from,to]. */
export function logsInPhase(
  dayLog: DayLog,
  enrollmentISO: string,
  from: number,
  to: number,
): { periods: number; symptomDays: number } {
  const inPhase = (iso: string) => {
    const pd = planDayForDate(enrollmentISO, iso);
    return pd >= from && pd <= to;
  };
  const periodDays = periodDaysSet(dayLog);
  let periods = 0;
  for (const iso of periodDays) {
    if (!inPhase(iso)) continue;
    if (!periodDays.has(shiftISO(iso, -1))) periods++; // a start = first day of a run
  }
  let symptomDays = 0;
  for (const [iso, entry] of Object.entries(dayLog)) {
    if ((entry.symptoms?.length ?? 0) > 0 && inPhase(iso)) symptomDays++;
  }
  return { periods, symptomDays };
}

export type CheckpointMarker = {
  key: keyof MarkerSet;
  label: string;
  unit: string;
  decimals: number;
  kind: "self" | "lab";
  value: number;
  state: "current" | "projected" | "measured";
};

// Which markers appear at which checkpoint (confirmed cadence).
const MARKER_CADENCE: { key: keyof MarkerSet; label: string; unit: string; decimals: number; kind: "self" | "lab"; days: number[] }[] = [
  { key: "weightKg", label: "Weight", unit: "kg", decimals: 0, kind: "self", days: [30, 60, 90] },
  { key: "waistCm", label: "Waist", unit: "cm", decimals: 0, kind: "self", days: [30, 60, 90] },
  { key: "bmi", label: "BMI", unit: "", decimals: 1, kind: "self", days: [30, 60, 90] },
  { key: "homaIr", label: "HOMA-IR", unit: "", decimals: 1, kind: "lab", days: [60, 90] },
  { key: "hba1c", label: "HbA1c", unit: "%", decimals: 1, kind: "lab", days: [90] },
];

/** Markers to show at a checkpoint, each with its projected/current/measured label. */
export function checkpointMarkers(persona: Persona, checkpointDay: number): CheckpointMarker[] {
  const snap = getMarkerSnapshot(persona, checkpointDay);
  return MARKER_CADENCE.filter((m) => m.days.includes(checkpointDay) && snap[m.key] != null).map((m) => ({
    key: m.key,
    label: m.label,
    unit: m.unit,
    decimals: m.decimals,
    kind: m.kind,
    value: snap[m.key] as number,
    state: checkpointDay === 90 ? "measured" : m.kind === "lab" ? "projected" : "current",
  }));
}
