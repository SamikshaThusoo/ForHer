"use client";
import { useState } from "react";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { personaTrack } from "@/lib/journey";
import { BottomNav } from "@/components/forher/BottomNav/BottomNav";
import {
  cycleDayForDate, cycleLengthFor, phaseForCycleDay, PHASE_LABEL, PHASE_PROSE, HORMONES,
} from "@/lib/forher/cycleview";
import { ChevronLeft } from "lucide-react";
import styles from "./hormones.module.css";

const W = 320, H = 116, PAD = 6;

export default function HormonesPage() {
  const { persona } = usePersona();
  const today = new Date();
  const L = cycleLengthFor(persona);
  const todayCd = cycleDayForDate(persona, today);
  const [day, setDay] = useState(todayCd);
  const phase = phaseForCycleDay(day, L);
  const carePlan = personaTrack(persona) !== "none";

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
        <Link href="/forher" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · Hormones</span>
      </header>

      <div className={styles.hero}>
        <h1 className={styles.h1}>Your hormone <em>rhythm</em></h1>
        <p className={styles.sub}>
          Day {day}{day === todayCd ? " · today" : ""} · {PHASE_LABEL[phase]} phase
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
        <span className={styles.phaseTag}>{PHASE_LABEL[phase]} phase{day === todayCd ? ", right now" : ""}</span>
        <p className={styles.phaseProse}>{PHASE_PROSE[phase]}</p>
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
      <BottomNav />
    </main>
  );
}
