"use client";
import { useState } from "react";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { personaTrack } from "@/lib/journey";
import {
  cycleDayFromLog, cycleLengthFor, phaseForCycleDay, PHASE_LABEL, PHASE_PROSE, HORMONES,
} from "@/lib/forher/cycleview";
import type { CyclePhase } from "@/types/journey";
import { ChevronLeft } from "lucide-react";
import styles from "./hormones.module.css";

const W = 320, H = 116, PAD = 6;

const PHASE_RECS: Record<CyclePhase, { body: string; work: string; tip: string }> = {
  menstrual: { body: "Energy is low; cramps and fatigue are common.", work: "Keep the load light — admin and planning over big pushes.", tip: "Iron-rich meals, warmth and earlier nights." },
  follicular: { body: "Energy, mood and focus are climbing.", work: "Start new projects and tackle the hard problems.", tip: "A good week for a new class or a harder workout." },
  ovulatory: { body: "Energy, confidence and libido peak.", work: "Book the big conversations and presentations.", tip: "Stay hydrated; strength work feels great now." },
  luteal: { body: "Energy dips; bloating, cravings and mood shifts build.", work: "Wrap up and tidy — protect focus from overload.", tip: "Magnesium-rich foods and gentle movement help." },
};

export default function HormonesPage() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const today = new Date();
  const L = cycleLengthFor(persona, fh.cycleLog?.cycleLength);
  // "Today" is real only once she's logged her cycle; otherwise we centre the
  // scrubber mid-cycle and don't claim a current day.
  const todayCd = fh.cycleLog?.lastPeriod ? cycleDayFromLog(fh.cycleLog.lastPeriod, L, today) : Math.round(L / 2);
  const [dayState, setDayState] = useState<number | null>(null);
  const day = dayState ?? todayCd;
  const setDay = (d: number) => setDayState(d);
  const phase = phaseForCycleDay(day, L);
  const carePlan = personaTrack(persona) !== "none";
  const isToday = fh.cycleLog?.lastPeriod != null && day === todayCd;

  const lp = fh.cycleLog?.lastPeriod;
  const fmtD = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  let datesLine: string | null = null;
  if (lp) {
    const ovCd = Math.floor(L / 2);
    const daysToOv = ((ovCd - todayCd) % L + L) % L;
    const daysToPeriod = todayCd === 1 ? 0 : L - todayCd + 1;
    datesLine = `Next period ~ ${fmtD(new Date(today.getTime() + daysToPeriod * 86400000))} · Ovulation ~ ${fmtD(new Date(today.getTime() + daysToOv * 86400000))}`;
  }

  const x = (d: number) => PAD + ((d - 1) / (L - 1)) * (W - 2 * PAD);
  const y = (v: number) => H - PAD - v * (H - 2 * PAD);
  const pathFor = (fn: (d: number) => number) =>
    "M " + Array.from({ length: L }, (_, i) => `${x(i + 1).toFixed(1)} ${y(fn(i + 1)).toFixed(1)}`).join(" L ");

  // Dominant hormone at the scrubbed day.
  const dominant = [...HORMONES].sort((a, b) => b.fn(day) - a.fn(day))[0];
  const dv = dominant.fn(day);
  const verb = dv > 0.7 ? "peaking" : dv > 0.4 ? "rising" : "easing";

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.head}>
        <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · Hormones</span>
      </header>

      <div className={styles.hero}>
        <h1 className={styles.h1}>Your hormone <em>rhythm</em></h1>
        <p className={styles.sub}>
          Day {day}{isToday ? " · today" : ""} · {PHASE_LABEL[phase]} phase
        </p>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.dominant} style={{ color: dominant.color }}>{dominant.label} {verb}</div>
        <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart} preserveAspectRatio="none" aria-hidden>
          <line x1={x(day)} y1={PAD} x2={x(day)} y2={H - PAD} stroke="rgba(91,42,74,0.22)" strokeWidth="1.5" strokeDasharray="3 3" />
          {HORMONES.map((h) => (
            <path key={h.key} d={pathFor(h.fn)} fill="none" stroke={h.color} strokeWidth="2.2"
              strokeLinejoin="round" strokeLinecap="round" opacity={h.key === dominant.key ? 1 : 0.55} />
          ))}
          {HORMONES.map((h) => (
            <circle key={h.key} cx={x(day)} cy={y(h.fn(day))} r={h.key === dominant.key ? 4.5 : 3.2}
              fill={h.color} stroke="#fff" strokeWidth="1.5" />
          ))}
        </svg>
        <div className={styles.axis}><span>Day 1</span><span>Ovulation</span><span>Day {L}</span></div>

        {/* Scrubber — drag through the cycle */}
        <input
          className={styles.range} type="range" min={1} max={L} value={day}
          onChange={(e) => setDay(Number(e.target.value))} aria-label="Scrub cycle day"
        />
        <p className={styles.scrubHint}>Drag to explore any day in your cycle</p>

        <div className={styles.legend}>
          {HORMONES.map((h) => (
            <span key={h.key} className={styles.legItem}><span className={styles.legDot} style={{ background: h.color }} />{h.label}</span>
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
          const v = Math.round(h.fn(day) * 100);
          return (
            <div key={h.key} className={styles.hRow}>
              <span className={styles.hLabel}><span className={styles.hDot} style={{ background: h.color }} />{h.label}</span>
              <div className={styles.hBar}><i style={{ width: `${v}%`, background: h.color }} /></div>
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
