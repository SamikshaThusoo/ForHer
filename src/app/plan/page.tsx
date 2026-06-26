"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer, PLAN_LAST_DAY } from "@/lib/forher/state";
import { personaTrack } from "@/lib/journey";
import { JourneyRoadmap } from "@/components/forher/JourneyRoadmap/JourneyRoadmap";
import { ChevronLeft } from "lucide-react";
import styles from "./plan.module.css";

export default function PlanPage() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const track = personaTrack(persona);

  if (!fh.hydrated) return <main className={`${styles.page} fhTheme`} />;

  if (!persona.pmos?.eligible || track === "none") {
    return (
      <main className={`${styles.page} fhTheme`}>
        <header className={styles.head}>
          <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
          <span className={styles.brandline}>For Her · PMOS</span>
        </header>
        <div className={styles.empty}>
          <h1 className={styles.h1}>No care-plan journey</h1>
          <p className={styles.emptySub}>You&apos;re on the companion track — keep tracking your cycle, mood and habits, and we&apos;ll re-check over time.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.head}>
        <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · PMOS</span>
      </header>

      <div className={styles.hero}>
        <h1 className={styles.h1}>Your 90-day <em>journey</em></h1>
        <p className={styles.jSub}>Each step is a milestone or a check-in with your care team. You&apos;re on Day {fh.day}.</p>
      </div>

      {/* Demo scrubber to move the "you're here" marker */}
      <div className={styles.scrub}>
        <div className={styles.scrubTop}>
          <span className={styles.dayNum}>Day {fh.day}<span className={styles.dayTot}> / {PLAN_LAST_DAY}</span></span>
        </div>
        <input className={styles.range} type="range" min={1} max={PLAN_LAST_DAY} value={fh.day}
          onChange={(e) => fh.setDay(Number(e.target.value))} aria-label="Day in journey" />
      </div>

      <JourneyRoadmap persona={persona} day={fh.day} />

      <p className={styles.disclaimer}>Your care team makes any clinical calls — these dates are when they check in.</p>
    </main>
  );
}
