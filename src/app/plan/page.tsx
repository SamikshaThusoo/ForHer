"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer, PLAN_LAST_DAY } from "@/lib/forher/state";
import type { TaskCategory } from "@/types/journey";
import {
  resolveTasksForDay, pickThreeThings, getPhase, getCyclePhase, getTouchpointsDue, personaTrack,
} from "@/lib/journey";
import { CAT_LABEL, CAT_ORDER } from "@/lib/forher/taskmeta";
import { TaskCard } from "@/components/forher/TaskCard/TaskCard";
import { BottomNav } from "@/components/forher/BottomNav/BottomNav";
import {
  ChevronLeft, Activity, Salad, ClipboardCheck, Moon, Brain, BookOpen, MessagesSquare, Stethoscope,
} from "lucide-react";
import styles from "./plan.module.css";

const PHASE_LABEL: Record<string, string> = {
  entry: "Entry", foundation: "Foundation", build: "Build", consolidate: "Consolidate", review: "Review",
};
const CAT_ICON: Record<TaskCategory, React.ComponentType<{ size?: number }>> = {
  move: Activity, nourish: Salad, track: ClipboardCheck, sleep: Moon,
  mind: Brain, learn: BookOpen, connect: MessagesSquare, clinical: Stethoscope,
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const PRESETS = [1, 30, 60, 90];

export default function PlanPage() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const track = personaTrack(persona);

  if (!fh.hydrated) return <main className={`${styles.page} fhTheme`} />;

  if (!persona.pmos?.eligible) {
    return (
      <main className={`${styles.page} fhTheme`}>
        <div className={styles.empty}>
          <p>The PMOS plan isn&apos;t available for this profile.</p>
          <Link href="/" className={styles.back2}>Back</Link>
        </div>
      </main>
    );
  }

  if (track === "none") {
    return (
      <main className={`${styles.page} fhTheme`}>
        <header className={styles.head}>
          <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
          <span className={styles.brandline}>For Her · PMOS</span>
        </header>
        <div className={styles.empty}>
          <h1 className={styles.h1}>You&apos;re on the engagement track</h1>
          <p className={styles.emptySub}>No daily care plan needed right now — keep tracking your cycle, mood and habits, and we&apos;ll re-check over time.</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  const tasks = resolveTasksForDay(persona, fh.day);
  const three = pickThreeThings(tasks);
  const threeIds = new Set(three.map((t) => t.id));
  const rest = tasks.filter((t) => !threeIds.has(t.id));
  const phase = getPhase(fh.day);
  const cycle = getCyclePhase(persona, fh.day);
  const due = getTouchpointsDue(persona, fh.day);
  const completed = tasks.filter((t) => fh.isDone(t.id)).length;
  const pct = Math.round((completed / Math.max(1, tasks.length)) * 100);

  const groups = CAT_ORDER
    .map((cat) => ({ cat, items: rest.filter((t) => t.category === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.head}>
        <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · PMOS</span>
      </header>

      <div className={styles.hero}>
        <h1 className={styles.h1}>Your <em>90-day</em> plan</h1>
        <div className={styles.phaseRow}>
          <span className={styles.jphasePill}>{PHASE_LABEL[phase]} phase</span>
          <span className={styles.cyclePill}>{cap(cycle.phase)} phase{cycle.confidence === "low" ? " (est.)" : ""}</span>
        </div>
      </div>

      {/* Day scrubber */}
      <div className={styles.scrub}>
        <div className={styles.scrubTop}>
          <span className={styles.dayNum}>Day {fh.day}<span className={styles.dayTot}> / {PLAN_LAST_DAY}</span></span>
          <span className={styles.progressText}>{completed}/{tasks.length} done</span>
        </div>
        <input
          className={styles.range} type="range" min={1} max={PLAN_LAST_DAY} value={fh.day}
          onChange={(e) => fh.setDay(Number(e.target.value))} aria-label="Day in plan"
        />
        <div className={styles.progressTrack}><i style={{ width: `${pct}%` }} /></div>
        <div className={styles.presets}>
          {PRESETS.map((d) => (
            <button key={d} type="button"
              className={`${styles.preset} ${fh.day === d ? styles.presetOn : ""}`}
              onClick={() => fh.setDay(d)}>Day {d}</button>
          ))}
        </div>
      </div>

      {due.length > 0 && (
        <div className={styles.clinical}>
          <span className={styles.clinicalTag}>Scheduled today</span>
          {due.map((t) => <div key={t.kind + t.day} className={styles.clinicalRow}>{t.label}</div>)}
        </div>
      )}

      {/* 3 things today */}
      <div className={styles.catHead}><span className={styles.catHi}>★</span> 3 things today</div>
      <div className={styles.tasks}>
        {three.map((t) => (
          <TaskCard key={t.id} task={t} done={fh.isDone(t.id)} onToggle={() => fh.toggleDone(t.id)} highlight />
        ))}
      </div>

      {/* Everything else, grouped by category */}
      {groups.map(({ cat, items }) => {
        const Icon = CAT_ICON[cat];
        return (
          <div key={cat}>
            <div className={styles.catHead}><Icon size={15} /> {CAT_LABEL[cat]}</div>
            <div className={styles.tasks}>
              {items.map((t) => (
                <TaskCard key={t.id} task={t} done={fh.isDone(t.id)} onToggle={() => fh.toggleDone(t.id)} />
              ))}
            </div>
          </div>
        );
      })}

      <p className={styles.disclaimer}>Lifestyle support for general wellbeing — not medical advice. Your care team makes any clinical calls.</p>
      <BottomNav />
    </main>
  );
}
