"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePersona } from "@/context/PersonaContext";
import type { JourneyTask, TaskTarget, RouteTarget } from "@/types/journey";
import {
  resolveTasksForDay, pickThreeThings, getPhase, getCyclePhase,
  getTouchpointsDue, personaTrack, TRACK_LABELS,
} from "@/lib/journey";
import { ChevronLeft } from "lucide-react";
import styles from "./plan.module.css";

const PHASE_LABEL: Record<string, string> = {
  entry: "Entry", foundation: "Foundation", build: "Build",
  consolidate: "Consolidate", review: "Review",
};
const CAT_LABEL: Record<JourneyTask["category"], string> = {
  move: "Move", nourish: "Nourish", track: "Track", mind: "Mind",
  learn: "Learn", connect: "Connect", clinical: "Clinical",
};

// Where a task's "log it" action goes. Surfaces that exist get a real route;
// the rest fall back to the mood/cycle log so every task is actionable.
const ROUTE_HREF: Partial<Record<RouteTarget, string>> = {
  "food-logger": "/cares/food",
  scanner: "/cares/scan",
  ask: "/cares/ask",
  consult: "/cares/care-team",
  "cycle-log": "/log/mood",
};

function fmtTarget(t: TaskTarget): string {
  switch (t.kind) {
    case "steps": return `${t.value.toLocaleString()} steps`;
    case "duration_min": return `${t.value} ${t.unit ?? "min"}`;
    case "count": return `${t.value}${t.unit ? " " + t.unit : ""}`;
    case "sessions_week": return `${t.value}×/week`;
    case "boolean": return "";
  }
}

const PRESETS = [
  { label: "Day 1", day: 1 },
  { label: "Day 30", day: 30 },
  { label: "Day 90", day: 90 },
  { label: "Day 120", day: 120 },
  { label: "Day 180", day: 180 },
];

export default function PlanPage() {
  const { persona } = usePersona();
  const router = useRouter();
  const [day, setDay] = useState(30);
  const [done, setDone] = useState<Set<string>>(new Set());

  const track = personaTrack(persona);
  const maxDay = track === "low" ? 30 : 182;

  const tasks = useMemo(() => resolveTasksForDay(persona, day), [persona, day]);
  const phase = getPhase(day);
  const cycle = getCyclePhase(persona, day);
  const due = getTouchpointsDue(persona, day);
  const top3 = useMemo(() => pickThreeThings(tasks).map((t) => t.id), [tasks]);

  const toggle = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (!persona.pmos?.eligible) {
    return (
      <main className={styles.page}>
        <div className={styles.empty}>
          <p>The PMOS plan isn&apos;t available for this profile.</p>
          <Link href="/" className={styles.back2}>Back</Link>
        </div>
      </main>
    );
  }

  if (track === "none") {
    return (
      <main className={styles.page}>
        <header className={styles.head}>
          <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
          <span className={styles.brandline}>For Her · PMOS</span>
        </header>
        <div className={styles.empty}>
          <h1 className={styles.h1}>You&apos;re on the engagement track</h1>
          <p className={styles.emptySub}>No daily care plan needed right now — keep tracking your cycle, mood and habits, and we&apos;ll re-check over time.</p>
        </div>
      </main>
    );
  }

  const completedCount = tasks.filter((t) => done.has(t.id)).length;

  return (
    <main className={styles.page}>
      <header className={styles.head}>
        <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · PMOS</span>
      </header>

      <div className={styles.hero}>
        <span className={styles.eyebrow}>{TRACK_LABELS[track]}</span>
        <h1 className={styles.h1}>Your <em>{maxDay === 30 ? "30-day" : "6-month"}</em> plan</h1>
        <p className={styles.heroSub}>Daily lifestyle steps, tuned to your PMOS risk and where you are in your cycle. Check them off as you go.</p>
      </div>

      {/* Day scrubber */}
      <div className={styles.scrub}>
        <div className={styles.scrubTop}>
          <span className={styles.dayNum}>Day {day}<span className={styles.dayTot}> / {maxDay}</span></span>
          <span className={styles.phasePill}>{PHASE_LABEL[phase]} · {cycle.phase}{cycle.confidence === "low" ? " ?" : ""}</span>
        </div>
        <input
          className={styles.range}
          type="range" min={0} max={maxDay} value={Math.min(day, maxDay)}
          onChange={(e) => setDay(Number(e.target.value))}
          aria-label="Day in plan"
        />
        <div className={styles.presets}>
          {PRESETS.filter((p) => p.day <= maxDay).map((p) => (
            <button key={p.day} type="button"
              className={`${styles.preset} ${day === p.day ? styles.presetOn : ""}`}
              onClick={() => setDay(p.day)}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Clinical touchpoint due today */}
      {due.length > 0 && (
        <div className={styles.clinical}>
          <span className={styles.clinicalTag}>Scheduled today</span>
          {due.map((t) => <div key={t.kind + t.day} className={styles.clinicalRow}>{t.label}</div>)}
        </div>
      )}

      {/* Today's tasks */}
      <div className={styles.tasksHead}>
        <span className={styles.tasksTitle}>Today&apos;s tasks</span>
        <span className={styles.tasksCount}>{completedCount}/{tasks.length} done</span>
      </div>
      <div className={styles.tasks}>
        {tasks.map((t) => {
          const checked = done.has(t.id);
          const target = fmtTarget(t.target);
          const href = ROUTE_HREF[t.routeTo];
          return (
            <div key={t.id}
              className={`${styles.task} ${checked ? styles.taskDone : ""} ${top3.includes(t.id) ? styles.taskTop : ""}`}>
              <button type="button" className={`${styles.check} ${checked ? styles.checkOn : ""}`}
                onClick={() => toggle(t.id)} aria-label={checked ? "Mark not done" : "Mark done"}>
                {checked ? "✓" : ""}
              </button>
              <button type="button" className={styles.taskBody}
                onClick={() => (href ? router.push(href) : toggle(t.id))}>
                <span className={styles.taskTitle}>
                  {t.title}{target && <span className={styles.taskTarget}>{target}</span>}
                  {href && <span className={styles.taskGo}>Log ›</span>}
                </span>
                <span className={styles.taskDetail}>{t.detail}</span>
              </button>
              <span className={`${styles.cat} ${styles["cat_" + t.category]}`}>{CAT_LABEL[t.category]}</span>
            </div>
          );
        })}
      </div>

      <p className={styles.disclaimer}>Lifestyle support for general wellbeing — not medical advice. Your care team makes any clinical calls.</p>
    </main>
  );
}
