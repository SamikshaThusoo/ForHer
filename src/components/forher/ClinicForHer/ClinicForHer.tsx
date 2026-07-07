"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { usePersona } from "@/context/PersonaContext";
import { personaTrack } from "@/lib/journey";
import { useForHer } from "@/lib/forher/state";
import { activeNudge, isConditionNudge } from "@/lib/forher/nudge";
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

  // Why she's here — a logged symptom / late or irregular cycle changes the framing
  // away from "you're in great shape".
  const condition =
    typeof window === "undefined"
      ? null
      : activeNudge({
          tier,
          persona,
          cycleLog: fh.cycleLog,
          dayLog: readDayLog(persona.id),
          cycleLength: cycleLengthFor(persona, fh.cycleLog?.cycleLength),
          today: new Date(),
        });
  const lede = isConditionNudge(condition) ? condition!.body : TIER_COPY[tier];

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
        <h1 className={styles.h1}>{isConditionNudge(condition) ? "Let's look into this" : "Your next step"}</h1>
        <p className={styles.lede}>{lede}</p>
      </section>

      <ClinicHub persona={persona} tier={tier} showRecommended day={fh.day} condition={condition} />

      <p className={styles.disclaimer}>
        This is a screening tool, not a diagnosis. Please consult a qualified clinician for medical decisions.
      </p>
    </main>
  );
}
