"use client";
import { useState } from "react";
import type { Persona } from "@/types/persona";
import type { DomainSignals, RiskOutcome } from "@/types/journey";
import { getCareCircle, TRACK_LABELS } from "@/lib/journey";
import { motion } from "framer-motion";
import { Stethoscope, Salad, HeartPulse, Brain, Sparkles, UserRound, ArrowRight } from "lucide-react";
import styles from "./Routing.module.css";

const ROLE_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  doctor: Stethoscope,
  nutritionist: Salad,
  dermatologist: Sparkles,
  gynaecologist: HeartPulse,
  psychologist: Brain,
  "care-coordinator": UserRound,
};

export function Routing({
  outcome, signals, persona, onConsent,
}: {
  outcome: RiskOutcome;
  signals: DomainSignals;
  persona: Persona;
  onConsent: () => void;
}) {
  const [consented, setConsented] = useState(false);
  const circle = getCareCircle(outcome, {
    acneOrHirsutism: signals.androgenic,
    ttc: !!persona.pmos?.ttc,
    highMetabolic: outcome === "high",
  });

  const isEngagement = outcome === "none";

  return (
    <div className={styles.wrap}>
      <span className={styles.eyebrow}>{TRACK_LABELS[outcome]}</span>
      <h2 className={styles.title}>
        {isEngagement ? "Your engagement track" : "Your care circle"}
      </h2>
      <p className={styles.lead}>
        {isEngagement
          ? "No plan needed right now — keep tracking your cycle, mood and habits, and we'll re-check over time."
          : "These are the people who'll support you — lifestyle-led, with humans making any clinical calls."}
      </p>

      <div className={styles.circle}>
        {circle.map((s, i) => {
          const Icon = ROLE_ICON[s.role] ?? UserRound;
          return (
            <motion.div
              key={s.role}
              className={styles.specialist}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <span className={styles.sicon}><Icon size={18} /></span>
              <span className={styles.sbody}>
                <strong>{s.label}</strong>
                <em>{s.reason}</em>
              </span>
            </motion.div>
          );
        })}
      </div>

      {!isEngagement && (
        <label className={styles.consent}>
          <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} />
          <span>I understand this is lifestyle support — not a diagnosis or prescription.</span>
        </label>
      )}

      <button
        type="button"
        className={styles.cta}
        disabled={!isEngagement && !consented}
        onClick={onConsent}
      >
        {isEngagement ? "Go to my companion" : "Start my plan"} <ArrowRight size={16} />
      </button>
    </div>
  );
}
