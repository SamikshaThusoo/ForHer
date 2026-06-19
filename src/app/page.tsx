"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { ForHerEntryCard } from "@/components/forher/ForHerEntryCard/ForHerEntryCard";
import { personaTrack, TRACK_LABELS } from "@/lib/journey";
import { ArrowRight } from "lucide-react";
import styles from "./home.module.css";

export default function Home() {
  const { persona } = usePersona();
  const eligible = !!persona.pmos?.eligible;
  const track = personaTrack(persona);

  return (
    <main className={`${styles.home} fhTheme`}>
      <header className={styles.top}>
        <div className={styles.wordmark}>For Her <span className={styles.tag}>PMOS</span></div>
      </header>

      <section className={styles.hero}>
        <p className={styles.hi}>Hi {persona.shortName}</p>
        <h1 className={styles.h1}>Your women&apos;s health, <em>handled with care</em></h1>
        <p className={styles.lead}>A guided PMOS program — understand your risk, then follow a plan that fits your everyday.</p>
      </section>

      <ForHerEntryCard />

      {eligible && (
        <Link href="/plan" className={styles.planCard}>
          <div className={styles.planBody}>
            <span className={styles.planEyebrow}>{track === "none" ? "Engagement track" : TRACK_LABELS[track]}</span>
            <span className={styles.planTitle}>{track === "none" ? "Your daily companion" : "Your plan"}</span>
            <span className={styles.planSub}>
              {track === "none" ? "Cycle, mood and habit tracking" : "Today's tasks and your 6-month journey"}
            </span>
          </div>
          <span className={styles.planArrow}><ArrowRight size={18} /></span>
        </Link>
      )}
    </main>
  );
}
