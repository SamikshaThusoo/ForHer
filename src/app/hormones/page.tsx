"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, useReducedMotion, animate } from "framer-motion";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { personaTrack } from "@/lib/journey";
import {
  cycleDayFromLog, cycleLengthFor, phaseForCycleDay, ovulationDay, hormoneModel,
  PHASE_LABEL, PHASE_PROSE, HORMONES,
} from "@/lib/forher/cycleview";
import type { HormoneKey } from "@/lib/forher/cycleview";
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

  const model = hormoneModel(L);
  const val = (key: HormoneKey, d: number) => model.value(key, d);
  const x = (d: number) => PAD + ((d - 1) / (L - 1)) * (W - 2 * PAD);
  const y = (v: number) => H - PAD - v * (H - 2 * PAD);

  // Smooth Catmull-Rom -> cubic-bezier path through the per-day samples, plus a
  // closed area path (down to the baseline) for the gradient fill. Curves and dots
  // both read `val`, so the dots always sit exactly on the curves.
  const pointsFor = (key: HormoneKey): [number, number][] =>
    Array.from({ length: L }, (_, i) => [x(i + 1), y(val(key, i + 1))]);
  const smoothPath = (pts: [number, number][]) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] ?? pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] ?? p2;
      const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  };
  const areaPath = (line: string, pts: [number, number][]) =>
    `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${(H - PAD).toFixed(1)} L ${pts[0][0].toFixed(1)} ${(H - PAD).toFixed(1)} Z`;
  const paths = HORMONES.map((h) => {
    const pts = pointsFor(h.key);
    const line = smoothPath(pts);
    return { ...h, line, area: areaPath(line, pts) };
  });

  // Descriptor keyed to the curve SHAPE at this day: rising / easing by local slope,
  // "peaking" only when actually near a maximum (never "peaking" while still climbing).
  const dominant = [...HORMONES].sort((a, b) => val(b.key, day) - val(a.key, day))[0];
  const dv = val(dominant.key, day);
  const slope = val(dominant.key, Math.min(L, day + 1)) - val(dominant.key, Math.max(1, day - 1));
  const verb = slope > 0.035 ? "rising" : slope < -0.035 ? "easing" : dv > 0.6 ? "peaking" : "steady";
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
  const cy0 = useTransform(mvDay, (d) => y(val(HORMONES[0].key, d)));
  const cy1 = useTransform(mvDay, (d) => y(val(HORMONES[1].key, d)));
  const cy2 = useTransform(mvDay, (d) => y(val(HORMONES[2].key, d)));
  const cy3 = useTransform(mvDay, (d) => y(val(HORMONES[3].key, d)));
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
            <defs>
              {paths.map((h) => (
                <linearGradient key={h.key} id={`grad-${h.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={hueOf(h.key)} stopOpacity="0.26" />
                  <stop offset="100%" stopColor={hueOf(h.key)} stopOpacity="0" />
                </linearGradient>
              ))}
              {/* Left-to-right wipe: the curves "draw in" by revealing under this rect.
                  Only used when motion is allowed; the resting state is fully visible
                  regardless (initial={false} below), so a stalled rAF never hides curves. */}
              <clipPath id="hz-reveal">
                {reduce ? (
                  <rect x={0} y={0} width={W} height={H} />
                ) : (
                  <motion.rect
                    x={0} y={0} height={H}
                    initial={{ width: 0 }}
                    animate={{ width: W }}
                    transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </clipPath>
            </defs>

            {/* subtle ovulation gridline */}
            <line x1={x(ovCd)} y1={PAD} x2={x(ovCd)} y2={H - PAD}
              stroke="rgba(91,42,74,0.13)" strokeWidth="1" strokeDasharray="2 3" />

            {/* Curves render at their resting opacity immediately (initial={false});
                the reveal clip is enhancement only, drawing them in when motion is on. */}
            <g clipPath="url(#hz-reveal)">
              {/* soft gradient area fills, behind the strokes */}
              {paths.map((h) => (
                <motion.path
                  key={h.key}
                  d={h.area}
                  fill={`url(#grad-${h.key})`}
                  stroke="none"
                  initial={false}
                  animate={{ opacity: curveOpacity(h.key) }}
                  transition={reduce ? { duration: 0 } : { duration: 0.3 }}
                />
              ))}

              {/* hormone curves — smooth, brand-coloured, estrogen a touch thicker */}
              {paths.map((h) => (
                <motion.path
                  key={h.key}
                  d={h.line}
                  fill="none"
                  stroke={hueOf(h.key)}
                  strokeWidth={h.key === "estrogen" ? 2.9 : 2.2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  initial={false}
                  animate={{ opacity: curveOpacity(h.key) }}
                  transition={reduce ? { duration: 0 } : { opacity: { duration: 0.3 } }}
                />
              ))}
            </g>

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
          const v = Math.round(val(h.key, day) * 100);
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
