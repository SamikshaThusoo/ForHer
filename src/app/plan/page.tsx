"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer, PLAN_LAST_DAY } from "@/lib/forher/state";
import { getTouchpointsDue, getPhase, personaTrack } from "@/lib/journey";
import {
  ChevronLeft, Sparkles, Star, Award, ClipboardCheck, Stethoscope, Check, Lock,
} from "lucide-react";
import styles from "./plan.module.css";

type NodeType = "start" | "milestone" | "finish" | "retest" | "clinical";
type PathNode = { day: number; label: string; type: NodeType };

const PHASE_LABEL: Record<string, string> = { foundation: "Foundation", build: "Build", milestone: "Milestone" };
const ICON: Record<NodeType, React.ComponentType<{ size?: number }>> = {
  start: Sparkles, milestone: Star, finish: Award, retest: ClipboardCheck, clinical: Stethoscope,
};

export default function PlanPage() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const track = personaTrack(persona);

  if (!fh.hydrated) return <main className={`${styles.page} fhTheme`} />;

  if (!persona.pmos?.eligible || track === "none") {
    return (
      <main className={`${styles.page} fhTheme`}>
        <header className={styles.head}>
          <Link href="/forher" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
          <span className={styles.brandline}>For Her · PMOS</span>
        </header>
        <div className={styles.empty}>
          <h1 className={styles.h1}>No care-plan journey</h1>
          <p className={styles.emptySub}>You&apos;re on the companion track — keep tracking your cycle, mood and habits, and we&apos;ll re-check over time.</p>
        </div>
      </main>
    );
  }

  // Build the journey: clinical touchpoints + milestones, sorted by day.
  const tps: PathNode[] = [];
  for (let d = 1; d <= 90; d++) {
    getTouchpointsDue(persona, d).forEach((t) => {
      if (t.kind === "cc-connect" || d === 90) return;
      tps.push({ day: d, label: t.label, type: t.kind === "retest" ? "retest" : "clinical" });
    });
  }
  const milestones: PathNode[] = [
    { day: 1, label: "Begin your journey", type: "start" },
    { day: 7, label: "First week complete", type: "milestone" },
    { day: 30, label: "Foundation phase complete", type: "milestone" },
    { day: 60, label: "Build phase complete", type: "milestone" },
    { day: 90, label: "90-day program complete", type: "finish" },
  ];
  const nodes = [...milestones, ...tps].sort((a, b) => a.day - b.day);
  const reachedMax = Math.max(0, ...nodes.filter((n) => n.day <= fh.day).map((n) => n.day));

  let prevPhase = "";

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.head}>
        <Link href="/forher" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · PMOS</span>
      </header>

      <div className={styles.hero}>
        <h1 className={styles.h1}>Your 90-day <em>journey</em></h1>
        <p className={styles.jSub}>Each step is a milestone or a check-in with your care team. You&apos;re on Day {fh.day}.</p>
      </div>

      {/* Demo scrubber to move the "you're here" marker */}
      <div className={styles.scrub}>
        <div className={styles.scrubTop}>
          <span className={styles.dayNum}>Day {fh.day}<span className={styles.dayTot}> / {PLAN_LAST_DAY}</span></span>
        </div>
        <input className={styles.range} type="range" min={1} max={PLAN_LAST_DAY} value={fh.day}
          onChange={(e) => fh.setDay(Number(e.target.value))} aria-label="Day in journey" />
      </div>

      <div className={styles.path}>
        {nodes.map((n, i) => {
          const phase = getPhase(n.day);
          const band = phase !== prevPhase ? PHASE_LABEL[phase] : null;
          prevPhase = phase;
          const done = n.day < reachedMax;
          const current = n.day === reachedMax;
          const locked = n.day > reachedMax;
          const big = n.type === "milestone" || n.type === "finish";
          const Icon = ICON[n.type];
          const side = i % 2 === 0;
          return (
            <div key={i}>
              {band && <div className={styles.band}><span>{band} phase</span></div>}
              <div className={`${styles.nodeRow} ${side ? styles.rowL : styles.rowR}`}>
                <div className={`${styles.node} ${done ? styles.nodeDone : current ? styles.nodeCurrent : styles.nodeFuture} ${big ? styles.nodeBig : ""}`}>
                  {done ? <Check size={big ? 26 : 22} strokeWidth={3} /> : locked ? <Lock size={16} /> : <Icon size={big ? 26 : 22} />}
                  {done && <span className={styles.star}><Star size={11} fill="currentColor" strokeWidth={0} /></span>}
                  {current && <span className={styles.startTag}>START</span>}
                </div>
                <div className={styles.nodeLabel}>
                  <span className={styles.nodeDay}>Day {n.day}</span>
                  <span className={styles.nodeText}>{n.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className={styles.disclaimer}>Your care team makes any clinical calls — these dates are when they check in.</p>
    </main>
  );
}
