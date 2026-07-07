// Phase 3 clinic nudges: pure detection + persisted dismissal. `activeNudge` returns
// the highest-priority nudge that fires and isn't dismissed, or null. `today` is
// injected so detection is deterministic in tests.
import type { Persona } from "@/types/persona";
import type { CareTrack } from "@/types/journey";
import { shouldResurfaceAssessment } from "@/lib/journey";
import { periodDaysSet, type DayLog } from "./daylog";
import type { CycleLog } from "./state";

export type NudgeType = "missed-period" | "irregular" | "symptom" | "wellness";
export type Nudge = { type: NudgeType; title: string; body: string; cta: string; href: string };

const HREF = "/clinic";
const CTA = "Book a check-in";
const DAY_MS = 86400000;

const CONCERNING = ["acne", "hair_loss", "pelvic_pain", "bladder_incontinence"];
const SYMPTOM_LABEL: Record<string, string> = {
  acne: "acne", hair_loss: "hair loss", pelvic_pain: "pelvic pain", bladder_incontinence: "bladder issues",
};

function latestPeriodISO(cycleLog: CycleLog, dayLog: DayLog): string | null {
  const days = [...periodDaysSet(dayLog)];
  if (cycleLog.lastPeriod) days.push(cycleLog.lastPeriod);
  if (!days.length) return null;
  days.sort(); // YYYY-MM-DD sorts lexicographically = chronologically
  return days[days.length - 1];
}

function missedPeriodNudge(cycleLog: CycleLog | null, dayLog: DayLog, cycleLength: number, today: Date): Nudge | null {
  if (!cycleLog || cycleLog.intent === "pregnant") return null;
  const lastISO = latestPeriodISO(cycleLog, dayLog);
  if (!lastISO) return null;
  const daysSince = Math.floor((today.getTime() - new Date(`${lastISO}T00:00:00`).getTime()) / DAY_MS);
  if (daysSince <= 2 * cycleLength) return null;
  return cycleLog.intent === "ttc"
    ? { type: "missed-period", title: "Your period's late", body: "This could be worth a test or a quick chat — book a check-in.", cta: CTA, href: HREF }
    : { type: "missed-period", title: "A missed period is worth a look", body: "Worth checking with a doctor — thyroid, hormones, and ruling a few things out.", cta: CTA, href: HREF };
}

function dayDiff(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / DAY_MS);
}

/** Collapse logged period days into period-start dates (first day of each run). */
function periodStarts(dayLog: DayLog): string[] {
  const days = [...periodDaysSet(dayLog)].sort();
  const starts: string[] = [];
  for (let i = 0; i < days.length; i++) {
    if (i === 0 || dayDiff(days[i - 1], days[i]) > 1) starts.push(days[i]);
  }
  return starts;
}

/** ≥2 cycle gaps outside the normal 21–35 day range → irregular (the 2-cycle rule). */
function isIrregularHistory(starts: string[]): boolean {
  const sorted = [...new Set(starts)].sort();
  let out = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = dayDiff(sorted[i - 1], sorted[i]);
    if (gap > 35 || gap < 21) out++;
  }
  return out >= 2;
}

function irregularNudge(persona: Persona, dayLog: DayLog): Nudge | null {
  // Prefer her own logged periods; fall back to (and combine with) the seed history.
  const combined = [...(persona.pmos?.cycleHistory ?? []), ...periodStarts(dayLog)];
  const irregular = isIrregularHistory(combined) || shouldResurfaceAssessment(persona, 0);
  if (!irregular) return null;
  return { type: "irregular", title: "Your cycles have been irregular", body: "A check-in could help rule a few things out.", cta: CTA, href: HREF };
}

function symptomNudge(dayLog: DayLog): Nudge | null {
  const counts: Record<string, number> = {};
  let days = 0;
  for (const entry of Object.values(dayLog)) {
    const hit = (entry.symptoms ?? []).filter((s) => CONCERNING.includes(s));
    if (hit.length) {
      days++;
      for (const s of hit) counts[s] = (counts[s] ?? 0) + 1;
    }
  }
  if (days < 3) return null;
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  return { type: "symptom", title: "Some symptoms worth a check", body: `You've logged ${SYMPTOM_LABEL[top]} a few times — a check-in could help get ahead of it.`, cta: CTA, href: HREF };
}

function wellnessNudge(): Nudge {
  return { type: "wellness", title: "Here whenever you need", body: "A question about your hormonal health? A wellness check-in is here whenever you want one.", cta: CTA, href: HREF };
}

export function activeNudge(args: {
  tier: CareTrack;
  persona: Persona;
  cycleLog: CycleLog | null;
  dayLog: DayLog;
  cycleLength: number;
  today: Date;
  dismissed: Set<NudgeType>;
}): Nudge | null {
  const { tier, persona, cycleLog, dayLog, cycleLength, today, dismissed } = args;
  if (tier === "medium" || tier === "high") return null;
  const candidates: (Nudge | null)[] = [
    missedPeriodNudge(cycleLog, dayLog, cycleLength, today),
    irregularNudge(persona, dayLog),
    symptomNudge(dayLog),
    tier === "none" ? wellnessNudge() : null,
  ];
  for (const n of candidates) if (n && !dismissed.has(n.type)) return n;
  return null;
}

const key = (id: string) => `forher.${id}.nudgeDismissed`;

export function readDismissed(id: string): Set<NudgeType> {
  try {
    const raw = JSON.parse(localStorage.getItem(key(id)) ?? "null");
    return new Set(Array.isArray(raw) ? (raw as NudgeType[]) : []);
  } catch {
    return new Set();
  }
}
export function dismissNudge(id: string, type: NudgeType) {
  try {
    const next = readDismissed(id);
    next.add(type);
    localStorage.setItem(key(id), JSON.stringify([...next]));
  } catch {
    /* ignore */
  }
}
