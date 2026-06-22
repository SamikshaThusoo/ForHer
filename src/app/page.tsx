"use client";
import { usePersona } from "@/context/PersonaContext";
import { ForHerEntryCard } from "@/components/forher/ForHerEntryCard/ForHerEntryCard";
import styles from "./home.module.css";

export default function Home() {
  const { persona } = usePersona();

  return (
    <main className={`${styles.home} fhTheme`}>
      <header className={styles.top}>
        <div className={styles.wordmark}>For Her <span className={styles.tag}>PMOS</span></div>
      </header>

      <section className={styles.hero}>
        <p className={styles.hi}>Hi {persona.shortName}</p>
        <h1 className={styles.h1}>Your women&apos;s health, <em>handled with care</em></h1>
        <p className={styles.lead}>A guided PMOS program — understand your risk, then follow a plan that fits your everyday.</p>
        <p className={styles.aka}><strong>PMOS</strong> (Polyendocrine Metabolic Ovarian Syndrome) — the condition you may know as <strong>PCOS</strong>.</p>
      </section>

      {/* Single entry card — adapts to the persona's state (flagged AHC / cold start). */}
      <ForHerEntryCard />
    </main>
  );
}
