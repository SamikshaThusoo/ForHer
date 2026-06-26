"use client";
import { Fragment, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { getTouchpointsDue, getPhase } from "@/lib/journey";
import type { Persona } from "@/types/persona";
import {
  Sparkles, Stethoscope, Salad, Brain, Sun, Trophy, ClipboardCheck, Check, Lock, X,
} from "lucide-react";
import styles from "./JourneyRoadmap.module.css";

type NodeType = "start" | "milestone" | "finish" | "retest" | "clinical";
type Item = { day: number; label: string; type: NodeType };
type Group = { day: number; items: Item[] };

const PHASE_LABEL: Record<string, string> = { foundation: "Foundation", build: "Build", milestone: "Milestone" };
const PHASE_RANGE: Record<string, string> = { foundation: "Days 1–30", build: "Days 31–60", milestone: "Days 61–90" };

const NODE_DESC: Record<NodeType, string> = {
  start: "Where it all begins — your first day on the plan.",
  milestone: "A milestone in your journey. Keep the streak going!",
  finish: "You complete the 90-day program — time to see what moved.",
  retest: "Bloods + an outcomes review with your doctor.",
  clinical: "A check-in with your care team. We'll remind you the day before.",
};

// Icon + short single-line label, derived from the existing label/type (no data change).
function meta(items: Item[]) {
  const isFinish = items.some((i) => i.type === "finish");
  const isMilestone = items.some((i) => i.type === "milestone" || i.type === "finish");
  const primary = items.find((i) => i.type === "milestone" || i.type === "finish") ?? items[0];
  const lbl = primary.label.toLowerCase();
  let Icon: React.ComponentType<{ size?: number }> = Stethoscope;
  let short = primary.label;
  if (isFinish) { Icon = Trophy; short = "Complete"; }
  else if (primary.type === "start") { Icon = Sparkles; short = "Begin"; }
  else if (primary.type === "milestone") { Icon = Trophy; short = primary.label.replace(" complete", "").replace(" phase", ""); }
  else if (primary.type === "retest") { Icon = ClipboardCheck; short = "Retest"; }
  else if (lbl.includes("nutrition")) { Icon = Salad; short = "Nutritionist"; }
  else if (lbl.includes("psych")) { Icon = Brain; short = "Psychologist"; }
  else if (lbl.includes("derm")) { Icon = Sun; short = "Dermatology"; }
  else if (lbl.includes("gynae")) { Icon = Stethoscope; short = "Gynae"; }
  else if (lbl.includes("doctor") || lbl.includes("baseline")) { Icon = Stethoscope; short = "Doctor"; }
  else if (lbl.includes("pre-retest") || lbl.includes("preparation")) { Icon = ClipboardCheck; short = "Pre-retest"; }
  return { Icon, short, isMilestone, isFinish };
}

const W = 360, CX = 180, AMP = 48, PITCH = 138, TOP = 82, DIV = 80, BOT = 28;

/** The gamified 90-day journey: one smooth serpentine path, evenly-pitched nodes
 *  with activity icons, phase dividers between chapters, and a clean detail popup
 *  on tap. `day` drives the "you're here" marker. */
export function JourneyRoadmap({ persona, day }: { persona: Persona; day: number }) {
  const reduce = useReducedMotion();
  const [sel, setSel] = useState<Group | null>(null);

  // ---- Build + merge same-day items into one node ----
  const items: Item[] = [];
  for (let d = 1; d <= 90; d++) {
    getTouchpointsDue(persona, d).forEach((t) => {
      if (t.kind === "cc-connect" || d === 90) return;
      items.push({ day: d, label: t.label, type: t.kind === "retest" ? "retest" : "clinical" });
    });
  }
  const milestones: Item[] = [
    { day: 1, label: "Begin your journey", type: "start" },
    { day: 7, label: "First week complete", type: "milestone" },
    { day: 30, label: "Foundation phase complete", type: "milestone" },
    { day: 60, label: "Build phase complete", type: "milestone" },
    { day: 90, label: "90-day program complete", type: "finish" },
  ];
  const byDay = new Map<number, Item[]>();
  [...milestones, ...items].sort((a, b) => a.day - b.day).forEach((it) => {
    if (!byDay.has(it.day)) byDay.set(it.day, []);
    byDay.get(it.day)!.push(it);
  });
  const groups: Group[] = [...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([d, its]) => ({ day: d, items: its }));

  // ---- Lay out: constant pitch; phase dividers BETWEEN phases add vertical space ----
  let prevPhase = "";
  let divCount = 0;
  const placed = groups.map((g, i) => {
    const phase = getPhase(g.day);
    let dividerBefore = false;
    if (phase !== prevPhase) {
      if (i > 0) { dividerBefore = true; divCount++; }
      prevPhase = phase;
    }
    return {
      ...g, phase, dividerBefore, i,
      x: CX + AMP * Math.sin(i * 0.8),
      y: TOP + i * PITCH + divCount * DIV,
    };
  });
  const totalH = TOP + groups.length * PITCH + divCount * DIV + BOT;
  const currentIdx = placed.reduce((acc, g, i) => (g.day <= day ? i : acc), 0);

  const buildPath = (subset: typeof placed) => {
    let d = "", pp = "";
    subset.forEach((n, k) => {
      if (n.phase !== pp) d += ` M ${n.x.toFixed(1)} ${n.y.toFixed(1)}`;
      else {
        const prev = subset[k - 1];
        const my = ((prev.y + n.y) / 2).toFixed(1);
        d += ` C ${prev.x.toFixed(1)} ${my} ${n.x.toFixed(1)} ${my} ${n.x.toFixed(1)} ${n.y.toFixed(1)}`;
      }
      pp = n.phase;
    });
    return d.trim();
  };
  const mutedD = buildPath(placed);
  const doneD = buildPath(placed.slice(0, currentIdx + 1));

  return (
    <div className={styles.path} style={{ height: totalH }}>
      <svg className={styles.road} viewBox={`0 0 ${W} ${totalH}`} preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="fhRoad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#B5687E" /><stop offset="1" stopColor="#5B2A4A" />
          </linearGradient>
        </defs>
        <path d={mutedD} fill="none" stroke="rgba(142,83,120,0.16)" strokeWidth={14}
          strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <motion.path d={doneD} fill="none" stroke="url(#fhRoad)" strokeWidth={14}
          strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
          initial={reduce ? false : { pathLength: 0 }} animate={reduce ? undefined : { pathLength: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }} />
      </svg>

      {placed.filter((p) => p.dividerBefore).map((p) => (
        <motion.div key={`div-${p.phase}`} className={styles.divider}
          style={{ top: p.y - (p.items.some((i) => i.type === "milestone" || i.type === "finish") ? 40 : 32) - 48 }}
          initial={reduce ? false : { opacity: 0, x: -10 }} animate={reduce ? undefined : { opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}>
          <span className={styles.divPill}>{PHASE_LABEL[p.phase]} · {PHASE_RANGE[p.phase]}</span>
        </motion.div>
      ))}

      {placed.map((p) => {
        const done = p.i < currentIdx, current = p.i === currentIdx, locked = p.i > currentIdx;
        const { Icon, short, isMilestone } = meta(p.items);
        const r = isMilestone ? 40 : 32;
        const xPct = (p.x / W) * 100;
        return (
          <Fragment key={p.day}>
            <motion.button type="button" onClick={() => setSel(p)}
              className={`${styles.node} ${done ? styles.done : current ? styles.current : styles.locked} ${isMilestone ? styles.milestone : ""}`}
              style={{ left: `${xPct}%`, top: p.y }}
              initial={reduce ? false : { opacity: 0, scale: 0.6 }} animate={reduce ? undefined : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: Math.min(p.i * 0.03, 0.3) }}>
              <Icon size={isMilestone ? 30 : 24} />
              {done && <span className={styles.checkBadge}><Check size={11} strokeWidth={3} /></span>}
              {locked && <span className={styles.lockBadge}><Lock size={10} /></span>}
            </motion.button>

            {current && (
              <motion.span className={styles.hereBubble} style={{ left: `${xPct}%`, top: p.y - r - 24 }}
                initial={reduce ? false : { opacity: 0 }}
                animate={reduce ? undefined : { opacity: 1, y: [0, -4, 0] }}
                transition={{ y: { repeat: Infinity, duration: 1.4 }, opacity: { duration: 0.3 } }}>
                YOU&apos;RE HERE
              </motion.span>
            )}

            <span className={styles.label} style={{ left: `${xPct}%`, top: p.y + r + 15 }}>
              <span className={styles.labelDay}>Day {p.day}</span>
              <span className={styles.labelShort}>{short}</span>
            </span>
          </Fragment>
        );
      })}

      {sel && (
        <div className={styles.modalBg} onClick={() => setSel(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.modalClose} onClick={() => setSel(null)} aria-label="Close"><X size={16} /></button>
            <span className={styles.modalDay}>Day {sel.day}</span>
            {sel.items.map((it, i) => (
              <div key={i} className={styles.modalItem}>
                <h3 className={styles.modalTitle}>{it.label}</h3>
                <p className={styles.modalSub}>{NODE_DESC[it.type]}</p>
              </div>
            ))}
            <button type="button" className={styles.modalBtn} onClick={() => setSel(null)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}
