"use client";
import { useState } from "react";
import { Droplet } from "lucide-react";
import styles from "./CycleOnboarding.module.css";

/** First-time cycle setup: last period start + typical duration. This is what
 *  turns on real phase prediction — until it's done, we don't show a phase. */
export function CycleOnboarding({ onSave }: { onSave: (lastPeriod: string, duration: number) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState("");
  const [dur, setDur] = useState(0);
  const valid = !!date && dur > 0;

  return (
    <div className={styles.card}>
      <span className={styles.icon}><Droplet size={22} /></span>
      <h3 className={styles.title}>Let&apos;s set up your cycle</h3>
      <p className={styles.sub}>Two quick details and we can predict your phases — no more guessing.</p>

      <label className={styles.label}>When did your last period start?</label>
      <input className={styles.date} type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} />

      <label className={styles.label}>How many days does it usually last?</label>
      <div className={styles.chips}>
        {[3, 4, 5, 6, 7].map((d) => (
          <button key={d} type="button" className={`${styles.chip} ${dur === d ? styles.chipOn : ""}`} onClick={() => setDur(d)}>
            {d === 7 ? "7+" : d}
          </button>
        ))}
      </div>

      <button type="button" className={styles.save} disabled={!valid} onClick={() => onSave(date, dur)}>
        Save my cycle
      </button>
    </div>
  );
}
