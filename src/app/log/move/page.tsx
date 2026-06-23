"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Check } from "lucide-react";
import { BottomNav } from "@/components/forher/BottomNav/BottomNav";
import styles from "./move.module.css";

const KINDS = ["Walk", "Yoga", "Strength", "Cardio", "Dance", "Cycling"];
const MINUTES = [10, 20, 30, 45];

export default function MoveLogPage() {
  const [steps, setSteps] = useState<number | null>(null);
  const [kind, setKind] = useState<string>("");
  const [mins, setMins] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const save = () => {
    try {
      const arr = JSON.parse(localStorage.getItem("forher.movelog.v1") || "[]");
      arr.push({ steps, kind, mins, at: new Date().toISOString() });
      localStorage.setItem("forher.movelog.v1", JSON.stringify(arr));
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
          <h1 className={styles.h1}>Log your <em>movement</em></h1>
          <p className={styles.lead}>Any movement counts — steady activity helps insulin sensitivity, even without weight change.</p>

          <div className={styles.section}>Steps so far</div>
          <div className={styles.chips}>
            {[2000, 5000, 8000, 10000].map((s) => (
              <button key={s} type="button"
                className={`${styles.chip} ${steps === s ? styles.chipOn : ""}`}
                onClick={() => setSteps(s)}>{s.toLocaleString()}</button>
            ))}
          </div>

          <div className={styles.section}>A session today?</div>
          <div className={styles.chips}>
            {KINDS.map((k) => (
              <button key={k} type="button"
                className={`${styles.chip} ${kind === k ? styles.chipOn : ""}`}
                onClick={() => setKind(k)}>{k}</button>
            ))}
          </div>

          {kind && (
            <>
              <div className={styles.section}>For how long?</div>
              <div className={styles.chips}>
                {MINUTES.map((m) => (
                  <button key={m} type="button"
                    className={`${styles.chip} ${mins === m ? styles.chipOn : ""}`}
                    onClick={() => setMins(m)}>{m} min</button>
                ))}
              </div>
            </>
          )}

          <button type="button" className={styles.save} onClick={save}
            disabled={steps === null && !kind}>Log movement</button>
        </div>
      ) : (
        <div className={styles.doneWrap}>
          <span className={styles.doneMark}><Check size={26} /></span>
          <h2 className={styles.doneTitle}>Nice work</h2>
          <p className={styles.doneSub}>Logged for today. Small, steady movement adds up with PMOS.</p>
          <Link href="/plan" className={styles.doneCta}>Back to my plan</Link>
        </div>
      )}
      <BottomNav />
    </main>
  );
}
