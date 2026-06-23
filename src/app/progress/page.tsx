"use client";
import Link from "next/link";
import { usePersona } from "@/context/PersonaContext";
import { useForHer } from "@/lib/forher/state";
import { getMarkerSnapshot, personaTrack } from "@/lib/journey";
import type { MarkerSet } from "@/types/journey";
import { BottomNav } from "@/components/forher/BottomNav/BottomNav";
import { ChevronLeft, TrendingDown, Minus, Trophy } from "lucide-react";
import styles from "./progress.module.css";

type Metric = { key: keyof MarkerSet; label: string; unit: string; decimals: number };
const METRICS: Metric[] = [
  { key: "bmi", label: "BMI", unit: "", decimals: 1 },
  { key: "hba1c", label: "HbA1c", unit: "%", decimals: 1 },
  { key: "weightKg", label: "Weight", unit: "kg", decimals: 0 },
  { key: "waistCm", label: "Waist", unit: "cm", decimals: 0 },
  { key: "homaIr", label: "HOMA-IR", unit: "", decimals: 1 },
];

function milestone(day: number): { title: string; sub: string } | null {
  if (day >= 90) return { title: "90-day program complete", sub: "You reached the full-retest milestone. Here's what moved." };
  if (day >= 60) return { title: "Build phase done", sub: "Two months in — momentum is building." };
  if (day >= 30) return { title: "You completed Foundation", sub: "The first 30 days are the hardest. Nicely done." };
  return null;
}

export default function ProgressPage() {
  const { persona } = usePersona();
  const fh = useForHer(persona.id);
  const track = personaTrack(persona);

  if (!fh.hydrated) return <main className={`${styles.page} fhTheme`} />;

  if (track === "none") {
    return (
      <main className={`${styles.page} fhTheme`}>
        <header className={styles.head}>
          <Link href="/forher" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
          <span className={styles.brandline}>For Her · Progress</span>
        </header>
        <div className={styles.empty}>
          <h1 className={styles.h1}>No program metrics yet</h1>
          <p className={styles.emptySub}>You&apos;re on the companion track — keep tracking your cycle and mood, and we&apos;ll re-check over time.</p>
        </div>
        <BottomNav />
      </main>
    );
  }

  const d0 = getMarkerSnapshot(persona, 0);
  const d90 = getMarkerSnapshot(persona, 90);
  const ms = milestone(fh.day);
  const ttc = !!persona.pmos?.ttc;

  const rows = METRICS
    .map((m) => ({ m, a: d0[m.key] as number | undefined, b: d90[m.key] as number | undefined }))
    .filter((r) => r.a != null && r.b != null);

  const improved = (d90.hba1c != null && d0.hba1c != null && d90.hba1c < d0.hba1c)
    || (d90.weightKg != null && d0.weightKg != null && d90.weightKg < d0.weightKg);
  const rec: "step-down" | "continue" | "tulip" = ttc ? "tulip" : improved ? "step-down" : "continue";

  return (
    <main className={`${styles.page} fhTheme`}>
      <header className={styles.head}>
        <Link href="/forher" className={styles.back} aria-label="Back"><ChevronLeft size={20} /></Link>
        <span className={styles.brandline}>For Her · Progress</span>
      </header>

      <div className={styles.hero}>
        <h1 className={styles.h1}>Your <em>progress</em></h1>
        <p className={styles.sub}>Day 0 vs Day 90 — your measured markers.</p>
      </div>

      {ms && (
        <div className={styles.milestone}>
          <span className={styles.trophy}><Trophy size={18} /></span>
          <div><div className={styles.msTitle}>{ms.title}</div><div className={styles.msSub}>{ms.sub}</div></div>
        </div>
      )}

      <div className={styles.metrics}>
        {rows.map(({ m, a, b }) => {
          const delta = (b as number) - (a as number);
          const better = delta < 0;
          const pctMove = Math.min(100, Math.abs(delta) / Math.max(0.01, a as number) * 100 * 4);
          return (
            <div key={m.key} className={styles.metric}>
              <div className={styles.metricTop}>
                <span className={styles.metricLabel}>{m.label}</span>
                <span className={`${styles.delta} ${better ? styles.deltaGood : styles.deltaFlat}`}>
                  {better ? <TrendingDown size={13} /> : <Minus size={13} />}
                  {delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${delta.toFixed(m.decimals)}${m.unit}`}
                </span>
              </div>
              <div className={styles.values}>
                <span className={styles.from}>{(a as number).toFixed(m.decimals)}{m.unit}</span>
                <div className={styles.track}><i style={{ width: `${pctMove}%`, background: better ? "#4F9D69" : "#9A8A92" }} /></div>
                <span className={styles.to}>{(b as number).toFixed(m.decimals)}{m.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {fh.day >= 90 && (
        <div className={styles.transition}>
          <div className={styles.transTitle}>What&apos;s next?</div>
          {[
            { key: "step-down", title: "Step down to maintenance", sub: "Companion mode + a quarterly check." },
            { key: "continue", title: "Continue structured care", sub: "Another focused block with your team." },
            { key: "tulip", title: "Warm handoff to Tulip", sub: "Move into pre-conception care; your record carries over." },
          ].map((o) => (
            <div key={o.key} className={`${styles.option} ${rec === o.key ? styles.optionRec : ""}`}>
              <div><div className={styles.optTitle}>{o.title}</div><div className={styles.optSub}>{o.sub}</div></div>
              {rec === o.key && <span className={styles.recTag}>Recommended</span>}
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
