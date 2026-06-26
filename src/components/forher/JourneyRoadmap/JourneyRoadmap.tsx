"use client";
import { getTouchpointsDue, getPhase } from "@/lib/journey";
import type { Persona } from "@/types/persona";
import { Sparkles, Star, Award, ClipboardCheck, Stethoscope, Check, Lock } from "lucide-react";
import styles from "./JourneyRoadmap.module.css";

type NodeType = "start" | "milestone" | "finish" | "retest" | "clinical";
type PathNode = { day: number; label: string; type: NodeType };

const PHASE_LABEL: Record<string, string> = { foundation: "Foundation", build: "Build", milestone: "Milestone" };
const ICON: Record<NodeType, React.ComponentType<{ size?: number }>> = {
  start: Sparkles, milestone: Star, finish: Award, retest: ClipboardCheck, clinical: Stethoscope,
};

/** The gamified 90-day journey (winding road of milestone + clinical nodes).
 *  Shared by /plan and the enrolment step. `day` drives the "you're here" marker. */
export function JourneyRoadmap({ persona, day }: { persona: Persona; day: number }) {
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

  const STEP = 132;
  const positioned = nodes.map((n, i) => ({
    ...n,
    x: 50 + 23 * Math.sin(i * 0.72),
    y: 70 + i * STEP,
  }));
  const totalH = 70 + nodes.length * STEP + 26;
  const currentIdx = nodes.reduce((acc, n, i) => (n.day <= day ? i : acc), 0);
  const roadD = positioned
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = positioned[i - 1];
      const midY = (prev.y + p.y) / 2;
      return `C ${prev.x} ${midY} ${p.x} ${midY} ${p.x} ${p.y}`;
    })
    .join(" ");

  return (
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
  );
}
