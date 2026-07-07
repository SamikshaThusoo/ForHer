"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { usePersona } from "@/context/PersonaContext";
import { personaTrack } from "@/lib/journey";
import { useForHer } from "@/lib/forher/state";
import { activeNudge, activeConditions } from "@/lib/forher/nudge";
import { readDayLog } from "@/lib/forher/daylog";
import { cycleLengthFor } from "@/lib/forher/cycleview";
import { ClinicHub } from "@/components/forher/ClinicHub/ClinicHub";
import styles from "./ClinicForHer.module.css";

const TIER_COPY: Record<string, string> = {
  high: "Your screen points to a higher hormonal-health risk. Let's get you seen.",
  medium: "Your screen suggests a moderate hormonal-health risk worth checking.",
  low: "A couple of signals worth a light check-in.",
  none: "No risk signals right now — keep up your lifestyle habits.",
};

export function ClinicForHer() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const tier = personaTrack(persona);

  const sig = {
    persona,
    cycleLog: fh.cycleLog,
    dayLog: typeof window === "undefined" ? {} : readDayLog(persona.id),
    cycleLength: cycleLengthFor(persona, fh.cycleLog?.cycleLength),
    today: new Date(),
  };
  // The card showed only the top signal; the page shows every one that's firing.
  const conditions = typeof window === "undefined" ? [] : activeConditions(sig);
  const condition = typeof window === "undefined" ? null : activeNudge({ tier, ...sig });
  const hasConditions = conditions.length > 0;

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.header}>
        <Link href="/" className={styles.back} aria-label="Back to home">
          <ChevronLeft size={20} />
        </Link>
        <span className={styles.brand}>Clinic</span>
      </header>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>Clinic ForHer</span>
        <h1 className={styles.h1}>{hasConditions ? "Let's look into this" : "Your next step"}</h1>
        <p className={styles.lede}>
          {hasConditions
            ? "Here's what your tracking has flagged — and what a check-in can do about it."
            : TIER_COPY[tier]}
        </p>
      </section>

      {hasConditions && (
        <section className={styles.noticed}>
          <span className={styles.noticedLabel}>What we&apos;ve noticed</span>
          <ul className={styles.noticedList}>
            {conditions.map((c) => (
              <li key={c.type} className={styles.noticedItem}>
                <strong>{c.title}</strong>
                <span>{c.body}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ClinicHub persona={persona} tier={tier} showRecommended day={fh.day} condition={condition} />

      <p className={styles.disclaimer}>
        This is a screening tool, not a diagnosis. Please consult a qualified clinician for medical decisions.
      </p>
    </main>
  );
}
