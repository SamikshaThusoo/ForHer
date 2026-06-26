"use client";
import { useState } from "react";
import { Droplet, Sparkles, HeartPulse, Baby, ArrowLeft } from "lucide-react";
import type { CycleIntent, CycleLog } from "@/lib/forher/state";
import styles from "./CycleOnboarding.module.css";

const INTENTS: { key: CycleIntent; label: string; sub: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: "track", label: "Just tracking", sub: "Understand my cycle, hormones and symptoms.", icon: Sparkles },
  { key: "ttc", label: "Trying to conceive", sub: "Help me spot my fertile days.", icon: HeartPulse },
  { key: "pregnant", label: "I'm pregnant", sub: "Support me through pregnancy with PCOS.", icon: Baby },
];

/** Tracker setup. First asks intent (track / TTC / pregnant) — each opens its
 *  own journey — then the details that unlock predictions. */
export function CycleOnboarding({ onSave }: { onSave: (log: CycleLog) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [intent, setIntent] = useState<CycleIntent | null>(null);
  const [date, setDate] = useState("");
  const [dur, setDur] = useState(0);
  const [weeks, setWeeks] = useState(0);

  // Step 1 — intent
  if (!intent) {
    return (
      <div className={styles.card}>
        <span className={styles.icon}><Droplet size={22} /></span>
        <h3 className={styles.title}>Let&apos;s set up your tracker</h3>
        <p className={styles.sub}>First — why are you here? Your cards adapt to your answer.</p>
        <div className={styles.intents}>
          {INTENTS.map((it) => (
            <button key={it.key} type="button" className={styles.intent} onClick={() => setIntent(it.key)}>
              <span className={styles.intentIcon}><it.icon size={18} /></span>
              <span className={styles.intentText}>
                <span className={styles.intentLabel}>{it.label}</span>
                <span className={styles.intentSub}>{it.sub}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2a — pregnant (no cycle tracking)
  if (intent === "pregnant") {
    return (
      <div className={styles.card}>
        <button type="button" className={styles.back} onClick={() => setIntent(null)}><ArrowLeft size={14} /> Back</button>
        <h3 className={styles.title}>Congratulations</h3>
        <p className={styles.sub}>We&apos;ll skip cycle tracking and focus on you and your pregnancy.</p>
        <label className={styles.label}>How far along are you?</label>
        <div className={styles.weeksRow}>
          <input className={styles.weeksInput} type="number" min={1} max={42} value={weeks || ""}
            onChange={(e) => setWeeks(Number(e.target.value))} />
          <span className={styles.weeksUnit}>weeks</span>
        </div>
        <button type="button" className={styles.save} disabled={!(weeks > 0)} onClick={() => onSave({ intent, weeksPregnant: weeks })}>
          Save
        </button>
      </div>
    );
  }

  // Step 2b — track / ttc
  const valid = !!date && dur > 0;
  return (
    <div className={styles.card}>
      <button type="button" className={styles.back} onClick={() => setIntent(null)}><ArrowLeft size={14} /> Back</button>
      <h3 className={styles.title}>{intent === "ttc" ? "Let's map your fertile window" : "Let's set up your cycle"}</h3>
      <p className={styles.sub}>Two quick details and we can predict your phases{intent === "ttc" ? " and fertile days" : ""}.</p>
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
      <button type="button" className={styles.save} disabled={!valid} onClick={() => onSave({ intent, lastPeriod: date, duration: dur })}>
        Save my cycle
      </button>
    </div>
  );
}
