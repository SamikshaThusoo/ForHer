"use client";
import { motion } from "framer-motion";
import { Footprints, ChevronRight } from "lucide-react";
import { usePersona } from "@/context/PersonaContext";
import styles from "./StepCounterCard.module.css";

/**
 * Apple-Health-grade step card.
 * - Small ring showing progress to goal (Apple Fitness Activity-ring inspired)
 * - Hero number with goal in muted denominator
 * - Tight progress bar beneath for redundancy
 * - Subtle freshness footnote
 *
 * No runner illustration, no scene gradient, no overlap glass pills.
 */
export function StepCounterCard() {
  const { persona } = usePersona();
  const enrolled = persona.cares.enrolled;
  const steps = enrolled ? 6180 : 0;
  const goal = 10_000;
  const pct = Math.max(0, Math.min(1, steps / goal));
  const lastSync = enrolled ? "Synced 2 min ago" : "Synced 3 days ago";

  // For the small Activity-style ring (radius 24, stroke 6, circumference ~150)
  const r = 24;
  const C = 2 * Math.PI * r;

  return (
    <section className={styles.card}>
      {/* Top row: ring + headline */}
      <div className={styles.top}>
        <div className={styles.ring}>
          <svg viewBox="0 0 56 56" width={56} height={56} aria-hidden>
            <circle cx={28} cy={28} r={r} fill="none" stroke="#EEF0F4" strokeWidth={6} />
            <motion.circle
              cx={28}
              cy={28}
              r={r}
              fill="none"
              stroke="#2060B0"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={C}
              transform="rotate(-90 28 28)"
              initial={{ strokeDashoffset: C }}
              animate={{ strokeDashoffset: C - C * pct }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            />
          </svg>
          <Footprints
            size={20}
            strokeWidth={2}
            className={styles.ringIcon}
          />
        </div>

        <div className={styles.body}>
          <div className={styles.label}>STEPS TODAY</div>
          <div className={styles.metric}>
            <span className={styles.metricBig}>
              {steps.toLocaleString("en-IN")}
            </span>
            <span className={styles.metricGoal}>of {goal.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <ChevronRight size={18} className={styles.chev} strokeWidth={2} />
      </div>

      {/* Slim progress bar — redundant with ring for at-a-glance scanning */}
      <div className={styles.barWrap}>
        <div className={styles.barTrack}>
          <motion.div
            className={styles.barFill}
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
        </div>
        <div className={styles.barMeta}>
          <span>{lastSync}</span>
          <span className={styles.barPct}>{Math.round(pct * 100)}%</span>
        </div>
      </div>
    </section>
  );
}
