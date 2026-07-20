// Phase 3 clinic nudges: pure detection + persisted dismissal. `activeNudge` returns
// the highest-priority nudge that fires and isn't dismissed, or null. `today` is
// injected so detection is deterministic in tests.
import type { Persona } from "@/types/persona";
import type { CareTrack } from "@/types/journey";
import { shouldResurfaceAssessment } from "@/lib/journey";
import { periodDaysSet, type DayLog } from "./daylog";
import type { CycleLog } from "./state";

export type NudgeType = "missed-period" | "irregular" | "symptom" | "wellness";
export type Nudge = { type: NudgeType; title: string; body: string; points: string[]; cta: string; href: string };

const HREF = "/clinic";
const CTA = "Book a check-in";
const DAY_MS = 86400000;

// Clinical weightage — the tiebreak when two signals are equally recent.
const WEIGHT: Record<NudgeType, number> = { "missed-period": 3, irregular: 2, symptom: 1, wellness: 0 };
const isoOf = (d: Date) => { const p = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

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
  // Past 2 cycles, but not a log that's a year+ old (they've simply stopped tracking).
  if (daysSince <= 2 * cycleLength || daysSince > 365) return null;
  return cycleLog.intent === "ttc"
    ? {
        type: "missed-period",
        title: "Your period's late",
        body: "A late period can mean a few things when you're trying to conceive — a quick check-in can tell you.",
        points: [
          "Talk it through with a doctor who can see your cycle log",
          "Clear guidance on when to take a test",
          "Next steps for conception, whatever the result",
        ],
        cta: CTA,
        href: HREF,
      }
    : {
        type: "missed-period",
        title: "A missed period is worth a look",
        body: "Missed periods are worth checking — it's usually nothing serious, but worth ruling things out.",
        points: [
          "A doctor reviews the cycle you've logged",
          "Simple checks — thyroid, hormones, and ruling out pregnancy",
          "Advice on what, if anything, to do next",
        ],
        cta: CTA,
        href: HREF,
      };
}

function dayDiff(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / DAY_MS);
}

/** Recency guard so stale logs don't nag forever — is this ISO day within n days of today? */
function withinDays(iso: string, today: Date, n: number): boolean {
  return Math.abs((today.getTime() - new Date(`${iso}T00:00:00`).getTime()) / DAY_MS) <= n;
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

function irregularNudge(persona: Persona, dayLog: DayLog, today: Date): Nudge | null {
  // Once she's logged her own periods, judge irregularity from HER data alone. The
  // seeded cycleHistory (and the seed-only shouldResurfaceAssessment fallback) is just
  // demo priming for a persona who hasn't logged anything yet — mixing a fresh log with
  // a months-old seed would otherwise create a giant fake gap and flag irregular forever.
  const loggedStarts = periodStarts(dayLog).filter((iso) => withinDays(iso, today, 365));
  const irregular = loggedStarts.length > 0
    ? isIrregularHistory(loggedStarts)
    : isIrregularHistory((persona.pmos?.cycleHistory ?? []).filter((iso) => withinDays(iso, today, 365)))
      || shouldResurfaceAssessment(persona, 0);
  if (!irregular) return null;
  return {
    type: "irregular",
    title: "Your cycles have been irregular",
    body: "Irregular cycles can point to something worth understanding — a check-in helps.",
    points: [
      "A doctor reviews the cycles you've logged",
      "Checks that can explain irregular periods",
      "A simple plan to help steady your cycle",
    ],
    cta: CTA,
    href: HREF,
  };
}

function symptomNudge(dayLog: DayLog, today: Date): Nudge | null {
  const counts: Record<string, number> = {};
  let days = 0;
  for (const [iso, entry] of Object.entries(dayLog)) {
    if (!withinDays(iso, today, 90)) continue; // only the last ~3 months count
    const hit = (entry.symptoms ?? []).filter((s) => CONCERNING.includes(s));
    if (hit.length) {
      days++;
      for (const s of hit) counts[s] = (counts[s] ?? 0) + 1;
    }
  }
  if (days < 3) return null;
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  return {
    type: "symptom",
    title: "Some symptoms worth a check",
    body: `You've logged ${SYMPTOM_LABEL[top]} a few times — a check-in can help you get ahead of it.`,
    points: [
      "Share the symptoms you've been logging",
      "A doctor advises on skin, hair or pain concerns",
      "Early steps before things build up",
    ],
    cta: CTA,
    href: HREF,
  };
}

function wellnessNudge(): Nudge {
  return {
    type: "wellness",
    title: "Here whenever you need",
    body: "A wellness check-in with a doctor who can see your tracking — no referral needed.",
    points: [
      "Talk through your cycle, mood and symptoms",
      "Ask anything about your hormonal health",
      "No lab report or AHC required",
    ],
    cta: CTA,
    href: HREF,
  };
}

export function activeNudge(args: {
  tier: CareTrack;
  persona: Persona;
  cycleLog: CycleLog | null;
  dayLog: DayLog;
  cycleLength: number;
  today: Date;
}): Nudge | null {
  const { tier, persona, cycleLog, dayLog, cycleLength, today } = args;
  if (tier === "medium" || tier === "high") return null;
  const candidates: (Nudge | null)[] = [
    missedPeriodNudge(cycleLog, dayLog, cycleLength, today),
    irregularNudge(persona, dayLog, today),
    symptomNudge(dayLog, today),
    tier === "none" ? wellnessNudge() : null,
  ];
  for (const n of candidates) if (n) return n;
  return null;
}

/** True when this nudge reflects a clinical condition (not the soft wellness card). */
export function isConditionNudge(nudge: Nudge | null): boolean {
  return !!nudge && nudge.type !== "wellness";
}

/** Every firing clinical signal (missed / irregular / symptom), regardless of tier —
 *  the home card shows only the top one; the clinic page shows them all. */
/** The date of the most recent evidence behind a signal — drives time-relevance.
 *  A missed period is a live/ongoing concern (today); irregular is anchored to her
 *  most recent period start (or the seed if she hasn't logged); a symptom to the
 *  latest day she logged a concerning one. */
function recencyOf(type: NudgeType, persona: Persona, dayLog: DayLog, today: Date): string {
  if (type === "missed-period") return isoOf(today);
  if (type === "symptom") {
    let latest = "";
    for (const [iso, entry] of Object.entries(dayLog)) {
      if (withinDays(iso, today, 90) && (entry.symptoms ?? []).some((s) => CONCERNING.includes(s)) && iso > latest) latest = iso;
    }
    return latest;
  }
  if (type === "irregular") {
    const logged = periodStarts(dayLog).filter((iso) => withinDays(iso, today, 365));
    const src = logged.length > 0 ? logged : (persona.pmos?.cycleHistory ?? []).filter((iso) => withinDays(iso, today, 365));
    return src.length ? [...src].sort()[src.length - 1] : "";
  }
  return "";
}

export function activeConditions(args: {
  persona: Persona;
  cycleLog: CycleLog | null;
  dayLog: DayLog;
  cycleLength: number;
  today: Date;
}): Nudge[] {
  const { persona, cycleLog, dayLog, cycleLength, today } = args;
  // Order by time-relevance (most recent evidence first), then by clinical weight —
  // so a freshly-logged symptom outranks a months-old seeded irregular, but when two
  // signals are equally recent the heavier one (missed > irregular > symptom) wins.
  return ([
    missedPeriodNudge(cycleLog, dayLog, cycleLength, today),
    irregularNudge(persona, dayLog, today),
    symptomNudge(dayLog, today),
  ].filter(Boolean) as Nudge[]).sort((a, b) => {
    const ra = recencyOf(a.type, persona, dayLog, today);
    const rb = recencyOf(b.type, persona, dayLog, today);
    if (ra !== rb) return ra < rb ? 1 : -1; // most recent first
    return WEIGHT[b.type] - WEIGHT[a.type]; // weightage tiebreak
  });
}
