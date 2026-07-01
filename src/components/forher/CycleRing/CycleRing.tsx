"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { CyclePhase } from "@/types/journey";
import { phaseForCycleDay, ovulationDay, PHASE_COLOR, PHASE_LABEL } from "@/lib/forher/cycleview";
import { Florette, BloodDrop } from "../CycleArt/CycleArt";
import styles from "./CycleRing.module.css";

/* The cycle ring — the page's centrepiece. A 4-phase arc ring (reusing the
   existing PHASE_COLOR system), with the florette at ovulation, blood drops on
   the period arc, and a spring marker at the selected/today day. Pure visual
   layer: it reads the cycle model, never mutates it. */

const VB = 300;
const C = VB / 2;
const R = 116;
const TRACK = 13;
const ACTIVE = 19;
const GAP_DEG = 3; // gap between phase segments
const TAU = Math.PI / 180;
const FLORETTE = "#4F9D69"; // existing fertile green (cycleview PHASE_COLOR.follicular)

const polar = (r: number, deg: number) => ({ x: C + r * Math.cos(deg * TAU), y: C + r * Math.sin(deg * TAU) });
const pct = (v: number) => `${(v / VB) * 100}%`;

function arcPath(r: number, a0: number, a1: number) {
  const s = polar(r, a0);
  const e = polar(r, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function statusLine(day: number, L: number, ovCd: number, duration: number) {
  if (day <= duration) return `Period · day ${day}`;
  if (day === ovCd) return "Ovulation day";
  if (day >= ovCd - 5 && day <= ovCd + 1) return "Fertile window open";
  const toNext = day === 1 ? 0 : L - day + 1;
  return toNext === 0 ? "Period due today" : `Next period in ${toNext} day${toNext === 1 ? "" : "s"}`;
}

export function CycleRing({
  L,
  cycleDay,
  todayCd,
  duration,
  onPhaseTap,
}: {
  L: number;
  cycleDay: number;
  todayCd: number;
  duration: number;
  onPhaseTap?: (day: number) => void;
}) {
  const reduce = useReducedMotion();
  const ovCd = ovulationDay(L);
  const ovStart = ovCd - 1;
  const ovEnd = ovCd + 2;
  const phase = phaseForCycleDay(cycleDay, L, duration);

  const dayToAngle = (d: number) => -90 + ((d - 1) / L) * 360;

  // Contiguous phase segments → arcs (inset by a small gap for the segmented look).
  // Menstrual spans the entered period length; ovulatory is anchored on L−14 and
  // clamped past the period so short cycles never overlap the two bands.
  const segsRaw: { phase: CyclePhase; a: number; b: number }[] = [
    { phase: "menstrual", a: 1, b: duration },
    { phase: "follicular", a: duration + 1, b: ovStart - 1 },
    { phase: "ovulatory", a: Math.max(ovStart, duration + 1), b: ovEnd },
    { phase: "luteal", a: ovEnd + 1, b: L },
  ];
  const segs = segsRaw.filter((s) => s.b >= s.a);

  const isFertileMarker = cycleDay >= ovCd - 5 && cycleDay <= ovCd + 1;
  const ovPos = polar(R, dayToAngle(ovCd));
  const todayPos = polar(R, dayToAngle(todayCd));
  const isToday = cycleDay === todayCd;

  // Period drops span the entered period length, placed at each day's slice centre
  // so they sit cleanly inside the menstrual band, not on the gaps.
  const drops = Array.from({ length: Math.min(duration, 7) }, (_, i) => {
    const p = polar(R, dayToAngle(i + 1) + 180 / L);
    return { d: i + 1, ...p };
  });

  const markerColor = PHASE_COLOR[phase];

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${VB} ${VB}`} className={styles.svg} role="img" aria-label={`Cycle ring — ${PHASE_LABEL[phase]} phase, day ${cycleDay} of ${L}`}>
        {/* base track */}
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(91,42,74,0.08)" strokeWidth={TRACK} aria-hidden />
        {/* phase arcs */}
        {segs.map((s, i) => {
          const active = s.phase === phase;
          const a0 = dayToAngle(s.a) + GAP_DEG;
          const a1 = dayToAngle(s.b + 1) - GAP_DEG;
          const tap = onPhaseTap;
          return (
            <motion.path
              key={s.phase}
              d={arcPath(R, a0, a1)}
              fill="none"
              stroke={PHASE_COLOR[s.phase]}
              strokeWidth={active ? ACTIVE : TRACK}
              strokeLinecap="round"
              opacity={active ? 1 : 0.42}
              role={tap ? "button" : undefined}
              tabIndex={tap ? 0 : undefined}
              aria-label={tap ? `Jump to ${PHASE_LABEL[s.phase].toLowerCase()} phase` : undefined}
              aria-hidden={tap ? undefined : true}
              style={{ cursor: tap ? "pointer" : undefined, outline: "none", WebkitTapHighlightColor: "transparent" }}
              onClick={tap ? () => tap(s.a) : undefined}
              onKeyDown={tap ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(s.a); } } : undefined}
              initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={reduce ? { duration: 0 } : { duration: 0.85, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            />
          );
        })}
      </svg>

      {/* blood drops along the period arc */}
      {drops.map((dp) => (
        <span key={dp.d} className={styles.deco} style={{ left: pct(dp.x), top: pct(dp.y) }}>
          <BloodDrop size={13} />
        </span>
      ))}

      {/* florette at the ovulation point */}
      <span className={styles.deco} style={{ left: pct(ovPos.x), top: pct(ovPos.y) }}>
        <Florette size={26} color={FLORETTE} bright bloom sway />
      </span>

      {/* faint "today" tick when scrubbed away from today */}
      {!isToday && (
        <span className={styles.todayTick} style={{ left: pct(todayPos.x), top: pct(todayPos.y) }} aria-hidden />
      )}

      {/* the live marker (selected or today) — a radial arm rotates it so it
          always travels along the circumference, never across the centre */}
      <div
        className={styles.markerArm}
        style={{
          transform: `rotate(${dayToAngle(cycleDay) + 90}deg)`,
          transition: reduce ? "none" : "transform .5s cubic-bezier(.34,1.4,.5,1)",
        }}
      >
        <div className={styles.markerHead} style={{ left: pct(C), top: pct(C - R) }}>
          {isFertileMarker ? (
            <Florette size={30} color={FLORETTE} bright />
          ) : (
            <motion.span
              className={styles.markerDot}
              style={{ background: markerColor, boxShadow: `0 0 0 5px ${markerColor}22, 0 2px 8px ${markerColor}66` }}
              animate={isToday && !reduce ? { scale: [1, 1.16, 1] } : { scale: 1 }}
              transition={isToday && !reduce ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
            />
          )}
        </div>
      </div>

      {/* centre readout */}
      <div className={styles.center}>
        <div className={styles.bigDay}>{cycleDay}</div>
        <div className={styles.ofL}>of {L} days</div>
        <span className={styles.phasePill} style={{ color: markerColor, background: `${markerColor}1f` }}>
          {PHASE_LABEL[phase]}
        </span>
        <div className={styles.status}>{statusLine(cycleDay, L, ovCd, duration)}</div>
      </div>
    </div>
  );
}
