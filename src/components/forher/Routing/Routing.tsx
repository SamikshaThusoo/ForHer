"use client";
import { useState } from "react";
import type { Persona } from "@/types/persona";
import type { DomainSignals, RiskOutcome } from "@/types/journey";
import { getCareCircle, TRACK_LABELS } from "@/lib/journey";
import { JourneyRoadmap } from "@/components/forher/JourneyRoadmap/JourneyRoadmap";
import { motion } from "framer-motion";
import { Stethoscope, Salad, HeartPulse, Brain, Sparkles, UserRound, ArrowRight, ChevronLeft } from "lucide-react";
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
  const [view, setView] = useState<"journey" | "circle">("journey");
  const circle = getCareCircle(outcome, {
    acneOrHirsutism: signals.androgenic,
    ttc: !!persona.pmos?.ttc,
    highMetabolic: outcome === "high",
  });

  const renderCircle = () => (
    <div className={styles.circle}>
      {circle.map((s, i) => {
        const Icon = ROLE_ICON[s.role] ?? UserRound;
        return (
          <motion.div key={s.role} className={styles.specialist}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.3 }}>
            <span className={styles.sicon}><Icon size={18} /></span>
            <span className={styles.sbody}><strong>{s.label}</strong><em>{s.reason}</em></span>
          </motion.div>
        );
      })}
    </div>
  );

  // ---- Engagement (no care plan): single page ----
  if (outcome === "none") {
    return (
      <div className={styles.wrap}>
        <span className={styles.eyebrow}>{TRACK_LABELS[outcome]}</span>
        <h2 className={styles.title}>Your engagement track</h2>
        <p className={styles.lead}>No plan needed right now — keep tracking your cycle, mood and habits, and we&apos;ll re-check over time.</p>
        {renderCircle()}
        <button type="button" className={styles.cta} onClick={onConsent}>Go to my companion <ArrowRight size={16} /></button>
      </div>
    );
  }

  // ---- Care plan, page 1: the 90-day journey ----
  if (view === "journey") {
    return (
      <div className={styles.wrap}>
        <span className={styles.eyebrow}>{TRACK_LABELS[outcome]}</span>
        <h2 className={styles.title}>Your 90-day journey</h2>
        <p className={styles.lead}>Here&apos;s the road ahead — milestones and check-ins with your care team. Take a look, then meet your circle.</p>
        <JourneyRoadmap persona={persona} day={1} />
        <button type="button" className={styles.cta} onClick={() => setView("circle")}>
          Next · meet your care circle <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  // ---- Care plan, page 2: your care circle + consent ----
  return (
    <div className={styles.wrap}>
      <button type="button" className={styles.stepBack} onClick={() => setView("journey")}>
        <ChevronLeft size={15} /> Back to journey
      </button>
      <span className={styles.eyebrow}>{TRACK_LABELS[outcome]}</span>
      <h2 className={styles.title}>Your care circle</h2>
      <p className={styles.lead}>These are the people who&apos;ll support you — lifestyle-led, with humans making any clinical calls.</p>
      {renderCircle()}
      <label className={styles.consent}>
        <input type="checkbox" checked={consented} onChange={(e) => setConsented(e.target.checked)} />
        <span>I understand this is lifestyle support — not a diagnosis or prescription.</span>
      </label>
      <button type="button" className={styles.cta} disabled={!consented} onClick={onConsent}>
        Start my plan <ArrowRight size={16} />
      </button>
    </div>
  );
}
