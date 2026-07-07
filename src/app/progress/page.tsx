"use client";
import { useState } from "react";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { personaTrack } from "@/lib/journey";
import { DailyView } from "@/components/forher/Progress/DailyView";
import { MilestoneView } from "@/components/forher/Progress/MilestoneView";
import { ChevronLeft } from "lucide-react";
import styles from "./progress.module.css";

export default function ProgressPage() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const track = personaTrack(persona);
  const [tab, setTab] = useState<"daily" | "milestone">("daily");

  if (!fh.hydrated) return <main className={`${styles.page} fhTheme`} />;

  if (track === "none") {
    return (
      <main className={`${styles.page} fhTheme`}>
        <header className={styles.head}>
          <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
          <span className={styles.brandline}>For Her · Progress</span>
        </header>
        <div className={styles.empty}>
          <h1 className={styles.h1}>No program metrics yet</h1>
          <p className={styles.emptySub}>You&apos;re on the companion track — keep tracking your cycle and mood, and we&apos;ll re-check over time.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.head}>
        <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · Progress</span>
      </header>

      <div className={styles.hero}>
        <h1 className={styles.h1}>Your <em>progress</em></h1>
        <p className={styles.sub}>Today is the cursor; the 90 days is the frame.</p>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Progress views">
        <button
          role="tab"
          type="button"
          aria-selected={tab === "daily"}
          className={`${styles.tab} ${tab === "daily" ? styles.tabOn : ""}`}
          onClick={() => setTab("daily")}
        >
          Daily
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === "milestone"}
          className={`${styles.tab} ${tab === "milestone" ? styles.tabOn : ""}`}
          onClick={() => setTab("milestone")}
        >
          Milestone
        </button>
      </div>

      {tab === "daily" ? <DailyView /> : <MilestoneView />}
    </main>
  );
}
