import type { Persona } from "@/types/persona";
import type { CyclePhase, JourneyTask, TaskTarget } from "@/types/journey";
import { TASK_CATALOG, type TaskDef } from "./constants";
import { getCyclePhase } from "./cycle";
import { getTouchpointsDue, personaTrack } from "./touchpoints";

function dueToday(everyDays: number, onDay: number | undefined, dayIndex: number): boolean {
  if (onDay != null) return onDay === dayIndex;
  if (everyDays <= 1) return true;
  return dayIndex % everyDays === 0;
}

function phaseNudge(phase: CyclePhase): string {
  switch (phase) {
    case "luteal": return "Energy may dip now — keep it gentle. ";
    case "ovulatory": return "Energy is peaking — a good day to push. ";
    case "menstrual": return "Be kind to yourself today. ";
    default: return "";
  }
}

function progressiveSteps(base: TaskTarget, dayIndex: number): TaskTarget {
  // high track: ramp 6000 → 10000 across days 1–90.
  const start = 6000, end = 10000;
  const t = Math.max(0, Math.min(1, dayIndex / 90));
  const value = Math.round((start + (end - start) * t) / 500) * 500;
  return { ...base, value: Math.min(end, value) };
}

export function resolveTasksForDay(persona: Persona, dayIndex: number): JourneyTask[] {
  const track = personaTrack(persona);
  const { phase } = getCyclePhase(persona, dayIndex);
  const ttc = !!persona.pmos?.ttc;
  const out: JourneyTask[] = [];

  for (const def of TASK_CATALOG as TaskDef[]) {
    const entry = def.byTrack[track];
    if (!entry) continue;
    if (def.id === "bbt" && !ttc) continue;
    if (!dueToday(entry.everyDays, entry.onDay, dayIndex)) continue;

    let target = entry.target;
    if (def.id === "steps" && track === "high") target = progressiveSteps(entry.target, dayIndex);

    const emphasised = !!def.phaseEmphasis?.includes(phase);
    const detail = emphasised ? phaseNudge(phase) + def.detail : def.detail;
    const priority =
      def.category === "track" && def.source === "companion" ? 1 : emphasised ? 2 : 3;

    out.push({
      id: def.id, category: def.category, title: def.title, detail, target,
      cadence: entry.everyDays === 1 ? "daily" : entry.everyDays === 7 ? "weekly"
        : entry.everyDays === 14 ? "fortnightly" : entry.everyDays === 30 ? "monthly" : "scheduled",
      source: def.source, phaseEmphasis: def.phaseEmphasis, track,
      routeTo: def.routeTo, clinicalNote: def.clinicalNote, priority,
    });
  }

  for (const tp of getTouchpointsDue(persona, dayIndex)) {
    out.push({
      id: `clinical-${tp.kind}-${tp.day}`, category: "clinical", title: tp.label,
      detail: `Scheduled today: ${tp.label}.`, target: { kind: "boolean", value: 1 },
      cadence: "scheduled", source: "clinical", track, routeTo: "consult", priority: 0,
    });
  }

  const prescribed = persona.pmos?.prescribed;
  if (prescribed?.supplement && prescribed.supplement.fromDay <= dayIndex) {
    out.push({
      id: "adherence-supplement", category: "nourish", title: `Take ${prescribed.supplement.name}`,
      detail: "A reminder for what your clinician recommended.", target: { kind: "boolean", value: 1 },
      cadence: "daily", source: "clinical", track, routeTo: "placeholder", priority: 1,
    });
  }
  if (prescribed?.medication && prescribed.medication.fromDay <= dayIndex) {
    out.push({
      id: "adherence-medication", category: "nourish", title: `Take ${prescribed.medication.name}`,
      detail: "A reminder for what your clinician prescribed.", target: { kind: "boolean", value: 1 },
      cadence: "daily", source: "clinical", track, routeTo: "placeholder", priority: 1,
    });
  }

  return out;
}

export function pickThreeThings(tasks: JourneyTask[]): JourneyTask[] {
  const sorted = [...tasks].sort((a, b) => a.priority - b.priority);
  const seen = new Set<string>();
  const picked: JourneyTask[] = [];
  for (const t of sorted) {
    if (seen.has(t.category)) continue;
    seen.add(t.category);
    picked.push(t);
    if (picked.length === 3) break;
  }
  return picked;
}
