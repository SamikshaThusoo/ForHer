"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check } from "lucide-react";
import styles from "./mood.module.css";

const FEELINGS = ["Energetic", "Calm", "Motivated", "Tired", "Crampy", "Bloated", "Moody", "Anxious"];
const CYCLE = ["Period today", "Spotting", "No bleeding", "Not sure"];
const pad = (n: number) => String(n).padStart(2, "0");
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

export default function MoodLogPage() {
  const router = useRouter();
  const [feelings, setFeelings] = useState<Set<string>>(new Set());
  const [cycle, setCycle] = useState<string>("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const toggleFeeling = (f: string) =>
    setFeelings((p) => { const n = new Set(p); n.has(f) ? n.delete(f) : n.add(f); return n; });

  const save = () => {
    try {
      const arr = JSON.parse(localStorage.getItem("forher.moodlog.v1") || "[]");
      arr.push({ feelings: [...feelings], cycle, note, day: todayISO(), at: new Date().toISOString() });
      localStorage.setItem("forher.moodlog.v1", JSON.stringify(arr));
    } catch {}
    setSaved(true);
  };

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.head}>
        <Link href="/" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · PMOS</span>
      </header>

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

      {saved && (
        <div className={styles.modalBg} onClick={() => router.push("/")}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <span className={styles.doneMark}><Check size={26} /></span>
            <h2 className={styles.doneTitle}>Check-in saved</h2>
            {feelings.size > 0 && <p className={styles.doneMood}>Feeling {[...feelings].join(", ").toLowerCase()}</p>}
            {cycle && <p className={styles.doneMood}>{cycle}</p>}
            <button type="button" className={styles.modalCta} onClick={() => router.push("/")}>Back to home</button>
          </div>
        </div>
      )}
    </main>
  );
}
