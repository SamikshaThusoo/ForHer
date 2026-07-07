"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, useReducedMotion, animate } from "framer-motion";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { personaTrack } from "@/lib/journey";
import {
  cycleDayFromLog, cycleLengthFor, phaseForCycleDay, ovulationDay, hormoneTemplateDay,
  PHASE_LABEL, PHASE_PROSE, HORMONES,
} from "@/lib/forher/cycleview";
import type { CyclePhase } from "@/types/journey";
import { ChevronLeft } from "lucide-react";
import styles from "./hormones.module.css";

const W = 320, H = 116, PAD = 6;

// Page-local phase atmosphere (the brief's palette). Not the app-wide PHASE_COLOR —
// this keeps the /cycle ring on its own green/gold and lets the hormone page play.
const ATMOSPHERE: Record<CyclePhase, string> = {
  menstrual: "#C76B7A", // rose
  follicular: "#C9A24A", // gold
  ovulatory: "#2F7A7A", // teal
  luteal: "#8E5378", // plum
};
// Page-local curve colours: LH + testosterone shifted off gold/teal so they don't melt
// into the follicular-gold / ovulatory-teal atmosphere.
const HUE: Record<string, string> = {
  estrogen: "#C76B7A",
  progesterone: "#8E5378",
  lh: "#D98324", // amber
  testosterone: "#2E6E8E", // blue-teal
};
const hueOf = (key: string) => HUE[key] ?? "#8E5378";

const PHASE_RECS: Record<CyclePhase, { body: string; work: string; tip: string }> = {
  menstrual: { body: "Energy is low; cramps and fatigue are common.", work: "Keep the load light — admin and planning over big pushes.", tip: "Iron-rich meals, warmth and earlier nights." },
  follicular: { body: "Energy, mood and focus are climbing.", work: "Start new projects and tackle the hard problems.", tip: "A good week for a new class or a harder workout." },
  ovulatory: { body: "Energy, confidence and libido peak.", work: "Book the big conversations and presentations.", tip: "Stay hydrated; strength work feels great now." },
  luteal: { body: "Energy dips; bloating, cravings and mood shifts build.", work: "Wrap up and tidy — protect focus from overload.", tip: "Magnesium-rich foods and gentle movement help." },
};

export default function HormonesPage() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const reduce = useReducedMotion();
  const today = new Date();
  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  const todayCd = fh.cycleLog?.lastPeriod ? cycleDayFromLog(fh.cycleLog.lastPeriod, L, today) : Math.round(L / 2);
  const [dayState, setDayState] = useState<number | null>(null);
  const day = dayState ?? todayCd;
  const setDay = (d: number) => setDayState(d);
  const duration = fh.cycleLog?.duration ?? 5;
  const phase = phaseForCycleDay(day, L, duration);
  const carePlan = personaTrack(persona) !== "none";
  const isToday = fh.cycleLog?.lastPeriod != null && day === todayCd;
  const [sel, setSel] = useState<string | null>(null);

  const lp = fh.cycleLog?.lastPeriod;
  const fmtD = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const ovCd = ovulationDay(L);
  let datesLine: string | null = null;
  if (lp) {
    const daysToOv = ((ovCd - todayCd) % L + L) % L;
    const daysToPeriod = todayCd === 1 ? 0 : L - todayCd + 1;
    datesLine = `Next period ~ ${fmtD(new Date(today.getTime() + daysToPeriod * 86400000))} · Ovulation ~ ${fmtD(new Date(today.getTime() + daysToOv * 86400000))}`;
  }

  const tDay = (d: number) => hormoneTemplateDay(d, L);
  const x = (d: number) => PAD + ((d - 1) / (L - 1)) * (W - 2 * PAD);
  const y = (v: number) => H - PAD - v * (H - 2 * PAD);
  const pathFor = (fn: (d: number) => number) =>
    "M " + Array.from({ length: L }, (_, i) => `${x(i + 1).toFixed(1)} ${y(fn(tDay(i + 1))).toFixed(1)}`).join(" L ");

  const dominant = [...HORMONES].sort((a, b) => b.fn(tDay(day)) - a.fn(tDay(day)))[0];
  const dv = dominant.fn(tDay(day));
  const verb = dv > 0.7 ? "peaking" : dv > 0.4 ? "rising" : "easing";
  const activeKey = sel ?? dominant.key;
  const activeIdx = HORMONES.findIndex((h) => h.key === activeKey);

  // One spring drives the marker + all four dots as `day` changes (or snaps for reduced motion).
  const mvDay = useMotionValue(day);
  useEffect(() => {
    if (reduce) { mvDay.jump(day); return; }
    const controls = animate(mvDay, day, { type: "spring", stiffness: 320, damping: 26, mass: 0.7 });
    return () => controls.stop();
  }, [day, reduce, mvDay]);

  const markerX = useTransform(mvDay, (d) => x(d));
  const cy0 = useTransform(mvDay, (d) => y(HORMONES[0].fn(tDay(d))));
  const cy1 = useTransform(mvDay, (d) => y(HORMONES[1].fn(tDay(d))));
  const cy2 = useTransform(mvDay, (d) => y(HORMONES[2].fn(tDay(d))));
  const cy3 = useTransform(mvDay, (d) => y(HORMONES[3].fn(tDay(d))));
  const cys = [cy0, cy1, cy2, cy3];

  const curveOpacity = (key: string) => (sel ? (key === sel ? 1 : 0.12) : key === dominant.key ? 1 : 0.5);

  // Phase-map track: coloured segments proportional to the phases.
  const ovStart = ovCd - 1;
  const ovEnd = ovCd + 2;
  const pct = (d: number) => Math.max(0, Math.min(100, (d / L) * 100));
  const phaseMap = `linear-gradient(90deg,
    ${ATMOSPHERE.menstrual} 0% ${pct(duration)}%,
    ${ATMOSPHERE.follicular} ${pct(duration)}% ${pct(ovStart - 1)}%,
    ${ATMOSPHERE.ovulatory} ${pct(ovStart - 1)}% ${pct(ovEnd)}%,
    ${ATMOSPHERE.luteal} ${pct(ovEnd)}% 100%)`;

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.head}>
        <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · Hormones</span>
      </header>

      <div className={styles.hero}>
        <h1 className={styles.h1}>Your hormone <em>rhythm</em></h1>
        <p className={styles.sub}>Day {day}{isToday ? " · today" : ""} · {PHASE_LABEL[phase]} phase</p>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.dominant} style={{ color: hueOf(dominant.key) }}>{dominant.label} {verb}</div>

        <div className={styles.chartWrap}>
          <div className={styles.atmosphere} style={{ backgroundColor: ATMOSPHERE[phase] }} />
          <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} preserveAspectRatio="none" aria-hidden>
            {HORMONES.map((h, i) => (
              <motion.path
                key={h.key}
                d={pathFor(h.fn)}
                fill="none"
                stroke={hueOf(h.key)}
                strokeWidth="2.4"
                strokeLinejoin="round"
                strokeLinecap="round"
                animate={{ opacity: curveOpacity(h.key) }}
                initial={reduce ? { pathLength: 1, opacity: curveOpacity(h.key) } : { pathLength: 0, opacity: curveOpacity(h.key) }}
                transition={reduce ? { duration: 0 } : { pathLength: { duration: 0.85, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.25 } }}
              />
            ))}

            <motion.line x1={markerX} y1={PAD} x2={markerX} y2={H - PAD}
              stroke="rgba(91,42,74,0.22)" strokeWidth="1.5" strokeDasharray="3 3" />

            {/* active-hormone glow — one very subtle breathing */}
            {activeIdx >= 0 && (
              <motion.circle cx={markerX} cy={cys[activeIdx]} fill={hueOf(activeKey)}
                initial={{ opacity: 0 }}
                animate={reduce ? { opacity: 0.18, r: 9 } : { opacity: [0.28, 0.1, 0.28], r: [8, 11, 8] }}
                transition={reduce ? { duration: 0 } : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }} />
            )}

            {HORMONES.map((h, i) => (
              <motion.circle key={h.key} cx={markerX} cy={cys[i]}
                animate={{ opacity: sel ? (h.key === sel ? 1 : 0.15) : 1, r: h.key === activeKey ? 5 : 3.4 }}
                initial={{ opacity: 0 }}
                transition={reduce ? { duration: 0 } : { r: { type: "spring", stiffness: 320, damping: 20 }, opacity: { duration: 0.25, delay: reduce ? 0 : 0.55 + i * 0.05 } }}
                fill={hueOf(h.key)} stroke="#fff" strokeWidth="1.5" />
            ))}
          </svg>
        </div>

        <div className={styles.axis}>
          <span>Day 1</span>
          <span className={styles.axisOv} style={{ left: `${((ovCd - 1) / (L - 1)) * 100}%` }}>Ovulation</span>
          <span>Day {L}</span>
        </div>

        <div className={styles.trackWrap}>
          <div className={styles.phaseMap} style={{ background: phaseMap }} />
          <input
            className={styles.range}
            type="range"
            min={1}
            max={L}
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            aria-label="Scrub cycle day"
            style={{ ["--thumb" as string]: hueOf(dominant.key) }}
          />
        </div>
        <p className={styles.scrubHint}>Drag to explore any day in your cycle</p>

        <div className={styles.legend}>
          {HORMONES.map((h) => (
            <button
              key={h.key}
              type="button"
              className={`${styles.legItem} ${sel === h.key ? styles.legOn : ""} ${sel && sel !== h.key ? styles.legDim : ""}`}
              onClick={() => setSel(sel === h.key ? null : h.key)}
              aria-pressed={sel === h.key}
            >
              <span className={styles.legDot} style={{ background: hueOf(h.key) }} />
              {h.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.phaseBox}>
        <span className={styles.phaseTag}>{PHASE_LABEL[phase]} phase{isToday ? ", right now" : ""}</span>
        <p className={styles.phaseProse}>{PHASE_PROSE[phase]}</p>
        {datesLine && <p className={styles.phaseDates}>{datesLine}</p>}
      </div>

      <div className={styles.recs}>
        <div className={styles.recRow}><span className={styles.recLabel}>Your body</span><span className={styles.recText}>{PHASE_RECS[phase].body}</span></div>
        <div className={styles.recRow}><span className={styles.recLabel}>At work</span><span className={styles.recText}>{PHASE_RECS[phase].work}</span></div>
        <div className={styles.recRow}><span className={styles.recLabel}>Try this</span><span className={styles.recText}>{PHASE_RECS[phase].tip}</span></div>
      </div>

      <div className={styles.hList}>
        {HORMONES.map((h) => {
          const v = Math.round(h.fn(tDay(day)) * 100);
          return (
            <div key={h.key} className={styles.hRow}>
              <span className={styles.hLabel}><span className={styles.hDot} style={{ background: hueOf(h.key) }} />{h.label}</span>
              <div className={styles.hBar}><i style={{ width: `${v}%`, background: hueOf(h.key) }} /></div>
              <span className={styles.hVal}>{v}</span>
            </div>
          );
        })}
      </div>

      {carePlan && (
        <div className={styles.pmosNote}>
          <strong>With PMOS,</strong> testosterone tends to run higher across the whole cycle — one reason skin, hair and cravings can flare. Steady blood sugar and movement help keep it in check.
        </div>
      )}

      <p className={styles.disclaimer}>An educational model of how hormones move — not your measured levels.</p>

      <Link href="/" className={styles.homeBtn}>Done</Link>
    </main>
  );
}
