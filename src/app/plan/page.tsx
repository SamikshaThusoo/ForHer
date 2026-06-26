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
          <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
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

  // Lay the nodes along a winding road. Single "current" = the last node reached.
  const STEP = 132;
  const positioned = nodes.map((n, i) => ({
    ...n,
    x: 50 + 23 * Math.sin(i * 0.72), // % across — gentle S-curve
    y: 70 + i * STEP,                // px down
  }));
  const totalH = 70 + nodes.length * STEP + 26;
  const currentIdx = nodes.reduce((acc, n, i) => (n.day <= fh.day ? i : acc), 0);
  const roadD = positioned
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = positioned[i - 1];
      const midY = (prev.y + p.y) / 2;
      return `C ${prev.x} ${midY} ${p.x} ${midY} ${p.x} ${p.y}`;
    })
    .join(" ");

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.head}>
        <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
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

      <div className={styles.path} style={{ height: totalH }}>
        <svg className={styles.road} viewBox={`0 0 100 ${totalH}`} preserveAspectRatio="none" aria-hidden>
          <path d={roadD} fill="none" stroke="rgba(142,83,120,0.22)" strokeWidth={14}
            strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {positioned.map((n, i) => {
          const phase = getPhase(n.day);
          const band = i === 0 || getPhase(positioned[i - 1].day) !== phase ? PHASE_LABEL[phase] : null;
          const done = i < currentIdx;
          const current = i === currentIdx;
          const locked = i > currentIdx;
          const big = n.type === "milestone" || n.type === "finish";
          const Icon = ICON[n.type];
          return (
            <div key={i}>
              {band && <span className={styles.band} style={{ left: `${n.x}%`, top: n.y - 52 }}>{band}</span>}
              <div className={`${styles.node} ${done ? styles.nodeDone : current ? styles.nodeCurrent : styles.nodeFuture} ${big ? styles.nodeBig : ""}`}
                style={{ left: `${n.x}%`, top: n.y }}>
                {done ? <Check size={big ? 27 : 23} strokeWidth={3} /> : locked ? <Lock size={17} /> : <Icon size={big ? 27 : 23} />}
                {done && <span className={styles.star}><Star size={11} fill="currentColor" strokeWidth={0} /></span>}
              </div>
              <span className={styles.nodeLabel} style={{ left: `${n.x}%`, top: n.y + (big ? 46 : 40) }}>
                {current && <span className={styles.hereTag}>You&apos;re here</span>}
                <span className={styles.nodeDay}>Day {n.day}</span>
                <span className={styles.nodeText}>{n.label}</span>
              </span>
            </div>
          );
        })}
      </div>

      <p className={styles.disclaimer}>Your care team makes any clinical calls — these dates are when they check in.</p>
    </main>
  );
}
