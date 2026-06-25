"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer, PLAN_LAST_DAY } from "@/lib/forher/state";
import {
  resolveDailyPlan, getPhase, getCyclePhase, getTouchpointsDue, personaTrack,
} from "@/lib/journey";
import { WINDOW_FOR_CAT, WINDOW_ORDER, WINDOW_LABEL, WINDOW_TIME } from "@/lib/forher/taskmeta";
import { TaskCard } from "@/components/forher/TaskCard/TaskCard";
import { ChevronLeft, Clock } from "lucide-react";
import styles from "./plan.module.css";

const PHASE_LABEL: Record<string, string> = {
  foundation: "Foundation", build: "Build", milestone: "Milestone",
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
          <Link href="/forher" className={styles.back2}>Back</Link>
        </div>
      </main>
    );
  }

  if (track === "none") {
    return (
      <main className={`${styles.page} fhTheme`}>
        <header className={styles.head}>
          <Link href="/forher" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
          <span className={styles.brandline}>For Her · PMOS</span>
        </header>
        <div className={styles.empty}>
          <h1 className={styles.h1}>You&apos;re on the engagement track</h1>
          <p className={styles.emptySub}>No daily care plan needed right now — keep tracking your cycle, mood and habits, and we&apos;ll re-check over time.</p>
        </div>
      </main>
    );
  }

  // The focused daily set — 5 tasks, surfaced in their scheduled time windows.
  const tasks = resolveDailyPlan(persona, fh.day);
  const phase = getPhase(fh.day);
  const cycle = getCyclePhase(persona, fh.day);
  const due = getTouchpointsDue(persona, fh.day);
  const completed = tasks.filter((t) => fh.isDone(t.id)).length;
  const pct = Math.round((completed / Math.max(1, tasks.length)) * 100);

  const windows = WINDOW_ORDER
    .map((w) => ({ w, items: tasks.filter((t) => WINDOW_FOR_CAT[t.category] === w) }))
    .filter((g) => g.items.length > 0);

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.head}>
        <Link href="/forher" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
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
          <span className={styles.progressText}>{completed}/{tasks.length} today</span>
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

      <div className={styles.todayLine}>Today&apos;s 5, timed to your day</div>

      {/* Daily 5, grouped by scheduled time window */}
      {windows.map(({ w, items }, gi) => (
        <div key={w} className="fhReveal" style={{ animationDelay: `${Math.min(gi * 80, 400)}ms` }}>
          <div className={styles.winHead}>
            <span className={styles.winLabel}><Clock size={13} /> {WINDOW_LABEL[w]}</span>
            <span className={styles.winTime}>{WINDOW_TIME[w]}</span>
          </div>
          <div className={styles.tasks}>
            {items.map((t) => (
              <TaskCard key={t.id} task={t} done={fh.isDone(t.id)} onToggle={() => fh.toggleDone(t.id)} />
            ))}
          </div>
        </div>
      ))}

      <p className={styles.disclaimer}>Lifestyle support for general wellbeing — not medical advice. Your care team makes any clinical calls.</p>
    </main>
  );
}
