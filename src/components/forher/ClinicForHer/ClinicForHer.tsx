"use client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { usePersona } from "@/context/PersonaContext";
import { personaTrack } from "@/lib/journey";
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
  const tier = personaTrack(persona);

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
        <h1 className={styles.h1}>Your next step</h1>
        <p className={styles.lede}>{TIER_COPY[tier]}</p>
      </section>

      <ClinicHub persona={persona} tier={tier} showRecommended />

      <p className={styles.disclaimer}>
        This is a screening tool, not a diagnosis. Please consult a qualified clinician for medical decisions.
      </p>
    </main>
  );
}
