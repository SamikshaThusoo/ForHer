"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer, PLAN_LAST_DAY } from "@/lib/forher/state";
import {
  resolveTasksForDay, pickThreeThings, getPhase, getCyclePhase, personaTrack,
} from "@/lib/journey";
import { ForHerEntryCard } from "@/components/forher/ForHerEntryCard/ForHerEntryCard";
import { TaskCard } from "@/components/forher/TaskCard/TaskCard";
import { BottomNav } from "@/components/forher/BottomNav/BottomNav";
import {
  Flame, Moon, ScanLine, BookOpen, Users, CalendarHeart, Activity, MessagesSquare, ArrowRight, TrendingUp, ChevronLeft,
} from "lucide-react";
import styles from "../home.module.css";

const PHASE_LABEL: Record<string, string> = {
  foundation: "Foundation", build: "Build", milestone: "Milestone",
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ForHerHome() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const track = personaTrack(persona);

  const backHabit = (
    <Link href="/" className={styles.backHabit}><ChevronLeft size={15} /> Habit Health</Link>
  );

  if (!fh.hydrated) return <main className={`${styles.home} fhTheme`} />;

  // ---- STATE 1: not assessed → welcome ----
  if (!fh.assessed) {
    return (
      <main className={`${styles.home} fhTheme`}>
        {backHabit}
        <header className={styles.top}>
          <div className={styles.wordmark}>For Her <span className={styles.tag}>PMOS</span></div>
        </header>
        <section className={styles.hero}>
          <p className={styles.hi}>Hi {persona.shortName}</p>
          <h1 className={styles.h1}>Your cycle &amp; hormones, <em>handled with care</em></h1>
          <p className={styles.lead}>A guided PMOS program — understand your risk, then follow a plan that fits your everyday.</p>
          <p className={styles.aka}><strong>PMOS</strong> (Polyendocrine Metabolic Ovarian Syndrome) — the condition you may know as <strong>PCOS</strong>.</p>
        </section>
        <ForHerEntryCard />
      </main>
    );
  }

  const cycle = getCyclePhase(persona, fh.day);
  const phaseChip = (
    <span className={styles.cyclePill}>{cap(cycle.phase)} phase{cycle.confidence === "low" ? " (est.)" : ""}</span>
  );

  // ---- STATE 3: assessed, no risk → companion ----
  if (track === "none") {
    return (
      <main className={`${styles.home} fhTheme`}>
        {backHabit}
        <header className={styles.dashTop}>
          <div className={styles.wordmark}>For Her <span className={styles.tag}>PMOS</span></div>
        </header>
        <section className={styles.dashHero}>
          <p className={styles.hi}>Hi {persona.shortName}</p>
          <div className={styles.phaseRow}>{phaseChip}</div>
          <h2 className={styles.dashH2}>You&apos;re in <em>good shape</em></h2>
          <p className={styles.lead}>No daily plan needed right now — keep tracking your cycle and we&apos;ll re-check over time.</p>
        </section>

        <div className={`${styles.quickGrid} fhReveal`}>
          <Link href="/cycle" className={styles.quick}><CalendarHeart size={20} /><span>Cycle</span></Link>
          <Link href="/hormones" className={styles.quick}><Activity size={20} /><span>Hormones</span></Link>
          <Link href="/community" className={styles.quick}><MessagesSquare size={20} /><span>Community</span></Link>
          <Link href="/log/mood" className={styles.quick}><Moon size={20} /><span>Track mood</span></Link>
        </div>

        <BottomNav />
      </main>
    );
  }

  // ---- STATE 2: assessed, on care plan → daily dashboard ----
  const tasks = resolveTasksForDay(persona, fh.day);
  const three = pickThreeThings(tasks);
  const jphase = getPhase(fh.day);

  return (
    <main className={`${styles.home} fhTheme`}>
      {backHabit}
      <header className={styles.dashTop}>
        <div className={styles.wordmark}>For Her <span className={styles.tag}>PMOS</span></div>
        {fh.streak > 0 && (
          <span className={styles.streak}><Flame size={13} /> {fh.streak}-day streak</span>
        )}
      </header>

      <section className={styles.dashHero}>
        <p className={styles.hi}>Hi {persona.shortName}</p>
        <div className={styles.phaseRow}>
          <span className={styles.jphasePill}>{PHASE_LABEL[jphase]} phase</span>
          {phaseChip}
        </div>
      </section>

      <div className={styles.scrub}>
        <div className={styles.scrubTop}>
          <span className={styles.dayNum}>Day {fh.day}<span className={styles.dayTot}> / {PLAN_LAST_DAY}</span></span>
        </div>
        <input
          className={styles.range} type="range" min={1} max={PLAN_LAST_DAY} value={fh.day}
          onChange={(e) => fh.setDay(Number(e.target.value))} aria-label="Day in plan"
        />
      </div>

      <div className={styles.sectionHead}>
        <span className={styles.sectionTitle}>3 things today</span>
        <span className={styles.sectionCount}>{three.filter((t) => fh.isDone(t.id)).length}/{three.length}</span>
      </div>
      <div className={styles.tasks}>
        {three.map((t, i) => (
          <div key={t.id} className="fhReveal" style={{ animationDelay: `${i * 70}ms` }}>
            <TaskCard task={t} done={fh.isDone(t.id)} onToggle={() => fh.toggleDone(t.id)} highlight />
          </div>
        ))}
      </div>
      <Link href="/plan" className={styles.seeAll}>See all {tasks.length} tasks <ArrowRight size={15} /></Link>

      <div className={`${styles.quickGrid} fhReveal`}>
        <Link href="/cares/scan" className={styles.quick}><ScanLine size={20} /><span>Scan food</span></Link>
        <Link href="/log/mood" className={styles.quick}><Moon size={20} /><span>Track mood</span></Link>
        <Link href="/log/move" className={styles.quick}><Activity size={20} /><span>Log movement</span></Link>
        <Link href="/learn" className={styles.quick}><BookOpen size={20} /><span>Learn</span></Link>
        <Link href="/progress" className={styles.quick}><TrendingUp size={20} /><span>Progress</span></Link>
        <Link href="/cares/care-team" className={styles.quick}><Users size={20} /><span>Care team</span></Link>
      </div>

      <BottomNav />
    </main>
  );
}
