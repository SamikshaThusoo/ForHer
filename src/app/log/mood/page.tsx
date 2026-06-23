"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Check } from "lucide-react";
import { BottomNav } from "@/components/forher/BottomNav/BottomNav";
import styles from "./mood.module.css";

const FEELINGS = ["Energetic", "Calm", "Motivated", "Tired", "Crampy", "Bloated", "Moody", "Anxious"];
const CYCLE = ["Period today", "Spotting", "No bleeding", "Not sure"];

export default function MoodLogPage() {
  const [feelings, setFeelings] = useState<Set<string>>(new Set());
  const [cycle, setCycle] = useState<string>("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const toggleFeeling = (f: string) =>
    setFeelings((p) => { const n = new Set(p); n.has(f) ? n.delete(f) : n.add(f); return n; });

  const save = () => {
    try {
      const arr = JSON.parse(localStorage.getItem("forher.moodlog.v1") || "[]");
      arr.push({ feelings: [...feelings], cycle, note, at: new Date().toISOString() });
      localStorage.setItem("forher.moodlog.v1", JSON.stringify(arr));
    } catch {}
    setSaved(true);
  };

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.head}>
        <Link href="/plan" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · PMOS</span>
      </header>

      {!saved ? (
        <div className={styles.body}>
          <h1 className={styles.h1}>How are you <em>today?</em></h1>
          <p className={styles.lead}>A daily check-in keeps your cycle predictions sharp and helps spot patterns over time.</p>

          <div className={styles.section}>How do you feel?</div>
          <div className={styles.chips}>
            {FEELINGS.map((f) => (
              <button key={f} type="button"
                className={`${styles.chip} ${feelings.has(f) ? styles.chipOn : ""}`}
                onClick={() => toggleFeeling(f)}>{f}</button>
            ))}
          </div>

          <div className={styles.section}>Your cycle</div>
          <div className={styles.chips}>
            {CYCLE.map((c) => (
              <button key={c} type="button"
                className={`${styles.chip} ${cycle === c ? styles.chipOn : ""}`}
                onClick={() => setCycle(c)}>{c}</button>
            ))}
          </div>

          <textarea className={styles.note} placeholder="Anything else worth noting? (optional)"
            value={note} onChange={(e) => setNote(e.target.value)} />

          <button type="button" className={styles.save} onClick={save}>Save today&apos;s check-in</button>
        </div>
      ) : (
        <div className={styles.doneWrap}>
          <span className={styles.doneMark}><Check size={26} /></span>
          <h2 className={styles.doneTitle}>Logged for today</h2>
          <p className={styles.doneSub}>Keeping this current sharpens your phase predictions and your plan.</p>
          <Link href="/plan" className={styles.doneCta}>Back to my plan</Link>
        </div>
      )}
      <BottomNav />
    </main>
  );
}
